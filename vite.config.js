import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site work from any GitHub Pages sub-path
// (e.g. https://<user>.github.io/my-bookshelf/) without extra configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
});
