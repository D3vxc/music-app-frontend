import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Music2, Upload, ImagePlus } from 'lucide-react';
import TrackList from '../components/TrackList';
import { api } from '../api';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { formatTime } from '../lib/format';

const MAX_MB = 25;

function readDuration(file) {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      resolve(Number.isFinite(a.duration) ? a.duration : 0);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => resolve(0);
    a.src = url;
  });
}

export default function Studio() {
  const { user } = useAuth();
  const { version, bump } = useLibrary();
  const toast = useToast();
  const [form, setForm] = useState({ title: '', album: '', genre: '' });
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [duration, setDuration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const audioInput = useRef(null);
  const mine = useAsync(() => (user ? api.songs.list({ artist: user.id, sort: 'new' }) : Promise.resolve({ items: [] })), [user?.id, version]);

  if (!user || user.role !== 'artist') {
    return (
      <div className="page center-page">
        <Music2 size={40} />
        <h1>Artist Studio</h1>
        <p className="muted">Upload and manage your music. You need an artist account for this.</p>
        <Link to="/register?role=artist" className="btn btn-primary">Create an artist account</Link>
      </div>
    );
  }

  const pickAudio = async (file) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('audio/')) return setError('Please choose an audio file (MP3, WAV, OGG, M4A, FLAC).');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Audio must be under ${MAX_MB} MB.`);
    setAudio(file);
    setDuration(await readDuration(file));
    if (!form.title) setForm((f) => ({ ...f, title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!audio) return setError('Choose an audio file first.');
    if (!form.title.trim()) return setError('Give your song a title.');
    setBusy(true);
    try {
      const song = await api.songs.create({ ...form, durationSec: duration, audio, cover });
      toast(`"${song.title}" is live`, 'success');
      setForm({ title: '', album: '', genre: '' });
      setAudio(null);
      setCover(null);
      setDuration(0);
      bump();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (song) => {
    if (!window.confirm(`Delete "${song.title}" permanently?`)) return;
    try {
      await api.songs.remove(song.id);
      toast('Song deleted');
      bump();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Artist Studio</h1>
        <p className="muted">Publishing as <strong>{user.displayName}</strong></p>
      </header>

      <form className="panel upload" onSubmit={submit}>
        <div
          className={`dropzone ${audio ? 'has-file' : ''}`}
          onClick={() => audioInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickAudio(e.dataTransfer.files[0]); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && audioInput.current?.click()}
        >
          <Upload size={28} />
          {audio ? (
            <div><strong>{audio.name}</strong><div className="muted small">{(audio.size / 1048576).toFixed(1)} MB · {formatTime(duration)}</div></div>
          ) : (
            <div><strong>Drop an audio file</strong><div className="muted small">or click to browse · up to {MAX_MB} MB</div></div>
          )}
          <input ref={audioInput} type="file" accept="audio/*" hidden onChange={(e) => pickAudio(e.target.files[0])} />
        </div>

        <div className="form-grid">
          <label className="field"><span>Title *</span><input value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label className="field"><span>Album</span><input value={form.album} maxLength={120} onChange={(e) => setForm({ ...form, album: e.target.value })} placeholder="Single" /></label>
          <label className="field"><span>Genre</span><input value={form.genre} maxLength={40} list="genres" onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="e.g. lofi" /></label>
          <datalist id="genres">{['ambient', 'electronic', 'hip hop', 'indie', 'jazz', 'lofi', 'pop', 'rock', 'synthwave'].map((g) => <option key={g} value={g} />)}</datalist>
          <label className="field">
            <span>Cover art</span>
            <span className="file-btn"><ImagePlus size={16} /> {cover ? cover.name : 'Choose image'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setCover(e.target.files[0] || null)} />
            </span>
          </label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Publish song'}</button>
      </form>

      <section>
        <div className="section-head"><h2>Your releases</h2></div>
        {mine.data && <TrackList songs={mine.data.items} showAlbum={false} onRemove={remove} emptyText="No releases yet. Your first upload will show up here." />}
      </section>
    </div>
  );
}
