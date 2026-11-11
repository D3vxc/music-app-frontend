import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ShuffleRounded from "@mui/icons-material/ShuffleRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import PublicRounded from "@mui/icons-material/PublicRounded";
import PageHeader from "../components/PageHeader";
import { PlaylistCover } from "../components/Cover";
import Cover from "../components/Cover";
import PlayButton from "../components/PlayButton";
import TrackList from "../components/TrackList";
import Menu from "../components/Menu";
import Modal from "../components/Modal";
import { removeItem } from "../components/useSongMenu";
import { Loading, ErrorState, Empty } from "../components/Status";
import useFetch from "../utils/useFetch";
import { usePlayer } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { formatTotal, songArtistName } from "../utils/format";

export default function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload, setData } = useFetch(`/playlists/${id}`);
  const player = usePlayer();
  const library = useLibrary();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editing, setEditing] = useState(false);

  // Keep in sync when the playlist is changed elsewhere (e.g. "Add to playlist" menu).
  const fromLibrary = library.playlists.find((p) => p._id === id);
  useEffect(() => {
    if (fromLibrary && data) setData((d) => ({ ...d, ...fromLibrary, owner: d.owner }));
  }, [fromLibrary]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const playlist = data;
  const songs = playlist.songs.filter(Boolean);
  const source = { label: playlist.name, path: `/playlist/${playlist._id}` };
  const playing = player.source?.path === source.path && player.isPlaying;
  const total = songs.reduce((sum, s) => sum + (s.duration || 0), 0);

  const remove = async (song) => {
    const updated = await library.removeFromPlaylist(playlist, song);
    if (updated) setData((d) => ({ ...d, songs: updated.songs }));
  };

  const ownerItems = [
    { label: "Edit details", icon: <EditRounded />, onClick: () => setEditing(true) },
    {
      label: playlist.isPublic ? "Make private" : "Make public",
      icon: playlist.isPublic ? <LockRounded /> : <PublicRounded />,
      onClick: async () => {
        const updated = await library.updatePlaylist(playlist, { isPublic: !playlist.isPublic });
        if (updated) setData((d) => ({ ...d, isPublic: updated.isPublic }));
      },
    },
    { divider: true },
    {
      label: "Delete",
      icon: <DeleteOutlineRounded />,
      danger: true,
      onClick: async () => {
        if (!window.confirm(`Delete "${playlist.name}"? This can't be undone.`)) return;
        if (await library.deletePlaylist(playlist)) navigate("/collection");
      },
    },
  ];

  return (
    <div>
      <PageHeader seed={playlist._id} type={playlist.isPublic ? "Public Playlist" : "Private Playlist"} title={playlist.name} art={<PlaylistCover playlist={playlist} />}>
        {playlist.description && <p className="header-desc">{playlist.description}</p>}
        <strong>{playlist.owner?.name}</strong>
        <span>
          {songs.length} song{songs.length === 1 ? "" : "s"}
          {total > 0 && `, ${formatTotal(total)}`}
        </span>
      </PageHeader>

      <div className="action-bar">
        {songs.length > 0 && (
          <PlayButton playing={playing} onClick={() => (player.source?.path === source.path ? player.togglePlay() : player.playSongs(songs, 0, source))} />
        )}
        {songs.length > 1 && (
          <button className={`icon-btn big toggle ${player.shuffle ? "on" : ""}`} onClick={player.toggleShuffle} aria-label="Toggle shuffle">
            <ShuffleRounded />
          </button>
        )}
        {playlist.isOwner && (
          <button className="icon-btn big" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Playlist options">
            <MoreHorizIcon />
          </button>
        )}
      </div>

      {songs.length ? (
        <TrackList songs={songs} source={source} menuExtra={playlist.isOwner ? (song) => [removeItem(() => remove(song))] : undefined} />
      ) : (
        <Empty title="This playlist is empty">
          <p className="muted">{playlist.isOwner ? "Find songs below, or use “Add to playlist” on any song." : "Nothing here yet."}</p>
        </Empty>
      )}

      {playlist.isOwner && <Recommendations playlist={playlist} onAdded={(updated) => setData((d) => ({ ...d, songs: updated.songs }))} />}

      {menuAnchor && <Menu anchor={menuAnchor} items={ownerItems} onClose={() => setMenuAnchor(null)} />}
      {editing && (
        <EditPlaylist
          playlist={playlist}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setData((d) => ({ ...d, name: updated.name, description: updated.description }))}
        />
      )}
    </div>
  );
}

function Recommendations({ playlist, onAdded }) {
  const { data } = useFetch("/songs?sort=popular&limit=30");
  const library = useLibrary();
  const have = new Set(playlist.songs.map((s) => s?._id));
  const recs = (data || []).filter((s) => !have.has(s._id)).slice(0, 6);
  if (!recs.length) return null;
  return (
    <section className="recs">
      <h2 className="section-title">Recommended</h2>
      <p className="muted small">Based on what's popular right now</p>
      {recs.map((song) => (
        <div className="rec-row" key={song._id}>
          <Cover src={song.coverUrl} seed={song._id} size={40} />
          <span className="title-text">
            <span className="track-name">{song.title}</span>
            <span className="track-artist">{songArtistName(song)}</span>
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={async () => {
              const updated = await library.addToPlaylist(playlist, song);
              if (updated) onAdded(updated);
            }}
          >
            Add
          </button>
        </div>
      ))}
    </section>
  );
}

function EditPlaylist({ playlist, onClose, onSaved }) {
  const library = useLibrary();
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Edit details" onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setSaving(true);
          const updated = await library.updatePlaylist(playlist, { name: name.trim(), description });
          setSaving(false);
          if (updated) {
            onSaved(updated);
            onClose();
          }
        }}
      >
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required autoFocus />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3} placeholder="Add an optional description" />
        </label>
        <button className="btn btn-light" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
