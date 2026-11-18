import { useEffect, useState } from 'react';

const GRADIENTS = [
  ['#34483A', '#4F6B57'],
  ['#665744', '#8A7456'],
  ['#5E7A8C', '#7C98A8'],
  ['#8C4A3B', '#B56A55'],
  ['#4B4A63', '#6B6A87'],
  ['#7A6A2E', '#A18F47'],
  ['#3E5F5C', '#5F8683'],
];

const hash = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// Shows the cover image, or a generated cover (colour + title) when there is
// no image or the image fails to load.
export default function Cover({ book, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [book.coverUrl]);

  if (book.coverUrl && !failed) {
    return (
      <img
        className={`cover cover-${size}`}
        src={book.coverUrl}
        alt={`Cover of ${book.title}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const [from, to] = GRADIENTS[hash(book.title || 'x') % GRADIENTS.length];
  return (
    <div className={`cover cover-${size} cover-generated`} style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}>
      <span className="cover-title">{book.title}</span>
      <span className="cover-author">{book.author}</span>
    </div>
  );
}
