// Procedural music generator: renders a short original track from a seed and
// returns it as a WAV. Used for the demo catalogue so the app works with no
// backend and no third-party audio.

export const SAMPLE_RATE = 22050;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const TAU = Math.PI * 2;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const tri = (phase) => (2 / Math.PI) * Math.asin(Math.sin(phase));

function scaleNote(root, scale, degree) {
  const oct = Math.floor(degree / 7);
  const idx = ((degree % 7) + 7) % 7;
  return root + scale[idx] + 12 * oct;
}

export function trackLength(spec) {
  const bar = (60 / spec.bpm) * 4;
  return spec.bars * bar + 2;
}

export function renderTrack(spec) {
  const {
    seed = 1,
    bpm = 96,
    root = 48,
    mode = 'minor',
    bars = 16,
    progression = [0, 5, 3, 4],
    drums = 'four',
    lead = 'arp',
    padLevel = 1,
  } = spec;
  const rng = mulberry32(seed);
  const scale = SCALES[mode] || SCALES.minor;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const total = trackLength(spec);
  const n = Math.ceil(total * SAMPLE_RATE);
  const out = new Float32Array(n);

  const note = (start, dur, release, fn) => {
    const s0 = Math.max(0, Math.floor(start * SAMPLE_RATE));
    const s1 = Math.min(n, Math.ceil((start + dur + release) * SAMPLE_RATE));
    for (let i = s0; i < s1; i++) {
      const t = i / SAMPLE_RATE - start;
      out[i] += fn(t, t < dur ? 1 : Math.max(0, 1 - (t - dur) / release));
    }
  };

  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const degree = progression[b % progression.length];
    const chord = [0, 2, 4].map((k) => scaleNote(root + 12, scale, degree + k));

    // pad
    for (const m of chord) {
      const f = hz(m);
      const detune = 1.003;
      note(t0, bar, 0.6, (t, rel) => {
        const atk = Math.min(1, t / 0.35);
        const v = Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2 * detune * t) + 0.2 * tri(TAU * f * 0.5 * t);
        return 0.045 * padLevel * atk * rel * v;
      });
    }

    // bass
    const bassF = hz(scaleNote(root - 12, scale, degree));
    const bassHits = drums === 'none' ? [0] : [0, 1.5, 2, 3.5];
    for (const h of bassHits) {
      note(t0 + h * beat, beat * 0.9, 0.08, (t, rel) => {
        const env = Math.exp(-t * 2.2) * rel;
        return 0.22 * env * Math.tanh(1.8 * Math.sin(TAU * bassF * t));
      });
    }

    // lead / arpeggio, enters after the intro
    if (b >= 2 && lead !== 'none') {
      const steps = lead === 'arp' ? 8 : 4;
      for (let s = 0; s < steps; s++) {
        if (rng() < (lead === 'arp' ? 0.18 : 0.35)) continue;
        const pick = lead === 'arp' ? chord[s % 3] + (s >= 4 ? 12 : 0) : scaleNote(root + 24, scale, degree + Math.floor(rng() * 5));
        const f = hz(pick + 12);
        const len = bar / steps;
        note(t0 + s * len, len * 0.6, 0.15, (t, rel) => {
          const env = Math.exp(-t * (lead === 'arp' ? 7 : 3.5)) * rel;
          return 0.07 * env * (tri(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2 * t));
        });
      }
    }

    // drums: in from bar 2, out for the last 2 bars
    if (drums !== 'none' && b >= 2 && b < bars - 2) {
      const kicks = drums === 'four' ? [0, 1, 2, 3] : [0, 2.5];
      for (const k of kicks) {
        note(t0 + k * beat, 0.35, 0.01, (t) => {
          const f = 45 + 90 * Math.exp(-t * 28);
          return 0.5 * Math.exp(-t * 9) * Math.sin(TAU * f * t);
        });
      }
      for (const sn of [1, 3]) {
        note(t0 + sn * beat, 0.18, 0.01, (t) => 0.13 * Math.exp(-t * 22) * ((rng() * 2 - 1) + 0.5 * Math.sin(TAU * 190 * t)));
      }
      let prev = 0;
      for (let h = 0; h < 8; h++) {
        const accent = h % 2 ? 0.035 : 0.055;
        note(t0 + h * (beat / 2), 0.05, 0.005, (t) => {
          const w = rng() * 2 - 1;
          const hp = w - prev;
          prev = w;
          return accent * Math.exp(-t * 60) * hp;
        });
      }
    }
  }

  // master: fades, normalise, soft clip
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? 0.9 / peak : 1;
  const fadeIn = 0.4 * SAMPLE_RATE;
  const fadeOut = 3 * SAMPLE_RATE;
  for (let i = 0; i < n; i++) {
    let g = gain;
    if (i < fadeIn) g *= i / fadeIn;
    if (i > n - fadeOut) g *= (n - i) / fadeOut;
    out[i] = Math.tanh(out[i] * g * 1.1) * 0.95;
  }
  return out;
}

export function encodeWav(samples, sampleRate = SAMPLE_RATE) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (off, s) => [...s].forEach((c, i) => view.setUint8(off + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

const urlCache = new Map();
export function synthUrl(spec) {
  const key = JSON.stringify(spec);
  if (!urlCache.has(key)) {
    const blob = new Blob([encodeWav(renderTrack(spec))], { type: 'audio/wav' });
    urlCache.set(key, URL.createObjectURL(blob));
  }
  return urlCache.get(key);
}
