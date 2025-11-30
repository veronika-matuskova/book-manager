import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import MyBooks from './pages/MyBooks';
import AddBook from './pages/AddBook';
import BookDetail from './pages/BookDetail';
import SeriesDetail from './pages/SeriesDetail';

function AppRoutes() {
  const { user, isLoading, initError, clearInitError } = useApp();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div className="card" style={{ width: '100%' }}>
          <h1 style={{ color: '#dc3545', marginBottom: '16px' }}>Database Initialization Error</h1>
          <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
            {initError}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                clearInitError();
                window.location.reload();
              }}
            >
              Reload Page
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (confirm('This will clear all your data. Are you sure?')) {
                  localStorage.removeItem('book-manager-db');
                  window.location.reload();
                }
              }}
            >
              Clear Data & Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no user, show profile setup
  if (!user) {
    return (
      <Routes>
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/my-books" element={<MyBooks />} />
        <Route path="/add-book" element={<AddBook />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;

