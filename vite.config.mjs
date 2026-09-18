import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(root, 'dist-v6');
const buildSha =
  process.env.BQ_BUILD_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'development';

const compatibilityDirectories = new Set(['assets', 'data', 'kids-games']);
const compatibilityExtensions = new Set([
  '.css',
  '.html',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.mjs',
  '.mp3',
  '.png',
  '.svg',
  '.txt',
  '.wasm',
  '.wav',
  '.webmanifest',
  '.webp',
  '.woff',
  '.woff2',
  '.xml',
]);
const compatibilityRootFiles = new Set(['_headers', '_redirects']);

function copyLegacyRuntime() {
  return {
    name: 'biblequest-v5-runtime-compatibility-copy',
    closeBundle() {
      mkdirSync(outDir, { recursive: true });

      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory() && compatibilityDirectories.has(entry.name)) {
          const source = join(root, entry.name);
          const target = join(outDir, entry.name);
          if (existsSync(source)) {
            cpSync(source, target, { recursive: true, force: true });
          }
          continue;
        }

        if (!entry.isFile() || entry.name === 'index.html') {
          continue;
        }

        if (
          compatibilityRootFiles.has(entry.name) ||
          compatibilityExtensions.has(extname(entry.name).toLowerCase())
        ) {
          copyFileSync(join(root, entry.name), join(outDir, entry.name));
        }
      }

      writeFileSync(
        join(outDir, 'bq-build.json'),
        JSON.stringify(
          {
            sha: buildSha,
            engine: 'vite-8',
            compatibilityBaseline: 'v5-production',
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
    },
  };
}

export default defineConfig({
  root,
  publicDir: false,
  define: {
    __BQ_BUILD_SHA__: JSON.stringify(buildSha),
  },
  plugins: [copyLegacyRuntime()],
  build: {
    outDir,
    emptyOutDir: true,
    assetsDir: '_v6',
    manifest: 'vite-manifest.json',
    sourcemap: false,
    target: 'es2022',
  },
});
