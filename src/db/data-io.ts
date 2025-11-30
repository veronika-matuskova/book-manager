// Data Import/Export functions for loading from and saving to JSON files
// Since this is a browser app, files must be manually saved to the data folder
// but we can load from the data folder via static file serving

import type {
  User,
  Book,
  Series,
  Genre,
  UserBook,
  ReadingCountLog,
  BookFormData
} from '../types';
import { BookFormat } from '../types';
import {
  createUser,
  createBook,
  createSeries,
  addBookToUserCollection,
  updateUserBook,
  addReadingCountLog,
  getFirstUser,
  getAllBooks,
  getAllSeries,
  getAllGenres,
  getUserBooks,
  getBookGenres,
  getOrCreateGenre
} from './database';

export interface DatabaseExport {
  users: User[];
  books: Book[];
  series: Series[];
  genres: Genre[];
  userBooks: UserBook[];
  readingCountLogs: ReadingCountLog[];
  exportedAt: string;
  version: string;
}

/**
 * Export entire database to JSON format
 */
export async function exportDatabaseToJSON(): Promise<string> {
  // Get all data from database
  const user = getFirstUser();
  const users = user ? [user] : [];
  const allBooks = getAllBooks();
  const series = getAllSeries();
  const genres = getAllGenres();
  
  // Enhance books with their genres
  const booksWithGenres = allBooks.map(book => {
    const bookGenres = getBookGenres(book.id);
    return {
      ...book,
      genreNames: bookGenres.map(g => g.name)
    };
  });
  
  // Get user books and reading count logs
  let userBooks: UserBook[] = [];
  let readingCountLogs: ReadingCountLog[] = [];
  
  if (user) {
    const userBookDetails = getUserBooks(user.id);
    userBooks = userBookDetails
      .filter(b => b.userBook)
      .map(b => b.userBook!);
    
    // Note: We need to query all reading count logs from the database
    // For now, we'll export an empty array
    readingCountLogs = [];
  }
  
  const exportData: DatabaseExport & { bookGenreMap?: Record<string, string[]> } = {
    users,
    books: allBooks,
    series,
    genres,
    userBooks,
    readingCountLogs,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    bookGenreMap: booksWithGenres.reduce((acc, book) => {
      acc[book.id] = book.genreNames;
      return acc;
    }, {} as Record<string, string[]>)
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Download database as JSON file
 * User can then manually save this to the data folder in the repository
 */
export async function downloadDatabaseJSON(filename: string = `book-manager-export-${new Date().toISOString().split('T')[0]}.json`): Promise<void> {
  const jsonData = await exportDatabaseToJSON();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Load JSON file from data folder via fetch
 */
export async function loadJSONFromDataFolder(path: string): Promise<any> {
  try {
    const response = await fetch(`/data/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    throw error;
  }
}

/**
 * Import database from JSON data
 */
export async function importDatabaseFromJSON(jsonData: string, clearExisting: boolean = false): Promise<void> {
  const data: DatabaseExport = JSON.parse(jsonData);
  
  // Clear existing data if requested
  if (clearExisting) {
    // Note: This would require delete functions - for now, we'll just skip duplicates
    console.warn('Clear existing not fully implemented - will skip duplicates');
  }
  
  // Import in correct order (respecting foreign keys)
  
  // 1. Users
  for (const user of data.users) {
    try {
      createUser({
        username: user.username,
        displayName: user.displayName,
        email: user.email
      });
    } catch (error: any) {
      if (!error.message?.includes('already taken')) {
        throw error;
      }
    }
  }
  
  // 2. Series
  for (const ser of data.series) {
    try {
      createSeries({
        name: ser.name,
        author: ser.author
      });
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.error(`Failed to import series "${ser.name}" by ${ser.author}:`, error);
        throw error;
      }
    }
  }
  
  // 2.5. Genres (ensure they exist before books reference them)
  // Genres will also be auto-created when books are added, but pre-creating is cleaner
  for (const genre of data.genres) {
    try {
      getOrCreateGenre(genre.name);
    } catch (error: any) {
      console.warn(`Failed to pre-create genre "${genre.name}":`, error);
      // Continue - genres will be created when books are added
    }
  }
  
  // 3. Books (with genres)
  // Get genre mapping if available (from newer exports)
  const bookGenreMap = (data as any).bookGenreMap || {};
  
  let importedBooks = 0;
  let skippedBooks = 0;
  
  for (const book of data.books) {
    try {
      // Get genres for this book from export data
      const genreNames = bookGenreMap[book.id] || [];
      
      createBook({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        asin: book.asin,
        seriesId: book.seriesId,
        position: book.position,
        publicationYear: book.publicationYear,
        pages: book.pages,
        format: book.format,
        coverImageUrl: book.coverImageUrl,
        description: book.description,
        genres: genreNames.length > 0 ? genreNames : undefined
      });
      importedBooks++;
      console.log(`✓ Imported book: "${book.title}" by ${book.author}`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        skippedBooks++;
        console.log(`⊘ Skipped existing book: "${book.title}" by ${book.author}`);
      } else {
        console.error(`✗ Failed to import book "${book.title}" by ${book.author}:`, error);
        console.error('  Error details:', error.message || error);
        throw error;
      }
    }
  }
  
  console.log(`\n📚 Import summary: ${importedBooks} books imported, ${skippedBooks} skipped`);
  
  // 4. User Books
  for (const userBook of data.userBooks) {
    try {
      addBookToUserCollection(userBook.userId, userBook.bookId);
      
      // Convert date strings to Date objects if they exist
      const startedDate = userBook.startedDate 
        ? (typeof userBook.startedDate === 'string' ? new Date(userBook.startedDate) : userBook.startedDate)
        : undefined;
      const finishedDate = userBook.finishedDate 
        ? (typeof userBook.finishedDate === 'string' ? new Date(userBook.finishedDate) : userBook.finishedDate)
        : undefined;
      
      updateUserBook(userBook.userId, userBook.bookId, {
        status: userBook.status,
        startedDate: startedDate,
        finishedDate: finishedDate,
        progress: userBook.progress
      });
    } catch (error: any) {
      if (!error.message?.includes('already')) {
        console.error(`Failed to import user book for book ${userBook.bookId}:`, error);
        throw error;
      }
    }
  }
  
  // 5. Reading Count Logs
  for (const log of data.readingCountLogs) {
    try {
      // Convert date string to Date object if it's a string
      const readDate = typeof log.readDate === 'string' ? new Date(log.readDate) : log.readDate;
      
      addReadingCountLog(
        log.userId,
        log.bookId,
        log.seriesId,
        readDate
      );
    } catch (error) {
      console.warn(`Failed to add reading count log:`, error);
    }
  }
}

/**
 * Load JSON file from File object (file input)
 */
export async function loadJSONFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        await importDatabaseFromJSON(jsonData);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Convert Amazon export format to our database format
 */
export function convertAmazonExportToBooks(amazonData: any[]): BookFormData[] {
  return amazonData.map((item: any) => {
    const author = Array.isArray(item.authors) ? item.authors[0]?.replace(/[:\s]+$/, '') || 'Unknown' : 'Unknown';
    const format: BookFormat | undefined = item.resourceType === 'EBOOK' ? BookFormat.DIGITAL : undefined;
    
    return {
      title: item.title || 'Untitled',
      author: author,
      asin: item.asin || undefined,
      format: format,
      coverImageUrl: item.productUrl || undefined,
      description: undefined
    };
  });
}

/**
 * Load and import database export JSON file from data folder
 * This is a convenience function that loads the file and imports it in one step
 */
export async function loadAndImportFromDataFolder(path: string, clearExisting: boolean = false): Promise<void> {
  try {
    console.log(`📂 Loading data from: /data/${path}`);
    const jsonData = await loadJSONFromDataFolder(path);
    
    if (!jsonData) {
      throw new Error('Failed to load JSON data - file may not exist or is empty');
    }
    
    console.log(`📦 Data loaded. Importing...`);
    console.log(`   - ${jsonData.users?.length || 0} users`);
    console.log(`   - ${jsonData.books?.length || 0} books`);
    console.log(`   - ${jsonData.series?.length || 0} series`);
    console.log(`   - ${jsonData.genres?.length || 0} genres`);
    
    // Convert the parsed object back to JSON string for importDatabaseFromJSON
    await importDatabaseFromJSON(JSON.stringify(jsonData), clearExisting);
    console.log(`✅ Import completed successfully!`);
  } catch (error) {
    console.error(`❌ Failed to load and import from ${path}:`, error);
    throw error;
  }
}

/**
 * Clear the database and recreate it with the latest schema
 * Useful for fixing schema migration issues
 * WARNING: This will delete all data!
 */
export function clearAndResetDatabase(): void {
  localStorage.removeItem('book-manager-db');
  console.log('✅ Database cleared. Refresh the page to create a new database with the latest schema.');
  alert('Database cleared! Please refresh the page to recreate it.');
}

/**
 * Load and import Amazon export JSON file from data folder
 */
export async function loadAmazonExport(path: string = 'jsonExport/deduped_books_and_documents.json'): Promise<number> {
  try {
    const amazonData = await loadJSONFromDataFolder(path);
    const booksToImport = convertAmazonExportToBooks(amazonData);
    
    let imported = 0;
    for (const bookData of booksToImport) {
      try {
        createBook(bookData);
        imported++;
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          console.warn(`Failed to import book "${bookData.title}":`, error);
        }
      }
    }
    
    return imported;
  } catch (error) {
    console.error('Failed to load Amazon export:', error);
    throw error;
  }
}

