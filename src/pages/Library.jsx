import { useNavigate } from "react-router-dom";
import AddRounded from "@mui/icons-material/AddRounded";
import Shelf, { ArtistCard, PlaylistCard } from "../components/Shelf";
import Cover from "../components/Cover";
import { Empty } from "../components/Status";
import { useLibrary } from "../context/LibraryContext";
import { Link } from "react-router-dom";

export default function Library() {
  const library = useLibrary();
  const navigate = useNavigate();
  return (
    <div>
      <div className="browse-head">
        <h1>Your Library</h1>
        <button
          className="btn btn-outline btn-sm"
          onClick={async () => {
            const pl = await library.createPlaylist();
            if (pl) navigate(`/playlist/${pl._id}`);
          }}
        >
          <AddRounded fontSize="small" /> New playlist
        </button>
      </div>
      <Shelf title="Playlists">
        {[
          <Link key="liked" className="card liked-card" to="/collection/tracks">
            <div className="card-art">
              <Cover kind="liked" />
            </div>
            <div className="card-title">Liked Songs</div>
            <div className="card-sub">{library.likedIds.size} liked songs</div>
          </Link>,
          ...library.playlists.map((pl) => <PlaylistCard key={pl._id} playlist={pl} />),
        ]}
      </Shelf>
      {library.follows.length ? (
        <Shelf title="Artists you follow">
          {library.follows.map((a) => (
            <ArtistCard key={a._id} artist={a} />
          ))}
        </Shelf>
      ) : (
        <Empty title="Follow artists you love">
          <p className="muted">They'll show up here.</p>
        </Empty>
      )}
    </div>
  );
}
