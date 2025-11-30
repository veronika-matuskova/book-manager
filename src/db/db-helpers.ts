// Helper functions for SQL.js database operations
// SQL.js requires prepared statements for parameterized queries

import type { Database as SqlJsDatabase } from 'sql.js';

// Type for SQL.js row objects (all values are unknown since SQL.js returns any)
export type SqlRow = Record<string, unknown>;

// Execute a SELECT query with parameters and return results
export function execSelect<T extends SqlRow = SqlRow>(
  db: SqlJsDatabase, 
  sql: string, 
  params: unknown[] = []
): T[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  
  while (stmt.step()) {
    const row = stmt.getAsObject() as T;
    results.push(row);
  }
  
  stmt.free();
  return results;
}

// Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
export function execRun(db: SqlJsDatabase, sql: string, params: unknown[] = []): void {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  stmt.step();
  stmt.free();
}

// Execute a query and return a single row
export function execSelectOne<T extends SqlRow = SqlRow>(
  db: SqlJsDatabase, 
  sql: string, 
  params: unknown[] = []
): T | null {
  const results = execSelect<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

// Execute a query and return count
export function execCount(db: SqlJsDatabase, sql: string, params: unknown[] = []): number {
  const result = execSelectOne<Record<string, unknown>>(db, sql, params);
  if (!result) return 0;
  // Get the first value from the result (works with any column name like 'count', 'total', etc.)
  const keys = Object.keys(result);
  if (keys.length === 0) return 0;
  const countValue = result[keys[0]];
  return typeof countValue === 'number' ? countValue : Number(countValue) || 0;
}

