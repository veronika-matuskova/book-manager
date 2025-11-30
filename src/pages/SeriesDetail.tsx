import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  getSeries,
  getSeriesBooks,
  getSeriesBookCount,
  getReadingCount
} from '../db/database';
import BookCard from '../components/BookCard';
import type { BookWithDetails, SeriesWithDetails } from '../types';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [series, setSeries] = useState<SeriesWithDetails | null>(null);
  const [books, setBooks] = useState<BookWithDetails[]>([]);
  const [bookCount, setBookCount] = useState(0);
  const [readingCount, setReadingCount] = useState(0);

  useEffect(() => {
    if (id && user) {
      loadSeries();
    }
  }, [id, user]);

  const loadSeries = () => {
    if (!id) return;
    const seriesData = getSeries(id);
    if (!seriesData) {
      navigate('/explore');
      return;
    }

    const booksData = getSeriesBooks(id, user?.id);
    setBooks(booksData);
    setBookCount(getSeriesBookCount(id));
    setReadingCount(user ? getReadingCount(user.id, undefined, id) : 0);

    setSeries({
      ...seriesData,
      books: booksData
    });
  };

  if (!series) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← Back
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1>{series.name}</h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          by {series.author}
        </p>
        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)' }}>
          <span>{bookCount} books</span>
          {readingCount > 0 && (
            <span>Read {readingCount} time{readingCount > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {books.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No books in this series yet.
        </div>
      )}
    </div>
  );
}

