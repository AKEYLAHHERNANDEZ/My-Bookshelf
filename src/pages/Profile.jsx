import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export default function Profile({ theme, onThemeChange }) {
  const { profile, stats, setProfileName, authRequired, signOut, loading } = useLibrary();
  const [name, setName] = useState(profile.name || 'Reader');

  useEffect(() => setName(profile.name || 'Reader'), [profile.name]);

  if (loading) return null;

  const saveName = async (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    await setProfileName(nextName);
  };

  return (
    <div className="profile-page">
      <div className="profile-intro">
        <span className="profile-avatar"><UserRound size={25} /></span>
        <div>
          <h2>Your profile</h2>
          <p className="muted">Manage your reader details and app preferences.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="card profile-card">
          <div className="card-head">
            <div>
              <h3>Reader details</h3>
              <p className="muted">This name appears in your dashboard greeting.</p>
            </div>
          </div>
          <form className="profile-name-form" onSubmit={saveName}>
            <label htmlFor="profile-name">Display name</label>
            <div className="profile-name-row">
              <input id="profile-name" value={name} maxLength={60} onChange={(event) => setName(event.target.value)} required />
              <button className="btn btn-primary" type="submit" disabled={!name.trim() || name.trim() === profile.name}>
                Save name
              </button>
            </div>
          </form>
          <div className="profile-library-summary">
            <BookOpen size={17} />
            <span>{stats.totalBooks} books in your library</span>
          </div>
        </section>

        <section className="card profile-card">
          <div className="card-head">
            <div>
              <h3>Appearance</h3>
              <p className="muted">Choose how My Bookshelf looks on this device.</p>
            </div>
          </div>
          <div className="theme-options" role="group" aria-label="Color theme">
            <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => onThemeChange('light')} aria-pressed={theme === 'light'}>
              <Sun size={19} />
              <span>Light</span>
              <small>Bright and warm</small>
            </button>
            <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => onThemeChange('dark')} aria-pressed={theme === 'dark'}>
              <Moon size={19} />
              <span>Dark</span>
              <small>Easy on the eyes</small>
            </button>
          </div>
          <p className="profile-hint">Your theme preference is saved in this browser.</p>
        </section>

        <section className="card profile-card profile-account-card">
          <div>
            <h3>Account</h3>
            <p className="muted">
              {authRequired ? 'Your library is connected to your private hosted account.' : 'Your library is stored on this device.'}
            </p>
          </div>
          {authRequired ? (
            <button className="btn btn-ghost" onClick={signOut}>
              <LogOut size={17} /> Sign out
            </button>
          ) : (
            <span className="profile-local-badge">Local library</span>
          )}
        </section>
      </div>
    </div>
  );
}
