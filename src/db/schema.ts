// Database schema based on DATA_MODELS.md

export const createSchema = () => `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(username) >= 3 AND length(username) <= 50)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Series table
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_series_name_author ON series(LOWER(name), LOWER(author));
CREATE INDEX IF NOT EXISTS idx_series_name ON series(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_series_author ON series(LOWER(author));

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  asin TEXT,
  series_id TEXT REFERENCES series(id),
  position INTEGER CHECK (position IS NULL OR position > 0),
  publication_year INTEGER,
  pages INTEGER CHECK (pages IS NULL OR pages > 0),
  format TEXT CHECK (format IS NULL OR format IN ('digital', 'physical', 'audiobook')),
  cover_image_url TEXT,
  description TEXT CHECK (description IS NULL OR length(description) <= 5000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(title)) > 0),
  CHECK (length(trim(author)) > 0)
  -- Note: publication_year validation moved to application level to avoid non-deterministic CHECK constraint
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_title_author ON books(LOWER(title), LOWER(author));
CREATE INDEX IF NOT EXISTS idx_books_series_id ON books(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_title ON books(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_books_author ON books(LOWER(author));
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book genres junction table
CREATE TABLE IF NOT EXISTS book_genres (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  UNIQUE(book_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_book_genres_book_id ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre_id ON book_genres(genre_id);

-- User books table
CREATE TABLE IF NOT EXISTS user_books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'to-read' CHECK (status IN ('to-read', 'currently-reading', 'read', 'didnt-finish')),
  started_date DATE,
  finished_date DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id),
  CHECK (status != 'read' OR progress = 100),
  CHECK (started_date IS NULL OR finished_date IS NULL OR finished_date >= started_date)
);

CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON user_books(book_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(status);
CREATE INDEX IF NOT EXISTS idx_user_books_dates ON user_books(started_date, finished_date);

-- Reading count logs table
CREATE TABLE IF NOT EXISTS reading_count_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  series_id TEXT REFERENCES series(id) ON DELETE CASCADE,
  read_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK ((book_id IS NOT NULL AND series_id IS NULL) OR (book_id IS NULL AND series_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_reading_count_logs_user_id ON reading_count_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_count_logs_book_id ON reading_count_logs(book_id) WHERE book_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reading_count_logs_series_id ON reading_count_logs(series_id) WHERE series_id IS NOT NULL;
`;

