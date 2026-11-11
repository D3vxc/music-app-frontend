# Pulse

A music streaming web app: browse and search a catalogue, play with a full queue, like songs, build playlists, and publish your own tracks as an artist.

**Live demo:** https://d3vxc.github.io/music-app-frontend/
**API:** [music-app-backend](https://github.com/D3vxc/music-app-backend)

## Features

- Persistent player: queue, shuffle, repeat (all/one), seek, volume, "play next", keyboard shortcuts (Space, ←/→ seek, Shift+←/→ skip), lock-screen media controls
- Search across titles, artists, albums and genres, with genre filters and sorting
- Liked Songs and playlists (create, rename, delete, add/remove tracks)
- Artist Studio: drag-and-drop audio upload with cover art, duration detection, and release management
- Listener and artist accounts
- Responsive layout with a mobile tab bar and mini-player; accessible labels and focus states

## Two modes

| Mode | When | Data |
| --- | --- | --- |
| **Demo** | `VITE_API_URL` not set (default, and what GitHub Pages serves) | Stored in the browser (localStorage + IndexedDB). The catalogue is original music **generated in the browser** by a small synth engine (`src/lib/synth.js`), so there are no licensing issues and no server. |
| **Live** | `VITE_API_URL=https://your-api` | Real accounts, uploads and playlists via the Pulse API. |

## Develop

```bash
npm install
npm run dev        # http://localhost:5173 (demo mode)
npm test           # unit tests (Vitest)
npm run build      # production build in dist/
```

For live mode, run the backend, then put `VITE_API_URL=http://localhost:3000` in `.env.local`.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` tests and builds every push, and deploys `main` to Pages.

1. Repo **Settings → Pages → Source: GitHub Actions** (one-time).
2. Push or merge to `main`.
3. Optional: set the repository variable `VITE_API_URL` (Settings → Secrets and variables → Actions → Variables) to switch the deployed site to live mode.

## Stack

React 18, React Router 7, Vite 7, Vitest, lucide-react icons. No UI framework; hand-written CSS.
