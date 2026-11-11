# Music App - Web

React + Vite frontend for an ad-free music streaming app, built for listeners and independent artists.

**No subscription tier, no ads, no skip limits.** Every listener gets on-demand playback, shuffle, repeat and unlimited skips.

## Features

- Three-panel layout: sidebar library, main view, persistent player bar (mobile: mini-player + bottom nav)
- Player: play/pause, next/previous, shuffle, repeat all/one, seek, volume and mute, queue with play next/add to queue/remove
- Lock-screen and headphone controls via the Media Session API, and keyboard shortcuts (Space, Shift+←/→)
- Home: greeting, quick picks, recently played, your playlists, new releases, popular, artists
- Search with live results (top result, songs, artists, playlists) and genre browsing
- Liked Songs, playlists (create, rename, describe, public/private, delete, add/remove songs, recommendations) and following artists
- Artist pages with popular tracks, follower count and bio
- **Artist Studio**: drag-and-drop upload with progress, cover art, stats (plays, likes, followers), edit/delete songs, edit profile

## Run it

Start the [backend](https://github.com/d3vxc/music-app-backend) first (port 3000), then:

```bash
npm install
npm run dev   # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend, so cookies just work. To point it somewhere else, set `VITE_API_TARGET=http://host:port`.

To rename the app, change `APP_NAME` in `src/config.js`, the `<title>` in `index.html`, and `public/logo.svg`.
