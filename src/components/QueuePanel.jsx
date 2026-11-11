import { X } from 'lucide-react';
import Cover from './Cover';
import Equalizer from './Equalizer';
import { usePlayer } from '../context/PlayerContext';

export default function QueuePanel({ onClose }) {
  const { queue, index, jumpTo, isPlaying } = usePlayer();
  const upNext = queue.slice(index + 1);
  const now = queue[index];
  return (
    <aside className="queue" aria-label="Queue">
      <header>
        <h2>Queue</h2>
        <button className="icon-btn" aria-label="Close queue" onClick={onClose}><X size={18} /></button>
      </header>
      {now ? (
        <>
          <h3>Now playing</h3>
          <div className="queue-item is-active">
            <Cover song={now} className="track-cover" />
            <div className="ellipsis"><div className="ellipsis">{now.title}</div><div className="muted small">{now.artistName}</div></div>
            {isPlaying && <Equalizer />}
          </div>
          <h3>Next up</h3>
          {upNext.length ? upNext.map((s, i) => (
            <button key={s.id + i} className="queue-item" onClick={() => jumpTo(index + 1 + i)}>
              <Cover song={s} className="track-cover" />
              <div className="ellipsis"><div className="ellipsis">{s.title}</div><div className="muted small">{s.artistName}</div></div>
            </button>
          )) : <p className="muted small">That's the end of the queue.</p>}
        </>
      ) : <p className="muted">Nothing queued yet.</p>}
    </aside>
  );
}
