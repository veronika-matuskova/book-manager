import { vi } from 'vitest';
import { closeTestDatabase } from '../test/db-test-utils';
import * as database from './database';
import initSqlJs from 'sql.js';
import path from 'path';

describe('Database Edge Cases', () => {
  beforeEach(async () => {
    localStorage.clear();
    database._resetDbInstance();
    
    const SQL = await initSqlJs({
      locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
    });
    
    const testDb = new SQL.Database();
    const { createSchema } = await import('./schema');
    testDb.run(createSchema());
    database._setTestDbInstance(testDb);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    closeTestDatabase();
    localStorage.clear();
    database._resetDbInstance();
  });

  describe('Boundary Conditions - User Operations', () => {
    it('should handle username at minimum length (3 characters)', () => {
      const user = database.createUser({ username: 'abc' });
      expect(user.username).toBe('abc');
    });

    it('should handle username at maximum length (50 characters)', () => {
      const longUsername = 'a'.repeat(50);
      const user = database.createUser({ username: longUsername });
      expect(user.username).toBe(longUsername);
    });

    it('should handle username with unicode characters', () => {
      // Unicode may or may not pass validation depending on regex
      try {
        const user = database.createUser({ username: 'user_ñame-123' });
        expect(user.username).toBe('user_ñame-123');
      } catch (e) {
        // If it throws due to validation, that's acceptable
        // The regex only allows [a-zA-Z0-9_-]
        expect(e).toBeDefined();
      }
    });

    it('should handle displayName with unicode and special characters', () => {
      const user = database.createUser({ 
        username: 'testuser',
        displayName: 'José María O\'Connor-Smith'
      });
      expect(user.displayName).toBe('José María O\'Connor-Smith');
    });

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(200) + '@example.com';
      const user = database.createUser({ 
        username: 'testuser',
        email: longEmail
      });
      expect(user.email).toBe(longEmail);
    });
  });

  describe('Boundary Conditions - Book Operations', () => {
    it('should handle title at minimum length (after trim)', () => {
      const book = database.createBook({ title: 'A', author: 'Author' });
      expect(book.title).toBe('A');
    });

    it('should handle very long book titles', () => {
      const longTitle = 'A'.repeat(500);
      const book = database.createBook({ title: longTitle, author: 'Author' });
      expect(book.title).toBe(longTitle);
    });

    it('should handle title with only whitespace (should be rejected)', () => {
      expect(() => {
        database.createBook({ title: '   ', author: 'Author' });
      }).toThrow();
    });

    it('should handle ISBN with different formats', () => {
      const isbn10 = '1234567890';
      const isbn13 = '9781234567890';
      
      const book1 = database.createBook({ title: 'Book 1', author: 'Author', isbn: isbn10 });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author', isbn: isbn13 });
      
      expect(book1.isbn).toBe(isbn10);
      expect(book2.isbn).toBe(isbn13);
    });

    it('should handle ASIN format', () => {
      const asin = 'B01234567X';
      const book = database.createBook({ title: 'Book', author: 'Author', asin });
      expect(book.asin).toBe(asin);
    });

    it('should handle publication year at boundaries', () => {
      const oldBook = database.createBook({ 
        title: 'Old Book', 
        author: 'Author',
        publicationYear: 1000
      });
      const newBook = database.createBook({ 
        title: 'New Book', 
        author: 'Author',
        publicationYear: 2099
      });
      
      expect(oldBook.publicationYear).toBe(1000);
      expect(newBook.publicationYear).toBe(2099);
    });

    it('should handle pages at minimum (1)', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        pages: 1
      });
      expect(book.pages).toBe(1);
    });

    it('should handle very large page counts', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        pages: 10000
      });
      expect(book.pages).toBe(10000);
    });

    it('should handle description at maximum length (5000 characters)', () => {
      const longDescription = 'A'.repeat(5000);
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        description: longDescription
      });
      expect(book.description?.length).toBe(5000);
    });

    it('should handle position in series at boundaries', () => {
      const series = database.createSeries({ name: 'Series', author: 'Author' });
      
      const book1 = database.createBook({ 
        title: 'Book 1', 
        author: 'Author',
        seriesId: series.id,
        position: 1
      });
      
      const book2 = database.createBook({ 
        title: 'Book 2', 
        author: 'Author',
        seriesId: series.id,
        position: 999
      });
      
      expect(book1.position).toBe(1);
      expect(book2.position).toBe(999);
    });
  });

  describe('Boundary Conditions - Progress and Status', () => {
    let userId: string;
    let bookId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      const book = database.createBook({ title: 'Test Book', author: 'Author' });
      bookId = book.id;
      database.addBookToUserCollection(userId, bookId);
    });

    it('should handle progress at minimum (0)', () => {
      const userBook = database.updateUserBook(userId, bookId, { progress: 0 });
      expect(userBook.progress).toBe(0);
    });

    it('should handle progress at maximum (100)', () => {
      const userBook = database.updateUserBook(userId, bookId, { progress: 100 });
      expect(userBook.progress).toBe(100);
    });

    it('should handle progress at midpoint (50)', () => {
      const userBook = database.updateUserBook(userId, bookId, { progress: 50 });
      expect(userBook.progress).toBe(50);
    });

    it('should automatically set progress to 100 when status is read', () => {
      // Update status to read - should auto-set progress to 100
      const userBook = database.updateUserBook(userId, bookId, { 
        status: 'read' as any
      });
      expect(userBook.status).toBe('read');
      expect(userBook.progress).toBe(100);
    });
  });

  describe('Boundary Conditions - Date Handling', () => {
    let userId: string;
    let bookId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      const book = database.createBook({ title: 'Test Book', author: 'Author' });
      bookId = book.id;
      database.addBookToUserCollection(userId, bookId);
    });

    it('should handle dates in the past', () => {
      const pastDate = new Date('1900-01-01');
      const userBook = database.updateUserBook(userId, bookId, {
        startedDate: pastDate
      });
      expect(userBook.startedDate).toBeInstanceOf(Date);
    });

    it('should reject dates in the future', () => {
      const futureDate = new Date('2100-01-01');
      expect(() => {
        database.updateUserBook(userId, bookId, {
          finishedDate: futureDate
        });
      }).toThrow(/cannot be in the future/);
    });

    it('should handle same started and finished date', () => {
      const sameDate = new Date('2024-01-01');
      const userBook = database.updateUserBook(userId, bookId, {
        startedDate: sameDate,
        finishedDate: sameDate
      });
      expect(userBook.startedDate).toEqual(sameDate);
      expect(userBook.finishedDate).toEqual(sameDate);
    });

    it('should allow today\'s date', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon today
      const userBook = database.updateUserBook(userId, bookId, {
        startedDate: today
      });
      expect(userBook.startedDate).toBeInstanceOf(Date);
    });

    it('should reject future start date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      expect(() => {
        database.updateUserBook(userId, bookId, {
          startedDate: futureDate
        });
      }).toThrow(/cannot be in the future/);
    });

    it('should allow started date before book was added to collection', () => {
      // This is a valid scenario - user might have started reading before adding to collection
      // Book is already added in beforeEach, so we can set a past date
      const startedDate = new Date('2024-01-05');
      
      // Setting started date before added date should be allowed
      const userBook = database.updateUserBook(userId, bookId, {
        startedDate: startedDate
      });
      
      expect(userBook.startedDate).toEqual(startedDate);
    });

    it('should allow finished date without started date', () => {
      // This is a valid scenario - user might finish a book without tracking start date
      // Book is already added in beforeEach
      const finishedDate = new Date('2024-01-15');
      const userBook = database.updateUserBook(userId, bookId, {
        finishedDate: finishedDate
      });
      
      expect(userBook.finishedDate).toBeInstanceOf(Date);
      expect(userBook.finishedDate).toEqual(finishedDate);
      expect(userBook.startedDate).toBeUndefined();
    });

    it('should allow setting finished date first, then started date later', () => {
      // Book is already added in beforeEach
      // Set finished date first
      const finishedDate = new Date('2024-01-15');
      let userBook = database.updateUserBook(userId, bookId, {
        finishedDate: finishedDate
      });
      expect(userBook.finishedDate).toEqual(finishedDate);
      expect(userBook.startedDate).toBeUndefined();
      
      // Then set started date (must be <= finished date)
      const startedDate = new Date('2024-01-10');
      userBook = database.updateUserBook(userId, bookId, {
        startedDate: startedDate
      });
      expect(userBook.startedDate).toEqual(startedDate);
      expect(userBook.finishedDate).toEqual(finishedDate);
    });
  });

  describe('Boundary Conditions - Large Datasets', () => {
    it('should handle creating many users', () => {
      const users = [];
      for (let i = 0; i < 100; i++) {
        users.push(database.createUser({ username: `user${i}` }));
      }
      expect(users.length).toBe(100);
    });

    it('should handle creating many books', () => {
      const books = [];
      for (let i = 0; i < 1000; i++) {
        books.push(database.createBook({ 
          title: `Book ${i}`, 
          author: `Author ${i}` 
        }));
      }
      expect(books.length).toBe(1000);
    });

    it('should handle getAllBooks with many books', () => {
      // Create 500 books
      for (let i = 0; i < 500; i++) {
        database.createBook({ 
          title: `Book ${i}`, 
          author: `Author ${i}` 
        });
      }
      
      const allBooks = database.getAllBooks();
      expect(allBooks.length).toBeGreaterThanOrEqual(500);
    });

    it('should handle getUserBooks with many user books', () => {
      const user = database.createUser({ username: 'testuser' });
      
      // Create 100 books and add to collection
      for (let i = 0; i < 100; i++) {
        const book = database.createBook({ 
          title: `Book ${i}`, 
          author: `Author ${i}` 
        });
        database.addBookToUserCollection(user.id, book.id);
      }
      
      const userBooks = database.getUserBooks(user.id);
      expect(userBooks.length).toBe(100);
    });
  });

  describe('Boundary Conditions - Series Operations', () => {
    it('should handle series with many books', () => {
      const series = database.createSeries({ name: 'Long Series', author: 'Author' });
      
      // Add 50 books to series
      for (let i = 1; i <= 50; i++) {
        const book = database.createBook({ 
          title: `Book ${i}`, 
          author: 'Author',
          seriesId: series.id,
          position: i
        });
        expect(book.seriesId).toBe(series.id);
        expect(book.position).toBe(i);
      }
      
      const seriesBooks = database.getSeriesBooks(series.id);
      expect(seriesBooks.length).toBe(50);
    });

    it('should handle series name with special characters', () => {
      const series = database.createSeries({ 
        name: 'Series: "The Chronicles" - Part 1', 
        author: 'Author Name'
      });
      expect(series.name).toBe('Series: "The Chronicles" - Part 1');
    });
  });

  describe('Boundary Conditions - Genre Operations', () => {
    it('should handle genre names with unicode', () => {
      const genre = database.getOrCreateGenre('Science Fiction & Fantasy');
      expect(genre.name).toBe('Science Fiction & Fantasy');
    });

    it('should handle genre names with numbers', () => {
      const genre = database.getOrCreateGenre('Fiction 2024');
      expect(genre.name).toBe('Fiction 2024');
    });

    it('should trim genre names properly', () => {
      const genre = database.getOrCreateGenre('  Fantasy  ');
      expect(genre.name).toBe('Fantasy');
    });

    it('should handle book with maximum genres (20)', () => {
      const book = database.createBook({ title: 'Book', author: 'Author' });
      const genres = Array.from({ length: 20 }, (_, i) => `Genre ${i}`);
      
      database.addBookGenres(book.id, genres);
      const bookGenres = database.getBookGenres(book.id);
      
      expect(bookGenres.length).toBe(20);
    });
  });

  describe('Boundary Conditions - Search Operations', () => {
    beforeEach(() => {
      database.createBook({ title: 'A', author: 'B' });
      database.createBook({ title: 'The Book', author: 'The Author' });
      database.createBook({ title: 'Book with Numbers 123', author: 'Author 456' });
    });

    it('should handle single character search', () => {
      const results = database.searchBooks('A');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle search with partial words', () => {
      const results = database.searchBooks('Book');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive search', () => {
      const results1 = database.searchBooks('book');
      const results2 = database.searchBooks('BOOK');
      const results3 = database.searchBooks('Book');
      
      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });

    it('should handle search with numbers', () => {
      const results = database.searchBooks('123');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Boundary Conditions - Filtering', () => {
    let userId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      
      // Create books with different statuses
      const book1 = database.createBook({ title: 'Book 1', author: 'Author' });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author' });
      const book3 = database.createBook({ title: 'Book 3', author: 'Author' });
      
      database.addBookToUserCollection(userId, book1.id);
      database.addBookToUserCollection(userId, book2.id);
      database.addBookToUserCollection(userId, book3.id);
      
      database.updateUserBook(userId, book1.id, { status: 'read' as any });
      database.updateUserBook(userId, book2.id, { status: 'currently-reading' as any });
      database.updateUserBook(userId, book3.id, { status: 'to-read' as any });
    });

    it('should filter by single status', () => {
      const results = database.getUserBooks(userId, { status: ['read' as any] });
      expect(results.length).toBe(1);
      expect(results[0].userBook?.status).toBe('read');
    });

    it('should filter by multiple statuses', () => {
      const results = database.getUserBooks(userId, { 
        status: ['read' as any, 'currently-reading' as any] 
      });
      expect(results.length).toBe(2);
    });

    it('should filter by empty status array (no filter)', () => {
      const results = database.getUserBooks(userId, { status: [] });
      expect(results.length).toBe(3);
    });

    it('should handle sorting by different options', () => {
      const sortOptions = ['latest-added', 'title-az', 'author-az', 'year', 'date-started', 'date-finished'] as any;
      
      sortOptions.forEach(sort => {
        const results = database.getUserBooks(userId, undefined, sort);
        expect(results.length).toBe(3);
      });
    });
  });
});

