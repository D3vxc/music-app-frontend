import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import HomeRounded from "@mui/icons-material/HomeRounded";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import LibraryMusicRounded from "@mui/icons-material/LibraryMusicRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import MicExternalOnRounded from "@mui/icons-material/MicExternalOnRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import Logo from "./Logo";
import Cover, { PlaylistCover } from "./Cover";
import { useAuth } from "../context/AuthContext";
import { useLibrary } from "../context/LibraryContext";
import { usePlayer } from "../context/PlayerContext";

export default function Sidebar() {
  const { user, isArtist } = useAuth();
  const library = useLibrary();
  const player = usePlayer();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const playingFrom = (path) => player.isPlaying && player.source?.path === path;

  const createPlaylist = async () => {
    const pl = await library.createPlaylist();
    if (pl) navigate(`/playlist/${pl._id}`);
  };

  return (
    <aside className="sidebar">
      <nav className="panel nav-panel">
        <Logo />
        <NavLink to="/" end className="nav-link">
          {({ isActive }) => (
            <>
              {isActive ? <HomeRounded /> : <HomeOutlined />} Home
            </>
          )}
        </NavLink>
        <NavLink to="/search" className="nav-link">
          <SearchRounded /> Search
        </NavLink>
        {isArtist && (
          <NavLink to="/studio" className="nav-link">
            <MicExternalOnRounded /> Artist Studio
          </NavLink>
        )}
      </nav>

      <div className="panel library-panel">
        <div className="library-head">
          <NavLink to="/collection" className="nav-link">
            <LibraryMusicRounded /> Your Library
          </NavLink>
          <button className="icon-btn" onClick={createPlaylist} aria-label="Create playlist" title="Create playlist">
            <AddRounded />
          </button>
        </div>

        {!user ? (
          <div className="library-empty">
            <h3>Create your first playlist</h3>
            <p>It's easy, we'll help you.</p>
            <button className="btn btn-light btn-sm" onClick={createPlaylist}>
              Create playlist
            </button>
            <h3>Follow your favourite artists</h3>
            <p>Every song, every feature, no ads. Free.</p>
            <button className="btn btn-light btn-sm" onClick={() => navigate("/search")}>
              Browse artists
            </button>
          </div>
        ) : (
          <>
            <div className="chips">
              {["all", "playlists", "artists"].map((f) => (
                <button key={f} className={`chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <ul className="library-list">
              {filter !== "artists" && (
                <li>
                  <NavLink to="/collection/tracks" className="lib-item">
                    <Cover kind="liked" size={48} />
                    <span className="lib-text">
                      <span className="lib-name">Liked Songs</span>
                      <span className="lib-sub">Playlist • {library.likedIds.size} songs</span>
                    </span>
                    {playingFrom("/collection/tracks") && <VolumeUpRounded className="lib-playing" />}
                  </NavLink>
                </li>
              )}
              {filter !== "artists" &&
                library.playlists.map((pl) => (
                  <li key={pl._id}>
                    <NavLink to={`/playlist/${pl._id}`} className="lib-item">
                      <PlaylistCover playlist={pl} size={48} />
                      <span className="lib-text">
                        <span className="lib-name">{pl.name}</span>
                        <span className="lib-sub">Playlist • {user.name}</span>
                      </span>
                      {playingFrom(`/playlist/${pl._id}`) && <VolumeUpRounded className="lib-playing" />}
                    </NavLink>
                  </li>
                ))}
              {filter !== "playlists" &&
                library.follows.map((a) => (
                  <li key={a._id}>
                    <NavLink to={`/artist/${a._id}`} className="lib-item">
                      <Cover src={a.imageUrl} seed={a._id} kind="artist" round size={48} />
                      <span className="lib-text">
                        <span className="lib-name">{a.name}</span>
                        <span className="lib-sub">Artist</span>
                      </span>
                      {playingFrom(`/artist/${a._id}`) && <VolumeUpRounded className="lib-playing" />}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
