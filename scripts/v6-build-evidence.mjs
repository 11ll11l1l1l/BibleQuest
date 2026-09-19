import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'dist-v6');
const expectedSha = process.env.BQ_BUILD_SHA || process.env.GITHUB_SHA;

if (!expectedSha) {
  throw new Error('BQ_BUILD_SHA or GITHUB_SHA is required for exact-SHA build evidence');
}

const budgets = Object.freeze({
  totalBytes: 250 * 1024 * 1024,
  javascriptBytes: 5 * 1024 * 1024,
  entryJavascriptBytes: 700 * 1024,
  imageBytes: 10 * 1024 * 1024,
  minimumFeatureDynamicChunks: 40,
});
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const javascriptExtensions = new Set(['.js', '.mjs']);
const sourceMapReferenceExtensions = new Set(['.css', '.js', '.mjs']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const identity = JSON.parse(await readFile(join(outDir, 'bq-build.json'), 'utf8'));
if (identity.sha !== expectedSha) {
  throw new Error(`build identity mismatch: expected ${expectedSha}, got ${identity.sha}`);
}

const manifest = JSON.parse(await readFile(join(outDir, 'vite-manifest.json'), 'utf8'));
const manifestEntries = Object.entries(manifest);
const browserEntry = manifestEntries.find(([, chunk]) => chunk?.isEntry === true && String(chunk.file || '').endsWith('.js'));
if (!browserEntry) {
  throw new Error('V6 build manifest does not expose a JavaScript browser entry.');
}

const [browserEntrySource, browserEntryChunk] = browserEntry;
const browserEntryPath = String(browserEntryChunk.file);
const browserEntryBytes = (await stat(join(outDir, browserEntryPath))).size;
const featureDynamicChunks = manifestEntries
  .filter(([, chunk]) => chunk?.isDynamicEntry === true)
  .filter(([source]) => source.startsWith('src/features/') && source.endsWith('/index.js'))
  .map(([source, chunk]) => Object.freeze({ source, file: String(chunk.file || '') }))
  .sort((a, b) => a.source.localeCompare(b.source));

const files = await walk(outDir);
const inventory = [];
const deployableSourceMaps = [];
const sourceMapReferences = [];
let totalBytes = 0;
let largestJavaScript = { path: null, bytes: 0 };
let largestImage = { path: null, bytes: 0 };

for (const file of files) {
  const { size } = await stat(file);
  const path = relative(outDir, file).replaceAll('\\', '/');
  const extension = extname(file).toLowerCase();
  totalBytes += size;
  inventory.push({ path, bytes: size });
  if (javascriptExtensions.has(extension) && size > largestJavaScript.bytes) {
    largestJavaScript = { path, bytes: size };
  }
  if (imageExtensions.has(extension) && size > largestImage.bytes) {
    largestImage = { path, bytes: size };
  }

  // Production-equivalent dist-v6 is directly deployable. Keep source maps
  // private by default: no .map payloads and no browser-discoverable map URLs
  // may ship in this artifact. A future diagnostics uploader can generate maps
  // in an isolated non-deployable job without weakening this deployment gate.
  if (extension === '.map') {
    deployableSourceMaps.push(path);
  }
  if (sourceMapReferenceExtensions.has(extension)) {
    const contents = await readFile(file, 'utf8');
    if (/sourceMappingURL\s*=/.test(contents)) sourceMapReferences.push(path);
  }
}

inventory.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
const report = {
  build: identity,
  budgets,
  sourceMapPrivacy: {
    policy: 'deployable-dist-must-not-contain-source-maps-or-sourceMappingURL-references',
    deployableSourceMaps,
    sourceMapReferences,
  },
  routeSplitting: {
    browserEntrySource,
    browserEntry: { path: browserEntryPath, bytes: browserEntryBytes },
    featureDynamicChunkCount: featureDynamicChunks.length,
    featureDynamicChunks,
  },
  totals: {
    files: inventory.length,
    totalBytes,
    largestJavaScript,
    largestImage,
  },
  largestFiles: inventory.slice(0, 25),
};

console.log(JSON.stringify(report, null, 2));

const failures = [];
if (deployableSourceMaps.length) failures.push(`deployable source maps present: ${deployableSourceMaps.join(', ')}`);
if (sourceMapReferences.length) failures.push(`browser source-map references present: ${sourceMapReferences.join(', ')}`);
if (totalBytes > budgets.totalBytes) failures.push(`total artifact ${totalBytes} > ${budgets.totalBytes}`);
if (largestJavaScript.bytes > budgets.javascriptBytes) failures.push(`largest JS ${largestJavaScript.bytes} > ${budgets.javascriptBytes}`);
if (browserEntryBytes > budgets.entryJavascriptBytes) failures.push(`browser entry JS ${browserEntryBytes} > ${budgets.entryJavascriptBytes}`);
if (featureDynamicChunks.length < budgets.minimumFeatureDynamicChunks) {
  failures.push(`feature dynamic chunks ${featureDynamicChunks.length} < ${budgets.minimumFeatureDynamicChunks}`);
}
if (largestImage.bytes > budgets.imageBytes) failures.push(`largest image ${largestImage.bytes} > ${budgets.imageBytes}`);
if (failures.length) throw new Error(`V6 build evidence failed: ${failures.join('; ')}`);
