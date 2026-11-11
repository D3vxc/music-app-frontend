// Demo backend: same interface as the live API, stored in localStorage/IndexedDB.
// Lets the app run fully on static hosting (GitHub Pages) with no server.
import { ApiError } from './errors';
import { buildSeedSongs, DEMO_ARTISTS } from './demoSeed';
import { synthUrl } from '../lib/synth';
import { idb } from '../lib/idb';

const KEY = 'pulse-demo-v1';
const SORTS = {
  new: (a, b) => b.createdAt.localeCompare(a.createdAt),
  popular: (a, b) => b.plays - a.plays || b.likes - a.likes,
  title: (a, b) => a.title.localeCompare(b.title),
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const clone = (x) => JSON.parse(JSON.stringify(x));
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export function createDemoApi(storage = globalThis.localStorage) {
  const load = () => {
    try {
      const raw = storage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through to a fresh store */
    }
    return { users: [], songs: buildSeedSongs(), playlists: [], session: null };
  };
  let db = load();
  const save = () => {
    try {
      storage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage full or blocked; keep in memory */
    }
  };

  async function hash(password) {
    const data = new TextEncoder().encode(`pulse-demo:${password}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const publicUser = (u) => {
    if (!u) return null;
    const { passHash, ...rest } = u;
    return clone(rest);
  };
  const me = () => db.users.find((u) => u.id === db.session) || null;
  const requireUser = () => {
    const u = me();
    if (!u) throw new ApiError('Please log in first', 401);
    return u;
  };
  const findSong = (id) => {
    const s = db.songs.find((x) => x.id === id);
    if (!s) throw new ApiError('Song not found', 404);
    return s;
  };
  const findOwnPlaylist = (id) => {
    const user = requireUser();
    const p = db.playlists.find((x) => x.id === id);
    if (!p || p.owner !== user.id) throw new ApiError('Playlist not found', 404);
    return p;
  };

  return {
    mode: 'demo',

    auth: {
      async register({ displayName, username, email, password, role = 'listener' }) {
        await delay();
        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();
        if (db.users.some((u) => u.username === username || u.email === email)) {
          throw new ApiError('That username or email is already taken', 409);
        }
        const user = { id: uid(), displayName: displayName.trim(), username, email, role, bio: '', likedSongs: [], passHash: await hash(password), createdAt: new Date().toISOString() };
        db.users.push(user);
        db.session = user.id;
        save();
        return publicUser(user);
      },
      async login({ identifier, password }) {
        await delay();
        const id = identifier.trim().toLowerCase();
        const user = db.users.find((u) => u.username === id || u.email === id);
        if (!user || user.passHash !== (await hash(password))) throw new ApiError('Incorrect username/email or password', 401);
        db.session = user.id;
        save();
        return publicUser(user);
      },
      async me() {
        return publicUser(me());
      },
      logout() {
        db.session = null;
        save();
      },
    },

    songs: {
      async list({ q = '', genre = '', artist = '', sort = 'new', limit = 50 } = {}) {
        await delay(60);
        const needle = q.trim().toLowerCase();
        let items = db.songs.filter((s) => {
          if (genre && s.genre !== genre) return false;
          if (artist && s.artist !== artist) return false;
          if (!needle) return true;
          return [s.title, s.artistName, s.album, s.genre].some((f) => f?.toLowerCase().includes(needle));
        });
        items = items.sort(SORTS[sort] || SORTS.new);
        return { items: clone(items.slice(0, limit)), total: items.length };
      },
      async genres() {
        return [...new Set(db.songs.map((s) => s.genre))].sort();
      },
      async get(id) {
        const song = findSong(id);
        return { song: clone(song), liked: Boolean(me()?.likedSongs.includes(id)) };
      },
      async liked() {
        const user = requireUser();
        return user.likedSongs.map((id) => db.songs.find((s) => s.id === id)).filter(Boolean).map(clone);
      },
      async create({ title, album = '', genre = 'other', durationSec = 0, audio, cover }) {
        const user = requireUser();
        if (user.role !== 'artist') throw new ApiError('Only artists can upload', 403);
        if (!audio) throw new ApiError('An audio file is required', 400);
        await delay(300);
        const id = uid();
        await idb.set(`audio:${id}`, audio);
        let coverUrl = '';
        if (cover) {
          await idb.set(`cover:${id}`, cover);
          coverUrl = `idb:cover:${id}`;
        }
        const song = {
          id,
          title: title.trim(),
          artist: user.id,
          artistName: user.displayName,
          album: album.trim(),
          genre: (genre || 'other').trim().toLowerCase(),
          durationSec: Math.round(durationSec) || 0,
          audioUrl: `idb:audio:${id}`,
          coverUrl,
          plays: 0,
          likes: 0,
          createdAt: new Date().toISOString(),
        };
        db.songs.push(song);
        save();
        return clone(song);
      },
      async update(id, data) {
        const user = requireUser();
        const song = findSong(id);
        if (song.artist !== user.id) throw new ApiError('You can only edit your own songs', 403);
        Object.assign(song, data);
        save();
        return clone(song);
      },
      async remove(id) {
        const user = requireUser();
        const song = findSong(id);
        if (song.artist !== user.id) throw new ApiError('You can only delete your own songs', 403);
        db.songs = db.songs.filter((s) => s.id !== id);
        db.users.forEach((u) => (u.likedSongs = u.likedSongs.filter((x) => x !== id)));
        db.playlists.forEach((p) => (p.songs = p.songs.filter((x) => x !== id)));
        save();
        await Promise.all([idb.del(`audio:${id}`), idb.del(`cover:${id}`)]).catch(() => {});
      },
      async play(id) {
        const song = db.songs.find((s) => s.id === id);
        if (song) {
          song.plays += 1;
          save();
        }
      },
      async like(id) {
        const user = requireUser();
        const song = findSong(id);
        const has = user.likedSongs.includes(id);
        user.likedSongs = has ? user.likedSongs.filter((x) => x !== id) : [id, ...user.likedSongs];
        song.likes = Math.max(0, song.likes + (has ? -1 : 1));
        save();
        return !has;
      },
      async resolveUrl(url) {
        if (!url) return '';
        if (url.startsWith('synth:')) return synthUrl(JSON.parse(url.slice(6)));
        if (url.startsWith('idb:')) {
          const blob = await idb.get(url.slice(4));
          if (!blob) throw new ApiError('This upload is no longer available on this device', 404);
          return URL.createObjectURL(blob);
        }
        return url;
      },
    },

    artists: {
      async get(id) {
        const seeded = DEMO_ARTISTS.find((a) => a.id === id);
        if (seeded) return clone(seeded);
        const u = db.users.find((x) => x.id === id && x.role === 'artist');
        if (!u) throw new ApiError('Artist not found', 404);
        return { id: u.id, displayName: u.displayName, bio: u.bio };
      },
    },

    playlists: {
      async list() {
        const user = requireUser();
        return clone(db.playlists.filter((p) => p.owner === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      },
      async create({ name, description = '' }) {
        const user = requireUser();
        const now = new Date().toISOString();
        const p = { id: uid(), name: name.trim(), description, owner: user.id, songs: [], isPublic: false, createdAt: now, updatedAt: now };
        db.playlists.push(p);
        save();
        return clone(p);
      },
      async get(id) {
        const p = findOwnPlaylist(id);
        return { ...clone(p), songs: p.songs.map((sid) => db.songs.find((s) => s.id === sid)).filter(Boolean).map(clone) };
      },
      async update(id, data) {
        const p = findOwnPlaylist(id);
        Object.assign(p, data, { updatedAt: new Date().toISOString() });
        save();
        return clone(p);
      },
      async remove(id) {
        findOwnPlaylist(id);
        db.playlists = db.playlists.filter((p) => p.id !== id);
        save();
      },
      async addSong(id, songId) {
        const p = findOwnPlaylist(id);
        findSong(songId);
        if (!p.songs.includes(songId)) p.songs.push(songId);
        p.updatedAt = new Date().toISOString();
        save();
        return clone(p);
      },
      async removeSong(id, songId) {
        const p = findOwnPlaylist(id);
        p.songs = p.songs.filter((s) => s !== songId);
        p.updatedAt = new Date().toISOString();
        save();
        return clone(p);
      },
    },

    reset() {
      db = { users: [], songs: buildSeedSongs(), playlists: [], session: null };
      save();
    },
  };
}
