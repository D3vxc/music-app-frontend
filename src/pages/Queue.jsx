import { Link } from "react-router-dom";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Cover from "../components/Cover";
import Equalizer from "../components/Equalizer";
import { Empty } from "../components/Status";
import { usePlayer } from "../context/PlayerContext";
import { formatTime, songArtistName } from "../utils/format";

function Row({ song, label, onPlay, onRemove, current, playing }) {
  return (
    <div className={`queue-row ${current ? "current" : ""}`} onDoubleClick={onPlay}>
      <span className="c-num">{playing ? <Equalizer /> : label}</span>
      <Cover src={song.coverUrl} seed={song._id} size={40} />
      <span className="title-text" onClick={onPlay} role="button" tabIndex={0}>
        <span className="track-name">{song.title}</span>
        <span className="track-artist">{songArtistName(song)}</span>
      </span>
      <span className="muted">{formatTime(song.duration)}</span>
      {onRemove ? (
        <button className="icon-btn" onClick={onRemove} aria-label="Remove from queue">
          <CloseRounded fontSize="small" />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

export default function Queue() {
  const p = usePlayer();
  if (!p.current) {
    return (
      <Empty title="Add to your queue">
        <p className="muted">Tap “Add to queue” from any song's menu to see it here.</p>
        <Link className="btn btn-light" to="/search">
          Find something to play
        </Link>
      </Empty>
    );
  }
  const upcoming = p.queue.map((s, i) => ({ s, i })).slice(p.index + 1);
  const wrapped = p.repeat === "all" ? p.queue.map((s, i) => ({ s, i })).slice(0, p.index) : [];
  return (
    <div className="queue">
      <h1>Queue</h1>
      <h2 className="section-title">Now playing</h2>
      <Row song={p.current} label={1} current playing={p.isPlaying} onPlay={p.togglePlay} />
      {(upcoming.length > 0 || wrapped.length > 0) && (
        <>
          <h2 className="section-title">Next{p.source?.label ? ` from: ${p.source.label}` : ""}</h2>
          {[...upcoming, ...wrapped].map(({ s, i }, n) => (
            <Row key={`${s._id}-${i}`} song={s} label={n + 2} onPlay={() => p.jumpTo(i)} onRemove={() => p.removeFromQueue(i)} />
          ))}
        </>
      )}
    </div>
  );
}
