// Book operations
import { v4 as uuidv4 } from 'uuid';
import { execSelect, execRun, execSelectOne } from '../db-helpers';
import { getDb, saveDatabase, parseDate, parseBookFormat, validateISBN, validateASIN } from './core';
import { getBookGenres, addBookGenres } from './genres';
import { getUserBook } from './user-books';
import type { Book, BookWithDetails, BookFormData } from '../../types';

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
    format: parseBookFormat(row.format),
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
    format: parseBookFormat(row.format),
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
      format: parseBookFormat(row.format),
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

