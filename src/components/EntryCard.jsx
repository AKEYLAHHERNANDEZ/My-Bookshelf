import { Pencil, Trash2 } from 'lucide-react';
import Stars from './Stars.jsx';
import { ENTRY_TYPES } from '../utils/constants.js';
import { formatDate } from '../utils/dates.js';

// A single journal entry. `onEdit` / `onDelete` are provided by the parent so the
// same card works on the Journal page and inside the book details dialog.
export default function EntryCard({ entry, book, onEdit, onDelete }) {
  const label = ENTRY_TYPES.find((t) => t.value === entry.type)?.label || entry.type;

  return (
    <article className={`entry-card entry-${entry.type}`}>
      <header className="entry-head">
        <span className={`badge badge-type-${entry.type}`}>{label}</span>
        {book && (
          <span className="entry-book">
            {book.title} <small>by {book.author}</small>
          </span>
        )}
        <span className="entry-date">{formatDate(entry.createdAt)}</span>
      </header>

      {entry.type === 'review' && entry.rating > 0 && <Stars value={entry.rating} size={16} />}
      <p className={entry.type === 'quote' ? 'entry-quote' : 'entry-text'}>
        {entry.type === 'quote' ? `“${entry.text}”` : entry.text}
      </p>

      <footer className="entry-foot">
        <span className="muted">{entry.page ? `Page ${entry.page}` : ''}</span>
        <span className="entry-actions">
          <button className="icon-btn" onClick={() => onEdit(entry)} aria-label="Edit entry">
            <Pencil size={16} />
          </button>
          <button className="icon-btn" onClick={() => onDelete(entry)} aria-label="Delete entry">
            <Trash2 size={16} />
          </button>
        </span>
      </footer>
    </article>
  );
}
