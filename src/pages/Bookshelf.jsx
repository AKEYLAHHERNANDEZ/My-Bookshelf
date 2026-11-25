import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid2X2, Heart, Library, Plus, Search, SearchX, Settings2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import BookCard from '../components/BookCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ShelfView from '../components/ShelfView.jsx';
const emptyFilters = { status: 'all', favorites: false };

function getSavedView() {
  try {
    return localStorage.getItem('my-bookshelf-view') === 'grid' ? 'grid' : 'shelf';
  } catch {
    return 'grid';
  }
}

export default function Bookshelf() {
  const { books, sessions, openAddBook, loading } = useLibrary();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(emptyFilters);
  const [view, setView] = useState(getSavedView);
  const [shelvesEditing, setShelvesEditing] = useState(false);
  const query = (params.get('q') || '').trim().toLowerCase();

  const shelf = useMemo(() => books.filter((b) => b.status !== 'Wishlist'), [books]);
  const visible = useMemo(() => {
    const list = shelf.filter((b) => {
      if (filters.status !== 'all' && b.status !== filters.status) return false;
      if (filters.favorites && !b.favorite) return false;
      if (query) {
        const haystack = `${b.title} ${b.author} ${b.genre} ${b.isbn}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : a.dateAdded > b.dateAdded ? -1 : 0));
  }, [shelf, filters, query]);

  const statusTabs = [
    ['Currently Reading', 'Reading'], ['Want to Read', 'To read'], ['Finished', 'Read'], ['Abandoned', 'DNF'],
  ].map(([status, label]) => ({ status, label, count: shelf.filter((book) => book.status === status).length }));
  const totalPages = shelf.reduce((sum, book) => sum + (Number(book.pages) || 0), 0);
  const year = new Date().getFullYear();
  const hoursRead = Math.round(sessions.filter((session) => String(session.date).startsWith(String(year))).reduce((sum, session) => sum + (Number(session.minutes) || 0), 0) / 60);

  if (loading) return <div className="bookshelf-loading" role="status">Loading your library...</div>;

  const hasFilters = filters.status !== 'all' || filters.favorites || query;
  const clearAll = () => {
    setFilters(emptyFilters);
    setParams({});
  };
  const changeView = (nextView) => {
    setView(nextView);
    if (nextView !== 'shelf') setShelvesEditing(false);
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
        <div><span className="eyebrow">Your library</span><h2>{shelf.length} books</h2></div>
        <div className="library-heading-actions">
          <button className="btn btn-primary" onClick={() => openAddBook()}><Plus size={16} /> Add</button>
        </div>
      </div>
      <div className="library-status-tabs" role="group" aria-label="Filter books by reading status">
        {statusTabs.map(({ status, label, count }) => <button key={status} className={filters.status === status ? 'active' : ''} onClick={() => setFilters((f) => ({ ...f, status: f.status === status ? 'all' : status }))} aria-pressed={filters.status === status}><span>{label}</span><small>{count}</small></button>)}
      </div>
      <div className="toolbar">
        <label className="library-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={params.get('q') || ''}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) next.set('q', event.target.value);
              else next.delete('q');
              setParams(next, { replace: true });
            }}
            placeholder="Search your library"
            aria-label="Search your library"
          />
        </label>
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
          <button
            type="button"
            className={shelvesEditing ? 'active' : ''}
            onClick={() => {
              if (view !== 'shelf') {
                changeView('shelf');
                setShelvesEditing(true);
              } else {
                setShelvesEditing((value) => !value);
              }
            }}
            aria-label={view === 'shelf' ? (shelvesEditing ? 'Done editing shelves' : 'Edit shelves') : 'Show and edit shelves'}
            aria-pressed={view === 'shelf' && shelvesEditing}
          >
            <Settings2 size={16} />
          </button>
        </div>

        <span className="toolbar-count" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'book' : 'books'}
        </span>

        {hasFilters && visible.length > 0 && (
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
          <ShelfView books={visible} allBooks={shelf} editing={shelvesEditing} />
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
