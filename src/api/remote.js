// Live backend client for the Pulse API (music-app-backend).
import { ApiError } from './errors';

const TOKEN_KEY = 'pulse-token';

export function createRemoteApi(baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const getToken = () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  };
  const setToken = (t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  };

  async function request(path, { method = 'GET', body, form } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    let res;
    try {
      res = await fetch(`${base}/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
    } catch {
      throw new ApiError('Cannot reach the server. Is the API running?', 0);
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token && path !== '/auth/login') setToken(null);
      const detail = data.details?.[0];
      throw new ApiError(detail ? `${detail.field}: ${detail.message}` : data.error || 'Request failed', res.status, data.details);
    }
    return data;
  }

  const qs = (params) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, v));
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  return {
    mode: 'live',
    auth: {
      async register(data) {
        const r = await request('/auth/register', { method: 'POST', body: data });
        setToken(r.token);
        return r.user;
      },
      async login(data) {
        const r = await request('/auth/login', { method: 'POST', body: data });
        setToken(r.token);
        return r.user;
      },
      async me() {
        if (!getToken()) return null;
        try {
          return (await request('/auth/me')).user;
        } catch (e) {
          if (e.status === 401) return null;
          throw e;
        }
      },
      logout() {
        setToken(null);
      },
    },
    songs: {
      list: ({ q, genre, artist, sort, limit = 50 } = {}) => request(`/songs${qs({ q, genre, artist, sort, limit })}`),
      genres: async () => (await request('/songs/genres')).genres,
      get: (id) => request(`/songs/${id}`),
      liked: async () => (await request('/songs/liked')).items,
      async create({ title, album, genre, durationSec, audio, cover }) {
        const form = new FormData();
        form.set('title', title);
        if (album) form.set('album', album);
        if (genre) form.set('genre', genre);
        if (durationSec) form.set('durationSec', String(Math.round(durationSec)));
        form.set('audio', audio);
        if (cover) form.set('cover', cover);
        return (await request('/songs', { method: 'POST', form })).song;
      },
      update: async (id, data) => (await request(`/songs/${id}`, { method: 'PATCH', body: data })).song,
      remove: (id) => request(`/songs/${id}`, { method: 'DELETE' }),
      play: (id) => request(`/songs/${id}/play`, { method: 'POST' }).catch(() => {}),
      like: async (id) => (await request(`/songs/${id}/like`, { method: 'POST' })).liked,
      resolveUrl: async (url) => url,
    },
    artists: {
      async get(id) {
        const { items } = await request(`/songs${qs({ artist: id, limit: 1 })}`);
        if (!items.length) throw new ApiError('Artist not found', 404);
        return { id, displayName: items[0].artistName, bio: '' };
      },
    },
    playlists: {
      list: async () => (await request('/playlists')).items,
      create: async (data) => (await request('/playlists', { method: 'POST', body: data })).playlist,
      get: async (id) => (await request(`/playlists/${id}`)).playlist,
      update: async (id, data) => (await request(`/playlists/${id}`, { method: 'PATCH', body: data })).playlist,
      remove: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
      addSong: async (id, songId) => (await request(`/playlists/${id}/songs`, { method: 'POST', body: { songId } })).playlist,
      removeSong: async (id, songId) => (await request(`/playlists/${id}/songs/${songId}`, { method: 'DELETE' })).playlist,
    },
  };
}
