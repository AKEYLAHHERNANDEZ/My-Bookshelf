import { useState } from 'react';
import Modal from './Modal.jsx';
import Stars from './Stars.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';
import { ENTRY_TYPES } from '../utils/constants.js';

export default function EntryModal() {
  const { entryForm, closeEntryForm } = useLibrary();
  if (!entryForm) return null;
  return <EntryForm key={entryForm.entry?.id || 'new'} config={entryForm} onClose={closeEntryForm} />;
}

function EntryForm({ config, onClose }) {
  const { books, saveEntry } = useLibrary();
  const entry = config.entry;
  const candidates = books.filter((b) => b.status !== 'Wishlist');

  const [f, setF] = useState({
    bookId: entry?.bookId || config.bookId || '',
    type: entry?.type || config.type || 'note',
    rating: entry?.rating || 0,
    page: entry?.page ?? '',
    text: entry?.text || '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setF((p) => ({ ...p, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!f.bookId) next.bookId = 'Choose which book this is about.';
    if (!f.text.trim()) next.text = 'Write something first.';
    if (f.page !== '' && (!Number.isInteger(Number(f.page)) || Number(f.page) < 1)) next.page = 'Enter a valid page number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    await saveEntry({
      ...(entry ? { id: entry.id, createdAt: entry.createdAt } : {}),
      bookId: f.bookId,
      type: f.type,
      rating: f.type === 'review' ? f.rating : null,
      page: f.type === 'review' || f.page === '' ? null : Number(f.page),
      text: f.text.trim(),
    });
    onClose();
  };

  const textLabel = { review: 'Your review', note: 'Note', quote: 'Quote', thought: 'Thought' }[f.type];

  return (
    <Modal
      title={entry ? 'Edit entry' : 'New journal entry'}
      layer={2}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="entry-form" className="btn btn-primary">
            Save entry
          </button>
        </>
      }
    >
      <form id="entry-form" className="form-grid" onSubmit={submit} noValidate>
        <div className="field span-2">
          <label htmlFor="en-book">Book *</label>
          <select id="en-book" value={f.bookId} onChange={set('bookId')}>
            <option value="">Select a book</option>
            {candidates.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author}
              </option>
            ))}
          </select>
          {errors.bookId && <span className="field-error">{errors.bookId}</span>}
        </div>

        <div className="field">
          <label htmlFor="en-type">Type</label>
          <select id="en-type" value={f.type} onChange={set('type')}>
            {ENTRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {f.type === 'review' ? (
          <div className="field">
            <label>Rating</label>
            <Stars value={f.rating} size={24} onChange={(rating) => setF((p) => ({ ...p, rating }))} />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="en-page">Page (optional)</label>
            <input id="en-page" type="number" min="1" value={f.page} onChange={set('page')} />
            {errors.page && <span className="field-error">{errors.page}</span>}
          </div>
        )}

        <div className="field span-2">
          <label htmlFor="en-text">{textLabel} *</label>
          <textarea id="en-text" rows={6} value={f.text} onChange={set('text')} autoFocus />
          {errors.text && <span className="field-error">{errors.text}</span>}
        </div>
      </form>
    </Modal>
  );
}
