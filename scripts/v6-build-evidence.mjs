import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'dist-v6');
const expectedSha = process.env.BQ_BUILD_SHA || process.env.GITHUB_SHA;

if (!expectedSha) {
  throw new Error('BQ_BUILD_SHA or GITHUB_SHA is required for exact-SHA build evidence');
}

const safeExpectedSha = String(expectedSha).replace(/[^a-z0-9._-]/gi, '_');
const privateSourceMapDir = resolve(root, '.v6-source-maps', safeExpectedSha);

const budgets = Object.freeze({
  totalBytes: 250 * 1024 * 1024,
  javascriptBytes: 5 * 1024 * 1024,
  entryJavascriptBytes: 700 * 1024,
  initialJavaScriptBytes: 1250 * 1024,
  initialStylesheetBytes: 1024 * 1024,
  featureRouteJavaScriptBytes: 600 * 1024,
  featureRouteStylesheetBytes: 512 * 1024,
  imageBytes: 10 * 1024 * 1024,
  imageTotalBytes: 32 * 1024 * 1024,
  fontBytes: 1 * 1024 * 1024,
  fontTotalBytes: 4 * 1024 * 1024,
  minimumFeatureDynamicChunks: 40,
});
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const fontExtensions = new Set(['.eot', '.otf', '.ttf', '.woff', '.woff2']);
const javascriptExtensions = new Set(['.js', '.mjs']);

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

function collectStaticManifestResources(source) {
  const visited = new Set();
  const javascript = new Set();
  const stylesheets = new Set();

  function visit(key) {
    if (!key || visited.has(key)) return;
    visited.add(key);

    const chunk = manifest[key];
    if (!chunk) return;

    const file = String(chunk.file || '');
    if (file.endsWith('.js') || file.endsWith('.mjs')) javascript.add(file);
    for (const stylesheet of chunk.css || []) stylesheets.add(String(stylesheet));
    for (const imported of chunk.imports || []) visit(imported);
  }

  visit(source);
  return Object.freeze({
    javascript: Object.freeze([...javascript].sort()),
    stylesheets: Object.freeze([...stylesheets].sort()),
  });
}

async function sumBuiltBytes(paths) {
  let bytes = 0;
  for (const path of paths) bytes += (await stat(join(outDir, path))).size;
  return bytes;
}

const startupResources = collectStaticManifestResources(browserEntrySource);
const startupJavascriptSet = new Set(startupResources.javascript);
const startupStylesheetSet = new Set(startupResources.stylesheets);
const startupPerformance = Object.freeze({
  javascriptBytes: await sumBuiltBytes(startupResources.javascript),
  stylesheetBytes: await sumBuiltBytes(startupResources.stylesheets),
  javascriptFiles: startupResources.javascript,
  stylesheetFiles: startupResources.stylesheets,
});

const featureRoutePerformance = Object.freeze(
  await Promise.all(
    featureDynamicChunks.map(async ({ source }) => {
      const resources = collectStaticManifestResources(source);
      const javascriptFiles = resources.javascript.filter((path) => !startupJavascriptSet.has(path));
      const stylesheetFiles = resources.stylesheets.filter((path) => !startupStylesheetSet.has(path));
      return Object.freeze({
        source,
        javascriptBytes: await sumBuiltBytes(javascriptFiles),
        stylesheetBytes: await sumBuiltBytes(stylesheetFiles),
        javascriptFiles: Object.freeze(javascriptFiles),
        stylesheetFiles: Object.freeze(stylesheetFiles),
      });
    }),
  ),
);

const largestFeatureRouteJavaScript = featureRoutePerformance.reduce(
  (largest, route) => (route.javascriptBytes > largest.javascriptBytes ? route : largest),
  Object.freeze({ source: null, javascriptBytes: 0, stylesheetBytes: 0 }),
);
const largestFeatureRouteStylesheet = featureRoutePerformance.reduce(
  (largest, route) => (route.stylesheetBytes > largest.stylesheetBytes ? route : largest),
  Object.freeze({ source: null, javascriptBytes: 0, stylesheetBytes: 0 }),
);

const scriptureManifestFailures = [];
const scriptureManifestEvidence = [];
for (const translationId of ['bsb', 'tl', 'cebocb']) {
  const manifestPath = join(outDir, 'data', 'v6-scripture-manifests', `${translationId}.json`);
  try {
    const scriptureManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (scriptureManifest.translationId !== translationId) {
      scriptureManifestFailures.push(`${translationId}: manifest identity mismatch`);
      continue;
    }
    if (scriptureManifest.delivery !== 'downloadable' || scriptureManifest.license?.redistribution !== 'allowed') {
      scriptureManifestFailures.push(`${translationId}: manifest packaging policy is not explicitly downloadable/allowed`);
    }
    if (!Array.isArray(scriptureManifest.books) || scriptureManifest.books.length !== 66) {
      scriptureManifestFailures.push(`${translationId}: expected 66 book packages, found ${scriptureManifest.books?.length ?? 0}`);
      continue;
    }

    let bytes = 0;
    for (const book of scriptureManifest.books) {
      const relativePath = String(book.url || '').replace(/^\/+/, '');
      const payload = await readFile(join(outDir, relativePath));
      const digest = createHash('sha256').update(payload).digest('hex');
      if (digest !== String(book.sha256 || '').toLowerCase()) {
        scriptureManifestFailures.push(`${translationId}:${book.bookCode}: sha256 mismatch`);
      }
      if (payload.byteLength !== Number(book.bytes)) {
        scriptureManifestFailures.push(`${translationId}:${book.bookCode}: byte-length mismatch`);
      }
      bytes += payload.byteLength;
    }
    scriptureManifestEvidence.push({
      translationId,
      contentVersion: scriptureManifest.contentVersion,
      books: scriptureManifest.books.length,
      bytes,
    });
  } catch (error) {
    scriptureManifestFailures.push(`${translationId}: ${error?.message || error}`);
  }
}

const files = await walk(outDir);
const publicSourceMapFiles = files.filter((file) => file.endsWith('.map'));
const publicSourceMapReferences = [];
for (const file of files) {
  const path = relative(outDir, file).replaceAll('\\', '/');
  const extension = extname(file).toLowerCase();
  if (!path.startsWith('_v6/') || !new Set(['.js', '.mjs', '.css']).has(extension)) continue;
  const content = await readFile(file, 'utf8');
  if (/sourceMappingURL\s*=/.test(content)) publicSourceMapReferences.push(path);
}

let privateSourceMapMetadata;
let privateSourceMapFiles = [];
const privateSourceMapFailures = [];
try {
  privateSourceMapMetadata = JSON.parse(await readFile(join(privateSourceMapDir, 'bq-source-maps.json'), 'utf8'));
  privateSourceMapFiles = (await walk(privateSourceMapDir))
    .filter((file) => file.endsWith('.map'))
    .sort();

  if (privateSourceMapMetadata.sha !== expectedSha) {
    privateSourceMapFailures.push(`private source-map identity ${privateSourceMapMetadata.sha} != ${expectedSha}`);
  }
  if (privateSourceMapMetadata.publicSourceMaps !== false) {
    privateSourceMapFailures.push('private source-map metadata must declare publicSourceMaps=false');
  }
  if (privateSourceMapMetadata.sourcesEmbedded !== false) {
    privateSourceMapFailures.push('private source-map metadata must declare sourcesEmbedded=false');
  }
  if (!privateSourceMapFiles.length) {
    privateSourceMapFailures.push('private source-map directory contains no map files');
  }

  for (const mapFile of privateSourceMapFiles) {
    const sourceMap = JSON.parse(await readFile(mapFile, 'utf8'));
    const embeddedSources = Array.isArray(sourceMap.sourcesContent)
      ? sourceMap.sourcesContent.filter((source) => typeof source === 'string' && source.length > 0)
      : [];
    if (embeddedSources.length) {
      privateSourceMapFailures.push(
        `${relative(privateSourceMapDir, mapFile)} embeds ${embeddedSources.length} source payload(s)`,
      );
    }
  }
} catch (error) {
  privateSourceMapFailures.push(`private source-map evidence unavailable: ${error?.message || error}`);
}

const inventory = [];
let totalBytes = 0;
let imageTotalBytes = 0;
let fontTotalBytes = 0;
let largestJavaScript = { path: null, bytes: 0 };
let largestImage = { path: null, bytes: 0 };
let largestFont = { path: null, bytes: 0 };

for (const file of files) {
  const { size } = await stat(file);
  const path = relative(outDir, file).replaceAll('\\', '/');
  const extension = extname(file).toLowerCase();
  totalBytes += size;
  inventory.push({ path, bytes: size });
  if (javascriptExtensions.has(extension) && size > largestJavaScript.bytes) {
    largestJavaScript = { path, bytes: size };
  }
  if (imageExtensions.has(extension)) {
    imageTotalBytes += size;
    if (size > largestImage.bytes) largestImage = { path, bytes: size };
  }
  if (fontExtensions.has(extension)) {
    fontTotalBytes += size;
    if (size > largestFont.bytes) largestFont = { path, bytes: size };
  }
}

inventory.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
const report = {
  build: identity,
  budgets,
  routeSplitting: {
    browserEntrySource,
    browserEntry: { path: browserEntryPath, bytes: browserEntryBytes },
    featureDynamicChunkCount: featureDynamicChunks.length,
    featureDynamicChunks,
  },
  performance: {
    startup: startupPerformance,
    featureRoutes: featureRoutePerformance,
    largestFeatureRouteJavaScript,
    largestFeatureRouteStylesheet,
  },
  scripturePackages: scriptureManifestEvidence,
  sourceMaps: {
    privateDirectory: relative(root, privateSourceMapDir).replaceAll('\\', '/'),
    privateMapCount: privateSourceMapFiles.length,
    publicMapCount: publicSourceMapFiles.length,
    publicReferenceCount: publicSourceMapReferences.length,
    publicReferences: publicSourceMapReferences,
    metadata: privateSourceMapMetadata ?? null,
  },
  totals: {
    files: inventory.length,
    totalBytes,
    imageTotalBytes,
    fontTotalBytes,
    largestJavaScript,
    largestImage,
    largestFont,
  },
  largestFiles: inventory.slice(0, 25),
};

console.log(JSON.stringify(report, null, 2));

const failures = [];
if (publicSourceMapFiles.length) failures.push(`public artifact contains ${publicSourceMapFiles.length} source-map file(s)`);
if (publicSourceMapReferences.length) failures.push(`public V6 chunks expose sourceMappingURL references: ${publicSourceMapReferences.join(', ')}`);
failures.push(...privateSourceMapFailures);
failures.push(...scriptureManifestFailures);
if (totalBytes > budgets.totalBytes) failures.push(`total artifact ${totalBytes} > ${budgets.totalBytes}`);
if (largestJavaScript.bytes > budgets.javascriptBytes) failures.push(`largest JS ${largestJavaScript.bytes} > ${budgets.javascriptBytes}`);
if (browserEntryBytes > budgets.entryJavascriptBytes) failures.push(`browser entry JS ${browserEntryBytes} > ${budgets.entryJavascriptBytes}`);
if (startupPerformance.javascriptBytes > budgets.initialJavaScriptBytes) {
  failures.push(`initial JS ${startupPerformance.javascriptBytes} > ${budgets.initialJavaScriptBytes}`);
}
if (startupPerformance.stylesheetBytes > budgets.initialStylesheetBytes) {
  failures.push(`initial CSS ${startupPerformance.stylesheetBytes} > ${budgets.initialStylesheetBytes}`);
}
for (const route of featureRoutePerformance) {
  if (route.javascriptBytes > budgets.featureRouteJavaScriptBytes) {
    failures.push(`feature route JS ${route.source} ${route.javascriptBytes} > ${budgets.featureRouteJavaScriptBytes}`);
  }
  if (route.stylesheetBytes > budgets.featureRouteStylesheetBytes) {
    failures.push(`feature route CSS ${route.source} ${route.stylesheetBytes} > ${budgets.featureRouteStylesheetBytes}`);
  }
}
if (featureDynamicChunks.length < budgets.minimumFeatureDynamicChunks) {
  failures.push(`feature dynamic chunks ${featureDynamicChunks.length} < ${budgets.minimumFeatureDynamicChunks}`);
}
if (largestImage.bytes > budgets.imageBytes) failures.push(`largest image ${largestImage.bytes} > ${budgets.imageBytes}`);
if (imageTotalBytes > budgets.imageTotalBytes) failures.push(`image total ${imageTotalBytes} > ${budgets.imageTotalBytes}`);
if (largestFont.bytes > budgets.fontBytes) failures.push(`largest font ${largestFont.bytes} > ${budgets.fontBytes}`);
if (fontTotalBytes > budgets.fontTotalBytes) failures.push(`font total ${fontTotalBytes} > ${budgets.fontTotalBytes}`);
if (failures.length) throw new Error(`V6 build budget exceeded: ${failures.join('; ')}`);
