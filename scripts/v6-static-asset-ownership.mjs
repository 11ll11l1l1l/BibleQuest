import { access, readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'dist-v6');
const sourceAssets = resolve(root, 'assets');
const builtAssets = resolve(outDir, 'assets');
const imageExtensions = new Set(['.avif', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const fontExtensions = new Set(['.otf', '.ttf', '.woff', '.woff2']);
const budgets = Object.freeze({
  totalImageBytes: 20 * 1024 * 1024,
  largestImageBytes: 2 * 1024 * 1024,
  totalFontBytes: 5 * 1024 * 1024,
  largestFontBytes: 1024 * 1024,
});

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

await access(builtAssets);
const sourceFiles = (await walk(sourceAssets)).sort();
const sourceRelative = sourceFiles.map((file) => relative(sourceAssets, file).replaceAll('\\', '/'));
const missing = [];
const changed = [];
let totalBytes = 0;
let imageBytes = 0;
let imageCount = 0;
let largestImage = null;
let fontBytes = 0;
let fontCount = 0;
let largestFont = null;

for (let index = 0; index < sourceFiles.length; index += 1) {
  const source = sourceFiles[index];
  const relativePath = sourceRelative[index];
  const target = join(builtAssets, relativePath);
  try {
    await access(target);
  } catch {
    missing.push(relativePath);
    continue;
  }

  const [sourceInfo, targetInfo] = await Promise.all([stat(source), stat(target)]);
  totalBytes += targetInfo.size;
  if (sourceInfo.size !== targetInfo.size) changed.push(`${relativePath} (size)`);
  else {
    const [sourceBytes, targetBytes] = await Promise.all([readFile(source), readFile(target)]);
    if (!sourceBytes.equals(targetBytes)) changed.push(`${relativePath} (content)`);
  }

  const extension = extname(relativePath).toLowerCase();
  if (imageExtensions.has(extension)) {
    imageCount += 1;
    imageBytes += targetInfo.size;
    if (!largestImage || targetInfo.size > largestImage.bytes) largestImage = { path: relativePath, bytes: targetInfo.size };
  }
  if (fontExtensions.has(extension)) {
    fontCount += 1;
    fontBytes += targetInfo.size;
    if (!largestFont || targetInfo.size > largestFont.bytes) largestFont = { path: relativePath, bytes: targetInfo.size };
  }
}

const builtFiles = (await walk(builtAssets)).map((file) => relative(builtAssets, file).replaceAll('\\', '/')).sort();
const sourceSet = new Set(sourceRelative);
const unexpected = builtFiles.filter((file) => !sourceSet.has(file));

const report = {
  ownership: 'vite-compatibility-copy',
  sourceAssetCount: sourceRelative.length,
  builtAssetCount: builtFiles.length,
  totalBytes,
  budgets,
  imageCount,
  imageBytes,
  largestImage,
  fontCount,
  fontBytes,
  largestFont,
  missing,
  changed,
  unexpected,
};
console.log(JSON.stringify(report, null, 2));

const failures = [];
if (!sourceRelative.length) failures.push('source assets directory is unexpectedly empty');
if (missing.length) failures.push(`assets missing from dist-v6: ${missing.join(', ')}`);
if (changed.length) failures.push(`compatibility-copied assets differ from source: ${changed.join(', ')}`);
if (unexpected.length) failures.push(`unexpected files in dist-v6/assets: ${unexpected.join(', ')}`);
if (!imageCount) failures.push('no image assets were inventoried');
if (imageBytes > budgets.totalImageBytes) failures.push(`image assets exceed total budget: ${imageBytes} > ${budgets.totalImageBytes} bytes`);
if (largestImage?.bytes > budgets.largestImageBytes) failures.push(`largest image exceeds budget: ${largestImage.path} ${largestImage.bytes} > ${budgets.largestImageBytes} bytes`);
if (fontBytes > budgets.totalFontBytes) failures.push(`font assets exceed total budget: ${fontBytes} > ${budgets.totalFontBytes} bytes`);
if (largestFont?.bytes > budgets.largestFontBytes) failures.push(`largest font exceeds budget: ${largestFont.path} ${largestFont.bytes} > ${budgets.largestFontBytes} bytes`);
if (failures.length) throw new Error(`V6 static asset ownership failed: ${failures.join('; ')}`);
