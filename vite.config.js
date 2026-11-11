import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' makes the build work from any sub-path (e.g. GitHub Pages /music-app-frontend/).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
