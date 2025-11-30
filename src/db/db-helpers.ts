// Helper functions for SQL.js database operations
// SQL.js requires prepared statements for parameterized queries

import type { Database as SqlJsDatabase } from 'sql.js';

// Execute a SELECT query with parameters and return results
export function execSelect(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  
  stmt.free();
  return results;
}

// Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
export function execRun(db: SqlJsDatabase, sql: string, params: any[] = []): void {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  stmt.step();
  stmt.free();
}

// Execute a query and return a single row
export function execSelectOne(db: SqlJsDatabase, sql: string, params: any[] = []): any | null {
  const results = execSelect(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

// Execute a query and return count
export function execCount(db: SqlJsDatabase, sql: string, params: any[] = []): number {
  const result = execSelectOne(db, sql, params);
  if (!result) return 0;
  const key = Object.keys(result)[0];
  return Number(result[key]) || 0;
}

