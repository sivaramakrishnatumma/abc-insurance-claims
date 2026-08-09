import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves under a subpath; Render static sites serve at root.
  base: process.env.VITE_BASE_PATH ?? '/abc-insurance-claims/',
  plugins: [react()],
  server: {
    // Proxy API calls to the Express BFF so the browser talks to one origin.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
