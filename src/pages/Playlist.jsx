import { useNavigate, useParams } from 'react-router';
import { Pencil, Play, Trash2, Shuffle } from 'lucide-react';
import TrackList from '../components/TrackList';
import { Mosaic } from '../components/Cover';
import { api } from '../api';
import { useAsync } from '../lib/useAsync';
import { formatTime } from '../lib/format';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { setPlaylists, version, bump } = useLibrary();
  const { playQueue, shuffle, toggleShuffle } = usePlayer();
  const { data: playlist, error, loading } = useAsync(() => api.playlists.get(id), [id, version, user?.id]);

  if (loading && !playlist) return <div className="page"><div className="skeleton-row" /></div>;
  if (error) return <div className="page center-page"><h1>Playlist not found</h1><p className="muted">{error.message}</p></div>;

  const isOwner = user && (playlist.owner === user.id || playlist.owner?.id === user.id);
  const total = playlist.songs.reduce((t, s) => t + (s.durationSec || 0), 0);

  const rename = async () => {
    const name = window.prompt('Rename playlist', playlist.name);
    if (!name?.trim() || name === playlist.name) return;
    const p = await api.playlists.update(id, { name: name.trim() });
    setPlaylists((ps) => ps.map((x) => (x.id === id ? p : x)));
    bump();
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${playlist.name}"?`)) return;
    await api.playlists.remove(id);
    setPlaylists((ps) => ps.filter((x) => x.id !== id));
    toast('Playlist deleted');
    navigate('/library?tab=playlists');
  };
  const removeSong = async (song) => {
    const p = await api.playlists.removeSong(id, song.id);
    setPlaylists((ps) => ps.map((x) => (x.id === id ? p : x)));
    toast(`Removed "${song.title}"`);
    bump();
  };

  return (
    <div className="page">
      <div className="collection-head">
        <Mosaic songs={playlist.songs} label={playlist.name} className="collection-art" />
        <div>
          <span className="eyebrow">Playlist</span>
          <h1 className="display">{playlist.name}</h1>
          <p className="muted">{playlist.songs.length} songs · {formatTime(total)}</p>
          <div className="row-gap">
            <button className="btn btn-primary" disabled={!playlist.songs.length} onClick={() => playQueue(playlist.songs, 0)}><Play size={18} fill="currentColor" /> Play</button>
            <button className={`icon-btn ${shuffle ? 'is-on' : ''}`} aria-pressed={shuffle} aria-label="Shuffle" onClick={toggleShuffle}><Shuffle size={20} /></button>
            {isOwner && (
              <>
                <button className="icon-btn" aria-label="Rename playlist" onClick={rename}><Pencil size={18} /></button>
                <button className="icon-btn danger" aria-label="Delete playlist" onClick={remove}><Trash2 size={18} /></button>
              </>
            )}
          </div>
        </div>
      </div>
      <TrackList songs={playlist.songs} onRemove={isOwner ? removeSong : undefined} emptyText="This playlist is empty. Use the + button on any song to add it here." />
    </div>
  );
}
