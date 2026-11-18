import { useState } from 'react';
import { BookOpen, Check, Heart, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import Cover from './Cover.jsx';
import Stars from './Stars.jsx';
import ProgressBar from './ProgressBar.jsx';
import EntryCard from './EntryCard.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';
import { STATUSES, statusSlug } from '../utils/constants.js';
import { formatDate } from '../utils/dates.js';
import { estimateFinish } from '../utils/stats.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'progress', label: 'Reading Progress' },
  { id: 'notes', label: 'Notes & Quotes' },
  { id: 'review', label: 'Review' },
];

export default function BookDetails() {
  const { books, detailsState, closeDetails } = useLibrary();
  const book = books.find((b) => b.id === detailsState?.id);
  if (!detailsState || !book) return null;
  return <Details key={book.id} book={book} initialTab={detailsState.tab} onClose={closeDetails} />;
}

function Details({ book, initialTab, onClose }) {
  const {
    sessions,
    entries,
    openEditBook,
    removeBook,
    toggleFavorite,
    setStatus,
    editBook,
    readAgain,
    recordProgress,
    openEntryForm,
    removeEntry,
  } = useLibrary();

  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(book.currentPage || 0);
  const [confirm, setConfirm] = useState(null); // { kind: 'book' | 'entry', entry? }

  const bookEntries = entries.filter((e) => e.bookId === book.id);
  const notes = bookEntries.filter((e) => e.type !== 'review');
  const review = bookEntries.find((e) => e.type === 'review');
  const bookSessions = sessions.filter((s) => s.bookId === book.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const estimate = book.status === 'Currently Reading' ? estimateFinish(book, sessions) : null;

  const isWishlist = book.status === 'Wishlist';
  const canStart = ['Want to Read', 'On Hold', 'Abandoned', 'Wishlist'].includes(book.status);

  const confirmDelete = async () => {
    if (confirm.kind === 'book') await removeBook(book.id);
    else await removeEntry(confirm.entry.id);
    setConfirm(null);
  };

  return (
    <Modal title="" size="xl" onClose={onClose}>
      <div className="details">
        <aside className="details-side">
          <Cover book={book} size="lg" />

          <div className="details-actions">
            {canStart && (
              <button className="btn btn-primary btn-block" onClick={() => setStatus(book.id, 'Currently Reading')}>
                <BookOpen size={17} /> Start reading
              </button>
            )}
            {book.status === 'Currently Reading' && (
              <>
                <button className="btn btn-primary btn-block" onClick={() => setTab('progress')}>
                  <BookOpen size={17} /> Continue reading
                </button>
                <button className="btn btn-soft btn-block" onClick={() => setStatus(book.id, 'Finished')}>
                  <Check size={17} /> Mark as finished
                </button>
              </>
            )}
            {book.status === 'Finished' && (
              <button className="btn btn-soft btn-block" onClick={() => readAgain(book.id)}>
                <RotateCcw size={17} /> Read again
              </button>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => toggleFavorite(book.id)}>
              <Heart size={17} fill={book.favorite ? 'currentColor' : 'none'} className={book.favorite ? 'fav-on' : ''} />
              {book.favorite ? 'Favourite' : 'Mark as favourite'}
            </button>
            <div className="details-row">
              <button className="btn btn-ghost" onClick={() => openEditBook(book)}>
                <Pencil size={16} /> Edit
              </button>
              <button className="btn btn-ghost danger-text" onClick={() => setConfirm({ kind: 'book' })}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </aside>

        <div className="details-main">
          <header className="details-head">
            <span className={`badge badge-${statusSlug(book.status)}`}>{book.status}</span>
            <h2 className="details-title">{book.title}</h2>
            <p className="details-author">by {book.author}</p>
            <Stars
              value={book.rating}
              size={20}
              onChange={(rating) => editBook(book.id, { rating }, rating ? 'Rating saved' : 'Rating cleared')}
            />
          </header>

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <section className="tab-panel">
              {book.description ? <p className="details-desc">{book.description}</p> : <p className="muted">No description yet. Use Edit to add one.</p>}

              <dl className="meta-grid">
                <div><dt>Genre</dt><dd>{book.genre || '—'}</dd></div>
                <div><dt>Format</dt><dd>{book.format || '—'}</dd></div>
                <div><dt>Pages</dt><dd>{book.pages || '—'}</dd></div>
                <div><dt>Published</dt><dd>{book.year || '—'}</dd></div>
                <div><dt>Publisher</dt><dd>{book.publisher || '—'}</dd></div>
                <div><dt>ISBN</dt><dd>{book.isbn || '—'}</dd></div>
                <div><dt>Added</dt><dd>{formatDate(book.dateAdded)}</dd></div>
                {!isWishlist && <div><dt>Started</dt><dd>{formatDate(book.startDate)}</dd></div>}
                {book.status === 'Finished' && <div><dt>Finished</dt><dd>{formatDate(book.finishDate)}</dd></div>}
                {isWishlist && <div><dt>Priority</dt><dd>{book.priority}</dd></div>}
              </dl>

              {!isWishlist && book.pages > 0 && (
                <div className="details-progress">
                  <ProgressBar value={book.currentPage} max={book.pages} />
                  <small className="muted">
                    Page {book.currentPage || 0} of {book.pages}
                  </small>
                </div>
              )}

              <div className="field">
                <label htmlFor="dt-status">Change status</label>
                <select id="dt-status" value={book.status} onChange={(e) => setStatus(book.id, e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              {book.notes && (
                <div className="note-box">
                  <h4>Personal notes</h4>
                  <p>{book.notes}</p>
                </div>
              )}
            </section>
          )}

          {tab === 'progress' && (
            <section className="tab-panel">
              {isWishlist ? (
                <p className="muted">Move this book to your shelf to start tracking progress.</p>
              ) : (
                <>
                  <ProgressBar value={book.currentPage} max={book.pages || 0} />
                  <p className="muted">
                    {book.pages ? `Page ${book.currentPage || 0} of ${book.pages}` : `Page ${book.currentPage || 0} (total pages unknown — add it with Edit)`}
                  </p>
                  {estimate && (
                    <p className="estimate">
                      At about {estimate.perDay} pages a day you will finish around <strong>{formatDate(estimate.date, { day: 'numeric', month: 'long' })}</strong>.
                    </p>
                  )}

                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      recordProgress(book.id, page);
                    }}
                  >
                    <label htmlFor="dt-page">Current page</label>
                    <input id="dt-page" type="number" min="0" max={book.pages || undefined} value={page} onChange={(e) => setPage(e.target.value)} />
                    <button className="btn btn-primary" type="submit">Update progress</button>
                  </form>

                  <h4 className="section-label">Reading sessions</h4>
                  {bookSessions.length === 0 ? (
                    <p className="muted">No sessions yet. Updating your page above records one.</p>
                  ) : (
                    <ul className="session-list">
                      {bookSessions.slice(0, 8).map((s) => (
                        <li key={s.id}>
                          <span>{formatDate(s.date)}</span>
                          <span>{s.pagesRead} pages</span>
                          <span className="muted">{s.minutes ? `${s.minutes} min` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          )}

          {tab === 'notes' && (
            <section className="tab-panel">
              <div className="panel-head">
                <h4 className="section-label">Notes, quotes & thoughts</h4>
                <button className="btn btn-soft" onClick={() => openEntryForm({ bookId: book.id, type: 'note' })}>
                  <Plus size={16} /> Add
                </button>
              </div>
              {notes.length === 0 ? (
                <p className="muted">Nothing saved for this book yet.</p>
              ) : (
                <div className="entry-list">
                  {notes.map((e) => (
                    <EntryCard key={e.id} entry={e} onEdit={(entry) => openEntryForm({ entry })} onDelete={(entry) => setConfirm({ kind: 'entry', entry })} />
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'review' && (
            <section className="tab-panel">
              {review ? (
                <EntryCard entry={review} onEdit={(entry) => openEntryForm({ entry })} onDelete={(entry) => setConfirm({ kind: 'entry', entry })} />
              ) : (
                <div className="empty-inline">
                  <p className="muted">You have not reviewed this book yet.</p>
                  <button className="btn btn-primary" onClick={() => openEntryForm({ bookId: book.id, type: 'review' })}>
                    Write a review
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'book' ? 'Delete this book?' : 'Delete this entry?'}
          message={
            confirm.kind === 'book'
              ? `“${book.title}” and its notes, reviews and reading sessions will be removed. This cannot be undone.`
              : 'This journal entry will be removed. This cannot be undone.'
          }
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </Modal>
  );
}
