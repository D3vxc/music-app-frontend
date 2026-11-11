import { useEffect, useRef, useState } from 'react';
import { ListPlus, Plus, ListEnd } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';

export default function PlaylistMenu({ song }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { playlists, addToPlaylist, createPlaylist, requireLogin } = useLibrary();
  const { addToQueue } = usePlayer();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const newPlaylist = async () => {
    const name = window.prompt('Playlist name', `My Playlist #${playlists.length + 1}`);
    if (!name?.trim()) return;
    const p = await createPlaylist(name.trim());
    if (p) await addToPlaylist(p.id, song);
    setOpen(false);
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn" aria-label={`More options for ${song.title}`} aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <ListPlus size={18} />
      </button>
      {open && (
        <div className="menu" role="menu" onClick={(e) => e.stopPropagation()}>
          <button role="menuitem" onClick={() => { addToQueue(song); setOpen(false); }}>
            <ListEnd size={16} /> Play next
          </button>
          <div className="menu-sep" />
          <div className="menu-label">Add to playlist</div>
          <button role="menuitem" onClick={() => requireLogin() && newPlaylist()}>
            <Plus size={16} /> New playlist
          </button>
          {playlists.map((p) => (
            <button role="menuitem" key={p.id} onClick={() => { addToPlaylist(p.id, song); setOpen(false); }}>
              <span className="menu-dot" /> {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
