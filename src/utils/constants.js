export const STATUSES = ['Want to Read', 'Currently Reading', 'Finished', 'On Hold', 'Abandoned', 'Wishlist'];

// Wishlist books live on their own page, so the main bookshelf leaves them out.
export const SHELF_STATUSES = STATUSES.filter((s) => s !== 'Wishlist');

export const GENRES = [
  'Fantasy',
  'Sci-Fi',
  'Fiction',
  'Classics',
  'Mystery',
  'Thriller',
  'Romance',
  'Historical Fiction',
  'Non-Fiction',
  'Memoir',
  'Biography',
  'Self-Help',
  'Horror',
  'Young Adult',
  'Poetry',
  'Other',
];

export const FORMATS = ['Physical', 'eBook', 'Audiobook'];
export const PRIORITIES = ['High', 'Medium', 'Low'];

export const ENTRY_TYPES = [
  { value: 'review', label: 'Review' },
  { value: 'note', label: 'Note' },
  { value: 'quote', label: 'Quote' },
  { value: 'thought', label: 'Thought' },
];

export const statusSlug = (s) => s.toLowerCase().replace(/\s+/g, '-');

export const CHART_COLORS = ['#34483A', '#8A7B68', '#7F9B84', '#665744', '#C9B79C', '#B5543F', '#5E7A8C'];
