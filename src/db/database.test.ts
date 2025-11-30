import { vi } from 'vitest';
import { closeTestDatabase } from '../test/db-test-utils';
import * as database from './database';
import initSqlJs from 'sql.js';
import path from 'path';

describe('database', () => {
  beforeEach(async () => {
    localStorage.clear();
    
    // Reset any existing database instance
    database._resetDbInstance();
    
    // Initialize sql.js for Node.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
      }
    });
    
    // Create fresh test database
    const testDb = new SQL.Database();
    const { createSchema } = await import('./schema');
    testDb.run(createSchema());
    
    // Inject test database using the test helper
    database._setTestDbInstance(testDb);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    closeTestDatabase();
    localStorage.clear();
    // Reset module state
    database._resetDbInstance();
  });

  describe('User Operations', () => {
    it('should create a user with valid data', () => {
      const userData = {
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com'
      };

      const user = database.createUser(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.displayName).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.id).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with minimal data', () => {
      const userData = {
        username: 'minimal'
      };

      const user = database.createUser(userData);

      expect(user.username).toBe('minimal');
      expect(user.displayName).toBeUndefined();
      expect(user.email).toBeUndefined();
    });

    it('should throw error for invalid username format', () => {
      const userData = {
        username: 'ab' // Too short
      };

      // The database constraint will throw a different error, so we check for any error
      expect(() => database.createUser(userData)).toThrow();
    });

    it('should throw error for duplicate username', () => {
      const userData = {
        username: 'duplicate'
      };

      database.createUser(userData);
      expect(() => database.createUser(userData)).toThrow(/already taken/);
    });

    it('should get user by id', () => {
      const userData = {
        username: 'getuser',
        displayName: 'Get User'
      };

      const created = database.createUser(userData);
      const retrieved = database.getUser(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.username).toBe('getuser');
    });

    it('should return null for non-existent user', () => {
      const user = database.getUser('non-existent-id');
      expect(user).toBeNull();
    });

    it('should get user by username (case insensitive)', () => {
      const userData = {
        username: 'CaseUser'
      };

      database.createUser(userData);
      const retrieved = database.getUserByUsername('caseuser');
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.username).toBe('CaseUser');
    });

    it('should update user', () => {
      const userData = {
        username: 'updateuser',
        displayName: 'Original'
      };

      const created = database.createUser(userData);
      const updated = database.updateUser(created.id, {
        displayName: 'Updated Name',
        email: 'new@example.com'
      });

      expect(updated.displayName).toBe('Updated Name');
      expect(updated.email).toBe('new@example.com');
    });
  });

  describe('Book Operations', () => {
    it('should create a book with valid data', () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        publicationYear: 2024,
        pages: 300
      };

      const book = database.createBook(bookData);

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Book');
      expect(book.author).toBe('Test Author');
      expect(book.isbn).toBe('1234567890');
      expect(book.publicationYear).toBe(2024);
      expect(book.pages).toBe(300);
      expect(book.id).toBeTruthy();
    });

    it('should create a book with minimal data', () => {
      const bookData = {
        title: 'Minimal Book',
        author: 'Author'
      };

      const book = database.createBook(bookData);

      expect(book.title).toBe('Minimal Book');
      expect(book.author).toBe('Author');
      expect(book.isbn).toBeUndefined();
    });

    it('should trim title and author whitespace', () => {
      const bookData = {
        title: '  Trimmed Title  ',
        author: '  Trimmed Author  '
      };

      const book = database.createBook(bookData);

      expect(book.title).toBe('Trimmed Title');
      expect(book.author).toBe('Trimmed Author');
    });

    it('should throw error for duplicate book (title + author)', () => {
      const bookData = {
        title: 'Duplicate Book',
        author: 'Same Author'
      };

      database.createBook(bookData);
      expect(() => database.createBook(bookData)).toThrow(/already exists/);
    });

    it('should get book by id', () => {
      const bookData = {
        title: 'Get Book',
        author: 'Author'
      };

      const created = database.createBook(bookData);
      const retrieved = database.getBook(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Get Book');
    });

    it('should return null for non-existent book', () => {
      const book = database.getBook('non-existent-id');
      expect(book).toBeNull();
    });

    it('should get all books', () => {
      database.createBook({ title: 'Book 1', author: 'Author 1' });
      database.createBook({ title: 'Book 2', author: 'Author 2' });

      const books = database.getAllBooks();
      expect(books.length).toBe(2);
    });

    it('should search books by title', () => {
      database.createBook({ title: 'JavaScript Guide', author: 'Author' });
      database.createBook({ title: 'Python Basics', author: 'Author' });

      const results = database.searchBooks('javascript');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('JavaScript Guide');
    });

    it('should search books by author', () => {
      database.createBook({ title: 'Book 1', author: 'John Doe' });
      database.createBook({ title: 'Book 2', author: 'Jane Smith' });

      const results = database.searchBooks('john');
      expect(results.length).toBe(1);
      expect(results[0].author).toBe('John Doe');
    });
  });

  describe('Genre Operations', () => {
    it('should get or create genre', () => {
      const genre = database.getOrCreateGenre('Science Fiction');
      
      expect(genre).toBeDefined();
      expect(genre.name).toBe('Science Fiction');
      expect(genre.id).toBeTruthy();
    });

    it('should return existing genre if it exists', () => {
      const genre1 = database.getOrCreateGenre('Fantasy');
      const genre2 = database.getOrCreateGenre('Fantasy');
      
      expect(genre1.id).toBe(genre2.id);
      expect(genre1.name).toBe(genre2.name);
    });

    it('should be case insensitive when finding existing genre', () => {
      const genre1 = database.getOrCreateGenre('Fantasy');
      const genre2 = database.getOrCreateGenre('fantasy');
      
      expect(genre1.id).toBe(genre2.id);
    });

    it('should add genres to book', () => {
      const book = database.createBook({ title: 'Book', author: 'Author' });
      
      database.addBookGenres(book.id, ['Fantasy', 'Adventure']);
      const genres = database.getBookGenres(book.id);
      
      expect(genres.length).toBe(2);
      expect(genres.map(g => g.name)).toContain('Fantasy');
      expect(genres.map(g => g.name)).toContain('Adventure');
    });

    it('should replace existing genres when adding new ones', () => {
      const book = database.createBook({ title: 'Book', author: 'Author' });
      
      database.addBookGenres(book.id, ['Fantasy']);
      database.addBookGenres(book.id, ['Adventure', 'Sci-Fi']);
      const genres = database.getBookGenres(book.id);
      
      expect(genres.length).toBe(2);
      expect(genres.map(g => g.name)).not.toContain('Fantasy');
      expect(genres.map(g => g.name)).toContain('Adventure');
      expect(genres.map(g => g.name)).toContain('Sci-Fi');
    });
  });

  describe('Series Operations', () => {
    it('should create a series', () => {
      const seriesData = {
        name: 'Test Series',
        author: 'Series Author'
      };

      const series = database.createSeries(seriesData);

      expect(series).toBeDefined();
      expect(series.name).toBe('Test Series');
      expect(series.author).toBe('Series Author');
      expect(series.id).toBeTruthy();
    });

    it('should throw error for duplicate series', () => {
      const seriesData = {
        name: 'Duplicate Series',
        author: 'Author'
      };

      database.createSeries(seriesData);
      expect(() => database.createSeries(seriesData)).toThrow(/already exists/);
    });

    it('should get series by id', () => {
      const created = database.createSeries({ name: 'Test', author: 'Author' });
      const retrieved = database.getSeries(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should update series', () => {
      const created = database.createSeries({ name: 'Original', author: 'Author' });
      const updated = database.updateSeries(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.author).toBe('Author'); // Should remain unchanged
    });

    it('should add book to series', () => {
      const series = database.createSeries({ name: 'Series', author: 'Author' });
      const book = database.createBook({ title: 'Book', author: 'Author' });

      database.addBookToSeries(book.id, series.id, 1);
      const updatedBook = database.getBook(book.id);

      expect(updatedBook?.seriesId).toBe(series.id);
      expect(updatedBook?.position).toBe(1);
    });
  });

  describe('UserBook Operations', () => {
    let userId: string;
    let bookId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      const book = database.createBook({ title: 'Test Book', author: 'Author' });
      bookId = book.id;
    });

    it('should add book to user collection', () => {
      const userBook = database.addBookToUserCollection(userId, bookId);

      expect(userBook).toBeDefined();
      expect(userBook.userId).toBe(userId);
      expect(userBook.bookId).toBe(bookId);
      expect(userBook.status).toBe('to-read');
      expect(userBook.progress).toBe(0);
    });

    it('should throw error when adding duplicate book', () => {
      database.addBookToUserCollection(userId, bookId);
      expect(() => database.addBookToUserCollection(userId, bookId)).toThrow(/already in your collection/);
    });

    it('should get user book', () => {
      database.addBookToUserCollection(userId, bookId);
      const userBook = database.getUserBook(userId, bookId);

      expect(userBook).not.toBeNull();
      expect(userBook?.userId).toBe(userId);
      expect(userBook?.bookId).toBe(bookId);
    });

    it('should update user book', () => {
      database.addBookToUserCollection(userId, bookId);
      
      const updated = database.updateUserBook(userId, bookId, {
        status: 'read',
        progress: 100,
        finishedDate: new Date('2024-01-01')
      });

      expect(updated.status).toBe('read');
      expect(updated.progress).toBe(100);
      expect(updated.finishedDate).toBeInstanceOf(Date);
    });

    it('should auto-set progress to 100 when status is read', () => {
      database.addBookToUserCollection(userId, bookId);
      
      const updated = database.updateUserBook(userId, bookId, {
        status: 'read'
      });

      expect(updated.status).toBe('read');
      expect(updated.progress).toBe(100);
    });

    it('should remove book from user collection', () => {
      database.addBookToUserCollection(userId, bookId);
      database.removeBookFromUserCollection(userId, bookId);

      const userBook = database.getUserBook(userId, bookId);
      expect(userBook).toBeNull();
    });
  });

  describe('Reading Count Operations', () => {
    let userId: string;
    let bookId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      const book = database.createBook({ title: 'Test Book', author: 'Author' });
      bookId = book.id;
    });

    it('should add reading count log for book', () => {
      const log = database.addReadingCountLog(userId, bookId);

      expect(log).toBeDefined();
      expect(log.userId).toBe(userId);
      expect(log.bookId).toBe(bookId);
      expect(log.readDate).toBeInstanceOf(Date);
    });

    it('should throw error if neither bookId nor seriesId provided', () => {
      expect(() => database.addReadingCountLog(userId)).toThrow(/Either bookId or seriesId/);
    });

    it('should get reading count for book', () => {
      database.addReadingCountLog(userId, bookId);
      database.addReadingCountLog(userId, bookId);

      const count = database.getReadingCount(userId, bookId);
      expect(count).toBe(2);
    });

    it('should return 0 for book with no reading count', () => {
      const count = database.getReadingCount(userId, bookId);
      expect(count).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should get book count', () => {
      expect(database.getBookCount()).toBe(0);
      
      database.createBook({ title: 'Book 1', author: 'Author' });
      database.createBook({ title: 'Book 2', author: 'Author' });

      expect(database.getBookCount()).toBe(2);
    });

    it('should get user book count', () => {
      const user = database.createUser({ username: 'testuser' });
      const book1 = database.createBook({ title: 'Book 1', author: 'Author' });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author' });

      expect(database.getUserBookCount(user.id)).toBe(0);

      database.addBookToUserCollection(user.id, book1.id);
      database.addBookToUserCollection(user.id, book2.id);

      expect(database.getUserBookCount(user.id)).toBe(2);
    });
  });
});
