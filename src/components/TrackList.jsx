import { Heart, Play, X, Clock } from 'lucide-react';
import { Link } from 'react-router';
import Cover from './Cover';
import PlaylistMenu from './PlaylistMenu';
import Equalizer from './Equalizer';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatCount, formatTime, titleCase } from '../lib/format';

export default function TrackList({ songs, onRemove, showAlbum = true, emptyText = 'Nothing here yet.' }) {
  const { current, isPlaying, playQueue } = usePlayer();
  const { likedIds, toggleLike } = useLibrary();

  if (!songs.length) return <p className="empty">{emptyText}</p>;

  return (
    <div className="tracklist" role="table" aria-label="Songs">
      <div className="track track-head" role="row">
        <span>#</span>
        <span>Title</span>
        {showAlbum && <span className="hide-sm">Album</span>}
        <span className="hide-md">Plays</span>
        <span />
        <span className="ta-r"><Clock size={15} aria-label="Duration" /></span>
        <span />
      </div>
      {songs.map((song, i) => {
        const active = current?.id === song.id;
        const liked = likedIds.has(song.id);
        return (
          <div
            key={song.id}
            role="row"
            className={`track ${active ? 'is-active' : ''}`}
            onDoubleClick={() => playQueue(songs, i)}
          >
            <span className="track-num">
              {active && isPlaying ? <Equalizer /> : <span className="num">{i + 1}</span>}
              <button className="track-play" aria-label={`Play ${song.title}`} onClick={() => playQueue(songs, i)}>
                <Play size={14} fill="currentColor" />
              </button>
            </span>
            <span className="track-main">
              <Cover song={song} className="track-cover" />
              <span className="track-text">
                <button className="track-title" onClick={() => playQueue(songs, i)}>{song.title}</button>
                <Link className="track-artist" to={`/artist/${song.artist}`}>{song.artistName}</Link>
              </span>
            </span>
            {showAlbum && (
              <span className="hide-sm muted ellipsis">
                {song.album || '—'} <span className="tag">{titleCase(song.genre)}</span>
              </span>
            )}
            <span className="hide-md muted">{formatCount(song.plays)}</span>
            <span>
              <button className={`icon-btn like ${liked ? 'is-liked' : ''}`} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => toggleLike(song)}>
                <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </span>
            <span className="ta-r muted tabular">{formatTime(song.durationSec)}</span>
            <span className="track-actions">
              {onRemove ? (
                <button className="icon-btn" aria-label={`Remove ${song.title}`} onClick={() => onRemove(song)}>
                  <X size={17} />
                </button>
              ) : (
                <PlaylistMenu song={song} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
