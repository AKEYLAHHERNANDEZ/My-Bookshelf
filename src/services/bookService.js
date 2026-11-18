// ---------------------------------------------------------------------------
// bookService: the ONLY file the UI talks to for data.
//
// The UI uses a local HTTP API backed by SQLite. Keeping this as the only data
// layer means components stay independent of storage details.
// ---------------------------------------------------------------------------
import { sampleBooks, sampleSessions, sampleEntries, sampleGoal } from '../data/sampleBooks.js';
import { todayISO } from '../utils/dates.js';

const STORAGE_KEY = 'my-bookshelf-v1';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const SESSION_KEY = 'my-bookshelf-api-session';
export const requiresLogin = Boolean(API_BASE_URL);
let cache = null;

const clone = (value) => JSON.parse(JSON.stringify(value));

export function hasSession() {
  return !requiresLogin || Boolean(sessionStorage.getItem(SESSION_KEY));
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  cache = null;
}

export async function login(password) {
  if (!requiresLogin) return;
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Sign in failed.');
  sessionStorage.setItem(SESSION_KEY, result.token);
  cache = null;
}

function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = requiresLogin ? sessionStorage.getItem(SESSION_KEY) : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers }).then((response) => {
    if (response.status === 401 && requiresLogin) {
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('my-bookshelf-auth-expired'));
    }
    return response;
  });
}

const uid = (prefix) =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const blankBook = () => ({
  title: '',
  author: '',
  status: 'Want to Read',
  coverUrl: '',
  isbn: '',
  description: '',
  genre: '',
  publisher: '',
  year: null,
  pages: null,
  format: 'Physical',
  dateAdded: todayISO(),
  rating: 0,
  notes: '',
  favorite: false,
  currentPage: 0,
  startDate: null,
  finishDate: null,
  priority: 'Medium',
});

function seed() {
  return clone({
    books: sampleBooks,
    sessions: sampleSessions,
    entries: sampleEntries,
    goal: sampleGoal,
    activeSessions: {},
    profile: { name: 'Reader' },
  });
}

async function persist() {
  const response = await apiFetch('/api/library', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cache),
  });
  if (!response.ok) throw new Error('Could not save your library. Please sign in again if the problem continues.');
}

async function read() {
  if (cache) return cache;
  const response = await apiFetch('/api/library');
  if (!response.ok) throw new Error('Could not load your library. Please sign in again if the problem continues.');
  const remote = await response.json();
  if (remote && Array.isArray(remote.books)) {
    cache = remote;
    return cache;
  }
  // Import an existing browser library once when the SQLite database is new.
  let imported = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.books)) {
        cache = { sessions: [], entries: [], activeSessions: {}, profile: { name: 'Reader' }, goal: clone(sampleGoal), ...parsed };
        imported = true;
      }
    }
  } catch {
    /* corrupted data: fall through and reseed */
  }
  if (imported) await persist();
  if (!cache) {
    cache = seed();
    await persist();
  }
  // Roll the goal over to the current year, keeping the chosen target.
  const year = new Date().getFullYear();
  if (cache.goal.year !== year) cache.goal = { ...cache.goal, year };
  return cache;
}

// ----- Library ---------------------------------------------------------------

export async function getLibrary() {
  return clone(await read());
}

// ----- Books -----------------------------------------------------------------

export async function addBook(data) {
  const db = await read();
  const book = { ...blankBook(), ...data, id: uid('book') };
  db.books.push(book);
  await persist();
  return clone(book);
}

export async function updateBook(id, patch) {
  const db = await read();
  const index = db.books.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Book not found');
  db.books[index] = { ...db.books[index], ...patch, id };
  await persist();
  return clone(db.books[index]);
}

export async function deleteBook(id) {
  const db = await read();
  db.books = db.books.filter((b) => b.id !== id);
  db.sessions = db.sessions.filter((s) => s.bookId !== id);
  db.entries = db.entries.filter((e) => e.bookId !== id);
  delete db.activeSessions[id];
  await persist();
}

// ----- Reading sessions ------------------------------------------------------

export async function logSession(session) {
  const db = await read();
  const saved = { id: uid('session'), ...session };
  db.sessions.push(saved);
  await persist();
  return clone(saved);
}

export async function startSession(bookId, info) {
  const db = await read();
  db.activeSessions[bookId] = info;
  await persist();
}

export async function clearSession(bookId) {
  const db = await read();
  delete db.activeSessions[bookId];
  await persist();
}

// ----- Journal entries (reviews, notes, quotes, thoughts) --------------------

export async function addEntry(entry) {
  const db = await read();
  const saved = { createdAt: todayISO(), ...entry, id: uid('entry') };
  db.entries.push(saved);
  await persist();
  return clone(saved);
}

export async function updateEntry(id, patch) {
  const db = await read();
  const index = db.entries.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Entry not found');
  db.entries[index] = { ...db.entries[index], ...patch, id };
  await persist();
  return clone(db.entries[index]);
}

export async function deleteEntry(id) {
  const db = await read();
  db.entries = db.entries.filter((e) => e.id !== id);
  await persist();
}

// ----- Goal & profile --------------------------------------------------------

export async function setGoalTarget(target) {
  const db = await read();
  db.goal = { ...db.goal, target };
  await persist();
}

export async function setProfileName(name) {
  const db = await read();
  db.profile = { ...db.profile, name };
  await persist();
}

// ----- Demo data -------------------------------------------------------------

export async function resetDemoData() {
  cache = seed();
  await persist();
}
