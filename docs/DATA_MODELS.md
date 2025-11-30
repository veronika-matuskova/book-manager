# Data Models Specification

## Overview

This document defines the data models for the Book Management MVP application. All models are designed to support the core functionality while remaining simple and extensible.

## Data Model Decisions

### Reading Count Architecture
Reading count is **calculated** from the `reading_count_logs` table in real-time, not stored in the `user_books` table. This ensures:
- Single source of truth
- Accurate reading history
- Support for series-level reading counts

**How Reading Count Works:**
- When a user marks a book as "Read" and confirms via pop-up, a new entry is added to `reading_count_logs` with `book_id` set
- If the book belongs to a series, a **separate entry** is also added with `series_id` set (for series-level reading count tracking)
- **Book reading count** = COUNT of entries WHERE `user_id` = X AND `book_id` = Y
- **Series reading count** = COUNT of entries WHERE `user_id` = X AND `series_id` = Y
- When book is first added to collection, reading_count = 0 (no entries in logs)
- User can re-read the same book many times; each "Read" confirmation adds a new log entry

### Genres Storage
Genres use a **normalized junction table** approach (`genres` + `book_genres` tables) rather than array columns. This enables:
- Genre re-use across books
- Easier querying and filtering
- Future features (genre statistics, recommendations)

### Date Validation Strategy
Date validation (preventing future dates) is enforced at the **application level** only. The database constraint only enforces that `finished_date >= started_date` when both are set. This approach:
- Allows flexibility for data migration scenarios
- Keeps database constraints simple
- Requires application-level validation in all data entry points

### Unique Constraints
All unique constraints on text fields (title+author, series name+author) use `LOWER()` for case-insensitive matching. This prevents duplicate entries with different capitalization.

---

## 1. User Model

Represents a user account in the system. **Note: MVP supports single user per instance.**

```typescript
interface User {
  id: string;                    // UUID, primary key
  username: string;               // Unique, required, max 255 chars
  displayName?: string;           // Optional, max 255 chars
  email?: string;                 // Optional, validated email format
  createdAt: Date;                // Auto-generated on creation
  updatedAt: Date;                // Auto-updated on modification
}
```

### Validation Rules
- `username`: Required, unique, 3-50 characters, alphanumeric + underscore/hyphen
- `displayName`: Optional, max 255 characters
- `email`: Optional, valid email format if provided

### Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "booklover123",
  "displayName": "Alex Reader",
  "email": "alex@example.com",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

## 2. Book Model

Represents a book in the central database. Books are stored in a shared database (single user per instance in MVP).

```typescript
interface Book {
  id: string;                    // UUID, primary key
  title: string;                 // Required, max 500 chars
  author: string;                 // Required, max 255 chars
  isbn?: string;                 // Optional, format: ISBN-10 or ISBN-13
  asin?: string;                 // Optional, format: 10-character alphanumeric code that uniquely identifies a product in Amazon's catalog
  seriesId?: string;              // Optional, foreign key to Series
  position?: number;              // Optional, positive integer - position within series (only meaningful when seriesId is set)
  publicationYear?: number;      // Optional, 4-digit year
  pages?: number;                // Optional, positive integer
  format?: BookFormat;           // Optional, enum
  coverImageUrl?: string;        // Optional, valid URL
  description?: string;           // Optional, text field
  createdAt: Date;               // Auto-generated
  updatedAt: Date;               // Auto-updated
}

enum BookFormat {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
  AUDIOBOOK = 'audiobook'
}
```

### Validation Rules
- `title`: Required, 1-500 characters
- `author`: Required, 1-255 characters
- `isbn`: Optional, basic validation: 10 or 13 digits after removing non-numeric characters (full format validation including checksum to be implemented in future)
- `asin`: Optional, basic validation: exactly 10 alphanumeric characters (full format validation to be implemented in future)
- `publicationYear`: Optional, between 1000 and current year + 1
- `pages`: Optional, positive integer
- `genres`: Optional, retrieved via `book_genres` junction table, max 20 genres per book, max 255 characters per genre, free-form text (may be streamlined to predefined list in future), displayed as tags, genres are stored in separate `genres` table for re-use, genres are not locked for a book/user/series
- `coverImageUrl`: Optional, valid HTTP/HTTPS URL (if image fails to load, show book title and author name in a field; users cannot upload local images, only URLs)
- `description`: Optional, max 5000 characters (if more characters added, show error message to inform user)

### Unique Constraints
- Combination of `title` + `author` should be unique (case-insensitive)
- Duplicate detection is based on title+author only
- **Note:** Different editions/formats with same title+author are **NOT** considered duplicates (other parameters like ISBN can vary)

### Example
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "The Big Dark Sky",
  "author": "Dean Koontz",
  "isbn": "978-0525541997",
  "asin": "B09FPXJS4H",
  "publicationYear": 2022,
  "pages": 390,
  "format": "digital",
  // Note: genres are retrieved via book_genres junction table, not stored directly
  "coverImageUrl": "https://example.com/covers/big-dark-sky.jpg",
  "description": "A thrilling novel about...",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-10T08:00:00Z"
}
```

---

## 2.1 Series Model

Represents a book series in the database.

```typescript
interface Series {
  id: string;                    // UUID, primary key
  name: string;                  // Required, max 255 chars
  author: string;                 // Required, max 255 chars
  createdAt: Date;               // Auto-generated
  updatedAt: Date;               // Auto-updated
}

```

### Validation Rules
- `name`: Required, 1-255 characters
- `author`: Required, 1-255 characters

### Unique Constraints
- Combination of `name` + `author` should be unique (case-insensitive)

### Example
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Harry Potter",
  "author": "J.K. Rowling",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-10T08:00:00Z"
}
```

---

## 3. UserBook Model (Junction Table)

Represents the relationship between a user and a book, including reading status and metadata.

```typescript
interface UserBook {
  id: string;                    // UUID, primary key
  userId: string;                 // Foreign key to User.id
  bookId: string;                 // Foreign key to Book.id
  status: ReadingStatus;          // Required, enum
  startedDate?: Date;             // Optional, date when reading started
  finishedDate?: Date;            // Optional, date when reading finished
  progress: number;               // Required, 0-100 percentage, default 0 when book added, 100 when status is "read"
  addedAt: Date;                  // Auto-generated when added to collection
  updatedAt: Date;                // Auto-updated on modification
}

enum ReadingStatus {
  TO_READ = 'to-read',
  CURRENTLY_READING = 'currently-reading',
  READ = 'read',
  DIDNT_FINISH = 'didnt-finish'
}
```

### Validation Rules
- `status`: Required, must be one of the ReadingStatus enum values. Default value is `to-read`.
- `startedDate`: Optional, valid date, cannot be in the future (only past or today), can be before book was added to collection (valid scenario, no error)
- `finishedDate`: Optional, valid date, cannot be in the future (only past or today), must be >= startedDate if both exist (if not, show error message: "Start date must be prior to finish date"), can be set without started date (valid scenario, no error), can be set for "Didn't Finish" status (equals the date when user decided to close the book)
- `progress`: Required, integer between 0 and 100, default 0 when book is added, automatically set to 100 when status is "read"
- User can see reading_count as a detail of the book and/or series
- User can re-read the book many times
- When book is added, the reading_count = 0
- For each read status change to read, the user has to confirm the book was read via the pop-up

### Business Rules
- **New book added** → Default status "To Read"
- When status changes to "currently-reading", `startedDate` can be auto-set to current date
- When status changes to "read", `finishedDate` can be auto-set to current date, and `progress` is automatically set to 100
- Progress field is required with default value 0 when book is added, and automatically set to 100 when status is "read"
- "Didn't Finish" status can have finished date (equals the date when user decided to close the book as didn't-finish and will not read anymore; date can be changed in the future when moving to other statuses)
- If user manually sets progress to 50% and then changes status to "Read", progress is automatically updated to 100%
- When status is "read", `progress` must be 100 (enforced by constraint)
- **"To Read" → "Read"** → Progress set to 100%, new entry added to `reading_count_logs` table
- **"Read" → "To Read"** → Pop-up appears asking "Are you starting a new reading session?" with "Yes" and "Cancel" options. If "Yes": original reading history remains visible, user can set new dates/progress, status changes. If "Cancel": status remains "Read", no changes.
- **"Read" → "Currently Reading"** → Pop-up appears asking "Are you starting a new reading session?" with "Yes" and "Cancel" options. If "Yes": original reading history remains visible, user can set new dates/progress, status changes. If "Cancel": status remains "Read", no changes.
- **"Currently Reading" → "Read"** → If 1st time: progress set to 100%, new entry added to `reading_count_logs`. If nth time: progress set to 100%, new entry added to `reading_count_logs`
- `finishedDate` must be >= `startedDate` if both are set
- User can only edit UserBook metadata (status, dates, progress). If shared Book details need updating, user must create a new book entry.

### Unique Constraints
- Combination of `userId` + `bookId` must be unique (one book per user)

### Example
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "bookId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "currently-reading",
  "startedDate": "2025-11-13",
  "finishedDate": null,
  "progress": 45,
  "addedAt": "2025-11-10T12:00:00Z",
  "updatedAt": "2025-11-13T14:30:00Z"
}
```

---

## 4. Database Schema (SQL)

**Note:** This schema is designed for SQLite. UUIDs are stored as TEXT and generated by the application layer. Validation for username format and email format is performed at the application level, not in database constraints.

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT username_length CHECK (length(username) >= 3 AND length(username) <= 50)
);

CREATE INDEX idx_users_username ON users(username);
```

**Application-Level Validation:**
- `username`: Must match regex `^[a-zA-Z0-9_-]+$` (case-insensitive alphanumeric, underscore, hyphen)
- `email`: If provided, must be valid email format (validated using application-level email validation library)

### Series Table (created before books to allow foreign key reference)
```sql
CREATE TABLE series (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index for case-insensitive name+author combination
CREATE UNIQUE INDEX idx_unique_series_name_author ON series(LOWER(name), LOWER(author));
CREATE INDEX idx_series_name ON series(LOWER(name));
CREATE INDEX idx_series_author ON series(LOWER(author));
```

### Books Table
```sql
CREATE TABLE books (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,  -- Validation performed at application level
  asin TEXT,  -- Validation performed at application level
  series_id TEXT REFERENCES series(id), 
  position INTEGER CHECK (position IS NULL OR position > 0),
  publication_year INTEGER,
  pages INTEGER CHECK (pages IS NULL OR pages > 0),
  format TEXT CHECK (format IS NULL OR format IN ('digital', 'physical', 'audiobook')),
  cover_image_url TEXT,  -- Validation performed at application level
  description TEXT CHECK (description IS NULL OR length(description) <= 5000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT author_not_empty CHECK (length(trim(author)) > 0),
  CONSTRAINT publication_year_valid CHECK (publication_year IS NULL OR (publication_year >= 1000 AND publication_year <= CAST(strftime('%Y', 'now') AS INTEGER) + 1))
);

-- Create unique index for case-insensitive title+author combination
CREATE UNIQUE INDEX idx_unique_title_author ON books(LOWER(title), LOWER(author));
CREATE INDEX idx_books_series_id ON books(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX idx_books_title ON books(LOWER(title));
CREATE INDEX idx_books_author ON books(LOWER(author));
CREATE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;
```

**Application-Level Validation:**
- `isbn`: If provided, must be 10 or 13 digits after removing non-numeric characters
- `asin`: If provided, must be exactly 10 alphanumeric characters (uppercase)
- `cover_image_url`: If provided, must be valid HTTP/HTTPS URL

### UserBooks Table
```sql
CREATE TABLE user_books (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'to-read' CHECK (status IN ('to-read', 'currently-reading', 'read', 'didnt-finish')),
  started_date DATE,  -- Date validation (no future dates) performed at application level
  finished_date DATE,  -- Date validation (no future dates, >= started_date) performed at application level
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_book UNIQUE (user_id, book_id),
  CONSTRAINT read_progress CHECK (
    status != 'read' OR progress = 100
  ),
  CONSTRAINT finished_after_started CHECK (
    started_date IS NULL OR 
    finished_date IS NULL OR 
    finished_date >= started_date
  )
);

CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_book_id ON user_books(book_id);
CREATE INDEX idx_user_books_status ON user_books(status);
CREATE INDEX idx_user_books_dates ON user_books(started_date, finished_date);
```

### Reading Count Logs Table
```sql
CREATE TABLE reading_count_logs (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  series_id TEXT REFERENCES series(id) ON DELETE CASCADE,
  read_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT book_or_series CHECK ((book_id IS NOT NULL AND series_id IS NULL) OR (book_id IS NULL AND series_id IS NOT NULL))
);

CREATE INDEX idx_reading_count_logs_user_id ON reading_count_logs(user_id);
CREATE INDEX idx_reading_count_logs_book_id ON reading_count_logs(book_id) WHERE book_id IS NOT NULL;
CREATE INDEX idx_reading_count_logs_series_id ON reading_count_logs(series_id) WHERE series_id IS NOT NULL;
```

**Reading Count Logic:**
- When a user marks a book as "Read" and confirms via pop-up, a new entry is added to `reading_count_logs` with `book_id` set
- If the book belongs to a series, a separate entry is also added with `series_id` set (for series-level reading count)
- Reading count for a book = COUNT of entries in `reading_count_logs` WHERE `user_id` = X AND `book_id` = Y
- Reading count for a series = COUNT of entries in `reading_count_logs` WHERE `user_id` = X AND `series_id` = Y

### Genres Table
```sql
CREATE TABLE genres (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book_genres (
  id TEXT PRIMARY KEY,  -- UUID stored as TEXT, generated by application
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  UNIQUE(book_id, genre_id)
);

CREATE INDEX idx_book_genres_book_id ON book_genres(book_id);
CREATE INDEX idx_book_genres_genre_id ON book_genres(genre_id);
```



---

## 5. Data Relationships

```
User (1) ────< (Many) UserBook (Many) >─── (1) Book
```

- One User can have many UserBooks
- One Book can be in many UserBooks (different users)
- One UserBook belongs to exactly one User and one Book

---

## 6. Query Examples

### Get all books for a user with book details
```sql
SELECT 
  ub.id,
  ub.status,
  ub.started_date,
  ub.finished_date,
  ub.progress,
  b.title,
  b.author,
  b.cover_image_url,
  b.pages,
  b.format
FROM user_books ub
JOIN books b ON ub.book_id = b.id
WHERE ub.user_id = :userId
ORDER BY ub.added_at DESC;
```

### Get books by status
```sql
SELECT 
  ub.*,
  b.*
FROM user_books ub
JOIN books b ON ub.book_id = b.id
WHERE ub.user_id = :userId 
  AND ub.status = :status
ORDER BY ub.added_at DESC;
```

### Search user's books
```sql
SELECT 
  ub.*,
  b.*
FROM user_books ub
JOIN books b ON ub.book_id = b.id
WHERE ub.user_id = :userId
  AND (
    LOWER(b.title) LIKE LOWER(:searchTerm) OR
    LOWER(b.author) LIKE LOWER(:searchTerm)
  )
ORDER BY ub.added_at DESC;
```

---

## 7. Database Initialization

### Initial Setup
1. Create database file (e.g., `book_manager.db`)
2. Create tables in order: `users` → `series` → `books` → `genres` → `book_genres` → `user_books` → `reading_count_logs` (respects foreign key dependencies)
3. Application generates UUIDs for all primary keys using a UUID library (e.g., `uuid` package in Node.js, `uuid` crate in Rust)

### Database File Location
- For local MVP: Database file stored in application data directory
- File name: `book_manager.db` (or configurable)
- Backup: Users can backup by copying the database file

### Future Enhancements
- Add migration system for schema changes
- Add database backup/restore functionality

### Future Enhancements
- Add `tags` array to UserBook (user-specific tags)
- Add `reading_time` tracking
- Add `last_read_date` for books read multiple times

---

## 8. Consolidated Validation Rules

This section provides a single source of truth for all validation rules. All validation is performed at the **application level** unless otherwise noted.

### User Validation

| Field | Required | Validation Rules | Error Message |
|-------|----------|------------------|---------------|
| `username` | Yes | - 3-50 characters<br>- Unique (case-insensitive)<br>- Alphanumeric + underscore/hyphen only<br>- Regex: `^[a-zA-Z0-9_-]+$` | "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens" |
| `displayName` | No | - Max 255 characters | "Display name cannot exceed 255 characters" |
| `email` | No | - Valid email format (if provided)<br>- Use application-level email validation library | "Please enter a valid email address" |

### Book Validation

| Field | Required | Validation Rules | Error Message |
|-------|----------|------------------|---------------|
| `title` | Yes | - 1-500 characters<br>- Not empty after trimming | "Title is required and cannot exceed 500 characters" |
| `author` | Yes | - 1-255 characters<br>- Not empty after trimming | "Author is required and cannot exceed 255 characters" |
| `isbn` | No | - If provided: 10 or 13 digits after removing non-numeric characters<br>- Basic validation only (checksum validation future enhancement) | "ISBN must be 10 or 13 digits" |
| `asin` | No | - If provided: Exactly 10 alphanumeric characters (uppercase)<br>- Regex: `^[A-Z0-9]{10}$` | "ASIN must be 10 alphanumeric characters" |
| `publicationYear` | No | - If provided: Between 1000 and (current year + 1) | "Publication year must be between 1000 and [current year + 1]" |
| `pages` | No | - If provided: Positive integer | "Pages must be a positive number" |
| `format` | No | - If provided: One of 'digital', 'physical', 'audiobook' | "Format must be one of: digital, physical, audiobook" |
| `coverImageUrl` | No | - If provided: Valid HTTP/HTTPS URL<br>- If image fails to load, show fallback (title + author) | "Please enter a valid HTTP or HTTPS URL" |
| `description` | No | - Max 5000 characters | "Description cannot exceed 5000 characters" |
| `genres` | No | - Max 20 genres per book<br>- Max 255 characters per genre<br>- Free-form text | "Maximum 20 genres per book" / "Genre cannot exceed 255 characters" |

### Series Validation

| Field | Required | Validation Rules | Error Message |
|-------|----------|------------------|---------------|
| `name` | Yes | - 1-255 characters | "Series name is required and cannot exceed 255 characters" |
| `author` | Yes | - 1-255 characters | "Series author is required and cannot exceed 255 characters" |

### UserBook Validation

| Field | Required | Validation Rules | Error Message |
|-------|----------|------------------|---------------|
| `status` | Yes | - One of: 'to-read', 'currently-reading', 'read', 'didnt-finish'<br>- Default: 'to-read' | N/A (dropdown selection) |
| `startedDate` | No | - If provided: Valid date<br>- Cannot be in the future (only past or today)<br>- Can be before book was added to collection (valid scenario) | "Start date cannot be in the future" |
| `finishedDate` | No | - If provided: Valid date<br>- Cannot be in the future (only past or today)<br>- Must be >= startedDate if both exist<br>- Can be set without startedDate (valid scenario)<br>- Can be set for "Didn't Finish" status | "Finish date cannot be in the future" / "Start date must be prior to finish date" |
| `progress` | Yes | - Integer between 0 and 100<br>- Default: 0 when book added<br>- Automatically set to 100 when status is "read" | "Progress must be between 0 and 100" |

### Date Validation Rules (Consolidated)

1. **Started Date:**
   - Cannot be in the future (only past or today)
   - Can be before book was added to collection (valid scenario, no error)
   - Optional for all statuses

2. **Finished Date:**
   - Cannot be in the future (only past or today)
   - Must be >= startedDate if both exist (database constraint + application validation)
   - Can be set without startedDate (valid scenario, no error)
   - Can be set for "Didn't Finish" status (equals date when user decided to close the book)
   - Can be changed when moving to other statuses

3. **Date Comparison:**
   - If finishedDate < startedDate (when both exist): Show error "Start date must be prior to finish date"
   - Validation performed at both database level (constraint) and application level

### Duplicate Detection

- **Books:** Case-insensitive combination of `title` + `author` must be unique
- **Series:** Case-insensitive combination of `name` + `author` must be unique
- **UserBooks:** Combination of `userId` + `bookId` must be unique (one book per user)
- **Note:** Different editions/formats with same title+author are NOT considered duplicates (other parameters like ISBN can vary)

