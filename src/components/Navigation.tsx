import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { searchBooks } from '../db/database';
import type { BookWithDetails } from '../types';

export default function Navigation() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookWithDetails[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      setIsSearching(true);
      const results = searchBooks(query, user?.id);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/book/${bookId}`);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setSearchQuery('');
    }
  };

  return (
    <nav style={{
      backgroundColor: 'white',
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        <Link to="/explore" style={{ 
          textDecoration: 'none', 
          color: 'var(--primary-color)', 
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          Book Manager
        </Link>

        <form onSubmit={handleSearchSubmit} style={{ flex: 1, position: 'relative', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Search all books..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)'
            }}
          />
          {showResults && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-lg)',
              marginTop: '4px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 200
            }}>
              {isSearching ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div style={{ 
                    padding: '12px', 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    Found {searchResults.length} books
                  </div>
                  {searchResults.slice(0, 10).map(book => (
                    <div
                      key={book.id}
                      onClick={() => handleBookClick(book.id)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--background-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '60px',
                          backgroundColor: 'var(--background-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          textAlign: 'center',
                          borderRadius: '4px'
                        }}>
                          {book.title.substring(0, 2)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{book.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {book.author}
                        </div>
                        {book.isOwned && (
                          <span className="badge badge-primary" style={{ marginTop: '4px', display: 'inline-block' }}>
                            Owned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No books found
                </div>
              )}
            </div>
          )}
        </form>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link
            to="/explore"
            style={{
              textDecoration: 'none',
              color: location.pathname === '/explore' ? 'var(--primary-color)' : 'var(--text-primary)',
              fontWeight: location.pathname === '/explore' ? '600' : '400'
            }}
          >
            Explore
          </Link>
          <Link
            to="/my-books"
            style={{
              textDecoration: 'none',
              color: location.pathname === '/my-books' ? 'var(--primary-color)' : 'var(--text-primary)',
              fontWeight: location.pathname === '/my-books' ? '600' : '400'
            }}
          >
            My Books
          </Link>
          <Link
            to="/add-book"
            style={{
              textDecoration: 'none',
              color: location.pathname === '/add-book' ? 'var(--primary-color)' : 'var(--text-primary)',
              fontWeight: location.pathname === '/add-book' ? '600' : '400'
            }}
          >
            Add Book
          </Link>
          {user && (
            <Link
              to="/profile"
              style={{
                textDecoration: 'none',
                color: location.pathname === '/profile' ? 'var(--primary-color)' : 'var(--text-primary)',
                fontWeight: location.pathname === '/profile' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{user.displayName || user.username}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

