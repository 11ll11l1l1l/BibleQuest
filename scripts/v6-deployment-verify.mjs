import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const HOST_SUFFIX = '.mybiblequest.pages.dev';
const ROOT_HOST = 'mybiblequest.pages.dev';
const MAX_FILES = 1000;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const DEFAULT_CONCURRENCY = 8;
const METADATA_ATTEMPTS = 18;
const METADATA_RETRY_MS = 5000;

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

export function normalizeDeploymentUrl(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch {
    throw new Error('Deployment verification requires a valid absolute URL.');
  }
  if (url.protocol !== 'https:') throw new Error('Deployment verification requires HTTPS.');
  if (url.username || url.password) throw new Error('Deployment verification URL must not contain credentials.');
  const host = url.hostname.toLowerCase();
  if (host !== ROOT_HOST && !host.endsWith(HOST_SUFFIX)) {
    throw new Error(`Deployment verification host is not an approved BibleQuest Cloudflare Pages host: ${host}`);
  }
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

function normalizeArtifactPath(value) {
  if (typeof value !== 'string' || !value) throw new Error('Artifact inventory contains an empty path.');
  if (value.startsWith('/') || value.includes('\\')) throw new Error(`Artifact inventory path is unsafe: ${value}`);
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new Error(`Artifact inventory path is not valid URL text: ${value}`);
  }
  if (decoded.split('/').includes('..')) throw new Error(`Artifact inventory path escapes the deployment root: ${value}`);
  return value;
}

export function computeArtifactDigest(files) {
  const ordered = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const canonical = ordered.map(file => `${file.sha256} ${file.bytes} ${file.path}\n`).join('');
  return sha256(Buffer.from(canonical, 'utf8'));
}

async function fetchBytes(baseUrl, path, fetchImpl) {
  const safePath = normalizeArtifactPath(path);
  const target = new URL(safePath, baseUrl);
  if (target.origin !== baseUrl.origin) throw new Error(`Artifact target escaped deployment origin: ${safePath}`);
  const response = await fetchImpl(target, {
    cache: 'no-store',
    redirect: 'error',
    headers: { accept: 'application/octet-stream' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Deployment artifact fetch failed for ${safePath}: HTTP ${response.status}`);
  if (response.url && new URL(response.url).origin !== baseUrl.origin) {
    throw new Error(`Deployment artifact redirected off origin: ${safePath}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function fetchJson(baseUrl, path, fetchImpl) {
  const bytes = await fetchBytes(baseUrl, path, fetchImpl);
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`Deployment artifact is not valid JSON: ${path}`);
  }
}

async function fetchDeploymentMetadata(baseUrl, path, fetchImpl) {
  let lastError;
  for (let attempt = 1; attempt <= METADATA_ATTEMPTS; attempt += 1) {
    try {
      return await fetchJson(baseUrl, path, fetchImpl);
    } catch (error) {
      lastError = error;
      if (attempt < METADATA_ATTEMPTS) await sleep(METADATA_RETRY_MS);
    }
  }
  throw new Error(
    `Deployment metadata did not become readable after ${METADATA_ATTEMPTS} attempts (${path}): ${lastError?.message || lastError}`,
  );
}

function validateInventory(manifest) {
  if (manifest?.schemaVersion !== 1) throw new Error('Deployment artifact integrity schemaVersion must be 1.');
  if (manifest?.algorithm !== 'sha256') throw new Error('Deployment artifact integrity algorithm must be sha256.');
  if (!SHA256_PATTERN.test(String(manifest?.artifactSha256 || ''))) {
    throw new Error('Deployment artifact integrity digest must be SHA-256.');
  }
  if (!Array.isArray(manifest?.files)) throw new Error('Deployment artifact integrity file inventory is missing.');
  if (!Number.isInteger(manifest.fileCount) || manifest.fileCount !== manifest.files.length) {
    throw new Error('Deployment artifact integrity fileCount does not match the inventory.');
  }
  if (manifest.fileCount < 1 || manifest.fileCount > MAX_FILES) {
    throw new Error(`Deployment artifact fileCount is outside the allowed range: ${manifest.fileCount}`);
  }
  if (!Number.isInteger(manifest.totalBytes) || manifest.totalBytes < 1 || manifest.totalBytes > MAX_TOTAL_BYTES) {
    throw new Error(`Deployment artifact totalBytes is outside the allowed range: ${manifest.totalBytes}`);
  }

  const paths = new Set();
  const entries = manifest.files.map(file => {
    const path = normalizeArtifactPath(file?.path);
    if (paths.has(path)) throw new Error(`Deployment artifact inventory repeats path: ${path}`);
    paths.add(path);
    const bytes = Number(file?.bytes);
    const digest = String(file?.sha256 || '');
    if (!Number.isInteger(bytes) || bytes < 0) throw new Error(`Deployment artifact byte count is invalid: ${path}`);
    if (!SHA256_PATTERN.test(digest)) throw new Error(`Deployment artifact SHA-256 is invalid: ${path}`);
    return Object.freeze({ path, bytes, sha256: digest.toLowerCase() });
  });

  const required = ['index.html', 'bq-build.json', 'manifest.webmanifest', 'offline-shell-sw.js'];
  for (const path of required) {
    if (!paths.has(path)) throw new Error(`Deployment artifact inventory is missing required file: ${path}`);
  }
  const declaredTotal = entries.reduce((sum, file) => sum + file.bytes, 0);
  if (declaredTotal !== manifest.totalBytes) {
    throw new Error(`Deployment artifact totalBytes mismatch: inventory ${declaredTotal}, manifest ${manifest.totalBytes}`);
  }
  const declaredDigest = computeArtifactDigest(entries);
  if (declaredDigest !== String(manifest.artifactSha256).toLowerCase()) {
    throw new Error('Deployment artifact aggregate digest does not match its inventory.');
  }
  return entries;
}

export async function verifyDeployedArtifact({
  deploymentUrl,
  expectedSha,
  fetchImpl = globalThis.fetch,
  concurrency = DEFAULT_CONCURRENCY,
} = {}) {
  const sourceSha = String(expectedSha || '').trim().toLowerCase();
  if (!SHA_PATTERN.test(sourceSha)) throw new Error('Deployment verification requires the full 40-character Git commit SHA.');
  if (typeof fetchImpl !== 'function') throw new Error('Deployment verification requires a fetch implementation.');
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error('Deployment verification concurrency must be an integer from 1 to 32.');
  }

  const baseUrl = normalizeDeploymentUrl(deploymentUrl);
  // A Pages bot success comment can precede edge propagation by several seconds.
  // Retry only the two immutable metadata files; once both are readable, every
  // declared artifact is still verified exactly once against its recorded bytes.
  const [build, integrity] = await Promise.all([
    fetchDeploymentMetadata(baseUrl, 'bq-build.json', fetchImpl),
    fetchDeploymentMetadata(baseUrl, 'bq-artifact-integrity.json', fetchImpl),
  ]);

  if (String(build?.sha || '').toLowerCase() !== sourceSha) {
    throw new Error(`Deployed build SHA mismatch: expected ${sourceSha}, got ${String(build?.sha || '<missing>')}`);
  }
  if (String(integrity?.sourceSha || '').toLowerCase() !== sourceSha) {
    throw new Error(`Deployed artifact source SHA mismatch: expected ${sourceSha}, got ${String(integrity?.sourceSha || '<missing>')}`);
  }

  const entries = validateInventory(integrity);
  const actual = new Array(entries.length);
  let cursor = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor;
      cursor += 1;
      const expected = entries[index];
      const bytes = await fetchBytes(baseUrl, expected.path, fetchImpl);
      const digest = sha256(bytes);
      if (bytes.byteLength !== expected.bytes) {
        throw new Error(`Deployed artifact byte count mismatch for ${expected.path}: expected ${expected.bytes}, got ${bytes.byteLength}`);
      }
      if (digest !== expected.sha256) {
        throw new Error(`Deployed artifact SHA-256 mismatch for ${expected.path}: expected ${expected.sha256}, got ${digest}`);
      }
      actual[index] = Object.freeze({ path: expected.path, bytes: bytes.byteLength, sha256: digest });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()));
  const totalBytes = actual.reduce((sum, file) => sum + file.bytes, 0);
  const artifactSha256 = computeArtifactDigest(actual);
  if (totalBytes !== integrity.totalBytes || artifactSha256 !== String(integrity.artifactSha256).toLowerCase()) {
    throw new Error('Deployed artifact aggregate verification does not match the build integrity manifest.');
  }

  return Object.freeze({
    deploymentOrigin: baseUrl.origin,
    sourceSha,
    artifactSha256,
    fileCount: actual.length,
    totalBytes,
  });
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  verifyDeployedArtifact({
    deploymentUrl: process.argv[2] || process.env.BQ_DEPLOYMENT_URL,
    expectedSha: process.argv[3] || process.env.BQ_EXPECTED_SHA,
  }).then(
    result => console.log(JSON.stringify(result, null, 2)),
    error => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    },
  );
}