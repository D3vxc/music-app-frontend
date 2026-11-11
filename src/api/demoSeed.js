// Fictional artists and original, procedurally generated tracks for demo mode.
export const DEMO_ARTISTS = [
  { id: 'a-nova', displayName: 'Nova Waves', bio: 'Night-drive synthwave from a bedroom studio.' },
  { id: 'a-lumen', displayName: 'Lumen Fields', bio: 'Slow ambient textures for focus and rain.' },
  { id: 'a-kito', displayName: 'Kito Bloom', bio: 'Warm lo-fi loops and soft basslines.' },
  { id: 'a-rue', displayName: 'Rue Static', bio: 'Club-ready electronic with a pop heart.' },
];

const T = (id, title, artist, album, genre, synth, plays, daysAgo) => ({ id, title, artist, album, genre, synth, plays, daysAgo });

const RAW = [
  T('s1', 'Midnight Drive', 'a-nova', 'Neon Coast', 'synthwave', { seed: 11, bpm: 104, root: 45, mode: 'minor', progression: [0, 5, 3, 4], drums: 'four', lead: 'arp' }, 48210, 40),
  T('s2', 'Chrome Horizon', 'a-nova', 'Neon Coast', 'synthwave', { seed: 12, bpm: 110, root: 47, mode: 'minor', progression: [0, 3, 5, 4], drums: 'four', lead: 'arp' }, 31877, 38),
  T('s3', 'Afterglow Avenue', 'a-nova', 'Neon Coast', 'synthwave', { seed: 13, bpm: 98, root: 43, mode: 'major', progression: [0, 4, 5, 3], drums: 'four', lead: 'melody' }, 12054, 5),
  T('s4', 'Glass Rain', 'a-lumen', 'Quiet Weather', 'ambient', { seed: 21, bpm: 70, root: 50, mode: 'major', progression: [0, 3, 5, 3], drums: 'none', lead: 'melody', padLevel: 1.4 }, 22190, 60),
  T('s5', 'Low Tide Hours', 'a-lumen', 'Quiet Weather', 'ambient', { seed: 22, bpm: 64, root: 48, mode: 'minor', progression: [0, 5, 2, 6], drums: 'none', lead: 'arp', padLevel: 1.4 }, 9034, 2),
  T('s6', 'Paper Lanterns', 'a-kito', 'Sunday Tapes', 'lofi', { seed: 31, bpm: 82, root: 46, mode: 'major', progression: [1, 4, 0, 5], drums: 'half', lead: 'melody' }, 56301, 25),
  T('s7', 'Window Seat', 'a-kito', 'Sunday Tapes', 'lofi', { seed: 32, bpm: 78, root: 44, mode: 'minor', progression: [0, 3, 6, 4], drums: 'half', lead: 'arp' }, 27400, 20),
  T('s8', 'Tea Gone Cold', 'a-kito', 'Single', 'lofi', { seed: 33, bpm: 86, root: 49, mode: 'major', progression: [3, 4, 2, 5], drums: 'half', lead: 'melody' }, 4120, 1),
  T('s9', 'Pulse Check', 'a-rue', 'Static Hearts', 'electronic', { seed: 41, bpm: 124, root: 45, mode: 'minor', progression: [0, 0, 5, 6], drums: 'four', lead: 'arp' }, 61522, 15),
  T('s10', 'Velvet Signal', 'a-rue', 'Static Hearts', 'electronic', { seed: 42, bpm: 120, root: 48, mode: 'major', progression: [5, 3, 0, 4], drums: 'four', lead: 'melody' }, 18333, 9),
  T('s11', 'Static Hearts', 'a-rue', 'Static Hearts', 'electronic', { seed: 43, bpm: 126, root: 43, mode: 'minor', progression: [0, 5, 6, 4], drums: 'four', lead: 'arp' }, 40870, 3),
];

export function buildSeedSongs(now = Date.now()) {
  return RAW.map((r) => {
    const artist = DEMO_ARTISTS.find((a) => a.id === r.artist);
    const spec = { bars: 16, ...r.synth };
    const durationSec = Math.round(spec.bars * (60 / spec.bpm) * 4 + 2);
    return {
      id: r.id,
      title: r.title,
      artist: r.artist,
      artistName: artist.displayName,
      album: r.album,
      genre: r.genre,
      durationSec,
      audioUrl: `synth:${JSON.stringify(spec)}`,
      coverUrl: '',
      plays: r.plays,
      likes: Math.round(r.plays / 23),
      createdAt: new Date(now - r.daysAgo * 86400000).toISOString(),
    };
  });
}
