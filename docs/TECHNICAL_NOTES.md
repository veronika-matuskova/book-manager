# Technical Notes

This document describes technical implementation details, architecture decisions, and recent improvements to the codebase.

## Recent Improvements

### Database Module Refactoring (2025-01-XX)

The database layer has been refactored from a single large file into a modular structure for better maintainability.

**Previous Structure:**
- `src/db/database.ts` (1,089 lines) - All database operations in one file

**New Structure:**
- `src/db/database/core.ts` - Database initialization and shared utilities
- `src/db/database/users.ts` - User operations
- `src/db/database/books.ts` - Book operations
- `src/db/database/genres.ts` - Genre operations
- `src/db/database/series.ts` - Series operations
- `src/db/database/user-books.ts` - User book collection operations
- `src/db/database/reading-counts.ts` - Reading count operations
- `src/db/database/statistics.ts` - Statistics operations
- `src/db/database/test-helpers.ts` - Test helper functions
- `src/db/database/index.ts` - Re-exports all functions
- `src/db/database.ts` - Backward compatibility wrapper

**Benefits:**
- Better code organization by domain
- Easier to navigate and maintain
- Reduced file size (largest file is now 258 lines)
- Clear separation of concerns
- No breaking changes - all existing imports continue to work

### Type Safety Improvements (2025-01-XX)

**Database Helpers (`src/db/db-helpers.ts`):**
- Replaced `any[]` with generic types for type-safe query results
- Added `SqlRow` type for SQL.js row objects
- Changed parameter types from `any[]` to `unknown[]` for safer type handling
- Improved `execCount` to handle any column name dynamically

**Database Operations:**
- Removed all `as any` type casts
- Added `parseBookFormat()` helper function to safely convert database strings to `BookFormat` enum
- All database operations now use proper TypeScript types

**Benefits:**
- Better IDE autocomplete and error detection
- Compile-time type checking catches errors early
- Runtime validation of enum values
- Safer handling of database values

### Error Handling Improvements (2025-01-XX)

**Database Initialization:**
- Added error state to `AppContext` for database initialization failures
- User-friendly error messages displayed when database initialization fails
- Recovery options provided (reload page or clear data and reset)
- Error state is properly managed through React Context

**Benefits:**
- Users see clear error messages instead of silent failures
- Provides recovery options when database initialization fails
- Better user experience with proper error feedback

### Code Quality Improvements (2025-01-XX)

**Removed Global Window Pollution:**
- Removed `dataIO` global exposure from `main.tsx`
- Cleaner codebase with no global namespace pollution
- Better encapsulation of internal functions

## Database Architecture

### Core Database Functions

The `core.ts` module provides:
- **Database Initialization**: `initDatabase()` - Initializes SQL.js database, loads from localStorage or creates new
- **Database Persistence**: `saveDatabase()` - Saves database to localStorage in chunks to avoid memory issues
- **Database Access**: `getDb()` - Gets the current database instance (throws if not initialized)

### Shared Utilities

The `core.ts` module also provides shared utility functions:
- `parseDate()` - Safely parses date strings from database
- `formatDate()` - Formats Date objects for SQL storage
- `validateDateNotFuture()` - Validates dates are not in the future
- `validateEmail()` - Validates email format
- `validateISBN()` - Validates ISBN format (10 or 13 digits)
- `validateASIN()` - Validates ASIN format (10 alphanumeric characters)
- `parseBookFormat()` - Safely parses BookFormat enum from database strings

### Domain Modules

Each domain module (users, books, genres, etc.) contains:
- CRUD operations for that domain
- Domain-specific validation
- Query functions specific to that domain

### Import Pattern

All database functions can be imported from the main database module:

```typescript
import { 
  createUser, 
  getBook, 
  getAllSeries,
  addBookToUserCollection 
} from '../db/database';
```

This maintains backward compatibility while using the new modular structure internally.

## Type System

### Database Helpers

The database helper functions use generics for type safety:

```typescript
// Type-safe SELECT query
const users = execSelect<UserRow>(db, 'SELECT * FROM users', []);

// Type-safe single row query
const user = execSelectOne<UserRow>(db, 'SELECT * FROM users WHERE id = ?', [id]);
```

### Type Definitions

All types are defined in `src/types/index.ts`:
- `User`, `Book`, `Series`, `Genre` - Core entity types
- `UserBook`, `ReadingCountLog` - Relationship types
- `BookWithDetails`, `SeriesWithDetails` - Extended types for UI
- `BookFormData`, `UserFormData`, etc. - Form data types
- `BookFilters`, `SortOption` - Filter and sort types

## Error Handling

### Database Initialization Errors

When database initialization fails:
1. Error is caught in `AppContext`
2. Error message is stored in `initError` state
3. User sees error screen with:
   - Clear error message
   - "Reload Page" button to retry
   - "Clear Data & Reset" button for recovery

### Database Operation Errors

Database operations throw errors that are caught by:
- Form validation in components
- Error boundaries (when implemented)
- Try-catch blocks in async operations

## Testing

### Test Helpers

Test helper functions are available for setting up test databases:

```typescript
import { _setTestDbInstance, _resetDbInstance } from '../db/database';

beforeEach(() => {
  const testDb = new SQL.Database();
  _setTestDbInstance(testDb);
});

afterEach(() => {
  _resetDbInstance();
});
```

### Test Structure

- Unit tests for each database module
- Integration tests for database operations
- Edge case tests for error handling
- All tests use isolated test database instances

## Performance Considerations

### Database Persistence

- Database is saved to localStorage after each write operation
- Uses chunked approach (8KB chunks) to avoid stack overflow
- localStorage has 5-10MB limit (acceptable for MVP)

### Query Performance

- All queries use parameterized statements (SQL injection protection)
- Indexes are defined in schema for common queries
- No pagination in queries yet (acceptable for MVP scale)

## Future Improvements

### Potential Enhancements

1. **IndexedDB Support**: Migrate from localStorage to IndexedDB for larger storage limits
2. **Query Pagination**: Add LIMIT/OFFSET to queries for better performance with large datasets
3. **Batch Operations**: Batch `saveDatabase()` calls to reduce localStorage writes
4. **Error Boundaries**: Add React error boundaries for better error handling
5. **Mapper Functions**: Extract common row-to-object mapping patterns
6. **Query Builder**: Create a query builder for complex queries

### Migration Path

The modular structure makes it easy to:
- Add new domain modules
- Refactor individual modules without affecting others
- Add new features to specific domains
- Improve performance of specific operations

## Code Style

### Naming Conventions

- Functions: `camelCase` (e.g., `createUser`, `getBook`)
- Types: `PascalCase` (e.g., `User`, `BookFormData`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DB_KEY`)
- Internal functions: Prefixed with `_` (e.g., `_getDbInstance`)

### File Organization

- One domain per file
- Related functions grouped together
- Helper functions at the top of files
- Exported functions clearly marked

### Type Safety

- No `any` types in production code
- Use `unknown` for truly unknown types
- Validate enum values at runtime
- Use type guards where appropriate

