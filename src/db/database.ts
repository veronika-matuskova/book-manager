// Database access layer using sql.js
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { createSchema } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { execSelect, execRun, execSelectOne, execCount } from './db-helpers';
import type {
  User,
  Book,
  Series,
  Genre,
  UserBook,
  ReadingCountLog,
  BookWithDetails,
  BookFormData,
  UserFormData,
  UserUpdateData,
  SeriesFormData,
  UserBookFormData,
  ReadingStatus,
  BookFilters,
  SortOption
} from '../types';

let dbInstance: SqlJsDatabase | null = null;
const DB_KEY = 'book-manager-db';

// Initialize database
export async function initDatabase(): Promise<void> {
  if (dbInstance) {
    return;
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem(DB_KEY);
  if (savedDb) {
    try {
      const decoded = atob(savedDb);
      const buffer = Uint8Array.from(decoded, c => c.charCodeAt(0));
      dbInstance = new SQL.Database(buffer);
    } catch (error) {
      console.error('Failed to load database from localStorage, creating new one:', error);
      // If loading fails, create a new database
      dbInstance = new SQL.Database();
      const schema = createSchema();
      dbInstance.run(schema);
      saveDatabase();
    }
  } else {
    // Create new database
    dbInstance = new SQL.Database();
    // Create schema
    const schema = createSchema();
    dbInstance.run(schema);
    saveDatabase();
  }
}

// Save database to localStorage
function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    // Convert Uint8Array to base64 using chunked approach to avoid stack overflow
    // Process in chunks of 8192 bytes to avoid memory issues
    const chunkSize = 8192;
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    const binaryString = chunks.join('');
    const buffer = btoa(binaryString);
    localStorage.setItem(DB_KEY, buffer);
  } catch (error) {
    console.error('Failed to save database:', error);
    throw error;
  }
}

// Get database instance
function getDb(): SqlJsDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

// Helper to parse date strings
function parseDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

// Helper to format date for SQL
function formatDate(date: Date | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// Helper to validate that date is not in the future
function validateDateNotFuture(date: Date | undefined, fieldName: string): void {
  if (!date) return;
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (date > today) {
    throw new Error(`${fieldName} cannot be in the future`);
  }
}

// Helper to validate email format
function validateEmail(email: string | undefined): void {
  if (!email) return; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }
}

// Helper to validate ISBN format (10 or 13 digits after removing non-numeric)
function validateISBN(isbn: string | undefined): void {
  if (!isbn) return; // ISBN is optional
  const digits = isbn.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 13) {
    throw new Error('ISBN must be 10 or 13 digits');
  }
}

// Helper to validate ASIN format (exactly 10 alphanumeric characters, uppercase)
function validateASIN(asin: string | undefined): void {
  if (!asin) return; // ASIN is optional
  // ASIN must be exactly 10 alphanumeric characters and already uppercase
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    throw new Error('ASIN must be 10 alphanumeric characters');
  }
}

// ============= USER OPERATIONS =============

export function createUser(data: UserFormData): User {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Validate username format and length
  if (data.username.length < 3 || data.username.length > 50) {
    throw new Error('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
    throw new Error('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens');
  }

  // Validate email format
  validateEmail(data.email);

  // Check uniqueness
  const existing = getUserByUsername(data.username);
  if (existing) {
    throw new Error('This username is already taken. Please choose another.');
  }

  execRun(
    db,
    'INSERT INTO users (id, username, display_name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.username, data.displayName || null, data.email || null, now, now]
  );
  saveDatabase();

  return {
    id,
    username: data.username,
    displayName: data.displayName,
    email: data.email,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function getUser(id: string): User | null {
  const db = getDb();
  const row = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', [id]);
  if (!row) return null;

  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string || undefined,
    email: row.email as string || undefined,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  };
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const row = execSelectOne(db, 'SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  if (!row) return null;

  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string || undefined,
    email: row.email as string || undefined,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  };
}

export function getFirstUser(): User | null {
  const db = getDb();
  const row = execSelectOne(db, 'SELECT * FROM users LIMIT 1');
  if (!row) return null;

  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string || undefined,
    email: row.email as string || undefined,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  };
}

export function updateUser(id: string, data: UserUpdateData): User {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.displayName !== undefined) {
    updates.push('display_name = ?');
    values.push(data.displayName || null);
  }
  if (data.email !== undefined) {
    // Validate email format
    validateEmail(data.email);
    updates.push('email = ?');
    values.push(data.email || null);
  }
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  execRun(db, `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();

  const updated = getUser(id);
  if (!updated) throw new Error('User not found');
  return updated;
}

// ============= BOOK OPERATIONS =============

export function createBook(data: BookFormData): Book {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Validate ISBN format
  validateISBN(data.isbn);

  // Validate ASIN format
  if (data.asin) {
    validateASIN(data.asin);
  }

  // Check for duplicates (title + author)
  const existing = execSelectOne(
    db,
    'SELECT id FROM books WHERE LOWER(title) = LOWER(?) AND LOWER(author) = LOWER(?)',
    [data.title.trim(), data.author.trim()]
  );
  if (existing) {
    throw new Error('A book with this title and author already exists in the database');
  }

  execRun(
    db,
    `INSERT INTO books (
      id, title, author, isbn, asin, series_id, position, publication_year,
      pages, format, cover_image_url, description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title.trim(),
      data.author.trim(),
      data.isbn?.trim() || null,
      data.asin?.trim() || null,
      data.seriesId || null,
      data.position || null,
      data.publicationYear || null,
      data.pages || null,
      data.format || null,
      data.coverImageUrl?.trim() || null,
      data.description?.trim() || null,
      now,
      now
    ]
  );

  // Add genres
  if (data.genres && data.genres.length > 0) {
    addBookGenres(id, data.genres);
  }

  saveDatabase();

  return getBook(id)!;
}

export function getBook(id: string): Book | null {
  const db = getDb();
  const row = execSelectOne(db, 'SELECT * FROM books WHERE id = ?', [id]);
  if (!row) return null;

  return {
    id: row.id as string,
    title: row.title as string,
    author: row.author as string,
    isbn: row.isbn as string || undefined,
    asin: row.asin as string || undefined,
    seriesId: row.series_id as string || undefined,
    position: row.position as number || undefined,
    publicationYear: row.publication_year as number || undefined,
    pages: row.pages as number || undefined,
    format: row.format as any || undefined,
    coverImageUrl: row.cover_image_url as string || undefined,
    description: row.description as string || undefined,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  };
}

export function getAllBooks(): Book[] {
  const db = getDb();
  const rows = execSelect(db, 'SELECT * FROM books ORDER BY created_at DESC');
  if (!rows.length) return [];

  return rows.map(row => ({
    id: row.id as string,
    title: row.title as string,
    author: row.author as string,
    isbn: row.isbn as string || undefined,
    asin: row.asin as string || undefined,
    seriesId: row.series_id as string || undefined,
    position: row.position as number || undefined,
    publicationYear: row.publication_year as number || undefined,
    pages: row.pages as number || undefined,
    format: row.format as any || undefined,
    coverImageUrl: row.cover_image_url as string || undefined,
    description: row.description as string || undefined,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  }));
}

export function searchBooks(query: string, userId?: string): BookWithDetails[] {
  const db = getDb();
  const searchTerm = `%${query.toLowerCase()}%`;
  
  let sql = `
    SELECT DISTINCT b.*, s.name as series_name, s.author as series_author
    FROM books b
    LEFT JOIN series s ON b.series_id = s.id
    WHERE 
      LOWER(b.title) LIKE ? OR
      LOWER(b.author) LIKE ? OR
      LOWER(b.isbn) LIKE ? OR
      LOWER(b.asin) LIKE ? OR
      LOWER(s.name) LIKE ? OR
      LOWER(s.author) LIKE ?
    ORDER BY b.created_at DESC
  `;

  const rows = execSelect(db, sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
  if (!rows.length) return [];

  const books: BookWithDetails[] = rows.map(row => {
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
      format: row.format as any || undefined,
      coverImageUrl: row.cover_image_url as string || undefined,
      description: row.description as string || undefined,
      createdAt: parseDate(row.created_at as string) || new Date(),
      updatedAt: parseDate(row.updated_at as string) || new Date()
    };

    const bookWithDetails: BookWithDetails = {
      ...book,
      genres: getBookGenres(bookId),
      series: row.series_id ? {
        id: book.seriesId!,
        name: row.series_name as string,
        author: row.series_author as string,
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined,
      isOwned: userId ? !!getUserBook(userId, bookId) : false
    };

    return bookWithDetails;
  });

  return books;
}

// ============= GENRE OPERATIONS =============

export function getOrCreateGenre(name: string): Genre {
  const db = getDb();
  const trimmedName = name.trim().substring(0, 255);
  
  // Try to find existing genre
  const row = execSelectOne(db, 'SELECT * FROM genres WHERE LOWER(name) = LOWER(?)', [trimmedName]);
  if (row) {
    return {
      id: row.id as string,
      name: row.name as string,
      createdAt: parseDate(row.created_at as string) || new Date()
    };
  }

  // Create new genre
  const id = uuidv4();
  const now = new Date().toISOString();
  execRun(db, 'INSERT INTO genres (id, name, created_at) VALUES (?, ?, ?)', [id, trimmedName, now]);
  saveDatabase();

  return {
    id,
    name: trimmedName,
    createdAt: new Date(now)
  };
}

export function getBookGenres(bookId: string): Genre[] {
  const db = getDb();
  const rows = execSelect(
    db,
    `SELECT g.* FROM genres g
     JOIN book_genres bg ON g.id = bg.genre_id
     WHERE bg.book_id = ?
     ORDER BY g.name`,
    [bookId]
  );
  if (!rows.length) return [];

  return rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: parseDate(row.created_at as string) || new Date()
  }));
}

export function addBookGenres(bookId: string, genreNames: string[]): void {
  const db = getDb();
  
  // Remove existing genres for this book
  execRun(db, 'DELETE FROM book_genres WHERE book_id = ?', [bookId]);

  // Add new genres (limit to 20)
  const genresToAdd = genreNames.slice(0, 20);
  for (const genreName of genresToAdd) {
    const genre = getOrCreateGenre(genreName);
    const id = uuidv4();
    execRun(db, 'INSERT OR IGNORE INTO book_genres (id, book_id, genre_id) VALUES (?, ?, ?)', [
      id,
      bookId,
      genre.id
    ]);
  }
  saveDatabase();
}

export function getAllGenres(): Genre[] {
  const db = getDb();
  const rows = execSelect(db, 'SELECT * FROM genres ORDER BY name');
  if (!rows.length) return [];

  return rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: parseDate(row.created_at as string) || new Date()
  }));
}

// ============= SERIES OPERATIONS =============

export function createSeries(data: SeriesFormData): Series {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Check for duplicates
  const existing = execSelectOne(
    db,
    'SELECT id FROM series WHERE LOWER(name) = LOWER(?) AND LOWER(author) = LOWER(?)',
    [data.name.trim(), data.author.trim()]
  );
  if (existing) {
    throw new Error('A series with this name and author already exists');
  }

  execRun(
    db,
    'INSERT INTO series (id, name, author, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.name.trim(), data.author.trim(), now, now]
  );
  saveDatabase();

  return {
    id,
    name: data.name.trim(),
    author: data.author.trim(),
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function getSeries(id: string): Series | null {
  const db = getDb();
  const row = execSelectOne(db, 'SELECT * FROM series WHERE id = ?', [id]);
  if (!row) return null;

  return {
    id: row.id as string,
    name: row.name as string,
    author: row.author as string,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  };
}

export function getAllSeries(): Series[] {
  const db = getDb();
  const rows = execSelect(db, 'SELECT * FROM series ORDER BY name');
  if (!rows.length) return [];

  return rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    author: row.author as string,
    createdAt: parseDate(row.created_at as string) || new Date(),
    updatedAt: parseDate(row.updated_at as string) || new Date()
  }));
}

export function getSeriesBooks(seriesId: string, userId?: string): BookWithDetails[] {
  const db = getDb();
  const rows = execSelect(
    db,
    'SELECT * FROM books WHERE series_id = ? ORDER BY position, title',
    [seriesId]
  );
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
      format: row.format as any || undefined,
      coverImageUrl: row.cover_image_url as string || undefined,
      description: row.description as string || undefined,
      createdAt: parseDate(row.created_at as string) || new Date(),
      updatedAt: parseDate(row.updated_at as string) || new Date()
    };

    return {
      ...book,
      genres: getBookGenres(bookId),
      isOwned: userId ? !!getUserBook(userId, bookId) : false
    };
  });
}

export function updateSeries(id: string, data: Partial<SeriesFormData>): Series {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name.trim());
  }
  if (data.author !== undefined) {
    updates.push('author = ?');
    values.push(data.author.trim());
  }
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  execRun(db, `UPDATE series SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();

  const updated = getSeries(id);
  if (!updated) throw new Error('Series not found');
  return updated;
}

export function deleteSeries(id: string): void {
  const db = getDb();
  // Set series_id to NULL for all books in this series
  execRun(db, 'UPDATE books SET series_id = NULL, position = NULL WHERE series_id = ?', [id]);
  // Delete the series
  execRun(db, 'DELETE FROM series WHERE id = ?', [id]);
  saveDatabase();
}

export function addBookToSeries(bookId: string, seriesId: string, position?: number): void {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if book is already in another series
  const existing = execSelectOne(db, 'SELECT series_id FROM books WHERE id = ?', [bookId]);
  if (existing) {
    const currentSeriesId = existing.series_id as string;
    if (currentSeriesId && currentSeriesId !== seriesId) {
      throw new Error('Book is already in another series. Remove it first.');
    }
  }

  execRun(
    db,
    'UPDATE books SET series_id = ?, position = ?, updated_at = ? WHERE id = ?',
    [seriesId, position || null, now, bookId]
  );
  saveDatabase();
}

export function removeBookFromSeries(bookId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  execRun(db, 'UPDATE books SET series_id = NULL, position = NULL, updated_at = ? WHERE id = ?', [
    now,
    bookId
  ]);
  saveDatabase();
}

// ============= USER BOOK OPERATIONS =============

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
  
  const params: any[] = [userId];
  
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
      format: row.format as any || undefined,
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
  const values: any[] = [];

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

// ============= READING COUNT OPERATIONS =============

export function addReadingCountLog(
  userId: string,
  bookId?: string,
  seriesId?: string,
  readDate?: Date
): ReadingCountLog {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const date = formatDate(readDate || new Date())!;

  if (!bookId && !seriesId) {
    throw new Error('Either bookId or seriesId must be provided');
  }

  execRun(
    db,
    'INSERT INTO reading_count_logs (id, user_id, book_id, series_id, read_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, bookId || null, seriesId || null, date, now]
  );
  saveDatabase();

  return {
    id,
    userId,
    bookId,
    seriesId,
    readDate: readDate || new Date(),
    createdAt: new Date(now)
  };
}

export function getReadingCount(userId: string, bookId?: string, seriesId?: string): number {
  const db = getDb();
  
  if (bookId) {
    return execCount(
      db,
      'SELECT COUNT(*) as count FROM reading_count_logs WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
  } else if (seriesId) {
    return execCount(
      db,
      'SELECT COUNT(*) as count FROM reading_count_logs WHERE user_id = ? AND series_id = ?',
      [userId, seriesId]
    );
  } else {
    return 0;
  }
}

// ============= STATISTICS =============

export function getBookCount(): number {
  const db = getDb();
  return execCount(db, 'SELECT COUNT(*) as count FROM books');
}

export function getUserBookCount(userId: string): number {
  const db = getDb();
  return execCount(db, 'SELECT COUNT(*) as count FROM user_books WHERE user_id = ?', [userId]);
}

export function getUserSeriesCount(userId: string): number {
  const db = getDb();
  return execCount(
    db,
    `SELECT COUNT(DISTINCT b.series_id) as count
     FROM user_books ub
     JOIN books b ON ub.book_id = b.id
     WHERE ub.user_id = ? AND b.series_id IS NOT NULL`,
    [userId]
  );
}

export function getSeriesBookCount(seriesId: string): number {
  const db = getDb();
  return execCount(db, 'SELECT COUNT(*) as count FROM books WHERE series_id = ?', [seriesId]);
}

// ============= TEST HELPERS =============
// These functions are only used for testing purposes

/**
 * @internal
 * Set the database instance for testing purposes only
 * This allows tests to inject a test database instance
 */
export function _setTestDbInstance(testDb: SqlJsDatabase | null): void {
  dbInstance = testDb;
}

/**
 * @internal
 * Get the current database instance (for testing)
 */
export function _getDbInstance(): SqlJsDatabase | null {
  return dbInstance;
}

/**
 * @internal
 * Reset database instance (for testing)
 */
export function _resetDbInstance(): void {
  dbInstance = null;
}

/**
 * @internal
 * Initialize database with custom locateFile function (for testing)
 */
export async function _initDatabaseForTesting(locateFile?: (file: string) => string): Promise<void> {
  if (dbInstance) {
    return;
  }

  const SQL = await initSqlJs({
    locateFile: locateFile || ((file: string) => `https://sql.js.org/dist/${file}`)
  });

  // Create new database
  dbInstance = new SQL.Database();
  // Create schema
  const schema = createSchema();
  dbInstance.run(schema);
  // Don't save to localStorage in tests
}

