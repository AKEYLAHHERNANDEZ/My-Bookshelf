import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import BookModal from './components/BookModal.jsx';
import BookDetails from './components/BookDetails.jsx';
import EntryModal from './components/EntryModal.jsx';
import Toast from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Bookshelf from './pages/Bookshelf.jsx';
import ReadingTracker from './pages/ReadingTracker.jsx';
import Journal from './pages/Journal.jsx';
import Insights from './pages/Insights.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Profile from './pages/Profile.jsx';
import { useLibrary } from './context/LibraryContext.jsx';

function SignInScreen({ onSignIn }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSignIn(password);
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">My Bookshelf</span>
        <h1>Welcome back</h1>
        <p className="muted">Enter your private library password to continue.</p>
        <label htmlFor="library-password">Password</label>
        <input id="library-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

export default function App() {
  const { authRequired, authenticated, signIn } = useLibrary();
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('my-bookshelf-theme');
      return savedTheme === 'dark' ? 'noir' : ['noir', 'midnight'].includes(savedTheme) ? savedTheme : 'light';
    } catch {
      return 'light';
    }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('my-bookshelf-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    try {
      localStorage.setItem('my-bookshelf-theme', theme);
    } catch {
      /* Theme remains active for this visit if browser storage is unavailable. */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('my-bookshelf-sidebar', collapsed ? 'collapsed' : 'open');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Close the mobile drawer and scroll to top whenever the page changes.
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (authRequired && !authenticated) return <SignInScreen onSignIn={signIn} />;

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="app-main">
        <Header
          onMenu={() => setMobileOpen(true)}
        />
        <main className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookshelf" element={<Bookshelf />} />
            <Route path="/tracker" element={<ReadingTracker />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile theme={theme} onThemeChange={setTheme} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <BookModal />
      <BookDetails />
      <EntryModal />
      <Toast />
    </div>
  );
}
