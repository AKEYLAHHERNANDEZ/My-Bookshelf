import { useEffect, useState } from 'react';
import { BookOpen, Check, Play, Square, Timer } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import Cover from '../components/Cover.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/dates.js';
import { estimateFinish } from '../utils/stats.js';

function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const total = Math.max(0, Math.floor((now - since) / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return <span className="timer">{h > 0 ? `${h}:` : ''}{m}:{s}</span>;
}

function TrackerCard({ book }) {
  const { sessions, activeSessions, recordProgress, startSession, cancelSession, finishSession, setStatus, openDetails } = useLibrary();
  const active = activeSessions[book.id];
  const [page, setPage] = useState(book.currentPage || 0);
  const [endPage, setEndPage] = useState(book.currentPage || 0);
  const estimate = estimateFinish(book, sessions);

  useEffect(() => {
    setPage(book.currentPage || 0);
    setEndPage(book.currentPage || 0);
  }, [book.currentPage]);

  return (
    <article className="tracker-card card">
      <button className="cover-btn" onClick={() => openDetails(book.id)} aria-label={`Open ${book.title}`}>
        <Cover book={book} size="md" />
      </button>

      <div className="tracker-body">
        <header>
          <h3>{book.title}</h3>
          <p className="muted">{book.author}</p>
        </header>

        <ProgressBar value={book.currentPage} max={book.pages || 0} />
        <p className="tracker-meta">
          <span>{book.pages ? `Page ${book.currentPage || 0} of ${book.pages}` : `Page ${book.currentPage || 0}`}</span>
          <span>Started {formatDate(book.startDate)}</span>
        </p>
        <p className="muted tracker-estimate">
          {estimate
            ? `About ${estimate.perDay} pages a day, so roughly ${estimate.days} day${estimate.days === 1 ? '' : 's'} to go (around ${formatDate(estimate.date, { day: 'numeric', month: 'short' })}).`
            : 'Log a few sessions to see a finishing estimate.'}
        </p>

        {active ? (
          <div className="session-box">
            <div className="session-status">
              <Timer size={18} /> Session in progress <Elapsed since={active.startedAt} />
              <small className="muted">started on page {active.startPage}</small>
            </div>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                finishSession(book.id, endPage);
              }}
            >
              <label htmlFor={`end-${book.id}`}>I stopped on page</label>
              <input id={`end-${book.id}`} type="number" min="0" max={book.pages || undefined} value={endPage} onChange={(e) => setEndPage(e.target.value)} />
              <button className="btn btn-primary" type="submit">
                <Square size={15} /> Finish session
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => cancelSession(book.id)}>
                Cancel
              </button>
            </form>
          </div>
        ) : (
          <div className="tracker-actions">
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                recordProgress(book.id, page);
              }}
            >
              <label htmlFor={`page-${book.id}`}>Current page</label>
              <input id={`page-${book.id}`} type="number" min="0" max={book.pages || undefined} value={page} onChange={(e) => setPage(e.target.value)} />
              <button className="btn btn-soft" type="submit">Update</button>
            </form>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => startSession(book.id)}>
                <Play size={15} /> Start session
              </button>
              <button className="btn btn-ghost" onClick={() => setStatus(book.id, 'Finished')}>
                <Check size={15} /> Mark as finished
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ReadingTracker() {
  const { books, sessions, setStatus, loading } = useLibrary();
  const [showAll, setShowAll] = useState(false);
  if (loading) return null;

  const reading = books.filter((b) => b.status === 'Currently Reading');
  const upNext = books.filter((b) => ['Want to Read', 'On Hold'].includes(b.status)).slice(0, 6);
  const titleOf = (id) => books.find((b) => b.id === id)?.title || 'Removed book';
  const history = [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const shown = showAll ? history : history.slice(0, 10);

  return (
    <div className="tracker">
      <section>
        <h2 className="section-title">Currently reading</h2>
        {reading.length === 0 ? (
          <EmptyState icon={BookOpen} title="No book in progress" message="Start one from the list below, or from your bookshelf." />
        ) : (
          <div className="tracker-list">
            {reading.map((b) => (
              <TrackerCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </section>

      {upNext.length > 0 && (
        <section>
          <h2 className="section-title">Up next</h2>
          <ul className="upnext-list">
            {upNext.map((b) => (
              <li key={b.id} className="card upnext-item">
                <Cover book={b} size="xs" />
                <div>
                  <strong>{b.title}</strong>
                  <small className="muted">{b.author}</small>
                </div>
                <button className="btn btn-soft" onClick={() => setStatus(b.id, 'Currently Reading')}>
                  {b.status === 'On Hold' ? 'Resume' : 'Start reading'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h3>Reading history</h3>
          <span className="muted">{history.length} sessions</span>
        </div>
        {history.length === 0 ? (
          <p className="muted">Your reading sessions will be listed here.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Book</th>
                    <th>Pages</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.date)}</td>
                      <td>{titleOf(s.bookId)}</td>
                      <td>
                        {s.pagesRead}
                        {s.startPage != null && s.endPage != null && <small className="muted"> (p. {s.startPage}→{s.endPage})</small>}
                      </td>
                      <td>{s.minutes ? `${s.minutes} min` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.length > 10 && (
              <button className="link-btn" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Show fewer' : `Show all ${history.length}`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
