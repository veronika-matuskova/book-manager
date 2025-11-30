// Statistics operations
import { execCount } from '../db-helpers';
import { getDb } from './core';

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

