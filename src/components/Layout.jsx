import { NavLink, Outlet, useNavigate } from 'react-router';
import { Home, Search, Library, Mic2, LogIn, LogOut, Plus, Heart } from 'lucide-react';
import Logo from './Logo';
import PlayerBar from './PlayerBar';
import { Mosaic } from './Cover';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { api } from '../api';

export default function Layout() {
  const { user, logout } = useAuth();
  const { playlists, createPlaylist } = useLibrary();
  const navigate = useNavigate();

  const newPlaylist = async () => {
    const name = window.prompt('Playlist name', `My Playlist #${playlists.length + 1}`);
    if (!name?.trim()) return;
    const p = await createPlaylist(name.trim());
    if (p) navigate(`/playlist/${p.id}`);
  };

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <Logo /> <span>Pulse</span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end><Home size={20} /> Home</NavLink>
          <NavLink to="/search"><Search size={20} /> Search</NavLink>
          <NavLink to="/library"><Library size={20} /> Your Library</NavLink>
          {user?.role === 'artist' && <NavLink to="/studio"><Mic2 size={20} /> Artist Studio</NavLink>}
        </nav>

        <div className="side-section">
          <div className="side-head">
            <span>Playlists</span>
            <button className="icon-btn" aria-label="Create playlist" onClick={newPlaylist}><Plus size={18} /></button>
          </div>
          <div className="side-list">
            {user && (
              <NavLink to="/library?tab=liked" className="side-item">
                <span className="liked-tile"><Heart size={14} fill="currentColor" /></span> Liked Songs
              </NavLink>
            )}
            {playlists.map((p) => (
              <NavLink key={p.id} to={`/playlist/${p.id}`} className="side-item">
                <Mosaic label={p.name} className="side-thumb" /> <span className="ellipsis">{p.name}</span>
              </NavLink>
            ))}
            {!user && <p className="muted small">Log in to create playlists and like songs.</p>}
          </div>
        </div>

        <div className="side-foot">
          {user ? (
            <div className="user-chip">
              <span className="avatar" aria-hidden="true">{user.displayName[0]?.toUpperCase()}</span>
              <span className="ellipsis">
                <strong className="ellipsis">{user.displayName}</strong>
                <span className="muted small">{user.role === 'artist' ? 'Artist' : 'Listener'}</span>
              </span>
              <button className="icon-btn" aria-label="Log out" onClick={() => { logout(); navigate('/'); }}><LogOut size={18} /></button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-block"><LogIn size={18} /> Log in</NavLink>
          )}
          {api.mode === 'demo' && <p className="muted tiny">Demo mode · data stays in this browser</p>}
        </div>
      </aside>

      <main id="main" className="main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Main">
        <NavLink to="/" end><Home size={22} /><span>Home</span></NavLink>
        <NavLink to="/search"><Search size={22} /><span>Search</span></NavLink>
        <NavLink to="/library"><Library size={22} /><span>Library</span></NavLink>
        {user?.role === 'artist' ? (
          <NavLink to="/studio"><Mic2 size={22} /><span>Studio</span></NavLink>
        ) : user ? (
          <button onClick={() => { logout(); navigate('/'); }}><LogOut size={22} /><span>Log out</span></button>
        ) : (
          <NavLink to="/login"><LogIn size={22} /><span>Log in</span></NavLink>
        )}
      </nav>

      <PlayerBar />
    </div>
  );
}
