import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PersonIcon from "@mui/icons-material/Person";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";
import Menu from "./Menu";
import { usePlayer } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/** Returns [openMenu(song, anchor, extraItems), menuElement]. */
export default function useSongMenu() {
  const [state, setState] = useState(null);
  const player = usePlayer();
  const library = useLibrary();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const open = useCallback((song, anchor, extra = []) => setState({ song, anchor, extra }), []);
  const close = useCallback(() => setState(null), []);

  let element = null;
  if (state) {
    const { song } = state;
    const liked = library.isLiked(song._id);
    const playlistItems = [
      {
        label: "New playlist",
        icon: <AddIcon />,
        onClick: () => library.createPlaylist({ songId: song._id }),
      },
      ...(library.playlists.length ? [{ divider: true }] : []),
      ...library.playlists.map((pl) => ({
        label: pl.name,
        icon: <QueueMusicIcon />,
        onClick: () => library.addToPlaylist(pl, song),
      })),
    ];
    const items = [
      {
        label: "Add to playlist",
        icon: <PlaylistAddIcon />,
        ...(user ? { submenu: playlistItems } : { onClick: () => library.createPlaylist() }),
      },
      {
        label: liked ? "Remove from Liked Songs" : "Save to Liked Songs",
        icon: liked ? <FavoriteIcon /> : <FavoriteBorderIcon />,
        onClick: () => library.toggleLike(song),
      },
      ...state.extra,
      { divider: true },
      {
        label: "Play next",
        icon: <PlaylistPlayIcon />,
        onClick: () => {
          player.playNext(song);
          toast("Playing next");
        },
      },
      {
        label: "Add to queue",
        icon: <QueueMusicIcon />,
        onClick: () => {
          player.addToQueue(song);
          toast("Added to queue");
        },
      },
      { divider: true },
      ...(song.artist?._id
        ? [{ label: "Go to artist", icon: <PersonIcon />, onClick: () => navigate(`/artist/${song.artist._id}`) }]
        : []),
      {
        label: "Copy song link",
        icon: <LinkIcon />,
        onClick: () => {
          const url = `${window.location.origin}/track/${song._id}`;
          navigator.clipboard?.writeText(url).then(
            () => toast("Link copied"),
            () => toast(url),
          );
        },
      },
    ];
    element = <Menu anchor={state.anchor} items={items} onClose={close} />;
  }
  return [open, element];
}

export const removeItem = (onClick) => ({ label: "Remove from this playlist", icon: <RemoveCircleOutlineIcon />, onClick });
