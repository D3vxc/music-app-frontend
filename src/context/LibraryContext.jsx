import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [playlists, setPlaylists] = useState([]);
  const [follows, setFollows] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setLikedIds(new Set());
      setPlaylists([]);
      setFollows([]);
      return;
    }
    const [likes, lists, artists] = await Promise.all([
      api.get("/me/likes/ids"),
      api.get("/playlists"),
      api.get("/me/follows"),
    ]);
    setLikedIds(new Set(likes.data));
    setPlaylists(lists.data);
    setFollows(artists.data);
  }, [user]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const requireLogin = useCallback(
    (what) => {
      if (user) return true;
      toast(`Log in to ${what}`);
      navigate("/login");
      return false;
    },
    [user, toast, navigate],
  );

  const toggleLike = useCallback(
    async (song) => {
      if (!requireLogin("save songs")) return;
      const liked = likedIds.has(song._id);
      setLikedIds((prev) => {
        const next = new Set(prev);
        liked ? next.delete(song._id) : next.add(song._id);
        return next;
      });
      try {
        await (liked ? api.delete(`/me/likes/${song._id}`) : api.put(`/me/likes/${song._id}`));
        toast(liked ? "Removed from Liked Songs" : "Added to Liked Songs");
      } catch (e) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          liked ? next.add(song._id) : next.delete(song._id);
          return next;
        });
        toast(errorMessage(e));
      }
    },
    [likedIds, requireLogin, toast],
  );

  const upsertPlaylist = (pl) =>
    setPlaylists((prev) => [pl, ...prev.filter((p) => p._id !== pl._id)]);

  const createPlaylist = useCallback(
    async (fields = {}) => {
      if (!requireLogin("create playlists")) return null;
      try {
        const res = await api.post("/playlists", fields);
        upsertPlaylist(res.data);
        toast(`Created "${res.data.name}"`);
        return res.data;
      } catch (e) {
        toast(errorMessage(e));
        return null;
      }
    },
    [requireLogin, toast],
  );

  const addToPlaylist = useCallback(
    async (playlist, song) => {
      try {
        const res = await api.post(`/playlists/${playlist._id}/songs`, { songId: song._id });
        upsertPlaylist(res.data);
        toast(`Added to "${playlist.name}"`);
        return res.data;
      } catch (e) {
        toast(errorMessage(e));
        return null;
      }
    },
    [toast],
  );

  const removeFromPlaylist = useCallback(
    async (playlist, song) => {
      try {
        const res = await api.delete(`/playlists/${playlist._id}/songs/${song._id}`);
        upsertPlaylist(res.data);
        toast(`Removed from "${playlist.name}"`);
        return res.data;
      } catch (e) {
        toast(errorMessage(e));
        return null;
      }
    },
    [toast],
  );

  const updatePlaylist = useCallback(
    async (playlist, fields) => {
      try {
        const res = await api.patch(`/playlists/${playlist._id}`, fields);
        upsertPlaylist(res.data);
        return res.data;
      } catch (e) {
        toast(errorMessage(e));
        return null;
      }
    },
    [toast],
  );

  const deletePlaylist = useCallback(
    async (playlist) => {
      try {
        await api.delete(`/playlists/${playlist._id}`);
        setPlaylists((prev) => prev.filter((p) => p._id !== playlist._id));
        toast(`Deleted "${playlist.name}"`);
        return true;
      } catch (e) {
        toast(errorMessage(e));
        return false;
      }
    },
    [toast],
  );

  const followedIds = useMemo(() => new Set(follows.map((a) => a._id)), [follows]);

  const toggleFollow = useCallback(
    async (artist) => {
      if (!requireLogin("follow artists")) return;
      const following = followedIds.has(artist._id);
      try {
        if (following) {
          await api.delete(`/me/follows/${artist._id}`);
          setFollows((prev) => prev.filter((a) => a._id !== artist._id));
        } else {
          await api.put(`/me/follows/${artist._id}`);
          setFollows((prev) => [{ _id: artist._id, name: artist.name, imageUrl: artist.imageUrl }, ...prev]);
        }
      } catch (e) {
        toast(errorMessage(e));
      }
    },
    [followedIds, requireLogin, toast],
  );

  const value = {
    likedIds,
    isLiked: (id) => likedIds.has(id),
    toggleLike,
    playlists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    updatePlaylist,
    deletePlaylist,
    follows,
    isFollowing: (id) => followedIds.has(id),
    toggleFollow,
    refresh,
  };
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export const useLibrary = () => useContext(LibraryContext);
