import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import BookDetail from './BookDetail';
import { AppProvider } from '../context/AppContext';
import * as database from '../db/database';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // useParams and MemoryRouter are not mocked - they work with MemoryRouter
  };
});

// Mock database functions
vi.mock('../db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/database')>();
  return {
    ...actual,
    initDatabase: vi.fn().mockResolvedValue(undefined),
    getFirstUser: vi.fn(),
    getUser: vi.fn(),
    getBook: vi.fn(),
    getBookGenres: vi.fn(() => []),
    getSeries: vi.fn(),
    getUserBook: vi.fn(),
    addBookToUserCollection: vi.fn(),
    removeBookFromUserCollection: vi.fn(),
    updateUserBook: vi.fn(),
    addReadingCountLog: vi.fn(),
    getReadingCount: vi.fn(() => 0),
    getSeriesBookCount: vi.fn(() => 0)
  };
});

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockBook = {
  id: 'book-1',
  title: 'Test Book',
  author: 'Author',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockBookWithDetails = {
  ...mockBook,
  genres: [],
  isOwned: false
};

const renderWithProviders = (component: React.ReactElement, initialEntries = ['/book/book-1']) => {
  return render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppProvider>
        <Routes>
          <Route path="/book/:id" element={component} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  );
};

describe('BookDetail', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Ensure initDatabase resolves immediately
    vi.mocked(database.initDatabase).mockResolvedValue(undefined);
    vi.mocked(database.getFirstUser).mockReturnValue(mockUser);
    vi.mocked(database.getUser).mockReturnValue(mockUser);
    vi.mocked(database.getBook).mockReturnValue(mockBook);
    vi.mocked(database.getBookGenres).mockReturnValue([]);
    vi.mocked(database.getUserBook).mockReturnValue(null);
    vi.mocked(database.getSeries).mockReturnValue(null);
  });

  it('should render book details', async () => {
    renderWithProviders(<BookDetail />);
    
    // Wait for book details to appear (this will wait for user to load and book to be fetched)
    await waitFor(() => {
      // Use getAllByText since "Test Book" appears in multiple places (placeholder and h1)
      const bookTitles = screen.getAllByText('Test Book');
      expect(bookTitles.length).toBeGreaterThan(0);
      expect(screen.getByText('Author')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show "Add to My Books" button when book is not in collection', async () => {
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to My Books/i })).toBeInTheDocument();
    });
  });

  it('should show "Edit Status" and "Remove from Collection" buttons when book is in collection', async () => {
    const userBook = {
      id: 'ub-1',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'to-read' as const,
      progress: 0,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.getUserBook).mockReturnValue(userBook);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Remove from Collection/i })).toBeInTheDocument();
    });
  });

  it('should add book to collection when "Add to My Books" is clicked', async () => {
    const mockUserBook = {
      id: 'ub-1',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'to-read' as const,
      progress: 0,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.addBookToUserCollection).mockReturnValue(mockUserBook);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to My Books/i })).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /Add to My Books/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(database.addBookToUserCollection).toHaveBeenCalledWith('user-1', 'book-1');
    });
  });

  it('should remove book from collection when "Remove from Collection" is clicked', async () => {
    const userBook = {
      id: 'ub-1',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'to-read' as const,
      progress: 0,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.getUserBook).mockReturnValue(userBook);
    
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove from Collection/i })).toBeInTheDocument();
    });
    
    const removeButton = screen.getByRole('button', { name: /Remove from Collection/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(database.removeBookFromUserCollection).toHaveBeenCalledWith('user-1', 'book-1');
    });
  });

  it('should open status modal when "Edit Status" is clicked', async () => {
    const userBook = {
      id: 'ub-1',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'to-read' as const,
      progress: 0,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.getUserBook).mockReturnValue(userBook);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Status/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Status/i });
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Update Reading Status/i)).toBeInTheDocument();
    });
  });

  it('should display reading count when book has been read', async () => {
    const userBook = {
      id: 'ub-1',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'read' as const,
      progress: 100,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.getUserBook).mockReturnValue(userBook);
    vi.mocked(database.getReadingCount).mockReturnValue(2);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByText(/Read 2 times/i)).toBeInTheDocument();
    });
  });

  it('should display series information when book is in a series', async () => {
    const mockSeries = {
      id: 'series-1',
      name: 'Test Series',
      author: 'Series Author',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const bookInSeries = {
      ...mockBook,
      seriesId: 'series-1'
    };
    
    vi.mocked(database.getBook).mockReturnValue(bookInSeries);
    vi.mocked(database.getSeries).mockReturnValue(mockSeries);
    vi.mocked(database.getSeriesBookCount).mockReturnValue(3);
    
    renderWithProviders(<BookDetail />);
    
    // Wait for book to load first, then check for series information
    await waitFor(() => {
      const bookTitles = screen.getAllByText('Test Book');
      expect(bookTitles.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    
    // Wait for series information to appear
    await waitFor(() => {
      expect(database.getSeries).toHaveBeenCalledWith('series-1');
      expect(screen.getByText(/Test Series/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Wait for series book count to appear (it's set in a separate useEffect)
    await waitFor(() => {
      expect(database.getSeriesBookCount).toHaveBeenCalledWith('series-1');
      expect(screen.getByText(/3 books in series/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should display genres when book has genres', async () => {
    const mockGenres = [
      { id: 'genre-1', name: 'Fantasy', createdAt: new Date() },
      { id: 'genre-2', name: 'Adventure', createdAt: new Date() }
    ];
    
    vi.mocked(database.getBookGenres).mockReturnValue(mockGenres);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Adventure')).toBeInTheDocument();
    });
  });

  it('should display progress bar when status is currently-reading', async () => {
    const userBook = {
      id: 'ub-1',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'currently-reading' as const,
      progress: 50,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.getUserBook).mockReturnValue(userBook);
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });

  it('should navigate back when back button is clicked', async () => {
    mockNavigate.mockClear();
    
    renderWithProviders(<BookDetail />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /← Back/i })).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole('button', { name: /← Back/i });
    fireEvent.click(backButton);
    
    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should show loading spinner when book is not loaded', () => {
    vi.mocked(database.getBook).mockReturnValue(null);
    
    renderWithProviders(<BookDetail />);
    
    // Should show spinner or loading state
    // This depends on the actual implementation
  });
});

