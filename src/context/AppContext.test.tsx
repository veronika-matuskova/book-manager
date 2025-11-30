import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import * as database from '../db/database';
import initSqlJs from 'sql.js';
import path from 'path';

// Using globals from vitest

// Component to test the hook
function TestComponent() {
  const { user, isLoading, isInitialized, createUser, refreshUser } = useApp();
  
  const handleCreateUser = async () => {
    try {
      await createUser({ username: 'testuser' });
    } catch (error) {
      // Error is expected in some tests - it's logged in AppContext
      // We don't need to do anything here, just prevent unhandled rejection
    }
  };
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="initialized">{isInitialized ? 'Initialized' : 'Not Initialized'}</div>
      <div data-testid="user">{user ? user.username : 'No User'}</div>
      <button 
        onClick={handleCreateUser}
        data-testid="create-user"
      >
        Create User
      </button>
      <button 
        onClick={() => refreshUser()}
        data-testid="refresh-user"
      >
        Refresh User
      </button>
    </div>
  );
}

describe('AppContext', () => {
  beforeEach(async () => {
    localStorage.clear();
    
    // Setup test database
    const SQL = await initSqlJs({
      locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
    });
    
    const testDb = new SQL.Database();
    const { createSchema } = await import('../db/schema');
    testDb.run(createSchema());
    database._setTestDbInstance(testDb);
  });

  afterEach(() => {
    database._resetDbInstance();
    localStorage.clear();
  });

  it('should initialize database on mount', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
    });
  });

  it('should set loading to false after initialization', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  it('should load existing user if available', async () => {
    // Create a user first
    database.createUser({ username: 'existinguser', displayName: 'Existing User' });
    
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('existinguser');
    });
  });

  it('should create a new user', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
    });
    
    const createButton = screen.getByTestId('create-user');
    await act(async () => {
      fireEvent.click(createButton);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
  });

  it('should refresh user data', async () => {
    // Create initial user
    const user = database.createUser({ username: 'testuser', displayName: 'Test User' });
    
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
    
    // Update user in database
    database.updateUser(user.id, { displayName: 'Updated User' });
    
    const refreshButton = screen.getByTestId('refresh-user');
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    await waitFor(() => {
      const userElement = screen.getByTestId('user');
      expect(userElement).toHaveTextContent('testuser');
    });
  });

  it('should handle database initialization errors gracefully', async () => {
    // Mock initDatabase to throw error
    const originalInit = database.initDatabase;
    vi.spyOn(database, 'initDatabase').mockRejectedValueOnce(new Error('Init failed'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    
    vi.restoreAllMocks();
  });

  it('should throw error when useApp is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestComponentOutside = () => {
      useApp();
      return <div>Test</div>;
    };
    
    expect(() => {
      render(<TestComponentOutside />);
    }).toThrow('useApp must be used within an AppProvider');
    
    consoleSpy.mockRestore();
  });

  it('should handle createUser errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
    });
    
    // Create user
    const createButton = screen.getByTestId('create-user');
    
    await act(async () => {
      fireEvent.click(createButton);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
    
    // Clear console.error spy to only catch the duplicate user error
    consoleSpy.mockClear();
    
    // Try to create duplicate user - should throw error
    // The error will be caught by the TestComponent's handleCreateUser
    await act(async () => {
      fireEvent.click(createButton);
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    // The error should be logged (handleCreateUser in AppContext logs it)
    // User should remain unchanged
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    }, { timeout: 1000 });
    
    consoleSpy.mockRestore();
  });
});

