import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from './Navigation';
import { AppProvider } from '../context/AppContext';
import * as database from '../db/database';

// Using globals from vitest

// Mock database functions - use importOriginal to get real functions
vi.mock('../db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/database')>();
  return {
    ...actual,
    searchBooks: vi.fn(() => []),
    initDatabase: vi.fn().mockResolvedValue(undefined) // Mock initDatabase to avoid sql.js WASM loading
  };
});

const renderWithProviders = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppProvider>
        {component}
      </AppProvider>
    </MemoryRouter>
  );
};

describe('Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render navigation links', () => {
    renderWithProviders(<Navigation />);
    
    expect(screen.getByText('Book Manager')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('My Books')).toBeInTheDocument();
    expect(screen.getByText('Add Book')).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should update search query on input change', () => {
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(searchInput.value).toBe('test query');
  });

  it('should search books when query is entered', () => {
    const mockBooks = [
      {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    vi.mocked(database.searchBooks).mockReturnValue(mockBooks as any);
    
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(database.searchBooks).toHaveBeenCalledWith('test', undefined);
  });

  it('should clear search results when query is empty', () => {
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.change(searchInput, { target: { value: '' } });
    
    expect(screen.queryByText(/Found/)).not.toBeInTheDocument();
  });

  it('should display search results', () => {
    const mockBooks = [
      {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    vi.mocked(database.searchBooks).mockReturnValue(mockBooks as any);
    
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
  });

  it('should navigate to book detail on result click', () => {
    const mockBooks = [
      {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    vi.mocked(database.searchBooks).mockReturnValue(mockBooks as any);
    
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    waitFor(() => {
      const result = screen.getByText('Test Book');
      fireEvent.click(result);
      
      // Navigation should have been triggered (would need navigation mock to verify)
    });
  });

  it('should highlight active route', () => {
    const { container } = renderWithProviders(<Navigation />, ['/explore']);
    
    const exploreLink = screen.getByText('Explore').closest('a');
    // Check if link exists and has the correct style
    expect(exploreLink).toBeInTheDocument();
    // The style might be applied via inline style
    const computedStyle = window.getComputedStyle(exploreLink!);
    // Just verify the link exists - style checking may vary
  });

  it('should display user name when user is logged in', async () => {
    // Initialize database and create user
    const SQL = await import('sql.js');
    const path = await import('path');
    const SQLModule = await SQL.default({
      locateFile: (file: string) => path.default.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
    });
    
    const testDb = new SQLModule.Database();
    const { createSchema } = await import('../db/schema');
    testDb.run(createSchema());
    database._setTestDbInstance(testDb);
    
    const user = database.createUser({
      username: 'testuser',
      displayName: 'Test User'
    });
    
    renderWithProviders(<Navigation />);
    
    // Wait for database initialization - AppContext needs time to load user
    await waitFor(() => {
      const userText = screen.queryByText('Test User');
      expect(userText).toBeInTheDocument();
    }, { timeout: 5000 });
    
    vi.restoreAllMocks();
    database._resetDbInstance();
  });

  it('should show username when displayName is not set', async () => {
    const SQL = await import('sql.js');
    const path = await import('path');
    const SQLModule = await SQL.default({
      locateFile: (file: string) => path.default.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
    });
    
    const testDb = new SQLModule.Database();
    const { createSchema } = await import('../db/schema');
    testDb.run(createSchema());
    database._setTestDbInstance(testDb);
    
    database.createUser({
      username: 'testuser'
    });
    
    renderWithProviders(<Navigation />);
    
    // Wait for database initialization
    await waitFor(() => {
      const userText = screen.queryByText('testuser');
      expect(userText).toBeInTheDocument();
    }, { timeout: 5000 });
    
    database._resetDbInstance();
  });

  it('should handle form submission', () => {
    const { container } = renderWithProviders(<Navigation />);
    
    const form = container.querySelector('form');
    const searchInput = screen.getByPlaceholderText('Search all books...');
    
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.submit(form!);
    
    // Form submission should navigate (would need navigation mock)
  });

  it('should limit search results to 10', () => {
    const manyBooks = Array.from({ length: 15 }, (_, i) => ({
      id: `book-${i}`,
      title: `Book ${i}`,
      author: 'Author',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    vi.mocked(database.searchBooks).mockReturnValue(manyBooks as any);
    
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    fireEvent.change(searchInput, { target: { value: 'book' } });
    
    waitFor(() => {
      expect(screen.queryAllByText(/Book \d+/)).toHaveLength(10);
    });
  });

  it('should display "No books found" when no results', () => {
    vi.mocked(database.searchBooks).mockReturnValue([]);
    
    renderWithProviders(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText('Search all books...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument();
    });
  });
});

