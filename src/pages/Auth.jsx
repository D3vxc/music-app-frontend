import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Headphones, Mic2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(v) {
  const e = {};
  if (!v.displayName.trim()) e.displayName = 'Tell us your name';
  if (!/^[a-z0-9_.]{3,30}$/i.test(v.username)) e.username = '3–30 letters, numbers, _ or .';
  if (!EMAIL.test(v.email)) e.email = 'Enter a valid email';
  if (v.password.length < 8) e.password = 'At least 8 characters';
  return e;
}

function Field({ label, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} aria-invalid={Boolean(error)} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [v, setV] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(v);
      toast(`Welcome back, ${u.displayName}`, 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="brand"><Logo size={36} /></Link>
        <h1>Log in to Pulse</h1>
        <Field label="Username or email" autoComplete="username" value={v.identifier} onChange={(e) => setV({ ...v, identifier: e.target.value })} required />
        <Field label="Password" type="password" autoComplete="current-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} required />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted center">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [v, setV] = useState({ displayName: '', username: '', email: '', password: '', role: params.get('role') === 'artist' ? 'artist' : 'listener' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateRegister(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError('');
    try {
      const u = await register(v);
      toast(`Welcome to Pulse, ${u.displayName}`, 'success');
      navigate(u.role === 'artist' ? '/studio' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Link to="/" className="brand"><Logo size={36} /></Link>
        <h1>Create your account</h1>
        <div className="role-pick" role="radiogroup" aria-label="Account type">
          {[
            { id: 'listener', icon: Headphones, title: 'Listener', text: 'Like songs, build playlists' },
            { id: 'artist', icon: Mic2, title: 'Artist', text: 'Upload and share your music' },
          ].map(({ id, icon: Icon, title, text }) => (
            <button type="button" role="radio" aria-checked={v.role === id} key={id} className={`role ${v.role === id ? 'is-on' : ''}`} onClick={() => setV({ ...v, role: id })}>
              <Icon size={22} />
              <strong>{title}</strong>
              <span className="muted small">{text}</span>
            </button>
          ))}
        </div>
        <Field label={v.role === 'artist' ? 'Artist name' : 'Your name'} value={v.displayName} onChange={set('displayName')} error={errors.displayName} autoComplete="name" />
        <Field label="Username" value={v.username} onChange={set('username')} error={errors.username} autoComplete="username" />
        <Field label="Email" type="email" value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Field label="Password" type="password" value={v.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        {api.mode === 'demo' && <p className="muted tiny center">Demo mode: your account is stored only in this browser.</p>}
        <p className="muted center">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
