import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = process.env.VITE_API_TARGET || "http://localhost:3000";

// The dev server proxies the API and uploaded media, so the browser sees a single
// origin and the session cookie just works.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": API,
      "/uploads": API,
    },
  },
});
