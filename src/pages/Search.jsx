import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SearchRounded from "@mui/icons-material/SearchRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Shelf, { ArtistCard, PlaylistCard } from "../components/Shelf";
import TrackList from "../components/TrackList";
import Cover from "../components/Cover";
import PlayButton from "../components/PlayButton";
import { Loading, Empty } from "../components/Status";
import useFetch from "../utils/useFetch";
import { usePlayer } from "../context/PlayerContext";
import { hue, songArtistName } from "../utils/format";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const genre = params.get("genre") || "";
  const sort = params.get("sort") || "";
  const [input, setInput] = useState(q);

  // Debounce typing into the URL so results are shareable and back/forward works.
  useEffect(() => {
    const t = setTimeout(() => {
      if (input.trim() !== q) setParams(input.trim() ? { q: input.trim() } : {}, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setInput(q), [q]);

  return (
    <div className="search-page">
      <div className="search-box">
        <SearchRounded />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do you want to listen to?"
          aria-label="Search"
        />
        {input && (
          <button className="icon-btn" onClick={() => setInput("")} aria-label="Clear search">
            <CloseRounded />
          </button>
        )}
      </div>
      {q ? <Results q={q} /> : genre || sort ? <SongBrowse genre={genre} sort={sort} /> : <BrowseAll />}
    </div>
  );
}

function BrowseAll() {
  const { data, loading } = useFetch("/songs/genres");
  if (loading) return <Loading />;
  return (
    <section>
      <h2 className="section-title">Browse all</h2>
      <div className="genre-grid">
        <Link to="/search?sort=new" className="genre-tile" style={{ "--h": 265 }}>
          New releases
        </Link>
        <Link to="/search?sort=popular" className="genre-tile" style={{ "--h": 15 }}>
          Charts
        </Link>
        {(data || []).map((g) => (
          <Link key={g.name} to={`/search?genre=${encodeURIComponent(g.name)}`} className="genre-tile" style={{ "--h": hue(g.name) }}>
            {g.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function SongBrowse({ genre, sort }) {
  const url = genre ? `/songs?genre=${encodeURIComponent(genre)}&limit=100` : `/songs?sort=${sort}&limit=100`;
  const { data, loading } = useFetch(url);
  const player = usePlayer();
  const title = genre || (sort === "popular" ? "Charts" : "New releases");
  const source = { label: title, path: `/search?${genre ? `genre=${genre}` : `sort=${sort}`}` };
  const songs = data || [];
  const playing = player.source?.path === source.path && player.isPlaying;
  if (loading) return <Loading />;
  return (
    <section>
      <div className="browse-head">
        <h1 className="capitalize">{title}</h1>
        {songs.length > 0 && (
          <PlayButton playing={playing} onClick={() => (player.source?.path === source.path ? player.togglePlay() : player.playSongs(songs, 0, source))} />
        )}
      </div>
      {songs.length ? <TrackList songs={songs} source={source} showPlays={sort === "popular"} /> : <Empty title="Nothing here yet" />}
    </section>
  );
}

function Results({ q }) {
  const { data, loading } = useFetch(`/search?q=${encodeURIComponent(q)}`);
  const player = usePlayer();
  if (loading && !data) return <Loading />;
  const { songs = [], artists = [], playlists = [] } = data || {};
  if (!songs.length && !artists.length && !playlists.length) {
    return (
      <Empty title={`No results found for "${q}"`}>
        <p className="muted">Check the spelling, or try fewer or different keywords.</p>
      </Empty>
    );
  }
  const source = { label: `Search: ${q}`, path: `/search?q=${q}` };
  const exactArtist = artists.find((a) => a.name.toLowerCase() === q.toLowerCase());
  const top = exactArtist ? { kind: "artist", item: exactArtist } : songs[0] ? { kind: "song", item: songs[0] } : artists[0] ? { kind: "artist", item: artists[0] } : null;

  return (
    <>
      <div className="top-results">
        {top && (
          <section className="top-result-wrap">
            <h2 className="section-title">Top result</h2>
            {top.kind === "artist" ? (
              <Link className="top-result" to={`/artist/${top.item._id}`}>
                <Cover src={top.item.imageUrl} seed={top.item._id} kind="artist" round size={92} />
                <h3>{top.item.name}</h3>
                <span className="pill">Artist</span>
              </Link>
            ) : (
              <div className="top-result" onClick={() => player.playSongs(songs, 0, source)} role="button" tabIndex={0}>
                <Cover src={top.item.coverUrl} seed={top.item._id} size={92} />
                <h3>{top.item.title}</h3>
                <span className="muted">
                  <span className="pill">Song</span> {songArtistName(top.item)}
                </span>
                <PlayButton className="card-play" size={48} playing={player.isCurrent(top.item, source) && player.isPlaying} onClick={() => player.playSongs(songs, 0, source)} />
              </div>
            )}
          </section>
        )}
        {songs.length > 0 && (
          <section className="top-songs">
            <h2 className="section-title">Songs</h2>
            <TrackList songs={songs.slice(0, 4)} source={source} showAlbum={false} />
          </section>
        )}
      </div>
      {songs.length > 4 && (
        <section>
          <h2 className="section-title">More songs</h2>
          <TrackList songs={songs} source={source} />
        </section>
      )}
      <Shelf title="Artists">
        {artists.map((a) => (
          <ArtistCard key={a._id} artist={a} />
        ))}
      </Shelf>
      <Shelf title="Playlists">
        {playlists.map((p) => (
          <PlaylistCard key={p._id} playlist={p} />
        ))}
      </Shelf>
    </>
  );
}
