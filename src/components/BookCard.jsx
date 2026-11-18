import { Heart } from 'lucide-react';
import Cover from './Cover.jsx';
import Stars from './Stars.jsx';
import ProgressBar from './ProgressBar.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';
import { statusSlug } from '../utils/constants.js';

export default function BookCard({ book }) {
  const { openDetails, toggleFavorite } = useLibrary();

  return (
    <article className="book-card">
      <button className="book-card-main" onClick={() => openDetails(book.id)} aria-label={`Open ${book.title}`}>
        <div className="book-card-cover">
          <Cover book={book} />
          <span className={`badge badge-${statusSlug(book.status)} cover-badge`}>{book.status}</span>
        </div>
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">{book.author}</p>
        {book.status === 'Currently Reading' && book.pages > 0 && (
          <ProgressBar value={book.currentPage} max={book.pages} slim />
        )}
        {book.rating > 0 && <Stars value={book.rating} size={14} />}
      </button>
      <button
        className={`fav-btn ${book.favorite ? 'is-fav' : ''}`}
        onClick={() => toggleFavorite(book.id)}
        aria-label={book.favorite ? 'Remove from favourites' : 'Add to favourites'}
        aria-pressed={book.favorite}
      >
        <Heart size={17} fill={book.favorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}
