import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const LibraryCtx = createContext(null);

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [playlists, setPlaylists] = useState([]);
  const [version, setVersion] = useState(0); // bump to make pages refetch

  const refresh = useCallback(async () => {
    if (!user) {
      setLikedIds(new Set());
      setPlaylists([]);
      return;
    }
    const [liked, pls] = await Promise.all([api.songs.liked(), api.playlists.list()]);
    setLikedIds(new Set(liked.map((s) => s.id)));
    setPlaylists(pls);
  }, [user]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const requireLogin = useCallback(() => {
    if (user) return true;
    toast('Log in to build your library');
    navigate('/login');
    return false;
  }, [user, toast, navigate]);

  const toggleLike = useCallback(
    async (song) => {
      if (!requireLogin()) return;
      const wasLiked = likedIds.has(song.id);
      setLikedIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(song.id) : next.add(song.id);
        return next;
      });
      try {
        await api.songs.like(song.id);
        toast(wasLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs', 'success');
        setVersion((v) => v + 1);
      } catch (e) {
        toast(e.message, 'error');
        refresh();
      }
    },
    [likedIds, requireLogin, toast, refresh]
  );

  const createPlaylist = useCallback(
    async (name) => {
      if (!requireLogin()) return null;
      const p = await api.playlists.create({ name });
      setPlaylists((ps) => [p, ...ps]);
      return p;
    },
    [requireLogin]
  );

  const addToPlaylist = useCallback(
    async (playlistId, song) => {
      try {
        const p = await api.playlists.addSong(playlistId, song.id);
        setPlaylists((ps) => ps.map((x) => (x.id === p.id ? p : x)));
        toast(`Added to ${p.name}`, 'success');
        setVersion((v) => v + 1);
      } catch (e) {
        toast(e.message, 'error');
      }
    },
    [toast]
  );

  const value = useMemo(
    () => ({ likedIds, playlists, setPlaylists, toggleLike, createPlaylist, addToPlaylist, refresh, requireLogin, version, bump: () => setVersion((v) => v + 1) }),
    [likedIds, playlists, toggleLike, createPlaylist, addToPlaylist, refresh, requireLogin, version]
  );
  return <LibraryCtx.Provider value={value}>{children}</LibraryCtx.Provider>;
}

export const useLibrary = () => useContext(LibraryCtx);
