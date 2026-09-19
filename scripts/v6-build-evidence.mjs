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
  imageBytes: 10 * 1024 * 1024,
});
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
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

const files = await walk(outDir);
const inventory = [];
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
}

inventory.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
const report = {
  build: identity,
  budgets,
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
if (totalBytes > budgets.totalBytes) failures.push(`total artifact ${totalBytes} > ${budgets.totalBytes}`);
if (largestJavaScript.bytes > budgets.javascriptBytes) failures.push(`largest JS ${largestJavaScript.bytes} > ${budgets.javascriptBytes}`);
if (largestImage.bytes > budgets.imageBytes) failures.push(`largest image ${largestImage.bytes} > ${budgets.imageBytes}`);
if (failures.length) throw new Error(`V6 build budget exceeded: ${failures.join('; ')}`);
