import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  getAllBooks,
  searchBooks,
  getBookCount,
  getBookGenres,
  getSeries,
  getUserBook
} from '../db/database';
import BookCard from '../components/BookCard';
import type { BookWithDetails, BookFilters, SortOption } from '../types';

export default function Explore() {
  const { user } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<BookWithDetails[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, _setFilters] = useState<BookFilters>({});
  const [sort, setSort] = useState<SortOption>('latest-added');
  const [showFilters, setShowFilters] = useState(false);
  const [bookCount, setBookCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadBooks();
    setBookCount(getBookCount());
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const results = searchBooks(searchQuery, user?.id);
      setBooks(results);
      setFilteredBooks(results);
    } else {
      loadBooks();
    }
  }, [searchQuery, user]);

  useEffect(() => {
    applyFilters();
  }, [books, filters, sort]);

  const loadBooks = () => {
    const allBooks = getAllBooks();
    const booksWithDetails: BookWithDetails[] = allBooks.map(book => ({
      ...book,
      genres: getBookGenres(book.id),
      series: book.seriesId ? getSeries(book.seriesId) || undefined : undefined,
      isOwned: user ? !!getUserBook(user.id, book.id) : false
    }));
    setBooks(booksWithDetails);
    setFilteredBooks(booksWithDetails);
  };

  const applyFilters = () => {
    let filtered = [...books];

    if (filters.formats && filters.formats.length > 0) {
      filtered = filtered.filter(book => book.format && filters.formats!.includes(book.format));
    }

    if (filters.genres && filters.genres.length > 0) {
      filtered = filtered.filter(book =>
        book.genres?.some(genre => filters.genres!.includes(genre.name))
      );
    }

    if (filters.authors && filters.authors.length > 0) {
      filtered = filtered.filter(book => filters.authors!.includes(book.author));
    }

    // Apply sorting
    switch (sort) {
      case 'title-az':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author-az':
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'year':
        filtered.sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0));
        break;
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    setFilteredBooks(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
      loadBooks();
    }
  };

  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Explore</h1>
        <div style={{ color: 'var(--text-secondary)' }}>
          {filteredBooks.length === books.length ? (
            <>{bookCount} books</>
          ) : (
            <>Found {filteredBooks.length}/{bookCount} books</>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search all books..."
          style={{ width: '100%', maxWidth: '500px' }}
        />
      </form>

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

      {showFilters && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Filter List</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Filter UI would go here - simplified for MVP */}
          </div>
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
              <BookCard key={book.id} book={book} />
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
                className="btn btn-primary"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                  loadBooks();
                }}
                style={{ marginTop: '16px' }}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <p>No books in database yet.</p>
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

