// Main database module - re-exports all database operations
// This maintains backward compatibility with existing imports from '../db/database'

// Core database functions
export { initDatabase, saveDatabase, getDb } from './core';

// User operations
export {
  createUser,
  getUser,
  getUserByUsername,
  getFirstUser,
  updateUser
} from './users';

// Book operations
export {
  createBook,
  getBook,
  getAllBooks,
  searchBooks
} from './books';

// Genre operations
export {
  getOrCreateGenre,
  getBookGenres,
  addBookGenres,
  getAllGenres
} from './genres';

// Series operations
export {
  createSeries,
  getSeries,
  getAllSeries,
  getSeriesBooks,
  updateSeries,
  deleteSeries,
  addBookToSeries,
  removeBookFromSeries
} from './series';

// User book operations
export {
  addBookToUserCollection,
  getUserBook,
  getUserBooks,
  updateUserBook,
  removeBookFromUserCollection,
  bulkUpdateUserBooks,
  bulkRemoveUserBooks
} from './user-books';

// Reading count operations
export {
  addReadingCountLog,
  getReadingCount
} from './reading-counts';

// Statistics operations
export {
  getBookCount,
  getUserBookCount,
  getUserSeriesCount,
  getSeriesBookCount
} from './statistics';

// Test helpers (marked as internal)
export {
  _setTestDbInstance,
  _getTestDbInstance,
  _resetDbInstance,
  _initDatabaseForTesting
} from './test-helpers';

// Re-export internal functions for backward compatibility
export { _getDbInstance, _setDbInstance } from './core';

