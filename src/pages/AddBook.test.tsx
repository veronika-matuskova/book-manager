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
    getAllSeries: vi.fn(() => [])
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
    
    expect(screen.getByText('Add Book')).toBeInTheDocument();
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
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
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
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
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
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
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
    
    const submitButton = screen.getByRole('button', { name: /Add Book/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
    
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Book' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/Title is required/i)).not.toBeInTheDocument();
    });
  });
});

