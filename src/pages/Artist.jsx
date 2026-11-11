import { useParams } from 'react-router';
import { Play } from 'lucide-react';
import TrackList from '../components/TrackList';
import Cover from '../components/Cover';
import { api } from '../api';
import { useAsync } from '../lib/useAsync';
import { formatCount } from '../lib/format';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

export default function Artist() {
  const { id } = useParams();
  const { playQueue } = usePlayer();
  const { version } = useLibrary();
  const { data, error } = useAsync(async () => {
    const [artist, songs] = await Promise.all([api.artists.get(id), api.songs.list({ artist: id, sort: 'popular' })]);
    return { artist, songs: songs.items };
  }, [id, version]);

  if (error) return <div className="page center-page"><h1>Artist not found</h1></div>;
  if (!data) return <div className="page"><div className="skeleton-row" /></div>;
  const plays = data.songs.reduce((t, s) => t + s.plays, 0);

  return (
    <div className="page">
      <div className="collection-head">
        <Cover seed={`artist-${id}`} label={data.artist.displayName} className="collection-art round" />
        <div>
          <span className="eyebrow">Artist</span>
          <h1 className="display">{data.artist.displayName}</h1>
          {data.artist.bio && <p className="muted">{data.artist.bio}</p>}
          <p className="muted small">{data.songs.length} songs · {formatCount(plays)} plays</p>
          {data.songs.length > 0 && <button className="btn btn-primary" onClick={() => playQueue(data.songs, 0)}><Play size={18} fill="currentColor" /> Play</button>}
        </div>
      </div>
      <h2>Popular</h2>
      <TrackList songs={data.songs} />
    </div>
  );
}
