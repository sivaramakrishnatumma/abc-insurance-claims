import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/abc-insurance-claims/',
  plugins: [react()],
  server: {
    // Proxy API calls to the Express BFF so the browser talks to one origin.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
