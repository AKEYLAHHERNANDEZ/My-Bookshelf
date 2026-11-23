import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { formatLongDate } from '../utils/dates.js';

const TITLES = {
  '/': 'Dashboard',
  '/bookshelf': 'My Bookshelf',
  '/tracker': 'Reading Tracker',
  '/journal': 'Reading Journal',
  '/insights': 'Reading Insights',
  '/wishlist': 'Wishlist',
  '/profile': 'Profile',
};

export default function Header({ onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

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

    </header>
  );
}
