// Using globals from vitest
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { execSelect, execRun, execSelectOne, execCount } from './db-helpers';
import { createSchema } from './schema';

describe('db-helpers', () => {
  let db: SqlJsDatabase;

  beforeEach(async () => {
    const path = await import('path');
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        return path.default.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
      }
    });
    db = new SQL.Database();
    db.run(createSchema());
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('execSelect', () => {
    it('should return empty array for empty result set', () => {
      const results = execSelect(db, 'SELECT * FROM users WHERE id = ?', ['non-existent']);
      expect(results).toEqual([]);
    });

    it('should return results for SELECT query', () => {
      // Insert test data
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const results = execSelect(db, 'SELECT * FROM users WHERE id = ?', ['user-1']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('user-1');
      expect(results[0].username).toBe('testuser');
    });

    it('should handle queries with no parameters', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const results = execSelect(db, 'SELECT * FROM users');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return multiple rows', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'user1',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-2',
        'user2',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const results = execSelect(db, 'SELECT * FROM users ORDER BY username');
      expect(results).toHaveLength(2);
      expect(results[0].username).toBe('user1');
      expect(results[1].username).toBe('user2');
    });
  });

  describe('execRun', () => {
    it('should execute INSERT statement', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const result = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', ['user-1']);
      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
    });

    it('should execute UPDATE statement', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      execRun(db, 'UPDATE users SET username = ? WHERE id = ?', ['updateduser', 'user-1']);

      const result = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', ['user-1']);
      expect(result?.username).toBe('updateduser');
    });

    it('should execute DELETE statement', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      execRun(db, 'DELETE FROM users WHERE id = ?', ['user-1']);

      const result = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', ['user-1']);
      expect(result).toBeNull();
    });

    it('should handle statements with no parameters', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      // This should not throw
      execRun(db, 'DELETE FROM users WHERE username = "testuser"');
      const result = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', ['user-1']);
      expect(result).toBeNull();
    });
  });

  describe('execSelectOne', () => {
    it('should return null for empty result set', () => {
      const result = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', ['non-existent']);
      expect(result).toBeNull();
    });

    it('should return single row when one exists', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'testuser',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const result = execSelectOne(db, 'SELECT * FROM users WHERE id = ?', ['user-1']);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-1');
      expect(result?.username).toBe('testuser');
    });

    it('should return first row when multiple exist', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'user1',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-2',
        'user2',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const result = execSelectOne(db, 'SELECT * FROM users ORDER BY username');
      expect(result).not.toBeNull();
      // Should return the first row based on ORDER BY
      expect(result?.username).toBe('user1');
    });
  });

  describe('execCount', () => {
    it('should return 0 for empty result set', () => {
      const count = execCount(db, 'SELECT COUNT(*) as count FROM users');
      expect(count).toBe(0);
    });

    it('should return correct count for COUNT query', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'user1',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-2',
        'user2',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const count = execCount(db, 'SELECT COUNT(*) as count FROM users');
      expect(count).toBe(2);
    });

    it('should return 0 when no rows match WHERE clause', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'user1',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const count = execCount(db, 'SELECT COUNT(*) as count FROM users WHERE username = ?', ['nonexistent']);
      expect(count).toBe(0);
    });

    it('should handle COUNT with different column names', () => {
      execRun(db, 'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        'user-1',
        'user1',
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00Z'
      ]);

      const count = execCount(db, 'SELECT COUNT(*) as total FROM users');
      expect(count).toBe(1);
    });
  });
});

