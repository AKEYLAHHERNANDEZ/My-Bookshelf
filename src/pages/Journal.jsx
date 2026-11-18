import { useState } from 'react';
import { NotebookPen, Plus } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import EntryCard from '../components/EntryCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ENTRY_TYPES } from '../utils/constants.js';

export default function Journal() {
  const { entries, books, openEntryForm, removeEntry, loading } = useLibrary();
  const [type, setType] = useState('all');
  const [bookId, setBookId] = useState('all');
  const [toDelete, setToDelete] = useState(null);

  if (loading) return null;

  const visible = entries
    .filter((e) => (type === 'all' || e.type === type) && (bookId === 'all' || e.bookId === bookId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const journalBooks = books.filter((b) => entries.some((e) => e.bookId === b.id));

  return (
    <div className="journal">
      <div className="toolbar">
        <div className="tabs tabs-pill">
          <button className={type === 'all' ? 'active' : ''} onClick={() => setType('all')}>All</button>
          {ENTRY_TYPES.map((t) => (
            <button key={t.value} className={type === t.value ? 'active' : ''} onClick={() => setType(t.value)}>
              {t.label}s
            </button>
          ))}
        </div>

        <select value={bookId} onChange={(e) => setBookId(e.target.value)} aria-label="Filter by book">
          <option value="all">All books</option>
          {journalBooks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>

        <button className="btn btn-primary push-right" onClick={() => openEntryForm({ type: type === 'all' ? 'note' : type })}>
          <Plus size={18} /> New entry
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={entries.length === 0 ? 'Your journal is empty' : 'No entries here yet'}
          message="Capture a review, a favourite quote, or a passing thought about what you are reading."
          action={
            <button className="btn btn-primary" onClick={() => openEntryForm({})}>
              <Plus size={18} /> Write your first entry
            </button>
          }
        />
      ) : (
        <div className="entry-list entry-masonry">
          {visible.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              book={books.find((b) => b.id === e.bookId)}
              onEdit={(entry) => openEntryForm({ entry })}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this entry?"
          message="This journal entry will be removed. This cannot be undone."
          layer={1}
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await removeEntry(toDelete.id);
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}
