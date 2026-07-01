import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the project under /DOITpreview/ in production.
  base: mode === 'production' ? '/DOITpreview/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '::',
    port: 8080,
  },
}));
