import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid2X2, Heart, Library, Plus, SearchX, Search, SlidersHorizontal, Funnel, Settings2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import BookCard from '../components/BookCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ShelfView from '../components/ShelfView.jsx';
import { GENRES, SHELF_STATUSES } from '../utils/constants.js';

const SORTS = {
  added: 'Recently added',
  title: 'Title (A–Z)',
  author: 'Author (A–Z)',
  rating: 'Highest rated',
};

const emptyFilters = { status: 'all', genre: 'all', sort: 'added', favorites: false };

function getSavedView() {
  try {
    return localStorage.getItem('my-bookshelf-view') === 'shelf' ? 'shelf' : 'grid';
  } catch {
    return 'grid';
  }
}

export default function Bookshelf() {
  const { books, sessions, openAddBook, loading } = useLibrary();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(emptyFilters);
  const [view, setView] = useState(getSavedView);
  const query = (params.get('q') || '').trim().toLowerCase();

  const shelf = useMemo(() => books.filter((b) => b.status !== 'Wishlist'), [books]);
  const genres = useMemo(() => [...new Set([...GENRES, ...shelf.map((b) => b.genre).filter(Boolean)])].filter((g) => shelf.some((b) => b.genre === g)), [shelf]);

  const visible = useMemo(() => {
    const list = shelf.filter((b) => {
      if (filters.status !== 'all' && b.status !== filters.status) return false;
      if (filters.genre !== 'all' && b.genre !== filters.genre) return false;
      if (filters.favorites && !b.favorite) return false;
      if (query) {
        const haystack = `${b.title} ${b.author} ${b.genre} ${b.isbn}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    const sorters = {
      added: (a, b) => (a.dateAdded < b.dateAdded ? 1 : a.dateAdded > b.dateAdded ? -1 : 0),
      title: (a, b) => a.title.localeCompare(b.title),
      author: (a, b) => a.author.localeCompare(b.author),
      rating: (a, b) => b.rating - a.rating || a.title.localeCompare(b.title),
    };
    return [...list].sort(sorters[filters.sort]);
  }, [shelf, filters, query]);

  const statusTabs = [
    ['Currently Reading', 'Reading'], ['Want to Read', 'To read'], ['Finished', 'Read'], ['Abandoned', 'DNF'],
  ].map(([status, label]) => ({ status, label, count: shelf.filter((book) => book.status === status).length }));
  const totalPages = shelf.reduce((sum, book) => sum + (Number(book.pages) || 0), 0);
  const year = new Date().getFullYear();
  const hoursRead = Math.round(sessions.filter((session) => String(session.date).startsWith(String(year))).reduce((sum, session) => sum + (Number(session.minutes) || 0), 0) / 60);

  if (loading) return null;

  const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));
  const hasFilters = filters.status !== 'all' || filters.genre !== 'all' || filters.favorites || query;
  const clearAll = () => {
    setFilters(emptyFilters);
    setParams({});
  };
  const changeView = (nextView) => {
    setView(nextView);
    try {
      localStorage.setItem('my-bookshelf-view', nextView);
    } catch {
      // Keep the selected view for this visit if browser storage is unavailable.
    }
  };

  if (shelf.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="Your shelf is empty"
        message="Add your first book to start building your personal library."
        action={
          <button className="btn btn-primary" onClick={() => openAddBook()}>
            <Plus size={18} /> Add a book
          </button>
        }
      />
    );
  }

  return (
    <div className="bookshelf">
      <div className="library-heading">
        <div><span className="eyebrow">Your library</span><h2>{books.length} books</h2></div>
        <button className="btn btn-primary" onClick={() => openAddBook()}><Plus size={16} /> Add</button>
      </div>
      <div className="library-status-tabs" role="group" aria-label="Filter books by reading status">
        {statusTabs.map(({ status, label, count }) => <button key={status} className={filters.status === status ? 'active' : ''} onClick={() => setFilters((f) => ({ ...f, status: f.status === status ? 'all' : status }))} aria-pressed={filters.status === status}><span>{label}</span><small>{count}</small></button>)}
      </div>
      <div className="toolbar">
        <span className="library-tools-label"><Search size={15} /> <SlidersHorizontal size={15} /> <Funnel size={15} /></span>
        <select value={filters.status} onChange={set('status')} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {SHELF_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select value={filters.genre} onChange={set('genre')} aria-label="Filter by genre">
          <option value="all">All genres</option>
          {genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>

        <select value={filters.sort} onChange={set('sort')} aria-label="Sort books">
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          className={`chip ${filters.favorites ? 'active' : ''}`}
          onClick={() => setFilters((f) => ({ ...f, favorites: !f.favorites }))}
          aria-pressed={filters.favorites}
        >
          <Heart size={15} fill={filters.favorites ? 'currentColor' : 'none'} /> Favourites
        </button>

        <div className="view-switch" role="group" aria-label="Bookshelf view">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => changeView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view">
            <Grid2X2 size={16} />
          </button>
          <button className={view === 'shelf' ? 'active' : ''} onClick={() => changeView('shelf')} aria-pressed={view === 'shelf'} aria-label="Shelf view">
            <Library size={16} />
          </button>
          <button type="button" onClick={() => document.getElementById('shelf-settings')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Shelf settings"><Settings2 size={16} /></button>
        </div>

        <span className="toolbar-count">
          {visible.length} {visible.length === 1 ? 'book' : 'books'}
          {query && <> matching “{params.get('q')}”</>}
        </span>

        {hasFilters && (
          <button className="link-btn" onClick={clearAll}>
            Clear filters
          </button>
        )}
      </div>

      <div className="library-year-heading"><h3>{year}</h3><span>{shelf.length} books · {totalPages.toLocaleString()} pages · {hoursRead} h read</span></div>

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No books match"
          message="Try a different search or clear your filters."
          action={
            <button className="btn btn-soft" onClick={clearAll}>
              Clear filters
            </button>
          }
        />
      ) : (
        view === 'shelf' ? (
          <ShelfView books={visible} allBooks={shelf} />
        ) : (
          <div className="book-grid">
            {visible.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
