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
  publicDir: 'public',
  build: {
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/**/*'],
    testTimeout: 30000,
    pool: 'threads'
  }
});

