import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MicExternalOnRounded from "@mui/icons-material/MicExternalOnRounded";
import LibraryMusicRounded from "@mui/icons-material/LibraryMusicRounded";
import Menu from "./Menu";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function TopBar({ solid }) {
  const { user, isArtist, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [anchor, setAnchor] = useState(null);

  const items = [
    ...(isArtist ? [{ label: "Artist Studio", icon: <MicExternalOnRounded />, onClick: () => navigate("/studio") }] : []),
    { label: "Your Library", icon: <LibraryMusicRounded />, onClick: () => navigate("/collection") },
    { divider: true },
    {
      label: "Log out",
      icon: <LogoutRounded />,
      onClick: async () => {
        await logout();
        toast("Logged out");
        navigate("/");
      },
    },
  ];

  return (
    <header className={`topbar ${solid ? "solid" : ""}`}>
      <div className="history">
        <button className="round-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeftRounded />
        </button>
        <button className="round-btn" onClick={() => navigate(1)} aria-label="Go forward">
          <ChevronRightRounded />
        </button>
      </div>
      <div className="topbar-right">
        {user ? (
          <button className="avatar-btn" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" title={user.name}>
            {user.imageUrl ? <img src={user.imageUrl} alt="" /> : <span>{user.name?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <>
            <Link className="btn btn-text" to="/register">
              Sign up
            </Link>
            <Link className="btn btn-light" to="/login">
              Log in
            </Link>
          </>
        )}
      </div>
      {anchor && <Menu anchor={anchor} items={items} onClose={() => setAnchor(null)} />}
    </header>
  );
}
