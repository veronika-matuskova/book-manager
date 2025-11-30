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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        setIsInitialized(true);
        
        // Check for existing user (MVP supports single user)
        const existingUser = getFirstUser();
        if (existingUser) {
          setUser(existingUser);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  const handleCreateUser = async (data: UserFormData) => {
    try {
      const newUser = createUser(data);
      setUser(newUser);
    } catch (error) {
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
        isInitialized
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

