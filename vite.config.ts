import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // Root by default (Render); GitHub Pages sets VITE_BASE_PATH to its subpath.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  // Allow Render's *.onrender.com host when serving the build via `vite preview`.
  preview: {
    allowedHosts: true,
  },
  server: {
    // Proxy API calls to the Express BFF so the browser talks to one origin.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
