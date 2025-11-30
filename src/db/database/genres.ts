// Genre operations
import { v4 as uuidv4 } from 'uuid';
import { execSelect, execRun, execSelectOne } from '../db-helpers';
import { getDb, saveDatabase, parseDate } from './core';
import type { Genre } from '../../types';

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

