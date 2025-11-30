// User operations
import { v4 as uuidv4 } from 'uuid';
import { execRun, execSelectOne } from '../db-helpers';
import { getDb, saveDatabase, parseDate, validateEmail } from './core';
import type { User, UserFormData, UserUpdateData } from '../../types';

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
  const values: unknown[] = [];

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

