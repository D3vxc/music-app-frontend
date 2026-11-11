import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PersonIcon from "@mui/icons-material/Person";
import FavoriteIcon from "@mui/icons-material/Favorite";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { hue } from "../utils/format";

const ICONS = { song: MusicNoteIcon, artist: PersonIcon, liked: FavoriteIcon, playlist: QueueMusicIcon };

/** Artwork with a generated gradient fallback so nothing ever shows a broken image. */
export default function Cover({ src, seed = "", kind = "song", round = false, size, className = "" }) {
  const Icon = ICONS[kind] || MusicNoteIcon;
  const h = hue(seed);
  const style = {
    width: size,
    height: size,
    background:
      kind === "liked"
        ? "linear-gradient(135deg, #4c1d95, #a78bfa 60%, #e9d5ff)"
        : `linear-gradient(135deg, hsl(${h} 55% 32%), hsl(${(h + 40) % 360} 60% 52%))`,
  };
  return (
    <div className={`cover ${round ? "round" : ""} ${className}`} style={style}>
      {src ? <img src={src} alt="" loading="lazy" /> : <Icon className="cover-icon" />}
    </div>
  );
}

/** 2x2 mosaic of the first four distinct covers, like a playlist thumbnail. */
export function PlaylistCover({ playlist, size, className = "" }) {
  const covers = [...new Set((playlist?.songs || []).map((s) => s?.coverUrl).filter(Boolean))].slice(0, 4);
  if (covers.length >= 4) {
    return (
      <div className={`cover mosaic ${className}`} style={{ width: size, height: size }}>
        {covers.map((c) => (
          <img key={c} src={c} alt="" loading="lazy" />
        ))}
      </div>
    );
  }
  return <Cover src={covers[0]} seed={playlist?._id} kind="playlist" size={size} className={className} />;
}
