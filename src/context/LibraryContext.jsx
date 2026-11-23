import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as service from '../services/bookService.js';
import { statusPatch } from '../utils/bookLogic.js';
import { computeStats } from '../utils/stats.js';
import { todayISO } from '../utils/dates.js';

const LibraryContext = createContext(null);

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return ctx;
}

const EMPTY = {
  books: [],
  sessions: [],
  entries: [],
  goal: { year: new Date().getFullYear(), target: 20 },
  activeSessions: {},
  profile: { name: 'Reader' },
};

export function LibraryProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [authenticated, setAuthenticated] = useState(() => service.hasSession());
  const [loading, setLoading] = useState(() => service.hasSession());

  // Global UI state: dialogs that can be opened from any page.
  const [bookForm, setBookForm] = useState(null); // { book?, defaultStatus? }
  const [detailsState, setDetailsState] = useState(null); // { id, tab }
  const [entryForm, setEntryForm] = useState(null); // { entry?, bookId?, type? }
  const [toastMsg, setToastMsg] = useState(null);

  const refresh = useCallback(async () => {
    setData(await service.getLibrary());
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    refresh()
      .catch((error) => {
        if (service.requiresLogin && !service.hasSession()) setAuthenticated(false);
        else console.error(error);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authenticated, refresh]);

  useEffect(() => {
    const expireSession = () => {
      setData(EMPTY);
      setAuthenticated(false);
    };
    window.addEventListener('my-bookshelf-auth-expired', expireSession);
    return () => window.removeEventListener('my-bookshelf-auth-expired', expireSession);
  }, []);

  async function signIn(password) {
    await service.login(password);
    setAuthenticated(true);
  }

  function signOut() {
    service.signOut();
    setData(EMPTY);
    setAuthenticated(false);
  }

  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const toast = useCallback((msg) => setToastMsg(msg), []);
  const findBook = (id) => data.books.find((b) => b.id === id);

  const stats = useMemo(() => computeStats(data.books, data.sessions, data.goal), [data]);

  // ----- Books -------------------------------------------------------------

  async function addBook(payload) {
    await service.addBook(payload);
    await refresh();
    toast(payload.status === 'Wishlist' ? 'Added to your wishlist' : 'Book added to your shelf');
  }

  async function editBook(id, patch, message = 'Changes saved') {
    await service.updateBook(id, patch);
    await refresh();
    if (message) toast(message);
  }

  async function removeBook(id) {
    await service.deleteBook(id);
    setDetailsState((s) => (s && s.id === id ? null : s));
    await refresh();
    toast('Book removed');
  }

  async function toggleFavorite(id) {
    const book = findBook(id);
    if (!book) return;
    await editBook(id, { favorite: !book.favorite }, book.favorite ? 'Removed from favourites' : 'Added to favourites');
  }

  async function setStatus(id, status) {
    const book = findBook(id);
    if (!book) return;
    await editBook(id, statusPatch(book, status), `Moved to ${status}`);
  }

  async function readAgain(id) {
    await editBook(
      id,
      { status: 'Currently Reading', currentPage: 0, startDate: todayISO(), finishDate: null },
      'Happy re-reading',
    );
  }

  // ----- Progress & sessions -------------------------------------------------

  async function recordProgress(id, page, minutes = null) {
    const book = findBook(id);
    if (!book) return;

    let next = Math.max(0, Math.round(Number(page) || 0));
    if (book.pages) next = Math.min(next, book.pages);
    const previous = book.currentPage || 0;
    const diff = next - previous;

    let patch = { currentPage: next };
    const done = Boolean(book.pages) && next >= book.pages;
    if (done) patch = { ...patch, ...statusPatch({ ...book, ...patch }, 'Finished') };
    else if (book.status !== 'Currently Reading') patch = { ...patch, ...statusPatch(book, 'Currently Reading') };

    await service.updateBook(id, patch);
    if (diff > 0) {
      await service.logSession({
        bookId: id,
        date: todayISO(),
        pagesRead: diff,
        startPage: previous,
        endPage: next,
        minutes,
      });
    }
    await refresh();
    toast(done ? 'Finished. Congratulations!' : 'Progress saved');
  }

  async function startSession(id) {
    const book = findBook(id);
    if (!book) return;
    if (book.status !== 'Currently Reading') await service.updateBook(id, statusPatch(book, 'Currently Reading'));
    await service.startSession(id, { startPage: book.currentPage || 0, startedAt: Date.now() });
    await refresh();
    toast('Reading session started');
  }

  async function cancelSession(id) {
    await service.clearSession(id);
    await refresh();
  }

  async function finishSession(id, endPage) {
    const session = data.activeSessions[id];
    const minutes = session ? Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)) : null;
    await service.clearSession(id);
    await recordProgress(id, endPage, minutes);
  }

  // ----- Journal -------------------------------------------------------------

  async function saveEntry(entry) {
    if (entry.id) {
      const { id, ...patch } = entry;
      await service.updateEntry(id, patch);
    } else {
      await service.addEntry(entry);
    }
    // A review's star rating doubles as the book's personal rating.
    if (entry.type === 'review' && entry.rating) await service.updateBook(entry.bookId, { rating: entry.rating });
    await refresh();
    toast('Journal entry saved');
  }

  async function removeEntry(id) {
    await service.deleteEntry(id);
    await refresh();
    toast('Entry deleted');
  }

  // ----- Goal and profile ---------------------------------------------------

  async function setGoalTarget(target) {
    await service.setGoalTarget(target);
    await refresh();
    toast('Reading goal updated');
  }

  async function setProfileName(name) {
    await service.setProfileName(name);
    await refresh();
    toast('Profile updated');
  }

  // ----- Dialog helpers ------------------------------------------------------

  const value = {
    ...data,
    loading,
    authRequired: service.requiresLogin,
    authenticated,
    signIn,
    signOut,
    stats,
    // data actions
    addBook,
    editBook,
    removeBook,
    toggleFavorite,
    setStatus,
    readAgain,
    recordProgress,
    startSession,
    cancelSession,
    finishSession,
    saveEntry,
    removeEntry,
    setGoalTarget,
    setProfileName,
    // dialogs
    bookForm,
    openAddBook: (defaultStatus = 'Want to Read') => setBookForm({ defaultStatus }),
    openEditBook: (book) => setBookForm({ book }),
    closeBookForm: () => setBookForm(null),
    detailsState,
    openDetails: (id, tab = 'overview') => setDetailsState({ id, tab }),
    closeDetails: () => setDetailsState(null),
    entryForm,
    openEntryForm: (config = {}) => setEntryForm(config),
    closeEntryForm: () => setEntryForm(null),
    toastMsg,
    toast,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
