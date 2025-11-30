import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBook, getAllSeries } from '../db/database';
import type { BookFormData } from '../types';

export default function AddBook() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    asin: '',
    publicationYear: undefined,
    pages: undefined,
    format: undefined,
    coverImageUrl: '',
    description: '',
    genres: []
  });
  const [genreInput, setGenreInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seriesList] = useState(getAllSeries());
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [seriesPosition, setSeriesPosition] = useState<number | undefined>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name === 'publicationYear' || name === 'pages' ? Number(value) : value)
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGenreAdd = () => {
    if (genreInput.trim() && formData.genres && formData.genres.length < 20) {
      setFormData(prev => ({
        ...prev,
        genres: [...(prev.genres || []), genreInput.trim()]
      }));
      setGenreInput('');
    }
  };

  const handleGenreRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres?.filter((_, i) => i !== index)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }
    if (formData.isbn && formData.isbn.replace(/\D/g, '').length !== 10 && formData.isbn.replace(/\D/g, '').length !== 13) {
      newErrors.isbn = 'ISBN must be 10 or 13 digits';
    }
    if (formData.asin && !/^[A-Z0-9]{10}$/.test(formData.asin.toUpperCase())) {
      newErrors.asin = 'ASIN must be 10 alphanumeric characters';
    }
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters';
    }
    if (formData.genres && formData.genres.length > 20) {
      newErrors.genres = 'Maximum 20 genres per book';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const bookData: BookFormData = {
        ...formData,
        asin: formData.asin ? formData.asin.toUpperCase() : undefined,
        seriesId: selectedSeriesId || undefined,
        position: seriesPosition
      };
      const book = createBook(bookData);
      navigate(`/book/${book.id}`);
    } catch (error: any) {
      setErrors(prev => ({ ...prev, general: error.message || 'Failed to add book' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Add Book</h1>

      {errors.general && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          color: '#dc3545',
          borderRadius: 'var(--border-radius)',
          marginBottom: '20px'
        }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>Basic Information</h2>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Title <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'error' : ''}
              required
              style={{ width: '100%' }}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="author" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Author <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className={errors.author ? 'error' : ''}
              required
              style={{ width: '100%' }}
            />
            {errors.author && <div className="error-message">{errors.author}</div>}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>Additional Details</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label htmlFor="isbn" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>ISBN</label>
              <input
                type="text"
                id="isbn"
                name="isbn"
                value={formData.isbn || ''}
                onChange={handleChange}
                className={errors.isbn ? 'error' : ''}
                style={{ width: '100%' }}
              />
              {errors.isbn && <div className="error-message">{errors.isbn}</div>}
            </div>

            <div>
              <label htmlFor="asin" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>ASIN</label>
              <input
                type="text"
                id="asin"
                name="asin"
                value={formData.asin || ''}
                onChange={handleChange}
                className={errors.asin ? 'error' : ''}
                style={{ width: '100%' }}
                maxLength={10}
              />
              {errors.asin && <div className="error-message">{errors.asin}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label htmlFor="publicationYear" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Year</label>
              <input
                type="number"
                id="publicationYear"
                name="publicationYear"
                value={formData.publicationYear || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
                min="1000"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label htmlFor="pages" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Pages</label>
              <input
                type="number"
                id="pages"
                name="pages"
                value={formData.pages || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
                min="1"
              />
            </div>

            <div>
              <label htmlFor="format" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Format</label>
              <select
                id="format"
                name="format"
                value={formData.format || ''}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                <option value="">None</option>
                <option value="digital">Digital</option>
                <option value="physical">Physical</option>
                <option value="audiobook">Audiobook</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="coverImageUrl" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Cover Image URL</label>
            <input
              type="url"
              id="coverImageUrl"
              name="coverImageUrl"
              value={formData.coverImageUrl || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
              maxLength={5000}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {(formData.description || '').length}/5000 characters
            </div>
            {errors.description && <div className="error-message">{errors.description}</div>}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>Series</h2>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="seriesId" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Series</label>
            <select
              id="seriesId"
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">None</option>
              {seriesList.map(series => (
                <option key={series.id} value={series.id}>
                  {series.name} by {series.author}
                </option>
              ))}
            </select>
          </div>

          {selectedSeriesId && (
            <div>
              <label htmlFor="seriesPosition" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Position in Series</label>
              <input
                type="number"
                id="seriesPosition"
                value={seriesPosition || ''}
                onChange={(e) => setSeriesPosition(e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100%' }}
                min="1"
              />
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>Genres</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenreAdd();
                }
              }}
              placeholder="Add genre..."
              style={{ flex: 1 }}
              maxLength={255}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGenreAdd}
              disabled={!genreInput.trim() || (formData.genres?.length || 0) >= 20}
            >
              Add
            </button>
          </div>
          {formData.genres && formData.genres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.genres.map((genre, index) => (
                <span key={index} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {genre}
                  <button
                    type="button"
                    onClick={() => handleGenreRemove(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '16px',
                      lineHeight: '1',
                      color: 'inherit'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {(formData.genres?.length || 0)}/20 genres
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Book...' : 'Add Book'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/explore')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

