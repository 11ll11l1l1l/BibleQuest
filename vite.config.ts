import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-v5',
    emptyOutDir: true,
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      input: 'v5.html'
    }
  }
});
