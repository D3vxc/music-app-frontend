import { HashRouter, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Artist from './pages/Artist';
import Studio from './pages/Studio';
import { Login, Register } from './pages/Auth';
import NotFound from './pages/NotFound';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';

// HashRouter so deep links work on GitHub Pages (no server-side rewrites there).
export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <LibraryProvider>
            <PlayerProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="search" element={<Search />} />
                  <Route path="library" element={<Library />} />
                  <Route path="playlist/:id" element={<Playlist />} />
                  <Route path="artist/:id" element={<Artist />} />
                  <Route path="studio" element={<Studio />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </PlayerProvider>
          </LibraryProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
