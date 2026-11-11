import { useEffect, useState } from 'react';
import { api } from '../api';
import { hashString } from '../lib/format';

// Generated artwork: a deterministic gradient + shapes per song, used when no cover is uploaded.
export function generatedCover(key, label = '') {
  const h = hashString(key);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + ((h >> 9) % 120)) % 360;
  const variant = (h >> 4) % 3;
  const shapes = [
    `<circle cx="70" cy="34" r="${18 + ((h >> 3) % 14)}" fill="hsla(${hue2},90%,75%,.55)"/><circle cx="28" cy="78" r="${10 + ((h >> 6) % 12)}" fill="hsla(${hue1},90%,85%,.35)"/>`,
    `<path d="M0 ${60 + ((h >> 5) % 20)} Q50 ${30 + ((h >> 7) % 30)} 100 ${55 + ((h >> 2) % 25)} V100 H0Z" fill="hsla(${hue2},85%,70%,.5)"/><path d="M0 85 Q50 65 100 82 V100 H0Z" fill="hsla(${hue1},80%,25%,.55)"/>`,
    Array.from({ length: 6 }, (_, i) => `<rect x="${12 + i * 13}" y="${70 - ((h >> i) % 45)}" width="7" height="${20 + ((h >> i) % 45)}" rx="3.5" fill="hsla(${hue2},90%,80%,.6)"/>`).join(''),
  ][variant];
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue1},70%,45%)"/><stop offset="1" stop-color="hsl(${hue2},75%,22%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/>${shapes}${initials ? `<text x="10" y="22" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="700" fill="rgba(255,255,255,.85)">${initials}</text>` : ''}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function Cover({ song, seed, label, className = '', size }) {
  const key = seed || song?.id || label || 'x';
  const fallback = generatedCover(key, label ?? song?.title ?? '');
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    let alive = true;
    const url = song?.coverUrl;
    if (!url) {
      setSrc(fallback);
      return undefined;
    }
    api.songs
      .resolveUrl(url)
      .then((u) => alive && setSrc(u || fallback))
      .catch(() => alive && setSrc(fallback));
    return () => {
      alive = false;
    };
  }, [song?.coverUrl, fallback]);

  return <img className={`cover ${className}`} src={src} alt="" width={size} height={size} loading="lazy" onError={() => setSrc(fallback)} />;
}

export function Mosaic({ songs = [], label, className = '' }) {
  if (songs.length < 4) return <Cover seed={`pl-${label}`} label={label} song={songs[0]} className={className} />;
  return (
    <div className={`mosaic ${className}`}>
      {songs.slice(0, 4).map((s) => (
        <Cover key={s.id} song={s} />
      ))}
    </div>
  );
}
