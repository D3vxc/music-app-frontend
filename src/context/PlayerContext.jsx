import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import api from "../api";
import { shuffled, songArtistName } from "../utils/format";

/*
 * The whole player lives here: one <audio> element, a queue, shuffle/repeat,
 * play counting and OS media controls. No ads, no skip limits, no "premium only"
 * features: every listener gets full on-demand playback.
 */

const PlayerContext = createContext(null);
const ProgressContext = createContext({ currentTime: 0, duration: 0 });

const RECENT_KEY = "recentlyPlayed";
const VOLUME_KEY = "volume";

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) - fine to ignore
  }
}

const initialState = {
  queue: [],
  original: [], // un-shuffled order, so turning shuffle off restores it
  index: -1,
  shuffle: false,
  repeat: "off", // "off" | "all" | "one"
  loadToken: 0, // bumps whenever the current track should (re)load and start
  source: null, // e.g. { label: "Liked Songs", path: "/collection/tracks" }
};

function shuffleAround(list, current) {
  const rest = list.filter((s) => s !== current);
  return current ? [current, ...shuffled(rest)] : shuffled(rest);
}

function reducer(state, action) {
  switch (action.type) {
    case "PLAY_LIST": {
      const { songs, index, source } = action;
      const current = songs[index];
      const queue = state.shuffle ? shuffleAround(songs, current) : songs;
      return {
        ...state,
        queue,
        original: songs,
        index: state.shuffle ? 0 : index,
        source,
        loadToken: state.loadToken + 1,
      };
    }
    case "JUMP":
      return { ...state, index: action.index, loadToken: state.loadToken + 1 };
    case "NEXT": {
      if (!state.queue.length) return state;
      if (state.index < state.queue.length - 1) {
        return { ...state, index: state.index + 1, loadToken: state.loadToken + 1 };
      }
      if (state.repeat === "all" || !action.auto) {
        return { ...state, index: 0, loadToken: state.loadToken + 1 };
      }
      return state; // reached the end with repeat off - the caller stops playback
    }
    case "PREV": {
      if (!state.queue.length) return state;
      const index = state.index > 0 ? state.index - 1 : state.repeat === "all" ? state.queue.length - 1 : 0;
      return { ...state, index, loadToken: state.loadToken + 1 };
    }
    case "TOGGLE_SHUFFLE": {
      const current = state.queue[state.index];
      if (state.shuffle) {
        const index = Math.max(0, state.original.indexOf(current));
        return { ...state, shuffle: false, queue: state.original, index };
      }
      return { ...state, shuffle: true, queue: shuffleAround(state.queue, current), index: current ? 0 : -1 };
    }
    case "CYCLE_REPEAT": {
      const next = { off: "all", all: "one", one: "off" }[state.repeat];
      return { ...state, repeat: next };
    }
    case "PLAY_NEXT": {
      if (!state.queue.length) return reducer(state, { type: "PLAY_LIST", songs: [action.song], index: 0 });
      const queue = [...state.queue];
      queue.splice(state.index + 1, 0, action.song);
      return { ...state, queue, original: [...state.original, action.song] };
    }
    case "ADD_TO_QUEUE": {
      if (!state.queue.length) return reducer(state, { type: "PLAY_LIST", songs: [action.song], index: 0 });
      return { ...state, queue: [...state.queue, action.song], original: [...state.original, action.song] };
    }
    case "REMOVE_FROM_QUEUE": {
      if (action.index === state.index) return state;
      const removed = state.queue[action.index];
      const queue = state.queue.filter((_, i) => i !== action.index);
      return {
        ...state,
        queue,
        original: state.original.filter((s) => s !== removed),
        index: action.index < state.index ? state.index - 1 : state.index,
      };
    }
    case "SONG_UPDATED": {
      const swap = (list) => list.map((s) => (s._id === action.song._id ? { ...s, ...action.song } : s));
      return { ...state, queue: swap(state.queue), original: swap(state.original) };
    }
    default:
      return state;
  }
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
  }
  const audio = audioRef.current;

  const [state, dispatch] = useReducer(reducer, initialState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [volume, setVolumeState] = useState(() => readStorage(VOLUME_KEY, 0.8));
  const [muted, setMuted] = useState(false);
  const [recent, setRecent] = useState(() => readStorage(RECENT_KEY, []));

  const current = state.queue[state.index] || null;
  const stateRef = useRef(state);
  stateRef.current = state;
  const countedRef = useRef(false);

  // Load + play whenever loadToken changes.
  useEffect(() => {
    if (!audio || !current) return;
    countedRef.current = false;
    if (!audio.src.endsWith(current.audioUrl)) audio.src = current.audioUrl;
    audio.currentTime = 0;
    audio.play().catch(() => setIsPlaying(false));

    setRecent((prev) => {
      const next = [current, ...prev.filter((s) => s._id !== current._id)].slice(0, 20);
      writeStorage(RECENT_KEY, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loadToken]);

  useEffect(() => {
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [audio, volume, muted]);

  // Wire up <audio> events once.
  useEffect(() => {
    if (!audio) return undefined;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onTime = () => {
      const { currentTime, duration } = audio;
      setProgress({ currentTime, duration: Number.isFinite(duration) ? duration : 0 });
      // Count a play after 30s (or half of a very short track), once per load.
      const song = stateRef.current.queue[stateRef.current.index];
      const threshold = Math.min(30, (Number.isFinite(duration) ? duration : 60) / 2);
      if (song && !countedRef.current && currentTime >= threshold) {
        countedRef.current = true;
        api.post(`/songs/${song._id}/play`).catch(() => {});
      }
    };
    const onEnded = () => {
      const s = stateRef.current;
      if (s.repeat === "one") {
        countedRef.current = false;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (s.index >= s.queue.length - 1 && s.repeat !== "all") {
        audio.currentTime = 0;
        setIsPlaying(false);
      } else {
        dispatch({ type: "NEXT", auto: true });
      }
    };
    const onError = () => {
      setBuffering(false);
      setIsPlaying(false);
    };
    const events = {
      play: onPlay,
      pause: onPause,
      waiting: onWaiting,
      playing: onPlaying,
      timeupdate: onTime,
      durationchange: onTime,
      loadedmetadata: onTime,
      ended: onEnded,
      error: onError,
    };
    Object.entries(events).forEach(([e, fn]) => audio.addEventListener(e, fn));
    return () => Object.entries(events).forEach(([e, fn]) => audio.removeEventListener(e, fn));
  }, [audio]);

  const togglePlay = useCallback(() => {
    if (!audio || !current) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [audio, current]);

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);

  const prev = useCallback(() => {
    // Like every player: "previous" restarts the song if you're more than 3s in.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    dispatch({ type: "PREV" });
  }, [audio]);

  const seek = useCallback(
    (time) => {
      if (!audio || !Number.isFinite(time)) return;
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || time));
      setProgress((p) => ({ ...p, currentTime: audio.currentTime }));
    },
    [audio],
  );

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    setMuted(false);
    writeStorage(VOLUME_KEY, clamped);
  }, []);

  /**
   * Play a list of songs starting at `index`. If that exact song is already
   * the current track, toggles pause instead (so the big play button doubles as pause).
   */
  const playSongs = useCallback(
    (songs, index = 0, source = null) => {
      if (!songs?.length) return;
      const target = songs[index];
      const playingSame =
        current && target && current._id === target._id && (!source || state.source?.path === source.path);
      if (playingSame) {
        togglePlay();
        return;
      }
      dispatch({ type: "PLAY_LIST", songs, index, source });
    },
    [current, state.source, togglePlay],
  );

  // OS / lock-screen / headphone controls.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    const artwork = current.coverUrl
      ? [{ src: new URL(current.coverUrl, window.location.href).href, sizes: "512x512" }]
      : [];
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: current.title,
      artist: songArtistName(current),
      album: current.album || "",
      artwork,
    });
    const handlers = {
      play: () => audio.play(),
      pause: () => audio.pause(),
      previoustrack: prev,
      nexttrack: next,
      seekto: (d) => seek(d.seekTime),
    };
    Object.entries(handlers).forEach(([a, fn]) => {
      try {
        navigator.mediaSession.setActionHandler(a, fn);
      } catch {
        // unsupported action
      }
    });
  }, [current, audio, prev, next, seek]);

  // Space = play/pause (unless typing), Shift+arrows = prev/next.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || e.target.isContentEditable) return;
      if (e.code === "Space" && !e.repeat && tag !== "BUTTON") {
        e.preventDefault();
        togglePlay();
      } else if (e.shiftKey && e.key === "ArrowRight") next();
      else if (e.shiftKey && e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, prev]);

  useEffect(() => {
    document.title = current ? `${current.title} • ${songArtistName(current)}` : document.title;
  }, [current]);

  const value = useMemo(
    () => ({
      current,
      queue: state.queue,
      index: state.index,
      source: state.source,
      shuffle: state.shuffle,
      repeat: state.repeat,
      isPlaying,
      buffering,
      volume,
      muted,
      recent,
      playSongs,
      togglePlay,
      next,
      prev,
      seek,
      setVolume,
      toggleMute: () => setMuted((m) => !m),
      toggleShuffle: () => dispatch({ type: "TOGGLE_SHUFFLE" }),
      cycleRepeat: () => dispatch({ type: "CYCLE_REPEAT" }),
      jumpTo: (index) => dispatch({ type: "JUMP", index }),
      playNext: (song) => dispatch({ type: "PLAY_NEXT", song }),
      addToQueue: (song) => dispatch({ type: "ADD_TO_QUEUE", song }),
      removeFromQueue: (index) => dispatch({ type: "REMOVE_FROM_QUEUE", index }),
      songUpdated: (song) => dispatch({ type: "SONG_UPDATED", song }),
      isCurrent: (song, source) =>
        !!current && current._id === song?._id && (!source || state.source?.path === source.path),
    }),
    [state, current, isPlaying, buffering, volume, muted, recent, playSongs, togglePlay, next, prev, seek, setVolume],
  );

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
export const useProgress = () => useContext(ProgressContext);
