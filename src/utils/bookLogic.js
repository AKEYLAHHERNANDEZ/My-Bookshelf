import { todayISO } from './dates.js';

// Returns the fields that must change when a book moves to a new status.
// Keeping this in one place means the form, the details view and the tracker
// all agree on what "Finished" or "Currently Reading" means.
export function statusPatch(book, status) {
  const patch = { status };
  const today = todayISO();

  if (status === 'Currently Reading') {
    patch.startDate = book.startDate || today;
    patch.finishDate = null;
  }

  if (status === 'Finished') {
    patch.startDate = book.startDate || today;
    patch.finishDate = book.finishDate || today;
    if (book.pages) patch.currentPage = book.pages;
  }

  return patch;
}

export const percentRead = (book) => {
  if (!book.pages) return book.status === 'Finished' ? 100 : 0;
  return Math.min(100, Math.round(((book.currentPage || 0) / book.pages) * 100));
};
