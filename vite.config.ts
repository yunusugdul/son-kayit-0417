import { defineConfig } from 'vite';

// Asset URL'leri hem site kökünde hem de GitHub Pages alt dizininde çalışır.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
