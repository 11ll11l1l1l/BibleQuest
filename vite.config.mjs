import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { writeArtifactIntegrityManifest } from './scripts/v6-artifact-integrity.mjs';
import { generateScripturePackageManifests } from './scripts/v6-generate-scripture-manifests.mjs';
import { publishV7VisualAssets } from './scripts/v7-publish-visual-assets.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(root, 'dist-v6');
const buildSha =
  process.env.BQ_BUILD_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'development';
const safeBuildSha = String(buildSha).replace(/[^a-z0-9._-]/gi, '_');
const privateSourceMapDir = resolve(root, '.v6-source-maps', safeBuildSha);

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
const viteManagedRootFiles = new Set(['index.html', 'v6-push-device-field.html']);

function walkFiles(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function copyLegacyRuntime() {
  return {
    name: 'biblequest-v5-runtime-compatibility-copy',
    async closeBundle() {
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

        if (!entry.isFile() || viteManagedRootFiles.has(entry.name)) {
          continue;
        }

        if (
          compatibilityRootFiles.has(entry.name) ||
          compatibilityExtensions.has(extname(entry.name).toLowerCase())
        ) {
          copyFileSync(join(root, entry.name), join(outDir, entry.name));
        }
      }

      generateScripturePackageManifests({
        root,
        outputDirectory: join(outDir, 'data', 'v6-scripture-manifests'),
      });

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

      // Vite treats the web manifest referenced by index.html as a build asset and
      // rewrites it to a hashed /_v6 URL. BibleQuest intentionally keeps the
      // canonical manifest at the deploy root so install/offline behavior remains
      // relative and portable across exact-SHA preview hosts.
      const indexPath = join(outDir, 'index.html');
      const rootManifestPath = join(outDir, 'manifest.webmanifest');
      if (!existsSync(indexPath) || !existsSync(rootManifestPath)) {
        throw new Error('V6 build is missing the deployable index or root PWA manifest.');
      }
      const builtIndex = readFileSync(indexPath, 'utf8');
      const manifestLinkPattern = /<link\s+rel=["']manifest["']\s+href=["'][^"']+["']\s*\/?>/i;
      if (!manifestLinkPattern.test(builtIndex)) {
        throw new Error('V6 build index is missing the PWA manifest link.');
      }
      const normalizedIndex = builtIndex.replace(
        manifestLinkPattern,
        '<link rel="manifest" href="manifest.webmanifest">',
      );
      writeFileSync(indexPath, normalizedIndex, 'utf8');

      // Only audit-verified, production-ready Lane A images enter the deployable artifact.
      // Staged 3-output image-agent drafts never ship or contaminate the integrity manifest.
      await publishV7VisualAssets({ root, outDir });
    },
  };
}

function collectPrivateSourceMaps() {
  return {
    name: 'biblequest-v6-private-source-maps',
    async closeBundle() {
      rmSync(privateSourceMapDir, { recursive: true, force: true });
      const sourceMaps = walkFiles(outDir)
        .filter((file) => file.endsWith('.map'))
        .sort();

      if (!sourceMaps.length) {
        throw new Error('V6 build produced no source maps for private diagnostics.');
      }

      for (const source of sourceMaps) {
        const relativePath = source.slice(outDir.length + 1);
        const target = join(privateSourceMapDir, relativePath);
        mkdirSync(dirname(target), { recursive: true });
        renameSync(source, target);
      }

      writeFileSync(
        join(privateSourceMapDir, 'bq-source-maps.json'),
        JSON.stringify(
          {
            sha: buildSha,
            publicArtifact: 'dist-v6',
            publicSourceMaps: false,
            sourcesEmbedded: false,
            maps: sourceMaps.map((file) => file.slice(outDir.length + 1).replaceAll('\\', '/')),
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );

      // Integrity is written after public source maps are removed so it describes
      // the final deployable bytes rather than an intermediate build directory.
      await writeArtifactIntegrityManifest(outDir, buildSha);
    },
  };
}

export default defineConfig({
  root,
  publicDir: false,
  define: {
    __BQ_BUILD_SHA__: JSON.stringify(buildSha),
  },
  plugins: [copyLegacyRuntime(), collectPrivateSourceMaps()],
  build: {
    outDir,
    emptyOutDir: true,
    assetsDir: '_v6',
    manifest: 'vite-manifest.json',
    sourcemap: 'hidden',
    target: 'es2022',
    rollupOptions: {
      input: {
        app: resolve(root, 'index.html'),
        pushDeviceField: resolve(root, 'v6-push-device-field.html'),
      },
      output: {
        sourcemapExcludeSources: true,
      },
    },
  },
});
