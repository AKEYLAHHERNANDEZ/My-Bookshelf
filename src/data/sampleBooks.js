// Demo data used the first time the app runs. It is deliberately kept out of
// the UI components: everything reaches the screen through services/bookService.js.
import { daysAgoISO } from '../utils/dates.js';

const book = (id, title, author, genre, pages, extra = {}) => ({
  id,
  title,
  author,
  genre,
  pages,
  status: 'Want to Read',
  coverUrl: '',
  isbn: '',
  description: '',
  publisher: '',
  year: null,
  format: 'Physical',
  dateAdded: daysAgoISO(120),
  rating: 0,
  notes: '',
  favorite: false,
  currentPage: 0,
  startDate: null,
  finishDate: null,
  priority: 'Medium',
  ...extra,
});

const finished = (id, title, author, genre, pages, rating, ago, extra = {}) =>
  book(id, title, author, genre, pages, {
    status: 'Finished',
    rating,
    currentPage: pages,
    startDate: daysAgoISO(ago + 12),
    finishDate: daysAgoISO(ago),
    dateAdded: daysAgoISO(ago + 30),
    ...extra,
  });

export const sampleBooks = [
  // Currently reading
  book('b1', 'The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 662, {
    status: 'Currently Reading',
    currentPage: 244,
    startDate: daysAgoISO(21),
    dateAdded: daysAgoISO(40),
    format: 'Physical',
    year: 2007,
    description:
      'A gifted young man grows from a troupe performer into the most notorious wizard of his age, and tells the story himself.',
  }),
  book('b2', 'Pride and Prejudice', 'Jane Austen', 'Classics', 432, {
    status: 'Currently Reading',
    currentPage: 188,
    startDate: daysAgoISO(14),
    dateAdded: daysAgoISO(30),
    format: 'eBook',
    year: 1813,
    favorite: true,
    description: 'Elizabeth Bennet navigates family pressure, first impressions and a very proud Mr Darcy.',
  }),
  book('b3', 'Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 498, {
    status: 'Currently Reading',
    currentPage: 97,
    startDate: daysAgoISO(7),
    dateAdded: daysAgoISO(12),
    format: 'Audiobook',
    year: 2011,
    description: 'A sweeping history of how humans came to dominate the planet.',
  }),

  // Finished this year
  finished('b4', 'Project Hail Mary', 'Andy Weir', 'Sci-Fi', 476, 5, 5, {
    favorite: true,
    year: 2021,
    description: 'A lone astronaut wakes up far from home with no memory and the fate of Earth in his hands.',
    notes: 'Could not put it down. The friendship at the centre is wonderful.',
  }),
  finished('b5', 'The Midnight Library', 'Matt Haig', 'Fiction', 304, 4, 20, { year: 2020 }),
  finished('b6', 'Circe', 'Madeline Miller', 'Fantasy', 393, 5, 41, {
    favorite: true,
    year: 2018,
    description: 'The daughter of a Titan finds her own power in exile on a remote island.',
  }),
  finished('b7', 'Atomic Habits', 'James Clear', 'Self-Help', 320, 4, 63, { year: 2018, format: 'Audiobook' }),
  finished('b8', 'Gone Girl', 'Gillian Flynn', 'Thriller', 432, 4, 90, { year: 2012 }),
  finished('b9', 'The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Romance', 400, 5, 118, {
    year: 2017,
  }),
  finished('b10', 'Dune', 'Frank Herbert', 'Sci-Fi', 688, 4, 150, { year: 1965 }),
  finished('b11', 'Educated', 'Tara Westover', 'Memoir', 352, 4, 185, { year: 2018 }),
  finished('b12', 'The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 310, 5, 220, { year: 1937, favorite: true }),
  finished('b13', 'Rebecca', 'Daphne du Maurier', 'Mystery', 449, 4, 260, { year: 1938 }),

  // Want to read / on hold / abandoned
  book('b14', 'Piranesi', 'Susanna Clarke', 'Fantasy', 272, { year: 2020, dateAdded: daysAgoISO(10) }),
  book('b15', 'The Secret History', 'Donna Tartt', 'Fiction', 559, { year: 1992, dateAdded: daysAgoISO(18) }),
  book('b16', 'Klara and the Sun', 'Kazuo Ishiguro', 'Sci-Fi', 303, { year: 2021, dateAdded: daysAgoISO(25) }),
  book('b17', 'Middlemarch', 'George Eliot', 'Classics', 880, {
    status: 'On Hold',
    currentPage: 210,
    startDate: daysAgoISO(110),
    year: 1871,
    notes: 'Taking a break — will come back in winter.',
  }),
  book('b18', 'Ulysses', 'James Joyce', 'Classics', 730, {
    status: 'Abandoned',
    currentPage: 64,
    startDate: daysAgoISO(200),
    year: 1922,
  }),

  // Wishlist
  book('w1', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 'Fiction', 416, {
    status: 'Wishlist',
    priority: 'High',
    notes: 'Recommended by a friend. Look for a paperback.',
    dateAdded: daysAgoISO(6),
  }),
  book('w2', 'A Gentleman in Moscow', 'Amor Towles', 'Historical Fiction', 462, {
    status: 'Wishlist',
    priority: 'Medium',
    dateAdded: daysAgoISO(15),
  }),
  book('w3', 'The Song of Achilles', 'Madeline Miller', 'Fantasy', 378, {
    status: 'Wishlist',
    priority: 'High',
    notes: 'Complete the Madeline Miller set.',
    dateAdded: daysAgoISO(22),
  }),
  book('w4', 'Braiding Sweetgrass', 'Robin Wall Kimmerer', 'Non-Fiction', 391, {
    status: 'Wishlist',
    priority: 'Low',
    dateAdded: daysAgoISO(33),
  }),
];

// Small deterministic generator so the demo calendar always looks the same.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildSessions() {
  const r = rng(42);
  const reading = ['b1', 'b2', 'b3'];
  const sessions = [];
  for (let d = 0; d < 75; d++) {
    const forced = d <= 5; // guarantees a visible streak
    if (!forced && r() < 0.38) continue;
    sessions.push({
      id: `s${sessions.length + 1}`,
      bookId: reading[Math.floor(r() * reading.length)],
      date: daysAgoISO(d),
      pagesRead: 8 + Math.floor(r() * 34),
      startPage: null,
      endPage: null,
      minutes: 15 + Math.floor(r() * 50),
    });
  }
  return sessions;
}

export const sampleSessions = buildSessions();

export const sampleEntries = [
  {
    id: 'e1',
    bookId: 'b4',
    type: 'review',
    rating: 5,
    page: null,
    text: 'A big-hearted science adventure. I loved how problem-solving drives the whole story and how much warmth is packed into it. Easily one of my favourites this year.',
    createdAt: daysAgoISO(4),
  },
  {
    id: 'e2',
    bookId: 'b6',
    type: 'review',
    rating: 5,
    page: null,
    text: 'Beautiful, patient storytelling. Circe feels like a real person rather than a myth, and the island chapters were my favourite.',
    createdAt: daysAgoISO(40),
  },
  {
    id: 'e3',
    bookId: 'b2',
    type: 'quote',
    rating: null,
    page: 1,
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    createdAt: daysAgoISO(13),
  },
  {
    id: 'e4',
    bookId: 'b1',
    type: 'thought',
    rating: null,
    page: 120,
    text: 'The way the story is framed as a story being told makes every chapter feel like a campfire evening.',
    createdAt: daysAgoISO(9),
  },
  {
    id: 'e5',
    bookId: 'b3',
    type: 'note',
    rating: null,
    page: 60,
    text: 'The chapter on shared myths and cooperation is worth rereading. Compare with notes from Atomic Habits on identity.',
    createdAt: daysAgoISO(3),
  },
  {
    id: 'e6',
    bookId: 'b7',
    type: 'review',
    rating: 4,
    page: null,
    text: 'Practical and easy to apply. The idea of small habits compounding stuck with me; the middle section repeats itself a little.',
    createdAt: daysAgoISO(60),
  },
];

export const sampleGoal = { year: new Date().getFullYear(), target: 20 };
