import { Link } from "react-router-dom";
import Shelf, { SongCard, ArtistCard, PlaylistCard } from "../components/Shelf";
import Cover, { PlaylistCover } from "../components/Cover";
import PlayButton from "../components/PlayButton";
import { Loading, ErrorState, Empty } from "../components/Status";
import useFetch from "../utils/useFetch";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { useLibrary } from "../context/LibraryContext";
import { greeting } from "../utils/format";

function QuickTile({ to, art, label, onPlay, playing }) {
  return (
    <Link to={to} className="quick-tile">
      {art}
      <span>{label}</span>
      {onPlay && <PlayButton className={`quick-play ${playing ? "show" : ""}`} size={40} playing={playing} onClick={onPlay} />}
    </Link>
  );
}

export default function Home() {
  const { user, isArtist } = useAuth();
  const player = usePlayer();
  const library = useLibrary();
  const fresh = useFetch("/songs?sort=new&limit=12");
  const popular = useFetch("/songs?sort=popular&limit=12");
  const artists = useFetch("/artists?limit=12");

  if (fresh.loading && popular.loading) return <Loading />;
  if (fresh.error) return <ErrorState message={fresh.error} onRetry={fresh.reload} />;

  const newSongs = fresh.data || [];
  const popSongs = popular.data || [];
  const recent = player.recent.slice(0, 8);
  const newSource = { label: "New releases", path: "/?new" };
  const popSource = { label: "Popular right now", path: "/?popular" };
  const recentSource = { label: "Recently played", path: "/?recent" };

  const quick = [
    user && {
      key: "liked",
      to: "/collection/tracks",
      art: <Cover kind="liked" size={64} />,
      label: "Liked Songs",
    },
    ...library.playlists.slice(0, 3).map((pl) => ({
      key: pl._id,
      to: `/playlist/${pl._id}`,
      art: <PlaylistCover playlist={pl} size={64} />,
      label: pl.name,
      songs: pl.songs,
      source: { label: pl.name, path: `/playlist/${pl._id}` },
    })),
    ...recent.slice(0, 4).map((s, i) => ({
      key: `r${s._id}`,
      to: `/artist/${s.artist?._id}`,
      art: <Cover src={s.coverUrl} seed={s._id} size={64} />,
      label: s.title,
      songs: recent,
      index: i,
      source: recentSource,
      song: s,
    })),
  ]
    .filter(Boolean)
    .slice(0, 8);

  return (
    <div className="home">
      <h1 className="greeting">{greeting()}{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>

      {quick.length > 0 && (
        <div className="quick-grid">
          {quick.map((q) => {
            const playing = q.song
              ? player.isCurrent(q.song, q.source) && player.isPlaying
              : player.source?.path === q.source?.path && player.isPlaying;
            return (
              <QuickTile
                key={q.key}
                to={q.to}
                art={q.art}
                label={q.label}
                playing={playing}
                onPlay={q.songs?.length ? () => player.playSongs(q.songs, q.index || 0, q.source) : null}
              />
            );
          })}
        </div>
      )}

      {!newSongs.length && (
        <Empty title="No music yet">
          <p className="muted">
            {isArtist ? "Be the first - upload a track from your studio." : "Artists haven't uploaded anything yet."}
          </p>
          {isArtist ? (
            <Link className="btn btn-accent" to="/studio">
              Upload a song
            </Link>
          ) : (
            !user && (
              <Link className="btn btn-light" to="/register?artist=1">
                Join as an artist
              </Link>
            )
          )}
        </Empty>
      )}

      {recent.length > 0 && (
        <Shelf title="Recently played">
          {recent.map((s, i) => (
            <SongCard key={s._id} song={s} songs={recent} index={i} source={recentSource} />
          ))}
        </Shelf>
      )}

      {library.playlists.length > 0 && (
        <Shelf title="Your playlists" to="/collection">
          {library.playlists.slice(0, 8).map((pl) => (
            <PlaylistCard key={pl._id} playlist={pl} />
          ))}
        </Shelf>
      )}

      <Shelf title="New releases" to="/search?sort=new">
        {newSongs.map((s, i) => (
          <SongCard key={s._id} song={s} songs={newSongs} index={i} source={newSource} />
        ))}
      </Shelf>

      <Shelf title="Popular right now">
        {popSongs.map((s, i) => (
          <SongCard key={s._id} song={s} songs={popSongs} index={i} source={popSource} />
        ))}
      </Shelf>

      <Shelf title="Artists">
        {(artists.data || []).map((a) => (
          <ArtistCard key={a._id} artist={a} />
        ))}
      </Shelf>
    </div>
  );
}
