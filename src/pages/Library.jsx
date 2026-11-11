import { Link, useSearchParams } from 'react-router';
import { Heart, Play, Plus } from 'lucide-react';
import TrackList from '../components/TrackList';
import { Mosaic } from '../components/Cover';
import { api } from '../api';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';

export default function Library() {
  const { user } = useAuth();
  const { playlists, createPlaylist, version } = useLibrary();
  const { playQueue } = usePlayer();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'liked';
  const liked = useAsync(() => (user ? api.songs.liked() : Promise.resolve([])), [user?.id, version]);

  if (!user) {
    return (
      <div className="page center-page">
        <Heart size={40} />
        <h1>Your library lives here</h1>
        <p className="muted">Log in to like songs and make playlists.</p>
        <div className="row-gap">
          <Link to="/login" className="btn btn-primary">Log in</Link>
          <Link to="/register" className="btn">Create account</Link>
        </div>
      </div>
    );
  }

  const newPlaylist = async () => {
    const name = window.prompt('Playlist name', `My Playlist #${playlists.length + 1}`);
    if (name?.trim()) await createPlaylist(name.trim());
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Your Library</h1>
      </header>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'liked'} className={`chip ${tab === 'liked' ? 'is-on' : ''}`} onClick={() => setParams({ tab: 'liked' })}>Liked Songs</button>
        <button role="tab" aria-selected={tab === 'playlists'} className={`chip ${tab === 'playlists' ? 'is-on' : ''}`} onClick={() => setParams({ tab: 'playlists' })}>Playlists</button>
      </div>

      {tab === 'liked' ? (
        <section>
          <div className="collection-head">
            <div className="liked-tile big"><Heart size={42} fill="currentColor" /></div>
            <div>
              <span className="eyebrow">Playlist</span>
              <h2 className="display">Liked Songs</h2>
              <p className="muted">{liked.data?.length ?? 0} songs</p>
              {liked.data?.length > 0 && (
                <button className="btn btn-primary" onClick={() => playQueue(liked.data, 0)}><Play size={18} fill="currentColor" /> Play</button>
              )}
            </div>
          </div>
          {liked.data && <TrackList songs={liked.data} emptyText="Songs you like will appear here. Tap the heart on any track." />}
        </section>
      ) : (
        <section className="card-grid">
          <button className="card card-new" onClick={newPlaylist}>
            <div className="card-art new-art"><Plus size={36} /></div>
            <h3 className="card-title">New playlist</h3>
          </button>
          {playlists.map((p) => (
            <Link key={p.id} to={`/playlist/${p.id}`} className="card">
              <div className="card-art"><Mosaic label={p.name} /></div>
              <h3 className="card-title">{p.name}</h3>
              <span className="card-sub">{p.songs.length} songs</span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
