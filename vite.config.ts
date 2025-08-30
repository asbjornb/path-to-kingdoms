import { defineConfig } from 'vite';

export default defineConfig({
  base: '/path-to-kingdoms/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
  },
});
