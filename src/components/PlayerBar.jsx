import { Link, useLocation, useNavigate } from "react-router-dom";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import SkipNextRounded from "@mui/icons-material/SkipNextRounded";
import SkipPreviousRounded from "@mui/icons-material/SkipPreviousRounded";
import ShuffleRounded from "@mui/icons-material/ShuffleRounded";
import RepeatRounded from "@mui/icons-material/RepeatRounded";
import RepeatOneRounded from "@mui/icons-material/RepeatOneRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import VolumeDownRounded from "@mui/icons-material/VolumeDownRounded";
import VolumeOffRounded from "@mui/icons-material/VolumeOffRounded";
import QueueMusicRounded from "@mui/icons-material/QueueMusicRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Cover from "./Cover";
import Slider from "./Slider";
import { usePlayer, useProgress } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { formatTime, songArtistName } from "../utils/format";

export default function PlayerBar() {
  const p = usePlayer();
  const { currentTime, duration } = useProgress();
  const library = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const song = p.current;
  const total = duration || song?.duration || 0;
  const liked = song && library.isLiked(song._id);
  const VolumeIcon = p.muted || p.volume === 0 ? VolumeOffRounded : p.volume < 0.5 ? VolumeDownRounded : VolumeUpRounded;
  const onQueue = location.pathname === "/queue";

  return (
    <footer className={`player ${song ? "" : "idle"}`} aria-label="Player">
      <div className="mobile-progress" style={{ width: `${total ? (currentTime / total) * 100 : 0}%` }} />
      <div className="np">
        {song ? (
          <>
            <Cover src={song.coverUrl} seed={song._id} size={56} />
            <div className="np-text">
              <span className="np-title">{song.title}</span>
              <Link className="np-artist" to={`/artist/${song.artist?._id}`}>
                {songArtistName(song)}
              </Link>
            </div>
            <button className={`icon-btn like-btn ${liked ? "on" : ""}`} onClick={() => library.toggleLike(song)}
              aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}>
              {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </button>
          </>
        ) : (
          <span className="np-empty">Pick something to play</span>
        )}
      </div>

      <div className="controls">
        <div className="buttons">
          <button className={`icon-btn toggle ${p.shuffle ? "on" : ""}`} onClick={p.toggleShuffle}
            aria-label={p.shuffle ? "Disable shuffle" : "Enable shuffle"} aria-pressed={p.shuffle}>
            <ShuffleRounded fontSize="small" />
          </button>
          <button className="icon-btn" onClick={p.prev} disabled={!song} aria-label="Previous">
            <SkipPreviousRounded />
          </button>
          <button className="main-play" onClick={p.togglePlay} disabled={!song} aria-label={p.isPlaying ? "Pause" : "Play"}>
            {p.isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
          </button>
          <button className="icon-btn" onClick={p.next} disabled={!song} aria-label="Next">
            <SkipNextRounded />
          </button>
          <button className={`icon-btn toggle ${p.repeat !== "off" ? "on" : ""}`} onClick={p.cycleRepeat}
            aria-label={`Repeat: ${p.repeat}`}>
            {p.repeat === "one" ? <RepeatOneRounded fontSize="small" /> : <RepeatRounded fontSize="small" />}
          </button>
        </div>
        <div className="seek">
          <span className="time">{formatTime(currentTime)}</span>
          <Slider value={currentTime} max={total} onCommit={p.seek} label="Seek" />
          <span className="time">{formatTime(total)}</span>
        </div>
      </div>

      <div className="extras">
        <button className={`icon-btn toggle ${onQueue ? "on" : ""}`} onClick={() => (onQueue ? navigate(-1) : navigate("/queue"))} aria-label="Queue">
          <QueueMusicRounded fontSize="small" />
        </button>
        <button className="icon-btn" onClick={p.toggleMute} aria-label={p.muted ? "Unmute" : "Mute"}>
          <VolumeIcon fontSize="small" />
        </button>
        <Slider className="volume" value={p.muted ? 0 : p.volume} max={1} onChange={p.setVolume} label="Volume" />
      </div>

      {/* compact mobile controls */}
      <button className="mobile-play icon-btn" onClick={p.togglePlay} disabled={!song} aria-label={p.isPlaying ? "Pause" : "Play"}>
        {p.isPlaying ? <PauseRounded /> : <PlayArrowRounded />}
      </button>
    </footer>
  );
}
