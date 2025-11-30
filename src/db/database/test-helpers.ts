// Test helper functions
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { createSchema } from '../schema';
import { _getDbInstance as getCoreDbInstance, _setDbInstance as setCoreDbInstance } from './core';

/**
 * @internal
 * Set the database instance for testing purposes only
 * This allows tests to inject a test database instance
 */
export function _setTestDbInstance(testDb: SqlJsDatabase | null): void {
  setCoreDbInstance(testDb);
}

/**
 * @internal
 * Get the current database instance (for testing)
 */
export function _getTestDbInstance(): SqlJsDatabase | null {
  return getCoreDbInstance();
}

/**
 * @internal
 * Reset database instance (for testing)
 */
export function _resetDbInstance(): void {
  setCoreDbInstance(null);
}

/**
 * @internal
 * Initialize database with custom locateFile function (for testing)
 */
export async function _initDatabaseForTesting(locateFile?: (file: string) => string): Promise<void> {
  if (getCoreDbInstance()) {
    return;
  }

  const SQL = await initSqlJs({
    locateFile: locateFile || ((file: string) => `https://sql.js.org/dist/${file}`)
  });

  // Create new database
  const dbInstance = new SQL.Database();
  // Create schema
  const schema = createSchema();
  dbInstance.run(schema);
  // Don't save to localStorage in tests
  setCoreDbInstance(dbInstance);
}

