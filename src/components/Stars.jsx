import { Star } from 'lucide-react';

// Read-only when `onChange` is omitted. Clicking the current rating clears it.
export default function Stars({ value = 0, onChange, size = 16 }) {
  return (
    <span className={`stars ${onChange ? 'stars-input' : ''}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Star size={size} className={n <= value ? 'star on' : 'star'} fill={n <= value ? 'currentColor' : 'none'} />;
        return onChange ? (
          <button
            type="button"
            key={n}
            className="star-btn"
            onClick={() => onChange(n === value ? 0 : n)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </span>
  );
}
