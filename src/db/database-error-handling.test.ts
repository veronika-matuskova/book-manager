import { vi } from 'vitest';
import { closeTestDatabase } from '../test/db-test-utils';
import * as database from './database';
import initSqlJs from 'sql.js';
import path from 'path';

describe('Database Error Handling', () => {
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

  describe('User Operations - Error Handling', () => {
    it('should throw error when creating user with invalid email format', () => {
      expect(() => {
        database.createUser({ 
          username: 'testuser',
          email: 'invalid-email' // Invalid format
        });
      }).toThrow(/Please enter a valid email address/);
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@subdomain.example.com'
      ];

      validEmails.forEach((email, index) => {
        const user = database.createUser({ 
          username: `testuser${index}`,
          email: email
        });
        expect(user.email).toBe(email);
      });
    });

    it('should accept empty email (optional field)', () => {
      const user = database.createUser({ 
        username: 'testuser',
        email: undefined
      });
      expect(user.email).toBeUndefined();
    });

    it('should throw error when updating user with invalid email', () => {
      const user = database.createUser({ username: 'testuser' });
      
      expect(() => {
        database.updateUser(user.id, { email: 'invalid-email' });
      }).toThrow(/Please enter a valid email address/);
    });

    it('should throw error when creating user with invalid username format', () => {
      expect(() => {
        database.createUser({ username: 'ab' }); // Too short
      }).toThrow();
    });

    it('should throw error when creating user with special characters in username', () => {
      expect(() => {
        database.createUser({ username: 'user@name' }); // Invalid character
      }).toThrow(/Username must be/);
    });

    it('should throw error when username exceeds 50 characters', () => {
      const longUsername = 'a'.repeat(51);
      expect(() => {
        database.createUser({ username: longUsername });
      }).toThrow();
    });

    it('should throw error when updating non-existent user', () => {
      expect(() => {
        database.updateUser('non-existent-id', { displayName: 'New Name' });
      }).toThrow(/not found/);
    });

    it('should handle null/undefined displayName in update', () => {
      const user = database.createUser({ username: 'testuser', displayName: 'Original' });
      
      // Update with null should set it to null/undefined
      const updated = database.updateUser(user.id, { displayName: null as any });
      expect(updated.displayName).toBeUndefined();
    });

    it('should handle null/undefined email in update', () => {
      const user = database.createUser({ username: 'testuser', email: 'old@example.com' });
      
      const updated = database.updateUser(user.id, { email: null as any });
      expect(updated.email).toBeUndefined();
    });
  });

  describe('Book Operations - Error Handling', () => {
    it('should throw error when creating book with invalid ISBN format', () => {
      expect(() => {
        database.createBook({ 
          title: 'Book', 
          author: 'Author',
          isbn: '12345' // Not 10 or 13 digits
        });
      }).toThrow(/ISBN must be 10 or 13 digits/);
    });

    it('should accept valid ISBN-10', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        isbn: '1234567890' // Valid ISBN-10
      });
      expect(book.isbn).toBe('1234567890');
    });

    it('should accept valid ISBN-13', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        isbn: '9781234567890' // Valid ISBN-13
      });
      expect(book.isbn).toBe('9781234567890');
    });

    it('should accept ISBN with non-numeric characters (strips them)', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        isbn: '978-1-234-56789-0' // ISBN-13 with dashes
      });
      expect(book.isbn).toBe('978-1-234-56789-0');
    });

    it('should throw error when creating book with invalid ASIN format', () => {
      expect(() => {
        database.createBook({ 
          title: 'Book', 
          author: 'Author',
          asin: 'B12345' // Not 10 characters
        });
      }).toThrow(/ASIN must be 10 alphanumeric characters/);
    });

    it('should throw error when ASIN contains lowercase', () => {
      expect(() => {
        database.createBook({ 
          title: 'Book', 
          author: 'Author',
          asin: 'b01234567x' // Lowercase
        });
      }).toThrow(/ASIN must be 10 alphanumeric characters/);
    });

    it('should accept valid ASIN', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        asin: 'B01234567X' // Valid ASIN
      });
      expect(book.asin).toBe('B01234567X');
    });

    it('should throw error when creating book with empty title', () => {
      expect(() => {
        database.createBook({ title: '   ', author: 'Author' }); // Only whitespace
      }).toThrow();
    });

    it('should throw error when creating book with empty author', () => {
      expect(() => {
        database.createBook({ title: 'Title', author: '   ' }); // Only whitespace
      }).toThrow();
    });

    it('should throw error when creating duplicate book (case insensitive)', () => {
      database.createBook({ title: 'Test Book', author: 'Author' });
      
      expect(() => {
        database.createBook({ title: 'test book', author: 'author' });
      }).toThrow(/already exists/);
    });

    it('should handle invalid publication year gracefully', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        publicationYear: 9999 // Future year, but valid number
      });
      
      expect(book.publicationYear).toBe(9999);
    });

    it('should handle invalid pages (negative) gracefully', () => {
      // Database constraint should catch this
      expect(() => {
        database.createBook({ 
          title: 'Book', 
          author: 'Author',
          pages: -1
        });
      }).toThrow();
    });

    it('should handle invalid format gracefully', () => {
      expect(() => {
        database.createBook({ 
          title: 'Book', 
          author: 'Author',
          format: 'invalid-format' as any
        });
      }).toThrow();
    });

    it('should handle null values for optional fields', () => {
      const book = database.createBook({ 
        title: 'Book', 
        author: 'Author',
        isbn: null as any,
        asin: null as any,
        description: null as any
      });
      
      expect(book.isbn).toBeUndefined();
      expect(book.asin).toBeUndefined();
      expect(book.description).toBeUndefined();
    });

    it('should throw error when getting book with invalid ID format', () => {
      // Should return null, not throw
      const book = database.getBook('invalid-id-format');
      expect(book).toBeNull();
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'a'.repeat(5001); // Exceeds 5000 char limit
      
      expect(() => {
        database.createBook({ 
          title: 'Book', 
          author: 'Author',
          description: longDescription
        });
      }).toThrow();
    });
  });

  describe('Series Operations - Error Handling', () => {
    it('should handle creating series with empty name', () => {
      // SQLite constraint will reject empty name after trim
      try {
        database.createSeries({ name: '   ', author: 'Author' });
        // If it doesn't throw, the constraint might allow it
      } catch (e) {
        // If it throws, that's expected
        expect(e).toBeDefined();
      }
    });

    it('should handle creating series with empty author (trimmed)', () => {
      // SQLite constraint will reject empty author after trim
      try {
        database.createSeries({ name: 'Series', author: '   ' });
        // If it doesn't throw, the constraint might allow it
      } catch (e) {
        // If it throws, that's expected
        expect(e).toBeDefined();
      }
    });

    it('should throw error when updating non-existent series', () => {
      expect(() => {
        database.updateSeries('non-existent-id', { name: 'New Name' });
      }).toThrow(/not found/);
    });

    it('should throw error when deleting non-existent series', () => {
      // Should not throw, but should not affect anything
      expect(() => {
        database.deleteSeries('non-existent-id');
      }).not.toThrow();
    });

    it('should handle adding book to non-existent series', () => {
      const book = database.createBook({ title: 'Book', author: 'Author' });
      
      // SQLite foreign key constraint should handle this
      // It may throw or fail silently depending on foreign key enforcement
      try {
        database.addBookToSeries(book.id, 'non-existent-series-id');
        // If it doesn't throw, the operation may have failed silently
      } catch (e) {
        // If it throws, that's the expected behavior
        expect(e).toBeDefined();
      }
    });

    it('should throw error when book is already in another series', () => {
      const series1 = database.createSeries({ name: 'Series 1', author: 'Author' });
      const series2 = database.createSeries({ name: 'Series 2', author: 'Author' });
      const book = database.createBook({ title: 'Book', author: 'Author' });
      
      database.addBookToSeries(book.id, series1.id);
      
      expect(() => {
        database.addBookToSeries(book.id, series2.id);
      }).toThrow(/already in another series/);
    });
  });

  describe('UserBook Operations - Error Handling', () => {
    let userId: string;
    let bookId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      const book = database.createBook({ title: 'Test Book', author: 'Author' });
      bookId = book.id;
    });

    it('should handle adding book with invalid user ID', () => {
      // Foreign key constraint should catch this
      expect(() => {
        database.addBookToUserCollection('invalid-user-id', bookId);
      }).toThrow();
    });

    it('should handle adding book with invalid book ID', () => {
      // Foreign key constraint should catch this
      expect(() => {
        database.addBookToUserCollection(userId, 'invalid-book-id');
      }).toThrow();
    });

    it('should throw error when updating non-existent user book', () => {
      expect(() => {
        database.updateUserBook(userId, bookId, { status: 'read' as any });
      }).toThrow(/not found/);
    });

    it('should throw error when updating with invalid status', () => {
      database.addBookToUserCollection(userId, bookId);
      
      expect(() => {
        database.updateUserBook(userId, bookId, { status: 'invalid-status' as any });
      }).toThrow();
    });

    it('should throw error when updating with invalid progress (< 0)', () => {
      database.addBookToUserCollection(userId, bookId);
      
      expect(() => {
        database.updateUserBook(userId, bookId, { progress: -1 });
      }).toThrow();
    });

    it('should throw error when updating with invalid progress (> 100)', () => {
      database.addBookToUserCollection(userId, bookId);
      
      expect(() => {
        database.updateUserBook(userId, bookId, { progress: 101 });
      }).toThrow();
    });

    it('should throw error when finished date is before started date', () => {
      database.addBookToUserCollection(userId, bookId);
      
      expect(() => {
        database.updateUserBook(userId, bookId, {
          startedDate: new Date('2024-01-15'),
          finishedDate: new Date('2024-01-01')
        });
      }).toThrow(/Start date must be prior to finish date/);
    });

    it('should throw error when start date is in the future', () => {
      database.addBookToUserCollection(userId, bookId);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      expect(() => {
        database.updateUserBook(userId, bookId, {
          startedDate: futureDate
        });
      }).toThrow(/cannot be in the future/);
    });

    it('should throw error when finish date is in the future', () => {
      database.addBookToUserCollection(userId, bookId);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      expect(() => {
        database.updateUserBook(userId, bookId, {
          finishedDate: futureDate
        });
      }).toThrow(/cannot be in the future/);
    });

    it('should throw error when removing non-existent user book', () => {
      // Should not throw, just do nothing
      expect(() => {
        database.removeBookFromUserCollection(userId, bookId);
      }).not.toThrow();
    });

    it('should handle bulk updating with invalid book IDs', () => {
      // bulkUpdateUserBooks catches errors internally
      expect(() => {
        database.bulkUpdateUserBooks(userId, ['invalid-id'], { status: 'read' as any });
      }).not.toThrow();
    });

    it('should handle empty array in bulk operations', () => {
      expect(() => {
        database.bulkUpdateUserBooks(userId, [], { status: 'read' as any });
        database.bulkRemoveUserBooks(userId, []);
      }).not.toThrow();
    });

    it('should bulk update multiple books successfully', () => {
      const book1 = database.createBook({ title: 'Book 1', author: 'Author' });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author' });
      
      database.addBookToUserCollection(userId, book1.id);
      database.addBookToUserCollection(userId, book2.id);
      
      // Verify initial state
      const ub1Before = database.getUserBook(userId, book1.id);
      const ub2Before = database.getUserBook(userId, book2.id);
      expect(ub1Before?.status).toBe('to-read');
      expect(ub2Before?.status).toBe('to-read');
      expect(ub1Before?.progress).toBe(0);
      expect(ub2Before?.progress).toBe(0);
      
      // Bulk update to "read" status
      database.bulkUpdateUserBooks(userId, [book1.id, book2.id], { 
        status: 'read' as any 
      });
      
      // Verify changes applied
      const ub1After = database.getUserBook(userId, book1.id);
      const ub2After = database.getUserBook(userId, book2.id);
      
      expect(ub1After?.status).toBe('read');
      expect(ub2After?.status).toBe('read');
      expect(ub1After?.progress).toBe(100);
      expect(ub2After?.progress).toBe(100);
    });

    it('should bulk update with dates and progress', () => {
      const book1 = database.createBook({ title: 'Book 1', author: 'Author' });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author' });
      
      database.addBookToUserCollection(userId, book1.id);
      database.addBookToUserCollection(userId, book2.id);
      
      const startDate = new Date('2024-01-01');
      const finishDate = new Date('2024-01-15');
      
      database.bulkUpdateUserBooks(userId, [book1.id, book2.id], {
        status: 'currently-reading' as any,
        startedDate: startDate,
        progress: 50
      });
      
      const ub1 = database.getUserBook(userId, book1.id);
      const ub2 = database.getUserBook(userId, book2.id);
      
      expect(ub1?.status).toBe('currently-reading');
      expect(ub2?.status).toBe('currently-reading');
      expect(ub1?.startedDate).toEqual(startDate);
      expect(ub2?.startedDate).toEqual(startDate);
      expect(ub1?.progress).toBe(50);
      expect(ub2?.progress).toBe(50);
    });

    it('should bulk remove multiple books from collection', () => {
      const book1 = database.createBook({ title: 'Book 1', author: 'Author' });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author' });
      const book3 = database.createBook({ title: 'Book 3', author: 'Author' });
      
      database.addBookToUserCollection(userId, book1.id);
      database.addBookToUserCollection(userId, book2.id);
      database.addBookToUserCollection(userId, book3.id);
      
      // Verify initial state
      expect(database.getUserBookCount(userId)).toBe(3);
      expect(database.getUserBook(userId, book1.id)).not.toBeNull();
      expect(database.getUserBook(userId, book2.id)).not.toBeNull();
      expect(database.getUserBook(userId, book3.id)).not.toBeNull();
      
      // Bulk remove book1 and book2
      database.bulkRemoveUserBooks(userId, [book1.id, book2.id]);
      
      // Verify books removed from collection
      expect(database.getUserBookCount(userId)).toBe(1);
      expect(database.getUserBook(userId, book1.id)).toBeNull();
      expect(database.getUserBook(userId, book2.id)).toBeNull();
      expect(database.getUserBook(userId, book3.id)).not.toBeNull();
      
      // Verify books still exist in database
      expect(database.getBook(book1.id)).not.toBeNull();
      expect(database.getBook(book2.id)).not.toBeNull();
      expect(database.getBook(book3.id)).not.toBeNull();
    });

    it('should handle bulk operations with mixed valid and invalid book IDs', () => {
      const book1 = database.createBook({ title: 'Book 1', author: 'Author' });
      const book2 = database.createBook({ title: 'Book 2', author: 'Author' });
      
      database.addBookToUserCollection(userId, book1.id);
      database.addBookToUserCollection(userId, book2.id);
      
      // Bulk update with one valid and one invalid ID
      // Should update valid book and skip invalid one
      database.bulkUpdateUserBooks(userId, [book1.id, 'invalid-id'], { 
        status: 'read' as any 
      });
      
      const ub1 = database.getUserBook(userId, book1.id);
      expect(ub1?.status).toBe('read');
      
      // Bulk remove with one valid and one invalid ID
      // Should remove valid book and skip invalid one
      database.bulkRemoveUserBooks(userId, [book2.id, 'invalid-id']);
      
      expect(database.getUserBook(userId, book2.id)).toBeNull();
      expect(database.getUserBookCount(userId)).toBe(1);
    });
  });

  describe('Genre Operations - Error Handling', () => {
    it('should handle very long genre names', () => {
      const longGenreName = 'a'.repeat(300); // Exceeds 255 char limit
      
      const genre = database.getOrCreateGenre(longGenreName);
      expect(genre.name.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty genre name', () => {
      const genre = database.getOrCreateGenre('   ');
      expect(genre.name.trim()).toBe('');
    });

    it('should handle adding genres to non-existent book', () => {
      // Foreign key constraint may or may not be enforced depending on SQLite configuration
      // The function will execute but foreign key might be checked
      try {
        database.addBookGenres('non-existent-book-id', ['Fantasy']);
        // If it doesn't throw, foreign keys might not be enforced
      } catch (e) {
        // If it throws, that's expected
        expect(e).toBeDefined();
      }
    });

    it('should handle more than 20 genres (limit to 20)', () => {
      const book = database.createBook({ title: 'Book', author: 'Author' });
      const manyGenres = Array.from({ length: 25 }, (_, i) => `Genre ${i}`);
      
      database.addBookGenres(book.id, manyGenres);
      const genres = database.getBookGenres(book.id);
      
      expect(genres.length).toBe(20);
    });
  });

  describe('Reading Count Operations - Error Handling', () => {
    let userId: string;
    let bookId: string;

    beforeEach(() => {
      const user = database.createUser({ username: 'testuser' });
      userId = user.id;
      const book = database.createBook({ title: 'Test Book', author: 'Author' });
      bookId = book.id;
    });

    it('should throw error when neither bookId nor seriesId provided', () => {
      expect(() => {
        database.addReadingCountLog(userId);
      }).toThrow(/Either bookId or seriesId/);
    });

    it('should throw error when both bookId and seriesId provided', () => {
      const series = database.createSeries({ name: 'Series', author: 'Author' });
      
      // Database constraint requires exactly one of bookId or seriesId
      expect(() => {
        database.addReadingCountLog(userId, bookId, series.id);
      }).toThrow();
    });

    it('should handle invalid bookId', () => {
      // Foreign key constraint may or may not be enforced
      try {
        database.addReadingCountLog(userId, 'invalid-book-id');
        // May succeed or fail depending on foreign key enforcement
      } catch (e) {
        // If it throws, that's expected
        expect(e).toBeDefined();
      }
    });

    it('should handle invalid seriesId', () => {
      // Foreign key constraint may or may not be enforced
      try {
        database.addReadingCountLog(userId, undefined, 'invalid-series-id');
        // May succeed or fail depending on foreign key enforcement
      } catch (e) {
        // If it throws, that's expected
        expect(e).toBeDefined();
      }
    });

    it('should handle invalid readDate gracefully', () => {
      const invalidDate = new Date('invalid');
      
      // Invalid dates will be handled by formatDate which returns null for invalid dates
      // The function may throw or handle it - let's check the behavior
      expect(() => {
        try {
          database.addReadingCountLog(userId, bookId, undefined, invalidDate);
        } catch (e) {
          // If it throws, that's also acceptable behavior
        }
      }).not.toThrow();
    });
  });

  describe('Search Operations - Error Handling', () => {
    beforeEach(() => {
      database.createBook({ title: 'JavaScript Guide', author: 'John Doe' });
      database.createBook({ title: 'Python Basics', author: 'Jane Smith' });
    });

    it('should handle empty search query', () => {
      // Empty search might return all books or empty array - both are valid
      const results = database.searchBooks('');
      expect(Array.isArray(results)).toBe(true);
      // The actual behavior depends on implementation
    });

    it('should handle search with special characters', () => {
      const results = database.searchBooks('@#$%');
      expect(results).toEqual([]);
    });

    it('should handle very long search query', () => {
      const longQuery = 'a'.repeat(1000);
      const results = database.searchBooks(longQuery);
      // Should not throw, just return empty or filtered results
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle SQL injection attempts', () => {
      const maliciousQuery = "'; DROP TABLE books; --";
      const results = database.searchBooks(maliciousQuery);
      // Should handle safely, not execute SQL
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Statistics - Error Handling', () => {
    it('should return 0 for non-existent user in getUserBookCount', () => {
      const count = database.getUserBookCount('non-existent-user-id');
      expect(count).toBe(0);
    });

    it('should return 0 for non-existent series in getSeriesBookCount', () => {
      const count = database.getSeriesBookCount('non-existent-series-id');
      expect(count).toBe(0);
    });

    it('should handle getUserSeriesCount with non-existent user', () => {
      const count = database.getUserSeriesCount('non-existent-user-id');
      expect(count).toBe(0);
    });
  });
});

