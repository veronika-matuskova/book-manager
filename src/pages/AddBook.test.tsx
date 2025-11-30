import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AddBook from './AddBook';
import * as database from '../db/database';

// Mock database functions
vi.mock('../db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/database')>();
  return {
    ...actual,
    initDatabase: vi.fn().mockResolvedValue(undefined),
    createBook: vi.fn(),
    getAllSeries: vi.fn(() => []),
    createSeries: vi.fn()
  };
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('AddBook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render add book form', () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    // Use getByRole for heading to avoid ambiguity with button text
    expect(screen.getByRole('heading', { name: /Add Book/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Author/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Book/i })).toBeInTheDocument();
  });

  it('should validate title is required', async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const form = screen.getByRole('button', { name: /Add Book/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
  });

  it('should validate author is required', async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    
    const form = screen.getByRole('button', { name: /Add Book/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Author is required/i)).toBeInTheDocument();
    });
  });

  it('should validate ISBN format (must be 10 or 13 digits)', async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    const isbnInput = screen.getByLabelText(/ISBN/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    fireEvent.change(isbnInput, { target: { value: '12345' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/ISBN must be 10 or 13 digits/i)).toBeInTheDocument();
    });
  });

  it('should accept valid ISBN-10', async () => {
    const mockBook = {
      id: 'book-1',
      title: 'Test Book',
      author: 'Author',
      isbn: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createBook).mockReturnValue(mockBook);
    
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    const isbnInput = screen.getByLabelText(/ISBN/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    fireEvent.change(isbnInput, { target: { value: '1234567890' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createBook).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/book/book-1');
    });
  });

  it('should accept valid ISBN-13', async () => {
    const mockBook = {
      id: 'book-1',
      title: 'Test Book',
      author: 'Author',
      isbn: '9781234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createBook).mockReturnValue(mockBook);
    
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    const isbnInput = screen.getByLabelText(/ISBN/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    fireEvent.change(isbnInput, { target: { value: '978-1-234-56789-0' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createBook).toHaveBeenCalled();
    });
  });

  it('should validate ASIN format (must be 10 alphanumeric)', async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    const asinInput = screen.getByLabelText(/ASIN/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    fireEvent.change(asinInput, { target: { value: 'B12345' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/ASIN must be 10 alphanumeric characters/i)).toBeInTheDocument();
    });
  });

  it('should convert ASIN to uppercase', async () => {
    const mockBook = {
      id: 'book-1',
      title: 'Test Book',
      author: 'Author',
      asin: 'B01234567X',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createBook).mockReturnValue(mockBook);
    
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    const asinInput = screen.getByLabelText(/ASIN/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    fireEvent.change(asinInput, { target: { value: 'b01234567x' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createBook).toHaveBeenCalledWith(
        expect.objectContaining({
          asin: 'B01234567X'
        })
      );
    });
  });

  it('should validate description length (max 5000 characters)', async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    fireEvent.change(descriptionInput, { target: { value: 'A'.repeat(5001) } });
    
    const form = screen.getByRole('button', { name: /Add Book/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Description cannot exceed 5000 characters/i)).toBeInTheDocument();
    });
  });

  it('should successfully create book with required fields', async () => {
    const mockBook = {
      id: 'book-1',
      title: 'Test Book',
      author: 'Author',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createBook).mockReturnValue(mockBook);
    
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Book',
          author: 'Author'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/book/book-1');
    });
  });

  it('should display error message when book creation fails', async () => {
    vi.mocked(database.createBook).mockImplementation(() => {
      throw new Error('A book with this title and author already exists in the database');
    });
    
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const titleInput = screen.getByLabelText(/Title/i);
    const authorInput = screen.getByLabelText(/Author/i);
    
    fireEvent.change(titleInput, { target: { value: 'Duplicate Book' } });
    fireEvent.change(authorInput, { target: { value: 'Author' } });
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/A book with this title and author already exists/i)).toBeInTheDocument();
    });
  });

  it('should clear errors when user types in field', async () => {
    render(
      <MemoryRouter>
        <AddBook />
      </MemoryRouter>
    );
    
    const form = screen.getByRole('button', { name: /Add Book/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
    
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/Title is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Series functionality', () => {
    const mockSeries = [
      {
        id: 'series-1',
        name: 'Test Series',
        author: 'Series Author',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'series-2',
        name: 'Another Series',
        author: 'Another Author',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should display series dropdown', () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Use more specific query - the select dropdown should have a label
      const seriesSelect = screen.getByRole('combobox', { name: /^Series$/i }) || document.querySelector('select[name="seriesId"]') as HTMLSelectElement;
      expect(seriesSelect).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Series' })).toBeInTheDocument();
    });

    it('should populate series dropdown with available series', () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      const seriesSelect = document.querySelector('select#seriesId') as HTMLSelectElement;
      expect(seriesSelect).toBeInTheDocument();
      
      // Check that "None" option exists in the select
      const noneOption = Array.from(seriesSelect.options).find(opt => opt.text === 'None');
      expect(noneOption).toBeTruthy();
      
      // Check that series options are present in the select
      const testSeriesOption = Array.from(seriesSelect.options).find(opt => opt.text === 'Test Series by Series Author');
      const anotherSeriesOption = Array.from(seriesSelect.options).find(opt => opt.text === 'Another Series by Another Author');
      expect(testSeriesOption).toBeTruthy();
      expect(anotherSeriesOption).toBeTruthy();
    });

    it('should show position input when series is selected', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Position input should not be visible initially
      expect(screen.queryByLabelText(/Position in Series/i)).not.toBeInTheDocument();
      
      // Select a series - use querySelector to avoid ambiguity with heading
      const seriesSelect = document.querySelector('select#seriesId') as HTMLSelectElement;
      fireEvent.change(seriesSelect, { target: { value: 'series-1' } });
      
      // Position input should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/Position in Series/i)).toBeInTheDocument();
      });
    });

    it('should hide position input when series is deselected', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Select a series - use querySelector to avoid ambiguity with heading
      const seriesSelect = document.querySelector('select#seriesId') as HTMLSelectElement;
      fireEvent.change(seriesSelect, { target: { value: 'series-1' } });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Position in Series/i)).toBeInTheDocument();
      });
      
      // Deselect series
      fireEvent.change(seriesSelect, { target: { value: '' } });
      
      // Position input should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/Position in Series/i)).not.toBeInTheDocument();
      });
    });

    it('should create book with series and position when series is selected', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        seriesId: 'series-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(database.createBook).mockReturnValue(mockBook);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = screen.getByLabelText(/Author/i);
      const seriesSelect = screen.getByLabelText(/^Series$/i) as HTMLSelectElement;
      
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      fireEvent.change(seriesSelect, { target: { value: 'series-1' } });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Position in Series/i)).toBeInTheDocument();
      });
      
      const positionInput = screen.getByLabelText(/Position in Series/i) as HTMLInputElement;
      fireEvent.change(positionInput, { target: { value: '1' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(database.createBook).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Book',
            author: 'Author',
            seriesId: 'series-1',
            position: 1
          })
        );
      });
    });

    it('should create book without series when no series is selected', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(database.createBook).mockReturnValue(mockBook);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = screen.getByLabelText(/Author/i);
      
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(database.createBook).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Book',
            author: 'Author',
            seriesId: undefined,
            position: undefined
          })
        );
      });
    });

    it('should create book with series but without position when position is not provided', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        seriesId: 'series-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(database.createBook).mockReturnValue(mockBook);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = screen.getByLabelText(/Author/i);
      const seriesSelect = screen.getByLabelText(/^Series$/i) as HTMLSelectElement;
      
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      fireEvent.change(seriesSelect, { target: { value: 'series-1' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(database.createBook).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Book',
            author: 'Author',
            seriesId: 'series-1',
            position: undefined
          })
        );
      });
    });

    it('should handle empty series list', () => {
      vi.mocked(database.getAllSeries).mockReturnValue([]);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      const seriesSelect = screen.getByLabelText(/^Series$/i) as HTMLSelectElement;
      expect(seriesSelect).toBeInTheDocument();
      
      // Should only have "None" option
      expect(seriesSelect.options.length).toBe(1);
      expect(seriesSelect.options[0].value).toBe('');
      expect(seriesSelect.options[0].text).toBe('None');
    });

    it('should show create new series option', () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      expect(screen.getByText(/Create new series/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Create new series/i)).toBeInTheDocument();
    });

    it('should show new series form when checkbox is checked', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // New series form should not be visible initially
      expect(screen.queryByLabelText(/Series Name/i)).not.toBeInTheDocument();
      
      // Check the create new series checkbox
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      // New series form should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Series Author/i)).toBeInTheDocument();
      });
      
      // Series dropdown should be hidden
      expect(screen.queryByLabelText(/^Series$/i)).not.toBeInTheDocument();
    });

    it('should hide new series form when checkbox is unchecked', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Check the create new series checkbox
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      });
      
      // Uncheck the checkbox
      fireEvent.click(checkbox);
      
      // New series form should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/Series Name/i)).not.toBeInTheDocument();
      });
      
      // Series dropdown should be visible again
      expect(screen.getByLabelText(/^Series$/i)).toBeInTheDocument();
    });

    it('should validate new series name is required', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Enable create new series
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      });
      
      // Fill in required book fields - use input name to avoid ambiguity with Series Author
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = document.querySelector('input[name="author"]') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      
      // Fill in series author but not name
      const seriesAuthorInput = screen.getByLabelText(/Series Author/i);
      fireEvent.change(seriesAuthorInput, { target: { value: 'Series Author' } });
      
      // Try to submit
      const form = screen.getByRole('button', { name: /Add Book/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        const submitButton = screen.getByRole('button', { name: /Add Book/i });
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Series name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate new series author is required', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Enable create new series
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      });
      
      // Fill in required book fields - use input name to avoid ambiguity with Series Author
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = document.querySelector('input[name="author"]') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      
      // Fill in series name but not author
      const seriesNameInput = screen.getByLabelText(/Series Name/i);
      fireEvent.change(seriesNameInput, { target: { value: 'New Series' } });
      
      // Try to submit
      const form = screen.getByRole('button', { name: /Add Book/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      } else {
        const submitButton = screen.getByRole('button', { name: /Add Book/i });
        fireEvent.click(submitButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Series author is required/i)).toBeInTheDocument();
      });
    });

    it('should create new series and book when creating new series', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      const newSeries = {
        id: 'new-series-1',
        name: 'New Series',
        author: 'New Author',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        seriesId: 'new-series-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.mocked(database.createSeries).mockReturnValue(newSeries);
      vi.mocked(database.createBook).mockReturnValue(mockBook);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Enable create new series
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      });
      
      // Fill in book fields - use input name to avoid ambiguity with Series Author
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = document.querySelector('input[name="author"]') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      
      // Fill in new series fields
      const seriesNameInput = screen.getByLabelText(/Series Name/i);
      const seriesAuthorInput = screen.getByLabelText(/Series Author/i);
      fireEvent.change(seriesNameInput, { target: { value: 'New Series' } });
      fireEvent.change(seriesAuthorInput, { target: { value: 'New Author' } });
      
      // Fill in position
      await waitFor(() => {
        expect(screen.getByLabelText(/Position in Series/i)).toBeInTheDocument();
      });
      const positionInput = screen.getByLabelText(/Position in Series/i);
      fireEvent.change(positionInput, { target: { value: '1' } });
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(database.createSeries).toHaveBeenCalledWith({
          name: 'New Series',
          author: 'New Author'
        });
        expect(database.createBook).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Book',
            author: 'Author',
            seriesId: 'new-series-1',
            position: 1
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/book/book-1');
      });
    });

    it('should show position input when new series name or author is filled', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Enable create new series
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      });
      
      // Position input should not be visible yet
      expect(screen.queryByLabelText(/Position in Series/i)).not.toBeInTheDocument();
      
      // Fill in series name
      const seriesNameInput = screen.getByLabelText(/Series Name/i);
      fireEvent.change(seriesNameInput, { target: { value: 'New Series' } });
      
      // Position input should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/Position in Series/i)).toBeInTheDocument();
      });
    });

    it('should handle series creation error', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      vi.mocked(database.createSeries).mockImplementation(() => {
        throw new Error('A series with this name and author already exists');
      });
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Enable create new series
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      });
      
      // Fill in book fields - use input name to avoid ambiguity with Series Author
      const titleInput = screen.getByLabelText(/Title/i);
      const authorInput = screen.getByRole('textbox', { name: /^Author/i }) || document.querySelector('input[name="author"]') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Book' } });
      fireEvent.change(authorInput, { target: { value: 'Author' } });
      
      // Fill in new series fields
      const seriesNameInput = screen.getByLabelText(/Series Name/i);
      const seriesAuthorInput = screen.getByLabelText(/Series Author/i);
      fireEvent.change(seriesNameInput, { target: { value: 'Duplicate Series' } });
      fireEvent.change(seriesAuthorInput, { target: { value: 'Author' } });
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /Add Book/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/A series with this name and author already exists/i)).toBeInTheDocument();
      });
      
      // Book should not be created
      expect(database.createBook).not.toHaveBeenCalled();
    });

    it('should clear selected series when switching to create new series', async () => {
      vi.mocked(database.getAllSeries).mockReturnValue(mockSeries);
      
      render(
        <MemoryRouter>
          <AddBook />
        </MemoryRouter>
      );
      
      // Select an existing series
      const seriesSelect = screen.getByLabelText(/^Series$/i) as HTMLSelectElement;
      fireEvent.change(seriesSelect, { target: { value: 'series-1' } });
      
      expect(seriesSelect.value).toBe('series-1');
      
      // Enable create new series
      const checkbox = screen.getByLabelText(/Create new series/i);
      fireEvent.click(checkbox);
      
      // Series dropdown should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/^Series$/i)).not.toBeInTheDocument();
      });
      
      // Disable create new series
      fireEvent.click(checkbox);
      
      // Series dropdown should be visible again with no selection
      await waitFor(() => {
        const newSeriesSelect = screen.getByLabelText(/^Series$/i) as HTMLSelectElement;
        expect(newSeriesSelect.value).toBe('');
      });
    });
  });
});

