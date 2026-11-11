import { describe, expect, it } from 'vitest';
import { encodeWav, renderTrack, trackLength, SAMPLE_RATE, mulberry32 } from './synth';

describe('synth', () => {
  const spec = { seed: 7, bpm: 120, bars: 4, root: 48, mode: 'minor' };

  it('renders the expected length, within [-1, 1]', () => {
    const s = renderTrack(spec);
    expect(s.length).toBe(Math.ceil(trackLength(spec) * SAMPLE_RATE));
    let peak = 0;
    for (const v of s) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeGreaterThan(0.3);
    expect(peak).toBeLessThanOrEqual(1);
  });

  it('is deterministic per seed', () => {
    expect(renderTrack(spec).slice(5000, 5100)).toEqual(renderTrack(spec).slice(5000, 5100));
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('writes a valid 16-bit mono WAV header', () => {
    const buf = encodeWav(new Float32Array([0, 1, -1]), 8000);
    const v = new DataView(buf);
    const str = (o) => String.fromCharCode(...new Uint8Array(buf, o, 4));
    expect(str(0)).toBe('RIFF');
    expect(str(8)).toBe('WAVE');
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(8000);
    expect(v.getUint32(40, true)).toBe(6);
    expect(v.getInt16(46, true)).toBe(32767);
    expect(v.getInt16(48, true)).toBe(-32768);
  });
});
