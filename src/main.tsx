import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Expose data-io functions globally for console access (development only)
// This allows developers to use data import/export functions from the browser console
if (import.meta.env.DEV) {
  // Dynamic import to avoid including in production bundle
  import('./db/data-io').then((dataIO) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).dataIO = dataIO;
    console.log('💡 dataIO functions available in console (dev mode only)');
    console.log('   Example: await window.dataIO.loadAndImportFromDataFolder("export/example-data.json")');
  }).catch((error) => {
    console.warn('Failed to load dataIO functions:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

