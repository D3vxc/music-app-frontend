import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LibraryProvider } from "./context/LibraryContext";
import { PlayerProvider } from "./context/PlayerContext";
import Layout from "./components/Layout";
import { Loading } from "./components/Status";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Artist from "./pages/Artist";
import Playlist from "./pages/Playlist";
import LikedSongs from "./pages/LikedSongs";
import Library from "./pages/Library";
import Queue from "./pages/Queue";
import Track from "./pages/Track";
import Studio from "./pages/Studio";
import NotFound from "./pages/NotFound";
import { Login, Register } from "./pages/Auth";

// Providers live inside the router so they can navigate (e.g. "log in to save songs").
function Root() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LibraryProvider>
          <PlayerProvider>
            <Outlet />
          </PlayerProvider>
        </LibraryProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/search", element: <Search /> },
          { path: "/artist/:id", element: <Artist /> },
          { path: "/playlist/:id", element: <Playlist /> },
          { path: "/track/:id", element: <Track /> },
          { path: "/queue", element: <Queue /> },
          { path: "/collection", element: <RequireAuth><Library /></RequireAuth> },
          { path: "/collection/tracks", element: <RequireAuth><LikedSongs /></RequireAuth> },
          { path: "/studio", element: <Studio /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
