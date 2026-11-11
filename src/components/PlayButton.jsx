import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";

export default function PlayButton({ playing, onClick, size = 56, className = "", label }) {
  return (
    <button
      className={`play-btn ${className}`}
      style={{ width: size, height: size }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={label || (playing ? "Pause" : "Play")}
    >
      {playing ? <PauseRounded /> : <PlayArrowRounded />}
    </button>
  );
}
