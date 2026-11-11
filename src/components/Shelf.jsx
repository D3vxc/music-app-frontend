import { Link } from "react-router-dom";
import Cover, { PlaylistCover } from "./Cover";
import PlayButton from "./PlayButton";
import { usePlayer } from "../context/PlayerContext";
import { songArtistName } from "../utils/format";

/** Horizontal section of cards with a title, e.g. "New releases". */
export default function Shelf({ title, to, children }) {
  if (!children || (Array.isArray(children) && !children.length)) return null;
  return (
    <section className="shelf">
      <div className="shelf-head">
        <h2>{to ? <Link to={to}>{title}</Link> : title}</h2>
        {to && (
          <Link className="show-all" to={to}>
            Show all
          </Link>
        )}
      </div>
      <div className="shelf-grid">{children}</div>
    </section>
  );
}

export function SongCard({ song, songs, index, source }) {
  const player = usePlayer();
  const playing = player.isCurrent(song, source) && player.isPlaying;
  return (
    <div className="card" onClick={() => player.playSongs(songs, index, source)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && player.playSongs(songs, index, source)}>
      <div className="card-art">
        <Cover src={song.coverUrl} seed={song._id} />
        <PlayButton className={`card-play ${playing ? "show" : ""}`} size={48} playing={playing} onClick={() => player.playSongs(songs, index, source)} />
      </div>
      <div className="card-title">{song.title}</div>
      <div className="card-sub">
        <Link to={`/artist/${song.artist?._id}`} onClick={(e) => e.stopPropagation()}>
          {songArtistName(song)}
        </Link>
      </div>
    </div>
  );
}

export function ArtistCard({ artist }) {
  return (
    <Link className="card" to={`/artist/${artist._id}`}>
      <div className="card-art">
        <Cover src={artist.imageUrl} seed={artist._id} kind="artist" round />
      </div>
      <div className="card-title">{artist.name}</div>
      <div className="card-sub">Artist</div>
    </Link>
  );
}

export function PlaylistCard({ playlist }) {
  const player = usePlayer();
  const source = { label: playlist.name, path: `/playlist/${playlist._id}` };
  const songs = playlist.songs || [];
  const playing = player.source?.path === source.path && player.isPlaying;
  return (
    <Link className="card" to={source.path}>
      <div className="card-art">
        <PlaylistCover playlist={playlist} />
        {songs.length > 0 && (
          <PlayButton
            className={`card-play ${playing ? "show" : ""}`}
            size={48}
            playing={playing}
            onClick={() => (player.source?.path === source.path ? player.togglePlay() : player.playSongs(songs, 0, source))}
          />
        )}
      </div>
      <div className="card-title">{playlist.name}</div>
      <div className="card-sub">
        {playlist.description || `${songs.length} song${songs.length === 1 ? "" : "s"}`}
      </div>
    </Link>
  );
}
