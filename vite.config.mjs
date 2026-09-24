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

function rewriteIndexLinkHref(html, rel, href) {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    const relValue = tag.match(/\brel=["']([^"']+)["']/i)?.[1] || '';
    if (!relValue.split(/\s+/).includes(rel)) return tag;
    if (/\bhref=["'][^"']*["']/i.test(tag)) {
      return tag.replace(/\bhref=["'][^"']*["']/i, `href="${href}"`);
    }
    return tag.replace(/\s*\/>$|>$/, (ending) => ` href="${href}"${ending}`);
  });
}

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

      const builtIndexPath = join(outDir, 'index.html');
      if (!existsSync(builtIndexPath)) {
        throw new Error('V6 build produced no index.html for root PWA link normalization.');
      }
      let builtIndex = readFileSync(builtIndexPath, 'utf8');
      builtIndex = rewriteIndexLinkHref(builtIndex, 'manifest', 'manifest.webmanifest');
      builtIndex = rewriteIndexLinkHref(builtIndex, 'icon', 'app-icon.svg');
      builtIndex = rewriteIndexLinkHref(builtIndex, 'apple-touch-icon', 'pwa-icon-192.png');
      writeFileSync(builtIndexPath, builtIndex, 'utf8');

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

function collectPrivateSourceMaps() {
  return {
    name: 'biblequest-v6-private-source-maps',
    closeBundle() {
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
      output: {
        sourcemapExcludeSources: true,
      },
    },
  },
});
