import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCheck, Library, Pencil, Plus, Sparkles } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import StatCard from '../components/StatCard.jsx';
import Cover from '../components/Cover.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Stars from '../components/Stars.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { BarChart, ProgressRing } from '../components/Charts.jsx';
import { MONTHS, dayOfYear, formatDate } from '../utils/dates.js';
import { yearOf } from '../utils/dates.js';

const MESSAGES = [
  'A few pages today is still a good day of reading.',
  'The best time to start a new chapter is right now.',
  'Every finished book is a small journey completed.',
  'Pour a cup of tea and find your place in the story.',
  'Reading a little each day adds up faster than you think.',
  'Somewhere on your shelf, a good book is waiting.',
  'Curl up, slow down, and let the story carry you.',
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { books, stats, goal, profile, setProfileName, openDetails, openAddBook, loading } = useLibrary();
  const [chartMode, setChartMode] = useState('books');

  if (loading) return null;

  const reading = books.filter((b) => b.status === 'Currently Reading');
  const recentlyFinished = books
    .filter((b) => b.status === 'Finished' && b.finishDate)
    .sort((a, b) => (a.finishDate < b.finishDate ? 1 : -1))
    .slice(0, 4);

  const monthly = MONTHS.map((label, i) => ({
    label,
    value: chartMode === 'books' ? stats.booksByMonth[i] : stats.pagesByMonth[i],
  }));

  // Pace message for the annual goal.
  const expected = (goal.target * dayOfYear()) / 365;
  const diff = stats.finishedThisYear - expected;
  const paceText =
    stats.finishedThisYear >= goal.target
      ? 'Goal reached. Wonderful reading year!'
      : diff >= 1
        ? `You are about ${Math.floor(diff)} book${Math.floor(diff) === 1 ? '' : 's'} ahead of pace.`
        : diff <= -1
          ? `You are about ${Math.ceil(-diff)} book${Math.ceil(-diff) === 1 ? '' : 's'} behind pace. Plenty of time to catch up.`
          : 'You are right on pace.';

  const message = MESSAGES[new Date().getDate() % MESSAGES.length];

  const rename = () => {
    const name = window.prompt('What should I call you?', profile.name);
    if (name && name.trim()) setProfileName(name.trim());
  };

  return (
    <div className="dashboard">
      <section className="welcome card">
        <div>
          <h2>
            {greeting()}, {profile.name}
            <button className="icon-btn" onClick={rename} aria-label="Change your name" title="Change your name">
              <Pencil size={14} />
            </button>
          </h2>
          <p>{message}</p>
        </div>
        <Sparkles className="welcome-deco" size={42} />
      </section>

      <section className="stat-grid">
        <StatCard icon={Library} label="Books in library" value={stats.totalBooks} />
        <StatCard icon={BookOpen} label="Currently reading" value={stats.reading} />
        <StatCard icon={CheckCheck} label={`Finished in ${stats.year}`} value={stats.finishedThisYear} />
        <StatCard icon={Sparkles} label="Pages read" value={stats.pagesRead.toLocaleString()} />
      </section>

      <div className="dash-grid">
        <div className="dash-col">
          <section className="card">
            <div className="card-head">
              <h3>Currently Reading</h3>
              <Link to="/tracker" className="link">Open tracker</Link>
            </div>
            {reading.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Nothing on your nightstand"
                message="Pick something from your shelf and begin your next story."
                action={<Link className="btn btn-primary" to="/bookshelf">Browse my bookshelf</Link>}
              />
            ) : (
              <ul className="reading-list">
                {reading.map((b) => (
                  <li key={b.id} className="reading-item">
                    <button className="cover-btn" onClick={() => openDetails(b.id)} aria-label={`Open ${b.title}`}>
                      <Cover book={b} size="sm" />
                    </button>
                    <div className="reading-info">
                      <h4>{b.title}</h4>
                      <p className="muted">{b.author}</p>
                      <ProgressBar value={b.currentPage} max={b.pages || 0} />
                      <small className="muted">
                        {b.pages ? `Page ${b.currentPage || 0} of ${b.pages}` : `Page ${b.currentPage || 0}`}
                      </small>
                    </div>
                    <button className="btn btn-soft" onClick={() => openDetails(b.id, 'progress')}>
                      Continue Reading
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h3>Recently Finished</h3>
              <Link to="/insights" className="link">See history</Link>
            </div>
            {recentlyFinished.length === 0 ? (
              <p className="muted">Finished books will appear here.</p>
            ) : (
              <ul className="finished-grid">
                {recentlyFinished.map((b) => (
                  <li key={b.id}>
                    <button className="finished-item" onClick={() => openDetails(b.id)}>
                      <Cover book={b} size="md" />
                      <strong>{b.title}</strong>
                      <small className="muted">{formatDate(b.finishDate, { day: 'numeric', month: 'short', year: yearOf(b.finishDate) === stats.year ? undefined : 'numeric' })}</small>
                      {b.rating > 0 && <Stars value={b.rating} size={13} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="dash-col">
          <section className="card goal-card">
            <div className="card-head">
              <h3>{stats.year} Reading Goal</h3>
              <Link to="/insights" className="link">Edit</Link>
            </div>
            <div className="goal-body">
              <ProgressRing value={stats.finishedThisYear} max={goal.target} label={`of ${goal.target} books`} />
              <p className="muted">{paceText}</p>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3>Monthly Reading</h3>
              <div className="tabs tabs-pill tabs-small">
                <button className={chartMode === 'books' ? 'active' : ''} onClick={() => setChartMode('books')}>Books</button>
                <button className={chartMode === 'pages' ? 'active' : ''} onClick={() => setChartMode('pages')}>Pages</button>
              </div>
            </div>
            <BarChart data={monthly} unit={chartMode} />
          </section>

          {books.length === 0 && (
            <button className="btn btn-primary" onClick={() => openAddBook()}>
              <Plus size={18} /> Add your first book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
