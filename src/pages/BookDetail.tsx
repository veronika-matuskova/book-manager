import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  getBook,
  getBookGenres,
  getSeries,
  getUserBook,
  addBookToUserCollection,
  removeBookFromUserCollection,
  updateUserBook,
  addReadingCountLog,
  getReadingCount,
  getSeriesBookCount
} from '../db/database';
import { ReadingStatus } from '../types';
import type { BookWithDetails, UserBookFormData } from '../types';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [book, setBook] = useState<BookWithDetails | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ReadingStatus>(ReadingStatus.TO_READ);
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [readingCount, setReadingCount] = useState(0);
  const [seriesBookCount, setSeriesBookCount] = useState(0);

  useEffect(() => {
    if (id && user) {
      loadBook();
    }
  }, [id, user]);

  // Set seriesBookCount when book changes
  useEffect(() => {
    if (book?.seriesId) {
      setSeriesBookCount(getSeriesBookCount(book.seriesId));
    }
  }, [book?.seriesId]);

  const loadBook = () => {
    if (!id) return;
    const bookData = getBook(id);
    if (!bookData) {
      navigate('/explore');
      return;
    }

    const bookWithDetails: BookWithDetails = {
      ...bookData,
      genres: getBookGenres(id),
      series: bookData.seriesId ? getSeries(bookData.seriesId) || undefined : undefined,
      userBook: user ? getUserBook(user.id, id) || undefined : undefined,
      readingCount: user ? getReadingCount(user.id, id) : 0,
      isOwned: user ? !!getUserBook(user.id, id) : false
    };

    setBook(bookWithDetails);
    setReadingCount(bookWithDetails.readingCount || 0);
    
    if (bookWithDetails.userBook) {
      setProgress(bookWithDetails.userBook.progress);
      setStartDate(bookWithDetails.userBook.startedDate ? 
        new Date(bookWithDetails.userBook.startedDate).toISOString().split('T')[0] : '');
      setFinishDate(bookWithDetails.userBook.finishedDate ? 
        new Date(bookWithDetails.userBook.finishedDate).toISOString().split('T')[0] : '');
    }
  };

  const handleAddToCollection = () => {
    if (!user || !id) return;
    try {
      addBookToUserCollection(user.id, id);
      loadBook();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemoveFromCollection = () => {
    if (!user || !id) return;
    if (confirm('Remove this book from your collection?')) {
      removeBookFromUserCollection(user.id, id);
      loadBook();
    }
  };

  const handleStatusChange = () => {
    if (!user || !id || !book) return;

    const updateData: Partial<UserBookFormData> = {
      status: newStatus,
      progress: newStatus === 'read' ? 100 : progress
    };

    if (startDate) {
      updateData.startedDate = new Date(startDate);
    }
    if (finishDate) {
      updateData.finishedDate = new Date(finishDate);
    }

    try {
      if (newStatus === 'read' && (!book.userBook || book.userBook.status !== 'read')) {
        if (confirm(`Did you finish reading "${book.title}"?`)) {
          updateUserBook(user.id, id, updateData);
          addReadingCountLog(user.id, id, book.seriesId, finishDate ? new Date(finishDate) : new Date());
          if (book.seriesId) {
            addReadingCountLog(user.id, undefined, book.seriesId, finishDate ? new Date(finishDate) : new Date());
          }
          loadBook();
        }
      } else {
        updateUserBook(user.id, id, updateData);
        loadBook();
      }
      setShowStatusModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!book) {
    return <div className="spinner"></div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px' }}>
        <div>
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              style={{
                width: '100%',
                borderRadius: 'var(--border-radius)',
                boxShadow: 'var(--shadow-lg)'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              aspectRatio: '2/3',
              backgroundColor: 'var(--background-light)',
              borderRadius: 'var(--border-radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '16px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              {book.title}
            </div>
          )}
        </div>

        <div>
          <h1 style={{ marginBottom: '8px' }}>{book.title}</h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {book.author}
          </p>

          {book.series && (
            <div style={{ marginBottom: '16px' }}>
              <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                Series: <Link to={`/series/${book.series.id}`}>{book.series.name}</Link>
              </span>
              {seriesBookCount > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  ({seriesBookCount} books in series)
                </span>
              )}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            {book.userBook && (
              <span className="badge badge-primary" style={{ marginRight: '8px' }}>
                {book.userBook.status.replace('-', ' ')}
              </span>
            )}
            {readingCount > 0 && (
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Read {readingCount} time{readingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {book.userBook && book.userBook.status === 'currently-reading' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Progress</span>
                <span>{book.userBook.progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: 'var(--background-light)',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${book.userBook.progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary-color)'
                }} />
              </div>
            </div>
          )}

          {book.userBook?.startedDate && (
            <p style={{ marginBottom: '8px', fontSize: '14px' }}>
              Started: {new Date(book.userBook.startedDate).toLocaleDateString()}
            </p>
          )}

          {book.userBook?.finishedDate && (
            <p style={{ marginBottom: '16px', fontSize: '14px' }}>
              Finished: {new Date(book.userBook.finishedDate).toLocaleDateString()}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            {book.isOwned ? (
              <>
                <button className="btn btn-primary" onClick={() => setShowStatusModal(true)}>
                  Edit Status
                </button>
                <button className="btn btn-danger" onClick={handleRemoveFromCollection}>
                  Remove from Collection
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleAddToCollection}>
                Add to My Books
              </button>
            )}
          </div>

          {book.genres && book.genres.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Genres</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {book.genres.map(genre => (
                  <span key={genre.id} className="badge">{genre.name}</span>
                ))}
              </div>
            </div>
          )}

          {(book.publicationYear || book.pages || book.format) && (
            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {book.publicationYear && <span>Published: {book.publicationYear}</span>}
              {book.pages && <span>{book.publicationYear ? ' • ' : ''}{book.pages} pages</span>}
              {book.format && <span>{book.pages || book.publicationYear ? ' • ' : ''}{book.format}</span>}
            </div>
          )}

          {book.description && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '8px' }}>Description</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{book.description}</p>
            </div>
          )}
        </div>
      </div>

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Update Reading Status</h2>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReadingStatus)}
                  style={{ width: '100%' }}
                >
                  <option value="to-read">To Read</option>
                  <option value="currently-reading">Currently Reading</option>
                  <option value="read">Read</option>
                  <option value="didnt-finish">Didn't Finish</option>
                </select>
              </div>

              {newStatus === 'currently-reading' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {(newStatus === 'currently-reading' || newStatus === 'read') && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    disabled={newStatus === 'read'}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {newStatus === 'read' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Finish Date</label>
                  <input
                    type="date"
                    value={finishDate}
                    onChange={(e) => setFinishDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusChange}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

