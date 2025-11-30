import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // Serve data folder as static assets via public directory
  // Copy data folder to public/data for it to be accessible
  publicDir: 'public'
});

