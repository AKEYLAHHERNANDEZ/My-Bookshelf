import { addDays, monthOf, parseISO, toISO, todayISO, yearOf } from './dates.js';

export const libraryBooks = (books) => books.filter((b) => b.status !== 'Wishlist');

export const pagesReadFor = (b) => (b.status === 'Finished' ? b.pages || b.currentPage || 0 : b.currentPage || 0);

function streaks(sessions) {
  const days = [...new Set(sessions.map((s) => s.date))].sort();
  if (!days.length) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round((parseISO(days[i]) - parseISO(days[i - 1])) / 86400000);
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // A streak is still "alive" if you read today or yesterday.
  const set = new Set(days);
  let cursor = new Date();
  if (!set.has(toISO(cursor))) cursor = addDays(cursor, -1);
  let current = 0;
  while (set.has(toISO(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export function computeStats(books, sessions, goal) {
  const year = new Date().getFullYear();
  const lib = libraryBooks(books);
  const finished = lib.filter((b) => b.status === 'Finished');
  const finishedThisYear = finished.filter((b) => yearOf(b.finishDate) === year);

  const booksByMonth = Array(12).fill(0);
  const pagesByMonth = Array(12).fill(0);
  finishedThisYear.forEach((b) => {
    const m = monthOf(b.finishDate);
    booksByMonth[m] += 1;
    pagesByMonth[m] += b.pages || 0;
  });

  const rated = lib.filter((b) => b.rating > 0);
  const avgRating = rated.length ? rated.reduce((sum, b) => sum + b.rating, 0) / rated.length : 0;

  const genreMap = {};
  lib.forEach((b) => {
    const g = b.genre || 'Other';
    genreMap[g] = (genreMap[g] || 0) + 1;
  });
  const genreCounts = Object.entries(genreMap)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  const favoriteGenres = Object.values(
    finished.reduce((acc, b) => {
      const g = b.genre || 'Other';
      acc[g] = acc[g] || { genre: g, count: 0, ratingSum: 0, rated: 0 };
      acc[g].count += 1;
      if (b.rating) {
        acc[g].ratingSum += b.rating;
        acc[g].rated += 1;
      }
      return acc;
    }, {}),
  )
    .map((g) => ({ genre: g.genre, count: g.count, avg: g.rated ? g.ratingSum / g.rated : 0 }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg);

  const pagesPerDay = {};
  sessions.forEach((s) => {
    pagesPerDay[s.date] = (pagesPerDay[s.date] || 0) + (s.pagesRead || 0);
  });

  return {
    year,
    totalBooks: lib.length,
    reading: lib.filter((b) => b.status === 'Currently Reading').length,
    finishedCount: finished.length,
    finishedThisYear: finishedThisYear.length,
    pagesRead: lib.reduce((sum, b) => sum + pagesReadFor(b), 0),
    avgRating,
    genreCounts,
    favoriteGenres,
    booksByMonth,
    pagesByMonth,
    pagesPerDay,
    target: goal.target,
    ...streaks(sessions),
  };
}

// Builds a Monday-first grid of the last `weeks` weeks for the activity calendar.
export function buildCalendar(pagesPerDay, weeks = 26) {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7);
  const todayStr = todayISO();
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    const iso = toISO(d);
    const pages = pagesPerDay[iso] || 0;
    const future = iso > todayStr;
    let level = 0;
    if (pages > 0) level = 1;
    if (pages >= 15) level = 2;
    if (pages >= 30) level = 3;
    if (pages >= 50) level = 4;
    cells.push({ iso, pages, level, future });
  }
  return cells;
}

// Rough finishing estimate from the last 30 days of sessions for this book.
export function estimateFinish(book, sessions) {
  if (!book.pages) return null;
  const remaining = book.pages - (book.currentPage || 0);
  if (remaining <= 0) return null;
  const cutoff = toISO(addDays(new Date(), -30));
  const recent = sessions.filter((s) => s.bookId === book.id && s.date >= cutoff);
  const total = recent.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
  if (!total) return null;
  const perDay = total / 30;
  const days = Math.ceil(remaining / perDay);
  return { perDay: Math.max(1, Math.round(perDay)), days, date: toISO(addDays(new Date(), days)) };
}
