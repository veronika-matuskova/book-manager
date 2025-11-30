// Test utilities for database operations
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { createSchema } from '../db/schema';
import path from 'path';
import { fileURLToPath } from 'url';

let testDb: SqlJsDatabase | null = null;

/**
 * Initialize a fresh test database instance
 */
export async function initTestDatabase(): Promise<SqlJsDatabase> {
  // For Node.js, load WASM from node_modules
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // Return path to sql.js WASM file in node_modules
      return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
    }
  });

  testDb = new SQL.Database();
  const schema = createSchema();
  testDb.run(schema);
  
  return testDb;
}

/**
 * Get the current test database instance
 */
export function getTestDb(): SqlJsDatabase {
  if (!testDb) {
    throw new Error('Test database not initialized. Call initTestDatabase() first.');
  }
  return testDb;
}

/**
 * Close and cleanup the test database
 */
export function closeTestDatabase(): void {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}

/**
 * Reset the test database by recreating the schema
 */
export async function resetTestDatabase(): Promise<void> {
  closeTestDatabase();
  await initTestDatabase();
}

