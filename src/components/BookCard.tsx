import { Link } from 'react-router-dom';
import type { BookWithDetails, ReadingStatus } from '../types';

interface BookCardProps {
  book: BookWithDetails;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (bookId: string, selected: boolean) => void;
  _onStatusChange?: (bookId: string, status: ReadingStatus) => void; // Reserved for future use
}

export default function BookCard({
  book,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: BookCardProps) {
  const statusColors: Record<ReadingStatus, string> = {
    'to-read': '#6c757d',
    'currently-reading': '#007bff',
    'read': '#28a745',
    'didnt-finish': '#dc3545'
  };

  const statusLabels: Record<ReadingStatus, string> = {
    'to-read': 'To Read',
    'currently-reading': 'Currently Reading',
    'read': 'Read',
    'didnt-finish': "Didn't Finish"
  };

  return (
    <div className="card" style={{
      display: 'flex',
      gap: '16px',
      position: 'relative',
      cursor: 'pointer',
      opacity: isSelected ? 0.7 : 1
    }}>
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect?.(book.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}
        />
      )}

      <Link to={`/book/${book.id}`} style={{ textDecoration: 'none', flex: '0 0 auto' }}>
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            style={{
              width: '100px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '4px',
              backgroundColor: 'var(--background-light)'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : (
          <div
            style={{
              width: '100px',
              height: '150px',
              backgroundColor: 'var(--background-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              textAlign: 'center',
              padding: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}
          >
            {book.title.substring(0, 20)}
            {book.title.length > 20 ? '...' : ''}
          </div>
        )}
        <div
          style={{
            display: 'none',
            width: '100px',
            height: '150px',
            backgroundColor: 'var(--background-light)',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            textAlign: 'center',
            padding: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}
        >
          {book.title}
        </div>
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/book/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
            {book.title}
          </h3>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            {book.author}
          </p>
        </Link>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {book.series && (
            <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
              Series: {book.series.name}
            </span>
          )}
          {book.userBook && (
            <span
              className="badge"
              style={{
                backgroundColor: statusColors[book.userBook.status] + '20',
                color: statusColors[book.userBook.status]
              }}
            >
              {statusLabels[book.userBook.status]}
            </span>
          )}
          {book.isOwned && (
            <span className="badge badge-primary">Owned</span>
          )}
        </div>

        {book.userBook && book.userBook.status === 'currently-reading' && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--background-light)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${book.userBook.progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary-color)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {book.userBook.progress}% complete
            </div>
          </div>
        )}

        {book.userBook?.startedDate && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Started: {new Date(book.userBook.startedDate).toLocaleDateString()}
          </div>
        )}

        {book.userBook?.finishedDate && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Finished: {new Date(book.userBook.finishedDate).toLocaleDateString()}
          </div>
        )}

        {book.genres && book.genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {book.genres.map(genre => (
              <span key={genre.id} className="badge" style={{ fontSize: '11px' }}>
                {genre.name}
              </span>
            ))}
          </div>
        )}

        {book.publicationYear && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {book.publicationYear}
            {book.pages && ` • ${book.pages} pages`}
            {book.format && ` • ${book.format}`}
          </div>
        )}
      </div>
    </div>
  );
}

