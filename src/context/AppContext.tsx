import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase, getFirstUser, createUser, getUser } from '../db/database';
import type { User, UserFormData } from '../types';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  createUser: (data: UserFormData) => Promise<void>;
  refreshUser: () => Promise<void>;
  isInitialized: boolean;
  initError: string | null;
  clearInitError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        
        // Only proceed if database initialization succeeded
        // getFirstUser will throw if database is not initialized, so we catch that
        let existingUser: User | null = null;
        try {
          existingUser = getFirstUser();
        } catch (userError) {
          // If getFirstUser fails, database might not be fully initialized
          console.error('Failed to get first user after initialization:', userError);
          throw new Error('Database initialized but not accessible');
        }
        
        setIsInitialized(true);
        setInitError(null);
        
        if (existingUser) {
          setUser(existingUser);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to initialize database. Please refresh the page to try again.';
        setInitError(errorMessage);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  const clearInitError = () => {
    setInitError(null);
  };

  const handleCreateUser = async (data: UserFormData) => {
    try {
      const newUser = createUser(data);
      setUser(newUser);
    } catch (error) {
      // Log error but don't throw - let the caller handle it
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  const handleRefreshUser = async () => {
    if (user) {
      const refreshed = getUser(user.id);
      if (refreshed) {
        setUser(refreshed);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        setUser,
        createUser: handleCreateUser,
        refreshUser: handleRefreshUser,
        isInitialized,
        initError,
        clearInitError
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

