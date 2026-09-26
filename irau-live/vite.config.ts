import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `base: './'` keeps the build portable: it works from any static host path
// (Netlify, Vercel, S3, a USB stick on the venue laptop) because routing is hash-based.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      // When `npm run serve` is running, `npm run dev` can use the realtime sync server too.
      '/api': 'http://localhost:8787',
    },
  },
});
