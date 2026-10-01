import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeDeploymentUrl } from './v6-deployment-verify.mjs';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;

async function fetchText(baseUrl, path, fetchImpl) {
  const target = new URL(path, baseUrl);
  const response = await fetchImpl(target, {
    cache: 'no-store',
    redirect: 'error',
    headers: { accept: path.endsWith('.json') ? 'application/json' : '*/*' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Live smoke failed for ${path}: HTTP ${response.status}`);
  if (response.url && new URL(response.url).origin !== baseUrl.origin) {
    throw new Error(`Live smoke redirected off deployment origin for ${path}`);
  }
  return {
    text: await response.text(),
    contentType: String(response.headers.get('content-type') || ''),
  };
}

export async function runLiveSmoke({
  deploymentUrl,
  expectedSha,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
} = {}) {
  const sourceSha = String(expectedSha || '').trim().toLowerCase();
  if (!SHA_PATTERN.test(sourceSha)) throw new Error('Live smoke requires an exact 40-character source SHA.');
  if (typeof fetchImpl !== 'function') throw new Error('Live smoke requires a fetch implementation.');

  const baseUrl = normalizeDeploymentUrl(deploymentUrl);
  const [root, build, manifest, serviceWorker] = await Promise.all([
    fetchText(baseUrl, '', fetchImpl),
    fetchText(baseUrl, 'bq-build.json', fetchImpl),
    fetchText(baseUrl, 'manifest.webmanifest', fetchImpl),
    fetchText(baseUrl, 'offline-shell-sw.js', fetchImpl),
  ]);

  if (!/<html\b/i.test(root.text) || !/<body\b/i.test(root.text)) {
    throw new Error('Live smoke root response is not the BibleQuest HTML shell.');
  }
  const buildMetadata = JSON.parse(build.text);
  if (String(buildMetadata?.sha || '').toLowerCase() !== sourceSha) {
    throw new Error(`Live smoke build SHA mismatch: expected ${sourceSha}, got ${String(buildMetadata?.sha || '<missing>')}`);
  }
  const webManifest = JSON.parse(manifest.text);
  if (!String(webManifest?.name || '').trim()) throw new Error('Live smoke web manifest has no application name.');
  if (webManifest?.display !== 'standalone') throw new Error('Live smoke web manifest is not configured for standalone PWA display.');
  const shortcutUrls = new Set((Array.isArray(webManifest?.shortcuts) ? webManifest.shortcuts : []).map(item => String(item?.url || '')));
  for (const requiredRoute of ['./#/reader', './#/assignments']) {
    if (!shortcutUrls.has(requiredRoute)) throw new Error(`Live smoke manifest is missing required route shortcut ${requiredRoute}.`);
  }

  const workerSource = serviceWorker.text;
  if (workerSource.length < 100) throw new Error('Live smoke service worker response is unexpectedly empty.');
  for (const requiredWorkerContract of [
    "self.addEventListener('fetch'",
    'caches.open(',
    "self.addEventListener('push'",
    'showNotification(',
    "self.addEventListener('notificationclick'",
    'openWindow?.(',
  ]) {
    if (!workerSource.includes(requiredWorkerContract)) {
      throw new Error(`Live smoke service worker is missing deployed contract: ${requiredWorkerContract}`);
    }
  }

  return Object.freeze({
    schemaVersion: 2,
    deploymentOrigin: baseUrl.origin,
    sourceSha,
    verifiedAt: now().toISOString(),
    checks: Object.freeze([
      Object.freeze({ path: '/', kind: 'html-shell', ok: true }),
      Object.freeze({ path: '/bq-build.json', kind: 'exact-sha', ok: true }),
      Object.freeze({ path: '/manifest.webmanifest', kind: 'pwa-manifest', ok: true }),
      Object.freeze({ path: '/manifest.webmanifest', kind: 'route-shortcuts', ok: true }),
      Object.freeze({ path: '/offline-shell-sw.js', kind: 'offline-cache-contract', ok: true }),
      Object.freeze({ path: '/offline-shell-sw.js', kind: 'push-worker-contract', ok: true }),
    ]),
  });
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  runLiveSmoke({
    deploymentUrl: process.argv[2] || process.env.BQ_DEPLOYMENT_URL,
    expectedSha: process.argv[3] || process.env.BQ_EXPECTED_SHA,
  }).then(
    async evidence => {
      const json = JSON.stringify(evidence, null, 2) + '\n';
      if (process.env.BQ_LIVE_SMOKE_OUTPUT) await writeFile(process.env.BQ_LIVE_SMOKE_OUTPUT, json, 'utf8');
      process.stdout.write(json);
    },
    error => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    },
  );
}
