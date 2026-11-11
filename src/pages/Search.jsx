import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search as SearchIcon, X } from 'lucide-react';
import TrackList from '../components/TrackList';
import { api } from '../api';
import { useAsync } from '../lib/useAsync';
import { titleCase } from '../lib/format';
import { useLibrary } from '../context/LibraryContext';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const genre = params.get('genre') || '';
  const sort = params.get('sort') || 'popular';
  const [text, setText] = useState(q);
  const { version } = useLibrary();

  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== q) {
        const next = new URLSearchParams(params);
        text ? next.set('q', text) : next.delete('q');
        setParams(next, { replace: true });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const genres = useAsync(() => api.songs.genres(), []);
  const results = useAsync(() => api.songs.list({ q, genre, sort, limit: 50 }), [q, genre, sort, version]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Search</h1>
      </header>
      <div className="searchbox">
        <SearchIcon size={20} />
        <input
          autoFocus
          type="search"
          placeholder="Songs, artists, albums or genres"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Search"
        />
        {text && <button className="icon-btn" aria-label="Clear search" onClick={() => setText('')}><X size={18} /></button>}
      </div>
      <div className="filters">
        <div className="chips" role="group" aria-label="Genre">
          <button className={`chip ${!genre ? 'is-on' : ''}`} onClick={() => setParam('genre', '')}>All</button>
          {(genres.data || []).map((g) => (
            <button key={g} className={`chip ${genre === g ? 'is-on' : ''}`} onClick={() => setParam('genre', genre === g ? '' : g)}>{titleCase(g)}</button>
          ))}
        </div>
        <label className="select">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="popular">Most played</option>
            <option value="new">Newest</option>
            <option value="title">A–Z</option>
          </select>
        </label>
      </div>
      {results.error ? <p className="error">{results.error.message}</p> : (
        <>
          <p className="muted small">{results.data ? `${results.data.total} ${results.data.total === 1 ? 'song' : 'songs'}` : 'Searching…'}</p>
          {results.data && <TrackList songs={results.data.items} emptyText={`No results for "${q}". Try another word or genre.`} />}
        </>
      )}
    </div>
  );
}
