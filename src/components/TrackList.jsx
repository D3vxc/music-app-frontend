import { Link } from "react-router-dom";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Cover from "./Cover";
import Equalizer from "./Equalizer";
import useSongMenu from "./useSongMenu";
import { usePlayer } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { formatTime, formatDate, formatCount, songArtistName } from "../utils/format";

/**
 * songs: array of songs
 * source: { label, path } - identifies the context so "now playing" highlights correctly
 * options: showAlbum, showAdded (uses song.likedAt / addedAt), showPlays, hideArtist, menuExtra(song) -> items
 */
export default function TrackList({ songs, source, showAlbum = true, showAdded = false, showPlays = false, hideArtist = false, menuExtra }) {
  const player = usePlayer();
  const library = useLibrary();
  const [openMenu, menu] = useSongMenu();

  if (!songs?.length) return null;

  const widths = {
    num: "40px",
    title: "minmax(0, 4fr)",
    plays: "minmax(0, 1.4fr)",
    album: "minmax(0, 2.6fr)",
    added: "minmax(0, 1.6fr)",
    dur: "128px",
  };
  const cols = ["num", "title", showPlays && "plays", showAlbum && "album", showAdded && "added", "dur"].filter(Boolean);
  // Narrower screens hide some columns in CSS; give each breakpoint a matching template.
  const template = (hide) => cols.filter((c) => !hide.includes(c)).map((c) => widths[c]).join(" ");
  const style = {
    "--cols": template([]),
    "--cols-md": template(["added"]),
    "--cols-sm": template(["added", "album", "plays"]),
  };

  return (
    <div className="tracks" role="table" style={style}>
      <div className="track-row track-head" role="row">
        <span className="c-num">#</span>
        <span className="c-title">Title</span>
        {showPlays && <span className="c-plays">Plays</span>}
        {showAlbum && <span className="c-album">Album</span>}
        {showAdded && <span className="c-added">Date added</span>}
        <span className="c-dur" aria-label="Duration">
          <AccessTimeIcon fontSize="small" />
        </span>
      </div>
      {songs.map((song, i) => {
        const isCurrent = player.isCurrent(song, source);
        const playingThis = isCurrent && player.isPlaying;
        const liked = library.isLiked(song._id);
        return (
          <div
            key={song._id + i}
            role="row"
            className={`track-row ${isCurrent ? "current" : ""}`}
            onDoubleClick={() => player.playSongs(songs, i, source)}
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(song, { left: e.clientX, top: e.clientY, right: e.clientX, bottom: e.clientY }, menuExtra?.(song) || []);
            }}
          >
            <span className="c-num">
              <span className="num-label">{playingThis ? <Equalizer /> : i + 1}</span>
              <button className="num-play" aria-label={playingThis ? "Pause" : `Play ${song.title}`} onClick={() => player.playSongs(songs, i, source)}>
                {playingThis ? <PauseRounded /> : <PlayArrowRounded />}
              </button>
            </span>
            <span className="c-title">
              <Cover src={song.coverUrl} seed={song._id} size={40} />
              <span className="title-text">
                <span className="track-name">{song.title}</span>
                {!hideArtist && (
                  <Link className="track-artist" to={`/artist/${song.artist?._id}`} onClick={(e) => e.stopPropagation()}>
                    {songArtistName(song)}
                  </Link>
                )}
              </span>
            </span>
            {showPlays && <span className="c-plays muted">{formatCount(song.plays)}</span>}
            {showAlbum && <span className="c-album muted">{song.album || "Single"}</span>}
            {showAdded && <span className="c-added muted">{formatDate(song.likedAt || song.addedAt || song.createdAt)}</span>}
            <span className="c-dur muted">
              <button
                className={`icon-btn like-btn ${liked ? "on" : ""}`}
                aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
                onClick={() => library.toggleLike(song)}
              >
                {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
              </button>
              <span className="dur-text">{formatTime(song.duration)}</span>
              <button className="icon-btn more-btn" aria-label="More options" onClick={(e) => openMenu(song, e.currentTarget, menuExtra?.(song) || [])}>
                <MoreHorizIcon fontSize="small" />
              </button>
            </span>
          </div>
        );
      })}
      {menu}
    </div>
  );
}
