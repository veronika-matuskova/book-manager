import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Expose data-io functions globally for console access
import * as dataIO from './db/data-io';

declare global {
  interface Window {
    dataIO: typeof dataIO;
  }
}

// Make data-io functions available in browser console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).dataIO = dataIO;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

