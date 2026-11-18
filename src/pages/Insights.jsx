import { useMemo, useState } from 'react';
import { Flame, Library, Pencil, Sparkles, Star, Target } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import StatCard from '../components/StatCard.jsx';
import Stars from '../components/Stars.jsx';
import { BarChart, DonutChart, ProgressRing } from '../components/Charts.jsx';
import { MONTHS, formatDate } from '../utils/dates.js';
import { buildCalendar } from '../utils/stats.js';

export default function Insights() {
  const { books, stats, goal, setGoalTarget, openDetails, loading } = useLibrary();
  const [mode, setMode] = useState('books');
  const calendar = useMemo(() => buildCalendar(stats.pagesPerDay, 26), [stats.pagesPerDay]);

  if (loading) return null;

  const finished = books
    .filter((b) => b.status === 'Finished')
    .sort((a, b) => ((a.finishDate || '') < (b.finishDate || '') ? 1 : -1));

  const monthly = MONTHS.map((label, i) => ({ label, value: mode === 'books' ? stats.booksByMonth[i] : stats.pagesByMonth[i] }));
  const daysRead = Object.keys(stats.pagesPerDay).length;

  const editGoal = () => {
    const input = window.prompt(`How many books do you want to read in ${stats.year}?`, String(goal.target));
    if (input === null) return;
    const value = Number(input);
    if (Number.isInteger(value) && value > 0 && value <= 1000) setGoalTarget(value);
    else window.alert('Please enter a whole number between 1 and 1000.');
  };

  return (
    <div className="insights">
      <section className="stat-grid">
        <StatCard icon={Library} label="Books read" value={stats.finishedCount} hint={`${stats.finishedThisYear} in ${stats.year}`} />
        <StatCard icon={Sparkles} label="Pages read" value={stats.pagesRead.toLocaleString()} />
        <StatCard icon={Star} label="Average rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} hint="out of 5" />
        <StatCard icon={Flame} label="Reading streak" value={`${stats.current} day${stats.current === 1 ? '' : 's'}`} hint={`Longest: ${stats.longest}`} />
      </section>

      <div className="insights-grid">
        <section className="card span-2">
          <div className="card-head">
            <h3>Monthly activity, {stats.year}</h3>
            <div className="tabs tabs-pill tabs-small">
              <button className={mode === 'books' ? 'active' : ''} onClick={() => setMode('books')}>Books</button>
              <button className={mode === 'pages' ? 'active' : ''} onClick={() => setMode('pages')}>Pages</button>
            </div>
          </div>
          <BarChart data={monthly} unit={mode} height={220} />
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Annual goal</h3>
            <button className="icon-btn" onClick={editGoal} aria-label="Edit reading goal" title="Edit goal">
              <Pencil size={16} />
            </button>
          </div>
          <div className="goal-body">
            <ProgressRing value={stats.finishedThisYear} max={goal.target} label={`of ${goal.target} books`} size={150} />
            <p className="muted">
              <Target size={14} className="inline-icon" />{' '}
              {Math.max(0, goal.target - stats.finishedThisYear)} to go in {stats.year}
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Genre distribution</h3>
          </div>
          {stats.genreCounts.length === 0 ? (
            <p className="muted">Add books with genres to see the mix.</p>
          ) : (
            <DonutChart data={stats.genreCounts} centerValue={stats.totalBooks} centerLabel="books" />
          )}
        </section>

        <section className="card span-2">
          <div className="card-head">
            <h3>Favourite genres</h3>
          </div>
          {stats.favoriteGenres.length === 0 ? (
            <p className="muted">Finish a few books to see your favourites.</p>
          ) : (
            <ol className="rank-list">
              {stats.favoriteGenres.slice(0, 5).map((g, i) => (
                <li key={g.genre}>
                  <span className="rank-num">{i + 1}</span>
                  <span className="rank-name">{g.genre}</span>
                  <span className="muted">{g.count} read</span>
                  {g.avg > 0 && <Stars value={Math.round(g.avg)} size={13} />}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card span-2">
          <div className="card-head">
            <h3>Reading calendar</h3>
            <span className="muted">{daysRead} days read · longest streak {stats.longest}</span>
          </div>
          <div className="heatmap-scroll">
            <div className="heatmap" role="img" aria-label="Reading activity calendar for the last 26 weeks">
              {calendar.map((c) => (
                <span
                  key={c.iso}
                  className={`heat heat-${c.future ? 'future' : c.level}`}
                  title={c.future ? '' : `${formatDate(c.iso)}: ${c.pages ? `${c.pages} pages` : 'no reading'}`}
                />
              ))}
            </div>
          </div>
          <div className="heat-legend">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className={`heat heat-${l}`} />
            ))}
            <span>More</span>
          </div>
        </section>

        <section className="card span-2">
          <div className="card-head">
            <h3>Reading history</h3>
            <span className="muted">{finished.length} finished</span>
          </div>
          {finished.length === 0 ? (
            <p className="muted">Finished books will be listed here.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Finished</th>
                    <th>Pages</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {finished.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <button className="link-btn" onClick={() => openDetails(b.id)}>
                          {b.title}
                        </button>
                        <small className="muted"> {b.author}</small>
                      </td>
                      <td>{formatDate(b.finishDate)}</td>
                      <td>{b.pages || '—'}</td>
                      <td>{b.rating ? <Stars value={b.rating} size={13} /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
