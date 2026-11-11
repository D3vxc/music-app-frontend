import { NavLink } from "react-router-dom";
import HomeRounded from "@mui/icons-material/HomeRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import LibraryMusicRounded from "@mui/icons-material/LibraryMusicRounded";
import MicExternalOnRounded from "@mui/icons-material/MicExternalOnRounded";
import { useAuth } from "../context/AuthContext";

export default function MobileNav() {
  const { isArtist } = useAuth();
  return (
    <nav className="mobile-nav">
      <NavLink to="/" end>
        <HomeRounded />
        Home
      </NavLink>
      <NavLink to="/search">
        <SearchRounded />
        Search
      </NavLink>
      <NavLink to="/collection">
        <LibraryMusicRounded />
        Library
      </NavLink>
      {isArtist && (
        <NavLink to="/studio">
          <MicExternalOnRounded />
          Studio
        </NavLink>
      )}
    </nav>
  );
}
