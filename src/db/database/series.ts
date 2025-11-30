// Series operations
import { v4 as uuidv4 } from 'uuid';
import { execSelect, execRun, execSelectOne } from '../db-helpers';
import { getDb, saveDatabase, parseDate, parseBookFormat } from './core';
import { getBookGenres } from './genres';
import { getUserBook } from './user-books';
import type { Series, SeriesFormData, Book, BookWithDetails } from '../../types';

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
      format: parseBookFormat(row.format),
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
  const values: unknown[] = [];

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

