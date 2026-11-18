import { useState } from 'react';
import { Search } from 'lucide-react';
import Modal from './Modal.jsx';
import Cover from './Cover.jsx';
import Stars from './Stars.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';
import { searchOnline } from '../services/bookSearch.js';
import { statusPatch } from '../utils/bookLogic.js';
import { FORMATS, GENRES, PRIORITIES, STATUSES } from '../utils/constants.js';
import { todayISO } from '../utils/dates.js';

const blank = (status) => ({
  title: '',
  author: '',
  status,
  coverUrl: '',
  isbn: '',
  description: '',
  genre: '',
  publisher: '',
  year: '',
  pages: '',
  format: 'Physical',
  dateAdded: todayISO(),
  rating: 0,
  notes: '',
  currentPage: '',
  startDate: '',
  finishDate: '',
  priority: 'Medium',
});

const fromBook = (b) => ({
  ...blank(b.status),
  ...b,
  year: b.year ?? '',
  pages: b.pages ?? '',
  currentPage: b.currentPage || '',
  startDate: b.startDate || '',
  finishDate: b.finishDate || '',
});

export default function BookModal() {
  const { bookForm, closeBookForm } = useLibrary();
  if (!bookForm) return null;
  // `key` resets the form every time a different book (or a fresh "add") is opened.
  return <BookForm key={bookForm.book?.id || `new-${bookForm.defaultStatus}`} config={bookForm} onClose={closeBookForm} />;
}

function BookForm({ config, onClose }) {
  const { addBook, editBook } = useLibrary();
  const editing = Boolean(config.book);
  const [f, setF] = useState(() => (editing ? fromBook(config.book) : blank(config.defaultStatus)));
  const [errors, setErrors] = useState({});
  const [mode, setMode] = useState('manual');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const set = (field) => (e) => setF((prev) => ({ ...prev, [field]: e.target.value }));

  const runSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      setResults(await searchOnline(query.trim()));
    } catch (err) {
      setResults(null);
      setSearchError(err.message || 'Search failed. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r) => {
    setF((prev) => ({
      ...prev,
      title: r.title,
      author: r.author,
      year: r.year ?? '',
      pages: r.pages ?? '',
      isbn: r.isbn,
      publisher: r.publisher,
      genre: r.genre || prev.genre,
      coverUrl: r.coverUrl,
    }));
    setMode('manual');
  };

  const validate = () => {
    const next = {};
    if (!f.title.trim()) next.title = 'Please enter a title.';
    if (!f.author.trim()) next.author = 'Please enter an author.';
    if (!f.status) next.status = 'Choose a reading status.';
    const pages = f.pages === '' ? null : Number(f.pages);
    if (pages !== null && (!Number.isInteger(pages) || pages < 1)) next.pages = 'Pages must be a whole number above 0.';
    if (f.year !== '' && (!Number.isInteger(Number(f.year)) || Number(f.year) < 1 || Number(f.year) > new Date().getFullYear() + 1))
      next.year = 'Enter a valid year.';
    const current = f.currentPage === '' ? 0 : Number(f.currentPage);
    if (!Number.isInteger(current) || current < 0) next.currentPage = 'Enter a valid page number.';
    else if (pages && current > pages) next.currentPage = 'Current page cannot be more than the total pages.';
    if (f.startDate && f.finishDate && f.finishDate < f.startDate) next.finishDate = 'Finish date is before the start date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let payload = {
      title: f.title.trim(),
      author: f.author.trim(),
      status: f.status,
      coverUrl: f.coverUrl.trim(),
      isbn: f.isbn.trim(),
      description: f.description.trim(),
      genre: f.genre,
      publisher: f.publisher.trim(),
      year: f.year === '' ? null : Number(f.year),
      pages: f.pages === '' ? null : Number(f.pages),
      format: f.format,
      dateAdded: f.dateAdded || todayISO(),
      rating: f.rating,
      notes: f.notes.trim(),
      currentPage: f.currentPage === '' ? 0 : Number(f.currentPage),
      startDate: f.startDate || null,
      finishDate: f.finishDate || null,
      priority: f.priority,
    };

    // Apply the status rules (start/finish dates, page count) when the status is new or changed.
    if (!editing || config.book.status !== payload.status) payload = { ...payload, ...statusPatch(payload, payload.status) };
    if (payload.status !== 'Finished') payload.finishDate = null;

    if (editing) await editBook(config.book.id, payload);
    else await addBook(payload);
    onClose();
  };

  const showProgress = ['Currently Reading', 'On Hold', 'Abandoned'].includes(f.status);
  const showStart = ['Currently Reading', 'Finished', 'On Hold', 'Abandoned'].includes(f.status);

  return (
    <Modal
      title={editing ? 'Edit book' : f.status === 'Wishlist' ? 'Add to wishlist' : 'Add a book'}
      size="lg"
      layer={2}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="book-form" className="btn btn-primary">
            {editing ? 'Save changes' : 'Save book'}
          </button>
        </>
      }
    >
      {!editing && (
        <div className="tabs tabs-pill" role="tablist">
          <button role="tab" aria-selected={mode === 'manual'} className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
            Manual entry
          </button>
          <button role="tab" aria-selected={mode === 'search'} className={mode === 'search' ? 'active' : ''} onClick={() => setMode('search')}>
            Search online
          </button>
        </div>
      )}

      {mode === 'search' ? (
        <div className="search-panel">
          <form className="search-row" onSubmit={runSearch}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, author or ISBN"
              aria-label="Search online"
            />
            <button className="btn btn-primary" type="submit" disabled={searching}>
              <Search size={16} /> {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {searchError && <p className="field-error">{searchError}</p>}
          {results && results.length === 0 && <p className="muted">No matches. Try different words or add the book manually.</p>}
          <ul className="result-list">
            {(results || []).map((r, i) => (
              <li key={`${r.title}-${i}`}>
                <button type="button" className="result-item" onClick={() => pickResult(r)}>
                  <Cover book={r} size="xs" />
                  <span>
                    <strong>{r.title}</strong>
                    <small>
                      {r.author || 'Unknown author'}
                      {r.year ? ` · ${r.year}` : ''}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!results && <p className="muted">Results come from Open Library. Pick one to fill in the form, then review and save.</p>}
        </div>
      ) : (
        <form id="book-form" className="form-grid" onSubmit={submit} noValidate>
          <div className="field span-2">
            <label htmlFor="bk-title">Title *</label>
            <input id="bk-title" value={f.title} onChange={set('title')} autoFocus />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="field">
            <label htmlFor="bk-author">Author *</label>
            <input id="bk-author" value={f.author} onChange={set('author')} />
            {errors.author && <span className="field-error">{errors.author}</span>}
          </div>

          <div className="field">
            <label htmlFor="bk-status">Reading status *</label>
            <select id="bk-status" value={f.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {errors.status && <span className="field-error">{errors.status}</span>}
          </div>

          <div className="field">
            <label htmlFor="bk-genre">Genre</label>
            <select id="bk-genre" value={f.genre} onChange={set('genre')}>
              <option value="">Select a genre</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
              {f.genre && !GENRES.includes(f.genre) && <option>{f.genre}</option>}
            </select>
          </div>

          <div className="field">
            <label htmlFor="bk-format">Format</label>
            <select id="bk-format" value={f.format} onChange={set('format')}>
              {FORMATS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="bk-pages">Total pages</label>
            <input id="bk-pages" type="number" min="1" value={f.pages} onChange={set('pages')} />
            {errors.pages && <span className="field-error">{errors.pages}</span>}
          </div>

          <div className="field">
            <label htmlFor="bk-year">Publication year</label>
            <input id="bk-year" type="number" value={f.year} onChange={set('year')} />
            {errors.year && <span className="field-error">{errors.year}</span>}
          </div>

          <div className="field">
            <label htmlFor="bk-publisher">Publisher</label>
            <input id="bk-publisher" value={f.publisher} onChange={set('publisher')} />
          </div>

          <div className="field">
            <label htmlFor="bk-isbn">ISBN</label>
            <input id="bk-isbn" value={f.isbn} onChange={set('isbn')} />
          </div>

          <div className="field span-2">
            <label htmlFor="bk-cover">Cover image URL</label>
            <div className="cover-field">
              <input id="bk-cover" value={f.coverUrl} onChange={set('coverUrl')} placeholder="https://…  (optional, a cover is generated if empty)" />
              <Cover book={f} size="xs" />
            </div>
          </div>

          {f.status === 'Wishlist' && (
            <div className="field">
              <label htmlFor="bk-priority">Priority</label>
              <select id="bk-priority" value={f.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {showProgress && (
            <div className="field">
              <label htmlFor="bk-current">Current page</label>
              <input id="bk-current" type="number" min="0" value={f.currentPage} onChange={set('currentPage')} />
              {errors.currentPage && <span className="field-error">{errors.currentPage}</span>}
            </div>
          )}

          {showStart && (
            <div className="field">
              <label htmlFor="bk-start">Start date</label>
              <input id="bk-start" type="date" value={f.startDate} onChange={set('startDate')} />
            </div>
          )}

          {f.status === 'Finished' && (
            <div className="field">
              <label htmlFor="bk-finish">Finish date</label>
              <input id="bk-finish" type="date" value={f.finishDate} onChange={set('finishDate')} />
              {errors.finishDate && <span className="field-error">{errors.finishDate}</span>}
            </div>
          )}

          <div className="field">
            <label htmlFor="bk-added">Date added</label>
            <input id="bk-added" type="date" value={f.dateAdded} onChange={set('dateAdded')} />
          </div>

          <div className="field">
            <label>Personal rating</label>
            <Stars value={f.rating} size={22} onChange={(rating) => setF((p) => ({ ...p, rating }))} />
          </div>

          <div className="field span-2">
            <label htmlFor="bk-desc">Description</label>
            <textarea id="bk-desc" rows={3} value={f.description} onChange={set('description')} />
          </div>

          <div className="field span-2">
            <label htmlFor="bk-notes">Notes</label>
            <textarea id="bk-notes" rows={2} value={f.notes} onChange={set('notes')} />
          </div>
        </form>
      )}
    </Modal>
  );
}
