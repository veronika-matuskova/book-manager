// User book operations
import { v4 as uuidv4 } from 'uuid';
import { execSelect, execRun, execSelectOne } from '../db-helpers';
import { getDb, saveDatabase, parseDate, formatDate, validateDateNotFuture, parseBookFormat } from './core';
import { getBookGenres } from './genres';
import { getUser } from './users';
import { getBook } from './books';
import { getReadingCount } from './reading-counts';
import type { UserBook, UserBookFormData, BookWithDetails, BookFilters, SortOption, Book, ReadingStatus } from '../../types';

export function addBookToUserCollection(userId: string, bookId: string): UserBook {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Validate foreign keys exist
  const user = getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const book = getBook(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  // Check if already in collection
  const existing = getUserBook(userId, bookId);
  if (existing) {
    throw new Error('Book is already in your collection');
  }

  execRun(
    db,
    `INSERT INTO user_books (id, user_id, book_id, status, progress, added_at, updated_at)
     VALUES (?, ?, ?, 'to-read', 0, ?, ?)`,
    [id, userId, bookId, now, now]
  );
  saveDatabase();

  return getUserBook(userId, bookId)!;
}

export function getUserBook(userId: string, bookId: string): UserBook | null {
  const db = getDb();
  const row = execSelectOne(
    db,
    'SELECT * FROM user_books WHERE user_id = ? AND book_id = ?',
    [userId, bookId]
  );
  if (!row) return null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    bookId: row.book_id as string,
    status: row.status as ReadingStatus,
    startedDate: parseDate(row.started_date as string),
    finishedDate: parseDate(row.finished_date as string),
    progress: row.progress as number,
    addedAt: parseDate(row.added_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  };
}

export function getUserBooks(
  userId: string,
  filters?: BookFilters,
  sort: SortOption = 'latest-added'
): BookWithDetails[] {
  const db = getDb();
  
  let sql = `
    SELECT DISTINCT 
      b.id, b.title, b.author, b.isbn, b.asin, b.series_id, b.position, 
      b.publication_year, b.pages, b.format, b.cover_image_url, b.description,
      b.created_at, b.updated_at,
      ub.id as ub_id, ub.user_id, ub.book_id, ub.status, ub.started_date, 
      ub.finished_date, ub.progress, ub.added_at, ub.updated_at as ub_updated_at,
      s.name as series_name, s.author as series_author
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    LEFT JOIN series s ON b.series_id = s.id
    WHERE ub.user_id = ?
  `;
  
  const params: unknown[] = [userId];
  
  // Apply filters
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      sql += ` AND ub.status IN (${filters.status.map(() => '?').join(',')})`;
      params.push(...filters.status);
    }
    if (filters.formats && filters.formats.length > 0) {
      sql += ` AND b.format IN (${filters.formats.map(() => '?').join(',')})`;
      params.push(...filters.formats);
    }
    if (filters.authors && filters.authors.length > 0) {
      sql += ` AND LOWER(b.author) IN (${filters.authors.map(() => 'LOWER(?)').join(',')})`;
      params.push(...filters.authors);
    }
    if (filters.genres && filters.genres.length > 0) {
      sql += `
        AND b.id IN (
          SELECT DISTINCT bg.book_id FROM book_genres bg
          JOIN genres g ON bg.genre_id = g.id
          WHERE LOWER(g.name) IN (${filters.genres.map(() => 'LOWER(?)').join(',')})
        )
      `;
      params.push(...filters.genres);
    }
    if (filters.isbn) {
      sql += ' AND LOWER(b.isbn) LIKE LOWER(?)';
      params.push(`%${filters.isbn}%`);
    }
    if (filters.asin) {
      sql += ' AND LOWER(b.asin) LIKE LOWER(?)';
      params.push(`%${filters.asin}%`);
    }
  }
  
  // Apply sorting
  switch (sort) {
    case 'title-az':
      sql += ' ORDER BY b.title ASC';
      break;
    case 'author-az':
      sql += ' ORDER BY b.author ASC';
      break;
    case 'year':
      sql += ' ORDER BY b.publication_year DESC';
      break;
    case 'date-started':
      sql += ' ORDER BY ub.started_date DESC';
      break;
    case 'date-finished':
      sql += ' ORDER BY ub.finished_date DESC';
      break;
    default: // latest-added
      sql += ' ORDER BY ub.added_at DESC';
  }

  const rows = execSelect(db, sql, params);
  if (!rows.length) return [];

  return rows.map(row => {
    const bookId = row.id as string;
    const book: Book = {
      id: bookId,
      title: row.title as string,
      author: row.author as string,
      isbn: row.isbn as string || undefined,
      asin: row.asin as string || undefined,
      seriesId: row.series_id as string || undefined,
      position: row.position as number || undefined,
      publicationYear: row.publication_year as number || undefined,
      pages: row.pages as number || undefined,
      format: parseBookFormat(row.format),
      coverImageUrl: row.cover_image_url as string || undefined,
      description: row.description as string || undefined,
      createdAt: parseDate(row.created_at as string) || new Date(),
      updatedAt: parseDate(row.updated_at as string) || new Date()
    };

    const userBook: UserBook = {
      id: row.ub_id as string,
      userId: row.user_id as string,
      bookId: bookId,
      status: row.status as ReadingStatus,
      startedDate: parseDate(row.started_date as string),
      finishedDate: parseDate(row.finished_date as string),
      progress: row.progress as number,
      addedAt: parseDate(row.added_at as string) || new Date(),
      updatedAt: parseDate(row.ub_updated_at as string) || new Date()
    };

    return {
      ...book,
      genres: getBookGenres(bookId),
      series: book.seriesId ? {
        id: book.seriesId,
        name: row.series_name as string,
        author: row.series_author as string,
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined,
      userBook,
      readingCount: getReadingCount(userId, bookId),
      isOwned: true
    };
  });
}

export function updateUserBook(
  userId: string,
  bookId: string,
  data: Partial<UserBookFormData>
): UserBook {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];

  // Validate dates are not in the future
  validateDateNotFuture(data.startedDate, 'Start date');
  validateDateNotFuture(data.finishedDate, 'Finish date');

  // Validate date range (finished >= started if both exist)
  if (data.startedDate && data.finishedDate && data.finishedDate < data.startedDate) {
    throw new Error('Start date must be prior to finish date');
  }

  // If updating dates, also check existing dates in database
  if (data.startedDate !== undefined || data.finishedDate !== undefined) {
    const existing = getUserBook(userId, bookId);
    if (existing) {
      const startDate = data.startedDate !== undefined ? data.startedDate : existing.startedDate;
      const finishDate = data.finishedDate !== undefined ? data.finishedDate : existing.finishedDate;
      if (startDate && finishDate && finishDate < startDate) {
        throw new Error('Start date must be prior to finish date');
      }
    }
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
    // Auto-set progress to 100 if status is "read"
    if (data.status === 'read') {
      updates.push('progress = 100');
    }
  }
  if (data.startedDate !== undefined) {
    updates.push('started_date = ?');
    values.push(formatDate(data.startedDate));
  }
  if (data.finishedDate !== undefined) {
    updates.push('finished_date = ?');
    values.push(formatDate(data.finishedDate));
  }
  if (data.progress !== undefined) {
    updates.push('progress = ?');
    values.push(data.progress);
  }
  updates.push('updated_at = ?');
  values.push(now);
  values.push(userId, bookId);

  execRun(
    db,
    `UPDATE user_books SET ${updates.join(', ')} WHERE user_id = ? AND book_id = ?`,
    values
  );
  saveDatabase();

  const updated = getUserBook(userId, bookId);
  if (!updated) throw new Error('UserBook not found');
  return updated;
}

export function removeBookFromUserCollection(userId: string, bookId: string): void {
  const db = getDb();
  execRun(db, 'DELETE FROM user_books WHERE user_id = ? AND book_id = ?', [userId, bookId]);
  saveDatabase();
}

export function bulkUpdateUserBooks(
  userId: string,
  bookIds: string[],
  data: Partial<UserBookFormData>
): void {
  for (const bookId of bookIds) {
    try {
      updateUserBook(userId, bookId, data);
    } catch (error) {
      console.error(`Failed to update book ${bookId}:`, error);
    }
  }
}

export function bulkRemoveUserBooks(userId: string, bookIds: string[]): void {
  const db = getDb();
  const placeholders = bookIds.map(() => '?').join(',');
  execRun(
    db,
    `DELETE FROM user_books WHERE user_id = ? AND book_id IN (${placeholders})`,
    [userId, ...bookIds]
  );
  saveDatabase();
}

