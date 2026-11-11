import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useToast } from './ToastContext';

const PlayerCtx = createContext(null);
const VOL_KEY = 'pulse-volume';

function shuffled(list, keepFirst) {
  const rest = list.filter((s) => s.id !== keepFirst?.id);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return keepFirst ? [keepFirst, ...rest] : rest;
}

export function PlayerProvider({ children }) {
  const toast = useToast();
  const audioRef = useRef(null);
  if (!audioRef.current && typeof Audio !== 'undefined') audioRef.current = new Audio();
  const [baseQueue, setBaseQueue] = useState([]);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // off | all | one
  const [volume, setVolumeState] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(VOL_KEY));
      return Number.isFinite(v) ? v : 0.8;
    } catch {
      return 0.8;
    }
  });
  const current = queue[index] || null;
  const loadToken = useRef(0);

  // keep latest state for event handlers
  const stateRef = useRef({});
  stateRef.current = { queue, index, repeat };

  const audio = audioRef.current;

  useEffect(() => {
    if (audio) audio.volume = volume;
    try {
      localStorage.setItem(VOL_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [audio, volume]);

  // load a new track whenever the current song changes
  useEffect(() => {
    if (!audio || !current) return;
    const token = ++loadToken.current;
    setLoading(true);
    setTime(0);
    setDuration(current.durationSec || 0);
    (async () => {
      try {
        const src = await api.songs.resolveUrl(current.audioUrl);
        if (token !== loadToken.current) return;
        audio.src = src;
        await audio.play();
        api.songs.play(current.id);
      } catch (e) {
        if (token !== loadToken.current) return;
        if (e.name !== 'AbortError') toast(e.name === 'NotAllowedError' ? 'Press play to start' : e.message || 'Could not play this track', 'error');
      } finally {
        if (token === loadToken.current) setLoading(false);
      }
    })();
  }, [audio, current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback((auto = false) => {
    const { queue: q, index: i, repeat: r } = stateRef.current;
    if (!q.length) return;
    if (i < q.length - 1) setIndex(i + 1);
    else if (r === 'all' || !auto) setIndex(0);
    else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [audio]);

  const prev = useCallback(() => {
    const { queue: q, index: i } = stateRef.current;
    if (!q.length) return;
    if (audio.currentTime > 3) audio.currentTime = 0;
    else setIndex(i > 0 ? i - 1 : q.length - 1);
  }, [audio]);

  useEffect(() => {
    if (!audio) return;
    const on = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      timeupdate: () => setTime(audio.currentTime),
      loadedmetadata: () => Number.isFinite(audio.duration) && setDuration(audio.duration),
      ended: () => {
        if (stateRef.current.repeat === 'one') {
          audio.currentTime = 0;
          audio.play();
        } else next(true);
      },
      error: () => setLoading(false),
    };
    Object.entries(on).forEach(([e, fn]) => audio.addEventListener(e, fn));
    return () => Object.entries(on).forEach(([e, fn]) => audio.removeEventListener(e, fn));
  }, [audio, next]);

  const toggle = useCallback(() => {
    if (!audio || !current) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [audio, current]);

  const playQueue = useCallback(
    (songs, startIndex = 0) => {
      if (!songs?.length) return;
      const start = songs[startIndex];
      if (current && start.id === current.id) {
        toggle();
        return;
      }
      setBaseQueue(songs);
      const q = shuffle ? shuffled(songs, start) : songs;
      setQueue(q);
      setIndex(q.findIndex((s) => s.id === start.id));
    },
    [current, shuffle, toggle]
  );

  const addToQueue = useCallback(
    (song) => {
      if (!queue.length) return playQueue([song]);
      setQueue((q) => [...q.slice(0, index + 1), song, ...q.slice(index + 1).filter((s) => s.id !== song.id)]);
      setBaseQueue((q) => [...q, song]);
      toast(`"${song.title}" plays next`, 'success');
    },
    [queue.length, index, playQueue, toast]
  );

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const on = !s;
      if (current) {
        const q = on ? shuffled(baseQueue, current) : baseQueue;
        setQueue(q);
        setIndex(Math.max(0, q.findIndex((x) => x.id === current.id)));
      }
      return on;
    });
  }, [baseQueue, current]);

  const cycleRepeat = useCallback(() => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')), []);
  const seek = useCallback((t) => {
    if (audio && Number.isFinite(t)) {
      audio.currentTime = t;
      setTime(t);
    }
  }, [audio]);
  const setVolume = useCallback((v) => setVolumeState(Math.min(1, Math.max(0, v))), []);
  const jumpTo = useCallback((i) => setIndex(i), []);

  // OS media controls / lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({ title: current.title, artist: current.artistName, album: current.album || 'Pulse' });
    const handlers = { play: toggle, pause: toggle, nexttrack: () => next(), previoustrack: prev };
    Object.entries(handlers).forEach(([a, h]) => {
      try {
        navigator.mediaSession.setActionHandler(a, h);
      } catch {
        /* unsupported action */
      }
    });
  }, [current, toggle, next, prev]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag) || e.target.isContentEditable) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight' && e.shiftKey) next();
      else if (e.code === 'ArrowLeft' && e.shiftKey) prev();
      else if (e.code === 'ArrowRight') seek(Math.min(audio.duration || 0, audio.currentTime + 5));
      else if (e.code === 'ArrowLeft') seek(Math.max(0, audio.currentTime - 5));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, next, prev, seek, audio]);

  const value = useMemo(
    () => ({ current, queue, index, isPlaying, loading, time, duration, volume, shuffle, repeat, playQueue, toggle, next: () => next(), prev, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, jumpTo }),
    [current, queue, index, isPlaying, loading, time, duration, volume, shuffle, repeat, playQueue, toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, jumpTo]
  );
  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export const usePlayer = () => useContext(PlayerCtx);
