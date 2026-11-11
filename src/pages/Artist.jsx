import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { formatCount } from "../utils/format";

export default function Artist() {
  const { id } = useParams();
  const { data, error, loading, reload } = useFetch(`/artists/${id}`);
  const player = usePlayer();
  const library = useLibrary();
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { artist, songs, followers, totalPlays } = data;
  const source = { label: artist.name, path: `/artist/${artist._id}` };
  const playing = player.source?.path === source.path && player.isPlaying;
  const following = library.isFollowing(artist._id);
  const isMe = user?.id === artist._id;
  // `data.following` is the state when the count was fetched; adjust so the number updates live.
  const followerCount = followers - (data.following ? 1 : 0) + (following ? 1 : 0);

  const albums = [...new Set(songs.map((s) => s.album).filter(Boolean))];

  return (
    <div>
      <PageHeader
        seed={artist._id}
        type="Artist"
        title={artist.name}
        art={<Cover src={artist.imageUrl} seed={artist._id} kind="artist" round />}
      >
        <span>{formatCount(totalPlays)} plays</span>
        <span>{formatCount(followerCount)} followers</span>
      </PageHeader>

      <div className="action-bar">
        {songs.length > 0 && (
          <PlayButton playing={playing} onClick={() => (player.source?.path === source.path ? player.togglePlay() : player.playSongs(songs, 0, source))} />
        )}
        {songs.length > 1 && (
          <button
            className={`icon-btn big toggle ${player.shuffle ? "on" : ""}`}
            onClick={player.toggleShuffle}
            aria-label="Toggle shuffle"
          >
            <ShuffleRounded />
          </button>
        )}
        {isMe ? (
          <Link className="btn btn-outline" to="/studio">
            Open Studio
          </Link>
        ) : (
          <button className="btn btn-outline" onClick={() => library.toggleFollow(artist)}>
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {songs.length ? (
        <section>
          <h2 className="section-title">Popular</h2>
          <TrackList songs={showAll ? songs : songs.slice(0, 5)} source={source} showAlbum={false} showPlays hideArtist />
          {songs.length > 5 && (
            <button className="btn btn-text show-more" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show less" : "See more"}
            </button>
          )}
        </section>
      ) : (
        <Empty title="No songs yet">
          <p className="muted">{isMe ? "Upload your first track from the Studio." : "Check back soon."}</p>
        </Empty>
      )}

      {albums.length > 0 && (
        <section>
          <h2 className="section-title">Releases</h2>
          <div className="chips">
            {albums.map((a) => (
              <span className="chip" key={a}>
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {artist.bio && (
        <section className="about">
          <h2 className="section-title">About</h2>
          <div className="about-card" style={artist.imageUrl ? { backgroundImage: `linear-gradient(transparent, #000c), url(${artist.imageUrl})` } : undefined}>
            <strong>{formatCount(totalPlays)} plays</strong>
            <p>{artist.bio}</p>
          </div>
        </section>
      )}
    </div>
  );
}
