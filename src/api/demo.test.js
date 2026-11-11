import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoApi } from './demo';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('demo api', () => {
  let api;
  beforeEach(() => {
    api = createDemoApi(memoryStorage());
  });

  it('seeds a catalogue with genres', async () => {
    const { items, total } = await api.songs.list();
    expect(total).toBeGreaterThan(5);
    expect(items[0].audioUrl.startsWith('synth:')).toBe(true);
    expect(await api.songs.genres()).toContain('lofi');
  });

  it('searches across title, artist and genre and sorts by plays', async () => {
    expect((await api.songs.list({ q: 'nova' })).items.every((s) => s.artistName === 'Nova Waves')).toBe(true);
    expect((await api.songs.list({ genre: 'ambient' })).total).toBe(2);
    const pop = (await api.songs.list({ sort: 'popular' })).items;
    expect(pop[0].plays).toBeGreaterThanOrEqual(pop[1].plays);
  });

  it('registers, rejects duplicates, and logs in with hashed password', async () => {
    const u = await api.auth.register({ displayName: 'Ana', username: 'Ana', email: 'ana@x.io', password: 'password123' });
    expect(u.passHash).toBeUndefined();
    expect(u.username).toBe('ana');
    await expect(api.auth.register({ displayName: 'B', username: 'ana', email: 'b@x.io', password: 'password123' })).rejects.toThrow(/taken/);
    api.auth.logout();
    expect(await api.auth.me()).toBeNull();
    await expect(api.auth.login({ identifier: 'ana', password: 'nope' })).rejects.toThrow(/Incorrect/);
    expect((await api.auth.login({ identifier: 'ANA@x.io', password: 'password123' })).displayName).toBe('Ana');
  });

  it('likes and playlists require login and work once logged in', async () => {
    await expect(api.songs.like('s1')).rejects.toThrow(/log in/i);
    await api.auth.register({ displayName: 'Ana', username: 'ana', email: 'ana@x.io', password: 'password123' });
    expect(await api.songs.like('s1')).toBe(true);
    expect((await api.songs.liked()).map((s) => s.id)).toEqual(['s1']);
    expect(await api.songs.like('s1')).toBe(false);
    const p = await api.playlists.create({ name: 'Mix' });
    await api.playlists.addSong(p.id, 's2');
    await api.playlists.addSong(p.id, 's2');
    expect((await api.playlists.get(p.id)).songs.map((s) => s.id)).toEqual(['s2']);
  });

  it('only artists can upload', async () => {
    await api.auth.register({ displayName: 'Ana', username: 'ana', email: 'ana@x.io', password: 'password123' });
    await expect(api.songs.create({ title: 'x', audio: new Blob(['x']) })).rejects.toThrow(/artists/);
  });
});
