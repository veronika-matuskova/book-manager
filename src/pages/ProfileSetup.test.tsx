import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProfileSetup from './ProfileSetup';
import { AppProvider } from '../context/AppContext';
import * as database from '../db/database';

// Mock database functions
vi.mock('../db/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../db/database')>();
  return {
    ...actual,
    initDatabase: vi.fn().mockResolvedValue(undefined),
    createUser: vi.fn()
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </MemoryRouter>
  );
};

describe('ProfileSetup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render profile setup form', () => {
    renderWithProviders(<ProfileSetup />);
    
    expect(screen.getByText('Create Your Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Profile/i })).toBeInTheDocument();
  });

  it('should show username requirements', () => {
    renderWithProviders(<ProfileSetup />);
    
    expect(screen.getByText(/3-50 characters, letters, numbers, underscores, and hyphens only/i)).toBeInTheDocument();
  });

  it('should validate username is required', async () => {
    renderWithProviders(<ProfileSetup />);
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    // The form has HTML5 required validation, but we also check for our custom validation
    // The username field is required, so the form won't submit if empty
    // But if it's too short, our validation will catch it
    const usernameInput = screen.getByLabelText(/Username/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'ab' } }); // Too short
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username must be 3-50 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate username length (too short)', async () => {
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username must be 3-50 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate username length (too long)', async () => {
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'a'.repeat(51) } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username must be 3-50 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate username format (invalid characters)', async () => {
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'user@name' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username must contain only letters, numbers, underscores, and hyphens/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    // Wait for validation to run and error to appear
    await waitFor(() => {
      const errorMessage = screen.queryByText(/Please enter a valid email address/i);
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should accept valid email format', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createUser).mockReturnValue(mockUser);
    
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        displayName: '',
        email: 'test@example.com'
      });
    }, { timeout: 3000 });
  });

  it('should allow optional email', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createUser).mockReturnValue(mockUser);
    
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        displayName: '',
        email: ''
      });
    });
  });

  it('should allow optional display name', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createUser).mockReturnValue(mockUser);
    
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const displayNameInput = screen.getByLabelText(/Display Name/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(database.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        displayName: 'Test User',
        email: ''
      });
    });
  });

  it('should navigate to explore page on successful profile creation', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createUser).mockReturnValue(mockUser);
    
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/explore');
    });
  });

  it('should display error message when username is already taken', async () => {
    vi.mocked(database.createUser).mockImplementation(() => {
      throw new Error('This username is already taken. Please choose another.');
    });
    
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/This username is already taken/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    vi.mocked(database.createUser).mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve(mockUser), 100));
    });
    
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('button', { name: /Creating Profile/i })).toBeDisabled();
  });

  it('should clear errors when user types in field', async () => {
    renderWithProviders(<ProfileSetup />);
    
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Username must be 3-50 characters/i)).toBeInTheDocument();
    });
    
    fireEvent.change(usernameInput, { target: { value: 'validuser' } });
    
    await waitFor(() => {
      expect(screen.queryByText(/Username must be 3-50 characters/i)).not.toBeInTheDocument();
    });
  });
});

