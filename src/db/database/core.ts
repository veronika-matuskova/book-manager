// Core database initialization and shared utilities
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { createSchema } from '../schema';
import { BookFormat } from '../../types';

let dbInstance: SqlJsDatabase | null = null;
const DB_KEY = 'book-manager-db';

// Initialize database
export async function initDatabase(): Promise<void> {
  if (dbInstance) {
    return;
  }

  try {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem(DB_KEY);
    if (savedDb) {
      try {
        const decoded = atob(savedDb);
        const buffer = Uint8Array.from(decoded, c => c.charCodeAt(0));
        dbInstance = new SQL.Database(buffer);
      } catch (error) {
        console.error('Failed to load database from localStorage, creating new one:', error);
        // If loading fails, create a new database
        dbInstance = new SQL.Database();
        const schema = createSchema();
        dbInstance.run(schema);
        saveDatabase();
      }
    } else {
      // Create new database
      dbInstance = new SQL.Database();
      // Create schema
      const schema = createSchema();
      dbInstance.run(schema);
      saveDatabase();
    }

    // Verify that dbInstance was actually set
    if (!dbInstance) {
      throw new Error('Failed to initialize database: dbInstance is null after initialization');
    }
  } catch (error) {
    // Ensure dbInstance is null on error so we can retry
    dbInstance = null;
    throw error;
  }
}

// Save database to localStorage
export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    // Convert Uint8Array to base64 using chunked approach to avoid stack overflow
    // Process in chunks of 8192 bytes to avoid memory issues
    const chunkSize = 8192;
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    const binaryString = chunks.join('');
    const buffer = btoa(binaryString);
    localStorage.setItem(DB_KEY, buffer);
  } catch (error) {
    console.error('Failed to save database:', error);
    throw error;
  }
}

// Get database instance
export function getDb(): SqlJsDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

// Get database instance (for internal use)
export function _getDbInstance(): SqlJsDatabase | null {
  return dbInstance;
}

// Set database instance (for testing)
export function _setDbInstance(testDb: SqlJsDatabase | null): void {
  dbInstance = testDb;
}

// Helper to parse date strings
export function parseDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

// Helper to format date for SQL
export function formatDate(date: Date | undefined): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// Helper to validate that date is not in the future
export function validateDateNotFuture(date: Date | undefined, fieldName: string): void {
  if (!date) return;
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (date > today) {
    throw new Error(`${fieldName} cannot be in the future`);
  }
}

// Helper to validate email format
export function validateEmail(email: string | undefined): void {
  if (!email) return; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }
}

// Helper to validate ISBN format (10 or 13 digits after removing non-numeric)
export function validateISBN(isbn: string | undefined): void {
  if (!isbn) return; // ISBN is optional
  const digits = isbn.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 13) {
    throw new Error('ISBN must be 10 or 13 digits');
  }
}

// Helper to validate ASIN format (exactly 10 alphanumeric characters, uppercase)
export function validateASIN(asin: string | undefined): void {
  if (!asin) return; // ASIN is optional
  // ASIN must be exactly 10 alphanumeric characters and already uppercase
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    throw new Error('ASIN must be 10 alphanumeric characters');
  }
}

// Helper to safely parse BookFormat from database string
export function parseBookFormat(format: unknown): BookFormat | undefined {
  if (!format || typeof format !== 'string') return undefined;
  // Check if the string is a valid BookFormat enum value
  if (format === BookFormat.DIGITAL || format === BookFormat.PHYSICAL || format === BookFormat.AUDIOBOOK) {
    return format as BookFormat;
  }
  return undefined;
}

