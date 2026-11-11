import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Cover from "../components/Cover";
import PlayButton from "../components/PlayButton";
import TrackList from "../components/TrackList";
import { Loading, ErrorState } from "../components/Status";
import useFetch from "../utils/useFetch";
import { usePlayer } from "../context/PlayerContext";
import { formatTime, formatCount, songArtistName } from "../utils/format";

/** Landing page for shared song links. */
export default function Track() {
  const { id } = useParams();
  const { data: song, error, loading, reload } = useFetch(`/songs/${id}`);
  const player = usePlayer();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const source = { label: song.title, path: `/track/${song._id}` };
  const playing = player.isCurrent(song) && player.isPlaying;
  return (
    <div>
      <PageHeader seed={song._id} type="Song" title={song.title} art={<Cover src={song.coverUrl} seed={song._id} />}>
        <strong>{songArtistName(song)}</strong>
        {song.album && <span>{song.album}</span>}
        <span>{formatTime(song.duration)}</span>
        <span>{formatCount(song.plays)} plays</span>
      </PageHeader>
      <div className="action-bar">
        <PlayButton playing={playing} onClick={() => player.playSongs([song], 0, source)} />
      </div>
      <TrackList songs={[song]} source={source} />
    </div>
  );
}
