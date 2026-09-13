import { defineConfig } from "vite";
import { copyStaticArtifacts } from "./scripts/v5-static-artifacts.mjs";

function stableRootArtifactsPlugin() {
  return {
    name: "biblequest-stable-root-artifacts",
    apply: "build",
    async closeBundle() {
      await copyStaticArtifacts({ root: process.cwd(), outDir: "dist" });
    }
  };
}

export default defineConfig({
  appType: "spa",
  plugins: [stableRootArtifactsPlugin()],
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
