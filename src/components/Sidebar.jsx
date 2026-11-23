import { NavLink } from 'react-router-dom';
import {
  BookMarked,
  ChartColumn,
  Gift,
  LayoutDashboard,
  Library,
  NotebookPen,
  BookOpen,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookshelf', label: 'My Bookshelf', icon: Library },
  { to: '/tracker', label: 'Reading Tracker', icon: BookOpen },
  { to: '/journal', label: 'Reading Journal', icon: NotebookPen },
  { to: '/insights', label: 'Reading Insights', icon: ChartColumn },
  { to: '/wishlist', label: 'Wishlist', icon: Gift },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const { authRequired } = useLibrary();

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`} aria-label="Main">
      <div className="sidebar-brand">
        <span className="brand-mark">
          <BookMarked size={22} />
        </span>
        <span className="brand-copy"><span className="brand-name">Book Tracker</span><small>Your personal library</small></span>
        <button className="sidebar-close icon-btn" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-link nav-button sidebar-data"><Database size={18} /><span className="nav-label">Your data · {authRequired ? 'Synced' : 'Local'}</span></div>
        <button
          className="nav-link nav-button collapse-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          <span className="nav-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
