import { Link } from 'react-router';
import { Play, Sparkles } from 'lucide-react';
import SongCard from '../components/SongCard';
import TrackList from '../components/TrackList';
import { api } from '../api';
import { useAsync } from '../lib/useAsync';
import { greeting, titleCase } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

export default function Home() {
  const { user } = useAuth();
  const { playQueue } = usePlayer();
  const { version } = useLibrary();
  const { data, loading, error } = useAsync(
    async () => {
      const [popular, fresh, genres] = await Promise.all([
        api.songs.list({ sort: 'popular', limit: 10 }),
        api.songs.list({ sort: 'new', limit: 6 }),
        api.songs.genres(),
      ]);
      return { popular: popular.items, fresh: fresh.items, genres };
    },
    [version]
  );

  if (error) return <div className="page"><p className="error">{error.message}</p></div>;

  const popular = data?.popular || [];
  const featured = popular[0];

  return (
    <div className="page">
      <header className="page-head">
        <h1>{greeting()}{user ? `, ${user.displayName.split(' ')[0]}` : ''}</h1>
      </header>

      {api.mode === 'demo' && !user && (
        <section className="banner">
          <Sparkles size={20} />
          <div>
            <strong>You're in demo mode.</strong> Every track here is generated live in your browser. Create an account (stored locally) to like songs, build playlists, or sign up as an artist and upload your own music.
          </div>
          <Link to="/register" className="btn btn-primary">Get started</Link>
        </section>
      )}

      {featured && (
        <section className="hero" style={{ '--hue': (featured.title.length * 37) % 360 }}>
          <div className="hero-text">
            <span className="eyebrow">Most played right now</span>
            <h2>{featured.title}</h2>
            <p className="muted">{featured.artistName} · {featured.album} · {titleCase(featured.genre)}</p>
            <button className="btn btn-primary btn-lg" onClick={() => playQueue(popular, 0)}>
              <Play size={18} fill="currentColor" /> Play top hits
            </button>
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>Trending now</h2>
          <Link to="/search?sort=popular" className="muted small">Show all</Link>
        </div>
        {loading && !data ? <div className="skeleton-row" /> : (
          <div className="card-row">
            {popular.map((s, i) => <SongCard key={s.id} song={s} list={popular} index={i} />)}
          </div>
        )}
      </section>

      <section>
        <div className="section-head"><h2>Fresh releases</h2></div>
        {data && <TrackList songs={data.fresh} />}
      </section>

      <section>
        <div className="section-head"><h2>Browse by genre</h2></div>
        <div className="genre-grid">
          {(data?.genres || []).map((g) => (
            <Link key={g} to={`/search?genre=${encodeURIComponent(g)}`} className="genre-tile" style={{ '--hue': (g.length * 53 + g.charCodeAt(0) * 7) % 360 }}>
              {titleCase(g)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
