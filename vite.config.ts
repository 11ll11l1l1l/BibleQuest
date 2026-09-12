import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    manifest: true,
    target: "es2022",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
