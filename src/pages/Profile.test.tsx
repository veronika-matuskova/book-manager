import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Profile from './Profile';
import { AppProvider } from '../context/AppContext';
import * as database from '../db/database';

// Mock database functions
vi.mock('../db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/database')>();
  return {
    ...actual,
    // Mock initDatabase to actually initialize a test database
    initDatabase: vi.fn().mockImplementation(async () => {
      // Only initialize if not already initialized
      if (!actual._getDbInstance()) {
        const SQL = await import('sql.js');
        const path = await import('path');
        const SQLModule = await SQL.default({
          locateFile: (file: string) => path.default.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
        });
        const testDb = new SQLModule.Database();
        const { createSchema } = await import('../db/schema');
        testDb.run(createSchema());
        actual._setTestDbInstance(testDb);
      }
    }),
    getFirstUser: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    getUserBookCount: vi.fn(() => 0),
    getUserSeriesCount: vi.fn(() => 0)
  };
});

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter
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

describe('Profile', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset database instance before each test
    database._resetDbInstance();
    vi.mocked(database.getFirstUser).mockReturnValue(mockUser);
    vi.mocked(database.getUser).mockImplementation((id) => {
      if (id === mockUser.id) return mockUser;
      return null;
    });
    // Reset database instance before each test
    database._resetDbInstance();
  });

  afterEach(() => {
    // Clean up database instance after each test
    database._resetDbInstance();
  });

  it('should render profile information', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display book and series counts', async () => {
    vi.mocked(database.getUserBookCount).mockReturnValue(5);
    vi.mocked(database.getUserSeriesCount).mockReturnValue(2);
    
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Series')).toBeInTheDocument();
    });
  });

  it('should show "Not set" for empty display name', async () => {
    const userWithoutDisplayName = { ...mockUser, displayName: undefined };
    vi.mocked(database.getFirstUser).mockReturnValue(userWithoutDisplayName);
    vi.mocked(database.getUser).mockReturnValue(userWithoutDisplayName);
    
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  it('should show "Not set" for empty email', async () => {
    const userWithoutEmail = { ...mockUser, email: undefined };
    vi.mocked(database.getFirstUser).mockReturnValue(userWithoutEmail);
    vi.mocked(database.getUser).mockReturnValue(userWithoutEmail);
    
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Not set')).toHaveLength(1);
    });
  });

  it('should show edit button when not editing', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
  });

  it('should enter edit mode when edit button is clicked', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  it('should allow editing display name', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
      expect(displayNameInput).toBeInTheDocument();
      
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
      expect(displayNameInput.value).toBe('Updated Name');
    });
  });

  it('should allow editing email', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
      expect(emailInput.value).toBe('newemail@example.com');
    });
  });

  it('should validate email format', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    // Wait for form to be populated with user data
    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
    });
    
    const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should save changes successfully', async () => {
    const updatedUser = { ...mockUser, displayName: 'Updated Name', email: 'new@example.com' };
    vi.mocked(database.updateUser).mockReturnValue(updatedUser);
    vi.mocked(database.getUser).mockReturnValue(updatedUser);
    
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    // Wait for form to be populated with user data
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
      const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
      expect(displayNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });
    
    const displayNameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
    const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
    
    fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(database.updateUser).toHaveBeenCalledWith('user-1', {
        displayName: 'Updated Name',
        email: 'new@example.com'
      });
      expect(screen.getByText('Updated Name')).toBeInTheDocument();
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
    });
  });

  it('should cancel editing and reset form', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    // Wait for form to be populated with user data
    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
      expect(displayNameInput).toBeInTheDocument();
    });
    
    const displayNameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
    fireEvent.change(displayNameInput, { target: { value: 'Changed Name' } });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
  });

  it('should show username as disabled', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      const usernameInput = screen.getByDisplayValue('testuser') as HTMLInputElement;
      expect(usernameInput).toBeDisabled();
      expect(screen.getByText(/Username cannot be changed/i)).toBeInTheDocument();
    });
  });

  it('should display member since date', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText(/Member since/i)).toBeInTheDocument();
    });
  });

  it('should display error message when update fails', async () => {
    vi.mocked(database.updateUser).mockImplementation(() => {
      throw new Error('Failed to update profile');
    });
    
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
    
    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editButton);
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to update profile/i)).toBeInTheDocument();
    });
  });
});

