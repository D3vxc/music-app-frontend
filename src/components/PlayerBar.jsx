import { useState } from 'react';
import { Link } from 'react-router';
import { Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX, Loader2 } from 'lucide-react';
import Cover from './Cover';
import QueuePanel from './QueuePanel';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatTime } from '../lib/format';

export default function PlayerBar() {
  const p = usePlayer();
  const { likedIds, toggleLike } = useLibrary();
  const [showQueue, setShowQueue] = useState(false);
  const [lastVol, setLastVol] = useState(0.8);
  const song = p.current;
  const pct = p.duration ? (p.time / p.duration) * 100 : 0;
  const VolIcon = p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;
  const liked = song && likedIds.has(song.id);

  return (
    <>
      <footer className={`player ${song ? '' : 'is-empty'}`} aria-label="Player">
        <div className="player-progress-mobile" style={{ width: `${pct}%` }} />
        <div className="player-now">
          {song ? (
            <>
              <Cover song={song} className="player-cover" />
              <div className="player-text">
                <div className="player-title ellipsis">{song.title}</div>
                <Link to={`/artist/${song.artist}`} className="player-artist ellipsis">{song.artistName}</Link>
              </div>
              <button className={`icon-btn like ${liked ? 'is-liked' : ''}`} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => toggleLike(song)}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </>
          ) : (
            <div className="player-text muted">Pick something to play</div>
          )}
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button className={`icon-btn hide-sm ${p.shuffle ? 'is-on' : ''}`} aria-pressed={p.shuffle} aria-label="Shuffle" onClick={p.toggleShuffle}>
              <Shuffle size={18} />
            </button>
            <button className="icon-btn hide-sm" aria-label="Previous" onClick={p.prev} disabled={!song}>
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button className="play-btn" aria-label={p.isPlaying ? 'Pause' : 'Play'} onClick={p.toggle} disabled={!song}>
              {p.loading ? <Loader2 size={20} className="spin" /> : p.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button className="icon-btn" aria-label="Next" onClick={p.next} disabled={!song}>
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button className={`icon-btn hide-sm ${p.repeat !== 'off' ? 'is-on' : ''}`} aria-label={`Repeat: ${p.repeat}`} onClick={p.cycleRepeat}>
              {p.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>
          <div className="player-seek hide-sm">
            <span className="tabular muted">{formatTime(p.time)}</span>
            <input
              type="range"
              className="range"
              min={0}
              max={p.duration || 0}
              step={0.1}
              value={Math.min(p.time, p.duration || 0)}
              onChange={(e) => p.seek(Number(e.target.value))}
              style={{ '--pct': `${pct}%` }}
              aria-label="Seek"
              disabled={!song}
            />
            <span className="tabular muted">{formatTime(p.duration)}</span>
          </div>
        </div>

        <div className="player-right hide-sm">
          <button className={`icon-btn ${showQueue ? 'is-on' : ''}`} aria-label="Queue" aria-pressed={showQueue} onClick={() => setShowQueue((s) => !s)}>
            <ListMusic size={18} />
          </button>
          <button
            className="icon-btn"
            aria-label={p.volume ? 'Mute' : 'Unmute'}
            onClick={() => {
              if (p.volume) {
                setLastVol(p.volume);
                p.setVolume(0);
              } else p.setVolume(lastVol || 0.8);
            }}
          >
            <VolIcon size={18} />
          </button>
          <input
            type="range"
            className="range volume"
            min={0}
            max={1}
            step={0.01}
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            style={{ '--pct': `${p.volume * 100}%` }}
            aria-label="Volume"
          />
        </div>
      </footer>
      {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}
    </>
  );
}
