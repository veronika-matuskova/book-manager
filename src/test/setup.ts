// Test setup file for Vitest
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure React Testing Library to automatically wrap async updates in act()
// This reduces the need for manual act() calls in tests
configure({
  asyncUtilTimeout: 5000,
  // Note: RTL automatically wraps some async operations, but useEffect updates may still need act()
});

// Suppress act() warnings for AppProvider initialization
// These warnings occur because AppProvider's useEffect runs asynchronously after render,
// which is expected behavior. The tests properly wait for async operations using waitFor().
const originalError = console.error;
const originalWarn = console.warn;

const shouldSuppressWarning = (args: unknown[]): boolean => {
  // Check all arguments for the warning message
  for (const arg of args) {
    const message = typeof arg === 'string' ? arg : String(arg || '');
    if (
      message.includes('An update to AppProvider inside a test was not wrapped in act') ||
      message.includes('not wrapped in act')
    ) {
      return true;
    }
  }
  return false;
};

console.error = (...args: unknown[]) => {
  if (shouldSuppressWarning(args)) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args: unknown[]) => {
  if (shouldSuppressWarning(args)) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Make localStorage available globally for Node.js environment
if (typeof global !== 'undefined') {
  (global as any).localStorage = localStorageMock;
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
}

// Mock FileReader for Node.js environment
if (typeof global !== 'undefined' && !global.FileReader) {
  class FileReaderMock {
    result: string | ArrayBuffer | null = null;
    error: DOMException | null = null;
    readyState: number = 0;
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null;

    readAsText(file: File): void {
      // Use file.text() which is available in Node.js 18+
      file.text().then((text: string) => {
        this.result = text;
        this.readyState = 2; // DONE
        if (this.onload) {
          this.onload({ target: this } as any);
        }
        if (this.onloadend) {
          this.onloadend({ target: this } as any);
        }
      }).catch((error: any) => {
        this.error = error;
        if (this.onerror) {
          this.onerror({ target: this } as any);
        }
        if (this.onloadend) {
          this.onloadend({ target: this } as any);
        }
      });
    }
  }

  (global as any).FileReader = FileReaderMock;
}

if (typeof window !== 'undefined' && !window.FileReader) {
  // For browser environment, FileReader should be available
  // But if not, we'll use a simple mock
  if (!window.FileReader) {
    (window as any).FileReader = class FileReaderMock {
      result: string | ArrayBuffer | null = null;
      error: DOMException | null = null;
      readyState: number = 0;
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

      readAsText(file: File): void {
        file.text().then((text: string) => {
          this.result = text;
          this.readyState = 2;
          if (this.onload) {
            this.onload({ target: this } as any);
          }
        }).catch((error: any) => {
          this.error = error;
          if (this.onerror) {
            this.onerror({ target: this } as any);
          }
        });
      }
    };
  }
}

