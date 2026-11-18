import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { formatLongDate } from '../utils/dates.js';

const TITLES = {
  '/': 'Dashboard',
  '/bookshelf': 'My Bookshelf',
  '/tracker': 'Reading Tracker',
  '/journal': 'Reading Journal',
  '/insights': 'Reading Insights',
  '/wishlist': 'Wishlist',
};

export default function Header({ onMenu, onSignOut, theme = 'light', onToggleTheme }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { openAddBook } = useLibrary();

  // The search box is the single source of truth for the bookshelf search:
  // typing anywhere jumps to the bookshelf with ?q=... in the URL.
  const query = pathname === '/bookshelf' ? params.get('q') || '' : '';

  const handleSearch = (value) => {
    navigate(value ? `/bookshelf?q=${encodeURIComponent(value)}` : '/bookshelf', { replace: pathname === '/bookshelf' });
  };

  return (
    <header className="app-header">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div className="header-title">
        <h1>{TITLES[pathname] || 'My Bookshelf'}</h1>
        <p>{formatLongDate()}</p>
      </div>

      <label className="header-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search your books"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search books"
        />
      </label>

      <button className="btn btn-primary" onClick={() => openAddBook()}>
        <Plus size={18} />
        <span className="btn-text">Add a Book</span>
      </button>
      <button
        className="icon-btn theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        aria-pressed={theme === 'dark'}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      {onSignOut && <button className="icon-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>}
    </header>
  );
}
