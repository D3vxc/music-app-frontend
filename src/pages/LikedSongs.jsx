import { useEffect } from "react";
import { Link } from "react-router-dom";
import ShuffleRounded from "@mui/icons-material/ShuffleRounded";
import PageHeader from "../components/PageHeader";
import Cover from "../components/Cover";
import PlayButton from "../components/PlayButton";
import TrackList from "../components/TrackList";
import { Loading, ErrorState, Empty } from "../components/Status";
import useFetch from "../utils/useFetch";
import { usePlayer } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { useAuth } from "../context/AuthContext";

export default function LikedSongs() {
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useFetch("/me/likes");
  const player = usePlayer();
  const { likedIds } = useLibrary();

  // Drop songs that get un-liked while on this page; refetch when something new is liked.
  useEffect(() => {
    if (!data) return;
    const known = new Set(data.map((s) => s._id));
    if ([...likedIds].some((id) => !known.has(id))) reload();
    else if (data.some((s) => !likedIds.has(s._id))) setData(data.filter((s) => likedIds.has(s._id)));
  }, [likedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const songs = data || [];
  const source = { label: "Liked Songs", path: "/collection/tracks" };
  const playing = player.source?.path === source.path && player.isPlaying;

  return (
    <div>
      <PageHeader title="Liked Songs" type="Playlist" color="#5b3fb0" art={<Cover kind="liked" />}>
        <strong>{user.name}</strong>
        <span>
          {songs.length} song{songs.length === 1 ? "" : "s"}
        </span>
      </PageHeader>
      <div className="action-bar">
        {songs.length > 0 && (
          <PlayButton playing={playing} onClick={() => (player.source?.path === source.path ? player.togglePlay() : player.playSongs(songs, 0, source))} />
        )}
        {songs.length > 1 && (
          <button className={`icon-btn big toggle ${player.shuffle ? "on" : ""}`} onClick={player.toggleShuffle} aria-label="Toggle shuffle">
            <ShuffleRounded />
          </button>
        )}
      </div>
      {songs.length ? (
        <TrackList songs={songs} source={source} showAdded />
      ) : (
        <Empty title="Songs you like will appear here">
          <p className="muted">Save songs by tapping the heart icon.</p>
          <Link className="btn btn-light" to="/search">
            Find songs
          </Link>
        </Empty>
      )}
    </div>
  );
}
