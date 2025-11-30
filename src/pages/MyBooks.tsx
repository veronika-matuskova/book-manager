import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getUserBooks,
  getUserBookCount,
  getUserSeriesCount,
  bulkRemoveUserBooks
} from '../db/database';
import BookCard from '../components/BookCard';
import type { BookWithDetails, BookFilters, SortOption } from '../types';

export default function MyBooks() {
  const { user } = useApp();
  const [books, setBooks] = useState<BookWithDetails[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, _setFilters] = useState<BookFilters>({});
  const [sort, setSort] = useState<SortOption>('latest-added');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [bookCount, setBookCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (user) {
      loadBooks();
      setBookCount(getUserBookCount(user.id));
      setSeriesCount(getUserSeriesCount(user.id));
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [books, filters, sort, searchQuery]);

  const loadBooks = () => {
    if (!user) return;
    const userBooks = getUserBooks(user.id, filters, sort);
    setBooks(userBooks);
    setFilteredBooks(userBooks);
  };

  const applyFilters = () => {
    let filtered = [...books];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.series?.name.toLowerCase().includes(query) ||
        book.series?.author.toLowerCase().includes(query)
      );
    }

    setFilteredBooks(filtered);
    setCurrentPage(1);
  };

  const handleSelectBook = (bookId: string, selected: boolean) => {
    setSelectedBooks(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(bookId);
      } else {
        next.delete(bookId);
      }
      return next;
    });
  };

  const handleBulkRemove = () => {
    if (!user || selectedBooks.size === 0) return;
    if (confirm(`Remove ${selectedBooks.size} book(s) from your collection?`)) {
      bulkRemoveUserBooks(user.id, Array.from(selectedBooks));
      setSelectedBooks(new Set());
      loadBooks();
      setBookCount(getUserBookCount(user.id));
    }
  };

  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>My Books</h1>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {bookCount} books {seriesCount > 0 && `• ${seriesCount} series`}
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search books..."
          style={{ width: '100%', maxWidth: '500px' }}
        />
      </form>

      {selectedBooks.size > 0 && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--border-radius)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{selectedBooks.size} book(s) selected</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-danger" onClick={handleBulkRemove}>
              Bulk Remove
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedBooks(new Set())}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{ padding: '8px 12px' }}
        >
          <option value="latest-added">Latest Added</option>
          <option value="title-az">Title (A-Z)</option>
          <option value="author-az">Author (A-Z)</option>
          <option value="year">Publication Year</option>
          <option value="date-started">Date Started</option>
          <option value="date-finished">Date Finished</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{ padding: '8px 12px' }}
        >
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
          <option value="75">75 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>

      {filteredBooks.length > 0 && (
        <div style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
          {searchQuery || Object.keys(filters).length > 0 ? (
            <>Showing {filteredBooks.length} of {bookCount} books</>
          ) : null}
        </div>
      )}

      {paginatedBooks.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {paginatedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                showCheckbox={true}
                isSelected={selectedBooks.has(book.id)}
                onSelect={handleSelectBook}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          {searchQuery ? (
            <>
              <p>No books found matching "{searchQuery}"</p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  applyFilters();
                }}
                style={{ marginTop: '16px' }}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <p>Your collection is empty.</p>
              <a href="/add-book" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                Add Your First Book
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

