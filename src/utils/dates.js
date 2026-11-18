// Dates are stored as plain 'YYYY-MM-DD' strings (local time) so they map
// directly into the database as ISO date strings.

const pad = (n) => String(n).padStart(2, '0');

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
};

export const daysAgoISO = (n) => toISO(addDays(new Date(), -n));

export const formatDate = (s, opts) =>
  s ? parseISO(s).toLocaleDateString(undefined, opts || { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatLongDate = (d = new Date()) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const yearOf = (s) => (s ? Number(s.slice(0, 4)) : null);
export const monthOf = (s) => (s ? Number(s.slice(5, 7)) - 1 : null);

export const dayOfYear = (d = new Date()) => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
};
