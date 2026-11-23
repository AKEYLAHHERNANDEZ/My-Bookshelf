import { useEffect, useState } from 'react';
import { BookOpen, Minus, Plus } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import Cover from './Cover.jsx';

const STORAGE_KEY = 'my-bookshelf-display-v1';
const FINISHES = ['oak', 'walnut', 'painted'];
const DEFAULTS = { finish: 'oak', style: 'spine', count: 3, assignments: {}, names: [], order: [] };
const SPINE_COLORS = ['#34483a', '#665744', '#5e7a8c', '#8c4a3b', '#4b4a63', '#7a6a2e', '#3e5f5c'];

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return DEFAULTS;
    return {
      ...DEFAULTS,
      ...saved,
      finish: FINISHES.includes(saved.finish) ? saved.finish : DEFAULTS.finish,
      style: saved.style === 'cover' ? 'cover' : 'spine',
      count: Math.min(8, Math.max(1, Number(saved.count) || DEFAULTS.count)),
      assignments: saved.assignments && typeof saved.assignments === 'object' ? saved.assignments : {},
      names: Array.isArray(saved.names) ? saved.names : [],
      order: Array.isArray(saved.order) ? saved.order : [],
    };
  } catch {
    return DEFAULTS;
  }
}

function colorFor(book) {
  const hash = [...(book.title || 'Book')].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  return SPINE_COLORS[hash % SPINE_COLORS.length];
}

export default function ShelfView({ books, allBooks }) {
  const { openDetails } = useLibrary();
  const [preferences, setPreferences] = useState(readPreferences);
  const [editing, setEditing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain active for this visit if browser storage is unavailable.
    }
  }, [preferences]);

  useEffect(() => {
    setPreferences((current) => {
      const assignments = { ...current.assignments };
      const counts = Array(current.count).fill(0);
      Object.entries(assignments).forEach(([id, shelf]) => {
        if (allBooks.some((book) => book.id === id) && Number.isInteger(shelf) && shelf >= 0 && shelf < current.count) {
          counts[shelf] += 1;
        }
      });

      const unassigned = allBooks.filter((book) => !Number.isInteger(assignments[book.id]) || assignments[book.id] < 0 || assignments[book.id] >= current.count);
      if (Object.keys(current.assignments).length === 0 && unassigned.length) {
        const perShelf = Math.ceil(allBooks.length / current.count);
        unassigned.forEach((book, index) => {
          assignments[book.id] = Math.min(current.count - 1, Math.floor(index / perShelf));
        });
      } else {
        unassigned.forEach((book) => {
          const shelf = counts.indexOf(Math.min(...counts));
          assignments[book.id] = shelf;
          counts[shelf] += 1;
        });
      }

      const liveIds = new Set(allBooks.map((book) => book.id));
      Object.keys(assignments).forEach((id) => {
        if (!liveIds.has(id)) delete assignments[id];
      });
      const order = current.order.filter((id) => liveIds.has(id));
      allBooks.forEach((book) => {
        if (!order.includes(book.id)) order.push(book.id);
      });
      if (
        Object.keys(assignments).length === Object.keys(current.assignments).length &&
        order.length === current.order.length &&
        allBooks.every((book) => Number.isInteger(assignments[book.id]))
      ) return current;
      return { ...current, assignments, order };
    });
  }, [allBooks, preferences.count]);

  const changeCount = (count) => {
    setPreferences((current) => {
      const assignments = Object.fromEntries(
        Object.entries(current.assignments).map(([id, shelf]) => [id, Math.min(count - 1, Number(shelf) || 0)]),
      );
      return { ...current, count, assignments, names: current.names.slice(0, count) };
    });
  };

  const moveBook = (id, shelf, beforeId = null) => {
    setPreferences((current) => {
      const assignments = { ...current.assignments, [id]: shelf };
      const order = current.order.filter((bookId) => bookId !== id);
      const targetIndex = beforeId ? order.indexOf(beforeId) : -1;
      order.splice(targetIndex < 0 ? order.length : targetIndex, 0, id);
      return { ...current, assignments, order };
    });
  };

  const orderedBooks = [...books].sort((a, b) => {
    const aShelf = preferences.assignments[a.id] ?? 0;
    const bShelf = preferences.assignments[b.id] ?? 0;
    if (aShelf !== bShelf) return aShelf - bShelf;
    return preferences.order.indexOf(a.id) - preferences.order.indexOf(b.id);
  });

  return (
    <section className={`shelf-room shelf-${preferences.finish}`} aria-label="Books displayed on shelves">
      <div className="shelf-toolbar">
        <div>
          <strong>Your shelves</strong>
          <span>{editing ? 'Drag books between shelves, or use the move menus.' : 'A little room for every story.'}</span>
        </div>
        <div className="shelf-toolbar-actions">
          <label className="shelf-display-control">
            <span>Book display</span>
            <select
              value={preferences.style}
              onChange={(event) => setPreferences((current) => ({ ...current, style: event.target.value }))}
              aria-label="Show books as covers or spines"
              aria-describedby="shelf-display-hint"
            >
              <option value="spine">Spines</option>
              <option value="cover">Covers</option>
            </select>
          </label>
          <button className={`btn ${editing ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setEditing((value) => !value)} aria-pressed={editing}>
            <BookOpen size={16} /> {editing ? 'Done editing' : 'Edit shelves'}
          </button>
        </div>
      </div>
      <p className="shelf-display-hint" id="shelf-display-hint">
        Spine view creates illustrated spines from each book’s title and author; no separate spine-image service is needed.
      </p>

      {editing && (
        <div className="shelf-options">
          <label>
            Shelf finish
            <select value={preferences.finish} onChange={(event) => setPreferences((current) => ({ ...current, finish: event.target.value }))}>
              <option value="oak">Natural oak</option>
              <option value="walnut">Walnut</option>
              <option value="painted">Painted cream</option>
            </select>
          </label>
          <div className="shelf-count-control" aria-label="Number of shelves">
            <span>Shelves</span>
            <button className="icon-btn" onClick={() => changeCount(Math.max(1, preferences.count - 1))} disabled={preferences.count <= 1} aria-label="Remove a shelf">
              <Minus size={16} />
            </button>
            <strong>{preferences.count}</strong>
            <button className="icon-btn" onClick={() => changeCount(Math.min(8, preferences.count + 1))} disabled={preferences.count >= 8} aria-label="Add a shelf">
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="shelf-stack">
        {Array.from({ length: preferences.count }, (_, shelfIndex) => {
          const shelfBooks = orderedBooks.filter((book) => (preferences.assignments[book.id] ?? 0) === shelfIndex);
          const name = preferences.names[shelfIndex] || `Shelf ${shelfIndex + 1}`;
          return (
            <section
              className={`shelf-row ${draggedId ? 'shelf-drop-ready' : ''}`}
              key={shelfIndex}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedId) moveBook(draggedId, shelfIndex);
                setDraggedId(null);
              }}
              aria-label={name}
            >
              <div className="shelf-row-header">
                {editing ? (
                  <input
                    className="shelf-name-input"
                    aria-label={`Name for shelf ${shelfIndex + 1}`}
                    value={name}
                    onChange={(event) => setPreferences((current) => {
                      const names = [...current.names];
                      names[shelfIndex] = event.target.value;
                      return { ...current, names };
                    })}
                  />
                ) : (
                  <span className="shelf-name">{name}</span>
                )}
                {editing && (
                  <select
                    className="shelf-add-book"
                    value=""
                    onChange={(event) => {
                      if (event.target.value) moveBook(event.target.value, shelfIndex);
                    }}
                    aria-label={`Move a book to ${name}`}
                  >
                    <option value="">Move a book here...</option>
                    {allBooks.map((book) => (
                      <option key={book.id} value={book.id}>{book.title}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className={`shelf-books shelf-books-${preferences.style} ${shelfBooks.length === 0 ? 'is-empty' : ''}`}>
                {shelfBooks.length === 0 && <span className="shelf-empty-note">Drop a book here</span>}
                {shelfBooks.map((book) => (
                  <div
                    className="shelf-book"
                    key={book.id}
                    draggable={editing}
                    onDragStart={(event) => {
                      setDraggedId(book.id);
                      event.dataTransfer.setData('text/plain', book.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    onDragOver={(event) => {
                      if (editing) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (!editing) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const id = event.dataTransfer.getData('text/plain') || draggedId;
                      if (id && id !== book.id) moveBook(id, shelfIndex, book.id);
                      setDraggedId(null);
                    }}
                  >
                    <button className="shelf-book-button" onClick={() => openDetails(book.id)} aria-label={`${book.title} by ${book.author}`}>
                      {preferences.style === 'cover' ? (
                        <Cover book={book} size="sm" />
                      ) : (
                        <span className="book-spine" style={{ '--spine-color': colorFor(book), '--spine-height': `${138 + (book.title.length % 34)}px` }}>
                          <span className="book-spine-title">{book.title}</span>
                          <span className="book-spine-author">{book.author}</span>
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="shelf-plank" />
            </section>
          );
        })}
      </div>
    </section>
  );
}
