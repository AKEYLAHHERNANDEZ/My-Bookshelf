import { useState } from 'react';
import { ArrowRightCircle, Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import Cover from '../components/Cover.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';

const ORDER = { High: 0, Medium: 1, Low: 2 };

export default function Wishlist() {
  const { books, openAddBook, openEditBook, openDetails, setStatus, removeBook, loading } = useLibrary();
  const [toRemove, setToRemove] = useState(null);

  if (loading) return null;

  const items = books
    .filter((b) => b.status === 'Wishlist')
    .sort((a, b) => (ORDER[a.priority] ?? 1) - (ORDER[b.priority] ?? 1) || a.title.localeCompare(b.title));

  return (
    <div className="wishlist">
      <div className="toolbar">
        <p className="muted">Books you would like to buy or borrow. Move one to your bookshelf when it arrives.</p>
        <button className="btn btn-primary push-right" onClick={() => openAddBook('Wishlist')}>
          <Plus size={18} /> Add to wishlist
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Your wishlist is empty"
          message="Keep track of the books you want to get your hands on."
          action={
            <button className="btn btn-primary" onClick={() => openAddBook('Wishlist')}>
              <Plus size={18} /> Add a book
            </button>
          }
        />
      ) : (
        <ul className="wish-grid">
          {items.map((b) => (
            <li key={b.id} className="card wish-card">
              <button className="cover-btn" onClick={() => openDetails(b.id)} aria-label={`Open ${b.title}`}>
                <Cover book={b} size="md" />
              </button>
              <div className="wish-body">
                <span className={`badge badge-priority-${(b.priority || 'Medium').toLowerCase()}`}>{b.priority || 'Medium'} priority</span>
                <h3>{b.title}</h3>
                <p className="muted">{b.author}</p>
                {b.notes && <p className="wish-notes">{b.notes}</p>}
                <div className="btn-row">
                  <button className="btn btn-soft" onClick={() => setStatus(b.id, 'Want to Read')}>
                    <ArrowRightCircle size={16} /> Move to bookshelf
                  </button>
                  <button className="icon-btn" onClick={() => openEditBook(b)} aria-label={`Edit ${b.title}`}>
                    <Pencil size={17} />
                  </button>
                  <button className="icon-btn" onClick={() => setToRemove(b)} aria-label={`Remove ${b.title}`}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toRemove && (
        <ConfirmDialog
          title="Remove from wishlist?"
          message={`“${toRemove.title}” will be removed from your wishlist.`}
          confirmLabel="Remove"
          layer={1}
          onCancel={() => setToRemove(null)}
          onConfirm={async () => {
            await removeBook(toRemove.id);
            setToRemove(null);
          }}
        />
      )}
    </div>
  );
}
