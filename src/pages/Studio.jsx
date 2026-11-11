import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import ImageRounded from "@mui/icons-material/ImageRounded";
import Cover from "../components/Cover";
import Modal from "../components/Modal";
import { Loading, ErrorState } from "../components/Status";
import useFetch from "../utils/useFetch";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePlayer } from "../context/PlayerContext";
import { songSchema } from "../validation";
import { formatCount, formatDate, formatTime } from "../utils/format";

const MAX_AUDIO_MB = 50;
const MAX_IMAGE_MB = 5;

function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      resolve(Number.isFinite(a.duration) ? a.duration : 0);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(url);
    };
    a.src = url;
  });
}

export default function Studio() {
  const { user, isArtist, loading: authLoading } = useAuth();
  const stats = useFetch(isArtist ? "/artists/me/stats" : null);
  const [editing, setEditing] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: "/studio" }} />;
  if (!isArtist) {
    return (
      <div className="status">
        <h2>Artist Studio is for artist accounts</h2>
        <p className="muted">Log out and create an artist account to upload music.</p>
      </div>
    );
  }
  if (stats.loading && !stats.data) return <Loading />;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;

  const { songs, totalPlays, totalLikes, followers } = stats.data;

  return (
    <div className="studio">
      <div className="studio-head">
        <Cover src={user.imageUrl} seed={user.id} kind="artist" round size={96} />
        <div>
          <span className="header-type">Artist Studio</span>
          <h1>{user.name}</h1>
          <div className="studio-links">
            <Link to={`/artist/${user.id}`}>View public profile</Link>
            <button className="btn-link" onClick={() => setProfileOpen(true)}>
              Edit profile
            </button>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Total plays" value={totalPlays} />
        <Stat label="Followers" value={followers} />
        <Stat label="Likes" value={totalLikes} />
        <Stat label="Songs" value={songs.length} />
      </div>

      <UploadForm onUploaded={stats.reload} />

      <section>
        <h2 className="section-title">Your songs</h2>
        {songs.length ? (
          <SongTable songs={songs} onEdit={setEditing} onChanged={stats.reload} />
        ) : (
          <p className="muted">Nothing uploaded yet. Your first track is one upload away.</p>
        )}
      </section>

      {editing && <EditSong song={editing} onClose={() => setEditing(null)} onSaved={stats.reload} />}
      {profileOpen && <EditProfile onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{formatCount(value)}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function FilePick({ label, accept, file, onChange, icon, hint }) {
  const ref = useRef();
  return (
    <div
      className={`file-pick ${file ? "has-file" : ""}`}
      onClick={() => ref.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onChange(f);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && ref.current.click()}
    >
      {icon}
      <div>
        <strong>{file ? file.name : label}</strong>
        <small className="muted">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : hint}</small>
      </div>
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
    </div>
  );
}

function UploadForm({ onUploaded }) {
  const toast = useToast();
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, setValue, formState } = useForm({ resolver: zodResolver(songSchema) });

  const pickAudio = (file) => {
    setError("");
    if (!file.type.startsWith("audio/")) return setError("That doesn't look like an audio file");
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) return setError(`Audio must be ${MAX_AUDIO_MB} MB or smaller`);
    setAudio(file);
    // Pre-fill the title from the filename.
    setValue("title", file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(), { shouldValidate: true });
  };

  const pickCover = (file) => {
    setError("");
    if (!file.type.startsWith("image/")) return setError("Cover art must be an image");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`Cover art must be ${MAX_IMAGE_MB} MB or smaller`);
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = handleSubmit(async (fields) => {
    if (!audio) return setError("Choose an audio file first");
    setError("");
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => v && form.append(k, v));
    form.append("duration", String(await readDuration(audio)));
    form.append("audio", audio);
    if (cover) form.append("cover", cover);
    try {
      setProgress(0);
      await api.post("/songs", form, {
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      toast(`"${fields.title}" is live`);
      reset();
      setAudio(null);
      setCover(null);
      setCoverPreview("");
      onUploaded();
    } catch (e) {
      setError(errorMessage(e, "Upload failed"));
    } finally {
      setProgress(null);
    }
  });

  return (
    <section className="upload-card">
      <h2 className="section-title">Upload a song</h2>
      <form className="upload-form" onSubmit={onSubmit} noValidate>
        <div className="upload-files">
          <FilePick
            label="Choose or drop an audio file"
            hint={`MP3, WAV, FLAC, OGG, M4A · up to ${MAX_AUDIO_MB} MB`}
            accept="audio/*"
            file={audio}
            onChange={pickAudio}
            icon={<CloudUploadRounded />}
          />
          <FilePick
            label="Cover art (optional)"
            hint={`Square JPG/PNG/WebP · up to ${MAX_IMAGE_MB} MB`}
            accept="image/jpeg,image/png,image/webp,image/gif"
            file={cover}
            onChange={pickCover}
            icon={coverPreview ? <img src={coverPreview} alt="" className="cover-preview" /> : <ImageRounded />}
          />
        </div>
        <div className="upload-fields">
          <label className={`field ${formState.errors.title ? "has-error" : ""}`}>
            <span>Title</span>
            <input {...register("title")} />
            {formState.errors.title && <small className="field-error">{formState.errors.title.message}</small>}
          </label>
          <label className="field">
            <span>Album / release (optional)</span>
            <input {...register("album")} placeholder="Leave empty for a single" />
          </label>
          <label className="field">
            <span>Genre (optional)</span>
            <input {...register("genre")} placeholder="e.g. hip hop, indie, house" list="genre-list" />
            <datalist id="genre-list">
              {["pop", "hip hop", "rap", "r&b", "rock", "indie", "electronic", "house", "drill", "grime", "afrobeats", "jazz", "classical", "lo-fi"].map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </label>
          {error && <div className="form-alert">{error}</div>}
          {progress !== null && (
            <div className="progress" aria-label="Upload progress">
              <div style={{ width: `${progress}%` }} />
            </div>
          )}
          <button className="btn btn-accent" disabled={progress !== null}>
            {progress !== null ? `Uploading… ${progress}%` : "Publish song"}
          </button>
          <p className="muted small">Only upload music you own or have the rights to distribute.</p>
        </div>
      </form>
    </section>
  );
}

function SongTable({ songs, onEdit, onChanged }) {
  const player = usePlayer();
  const toast = useToast();
  const source = { label: "Your uploads", path: "/studio" };
  return (
    <div className="studio-table">
      <div className="studio-row head">
        <span>Song</span>
        <span>Plays</span>
        <span>Likes</span>
        <span>Uploaded</span>
        <span />
      </div>
      {songs.map((s, i) => (
        <div className="studio-row" key={s._id}>
          <span className="studio-song">
            <button className="cover-play" onClick={() => player.playSongs(songs, i, source)} aria-label={`Play ${s.title}`}>
              <Cover src={s.coverUrl} seed={s._id} size={40} />
              <PlayArrowRounded />
            </button>
            <span className="title-text">
              <span className="track-name">{s.title}</span>
              <span className="track-artist">
                {[s.album, s.genre, formatTime(s.duration)].filter(Boolean).join(" · ")}
              </span>
            </span>
          </span>
          <span>{formatCount(s.plays)}</span>
          <span>{formatCount(s.likes)}</span>
          <span className="muted">{formatDate(s.createdAt)}</span>
          <span className="row-actions">
            <button className="icon-btn" onClick={() => onEdit(s)} aria-label="Edit">
              <EditRounded fontSize="small" />
            </button>
            <button
              className="icon-btn danger"
              aria-label="Delete"
              onClick={async () => {
                if (!window.confirm(`Delete "${s.title}"? Listeners will lose it from their playlists.`)) return;
                try {
                  await api.delete(`/songs/${s._id}`);
                  toast("Song deleted");
                  onChanged();
                } catch (e) {
                  toast(errorMessage(e));
                }
              }}
            >
              <DeleteOutlineRounded fontSize="small" />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

function EditSong({ song, onClose, onSaved }) {
  const toast = useToast();
  const player = usePlayer();
  const [cover, setCover] = useState(null);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(songSchema),
    defaultValues: { title: song.title, album: song.album, genre: song.genre },
  });
  const onSubmit = handleSubmit(async (fields) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v ?? ""));
    if (cover) form.append("cover", cover);
    try {
      const res = await api.patch(`/songs/${song._id}`, form);
      player.songUpdated(res.data);
      toast("Saved");
      onSaved();
      onClose();
    } catch (e) {
      toast(errorMessage(e));
    }
  });
  return (
    <Modal title="Edit song" onClose={onClose}>
      <form className="form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Title</span>
          <input {...register("title")} />
          {formState.errors.title && <small className="field-error">{formState.errors.title.message}</small>}
        </label>
        <label className="field">
          <span>Album</span>
          <input {...register("album")} />
        </label>
        <label className="field">
          <span>Genre</span>
          <input {...register("genre")} />
        </label>
        <label className="field">
          <span>Replace cover art</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setCover(e.target.files?.[0] || null)} />
        </label>
        <button className="btn btn-light" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}

function EditProfile({ onClose }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData();
          form.append("name", name.trim());
          form.append("bio", bio);
          if (image) form.append("image", image);
          setSaving(true);
          try {
            const res = await api.patch("/artists/me", form);
            setUser(res.data);
            toast("Profile updated");
            onClose();
          } catch (err) {
            toast(errorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="field">
          <span>Artist name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={1000} />
        </label>
        <label className="field">
          <span>Profile picture</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        </label>
        <button className="btn btn-light" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
