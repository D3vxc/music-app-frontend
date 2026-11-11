import { Pause, Play } from 'lucide-react';
import { Link } from 'react-router';
import Cover from './Cover';
import { usePlayer } from '../context/PlayerContext';

export default function SongCard({ song, list, index }) {
  const { current, isPlaying, playQueue } = usePlayer();
  const active = current?.id === song.id;
  return (
    <article className={`card ${active ? 'is-active' : ''}`}>
      <div className="card-art">
        <Cover song={song} />
        <button className="fab" aria-label={active && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`} onClick={() => playQueue(list, index)}>
          {active && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
      </div>
      <h3 className="card-title" title={song.title}>{song.title}</h3>
      <Link className="card-sub" to={`/artist/${song.artist}`}>{song.artistName}</Link>
    </article>
  );
}
