// Test utilities for React Router
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// React Router future flags for v7 compatibility
export const routerFutureFlags = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Helper to create MemoryRouter with future flags
export function TestMemoryRouter({ 
  children, 
  ...props 
}: { 
  children: ReactNode;
  initialEntries?: string[];
}) {
  return (
    <MemoryRouter {...routerFutureFlags} {...props}>
      {children}
    </MemoryRouter>
  );
}

// Helper to create BrowserRouter with future flags
export function TestBrowserRouter({ 
  children 
}: { 
  children: ReactNode;
}) {
  return (
    <BrowserRouter {...routerFutureFlags}>
      {children}
    </BrowserRouter>
  );
}

