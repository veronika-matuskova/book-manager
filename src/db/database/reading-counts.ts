// Reading count operations
import { v4 as uuidv4 } from 'uuid';
import { execRun, execCount } from '../db-helpers';
import { getDb, saveDatabase, formatDate } from './core';
import type { ReadingCountLog } from '../../types';

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

