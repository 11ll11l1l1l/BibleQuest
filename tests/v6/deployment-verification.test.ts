import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  computeArtifactDigest,
  normalizeDeploymentUrl,
  verifyDeployedArtifact,
} from '../../scripts/v6-deployment-verify.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const exactSha = 'a'.repeat(40);

function createFixture({ buildSha = exactSha } = {}) {
  const payloads = new Map([
    ['index.html', Buffer.from('<!doctype html><title>BibleQuest</title>')],
    ['bq-build.json', Buffer.from(JSON.stringify({ sha: buildSha }))],
    ['manifest.webmanifest', Buffer.from(JSON.stringify({ name: 'BibleQuest', display: 'standalone' }))],
    ['offline-shell-sw.js', Buffer.from('self.addEventListener("fetch",()=>{});')],
  ]);
  const files = [...payloads.entries()]
    .map(([path, bytes]) => ({ path, bytes: bytes.byteLength, sha256: sha256(bytes) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const integrity = {
    schemaVersion: 1,
    algorithm: 'sha256',
    sourceSha: exactSha,
    artifactSha256: computeArtifactDigest(files),
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    files,
  };
  payloads.set('bq-artifact-integrity.json', Buffer.from(JSON.stringify(integrity)));

  const fetchImpl = async input => {
    const url = input instanceof URL ? input : new URL(input);
    const path = url.pathname.replace(/^\//, '');
    const bytes = payloads.get(path);
    if (!bytes) return new Response('missing', { status: 404 });
    return new Response(bytes, { status: 200 });
  };
  return { payloads, fetchImpl, integrity };
}

test('deployment URL accepts only BibleQuest Cloudflare Pages HTTPS hosts', () => {
  assert.equal(
    normalizeDeploymentUrl('https://24aaacdb.mybiblequest.pages.dev/path?cache=1#hash').href,
    'https://24aaacdb.mybiblequest.pages.dev/',
  );
  assert.equal(normalizeDeploymentUrl('https://mybiblequest.pages.dev').href, 'https://mybiblequest.pages.dev/');
  assert.throws(() => normalizeDeploymentUrl('http://mybiblequest.pages.dev'), /requires HTTPS/);
  assert.throws(() => normalizeDeploymentUrl('https://example.com'), /not an approved BibleQuest Cloudflare Pages host/);
  assert.throws(() => normalizeDeploymentUrl('https://user:pass@mybiblequest.pages.dev'), /must not contain credentials/);
});

test('deployed artifact verifier proves exact source SHA and every declared file byte', async () => {
  const fixture = createFixture();
  const result = await verifyDeployedArtifact({
    deploymentUrl: 'https://preview.mybiblequest.pages.dev',
    expectedSha: exactSha,
    fetchImpl: fixture.fetchImpl,
    concurrency: 2,
  });

  assert.equal(result.deploymentOrigin, 'https://preview.mybiblequest.pages.dev');
  assert.equal(result.sourceSha, exactSha);
  assert.equal(result.artifactSha256, fixture.integrity.artifactSha256);
  assert.equal(result.fileCount, fixture.integrity.fileCount);
  assert.equal(result.totalBytes, fixture.integrity.totalBytes);
});

test('deployed artifact verifier rejects build identity mismatch', async () => {
  const fixture = createFixture({ buildSha: 'b'.repeat(40) });
  await assert.rejects(
    verifyDeployedArtifact({
      deploymentUrl: 'https://preview.mybiblequest.pages.dev',
      expectedSha: exactSha,
      fetchImpl: fixture.fetchImpl,
    }),
    /Deployed build SHA mismatch/,
  );
});

test('deployed artifact verifier rejects bytes changed after the integrity manifest was built', async () => {
  const fixture = createFixture();
  fixture.payloads.set('index.html', Buffer.from('<!doctype html><title>Tampered</title>'));

  await assert.rejects(
    verifyDeployedArtifact({
      deploymentUrl: 'https://preview.mybiblequest.pages.dev',
      expectedSha: exactSha,
      fetchImpl: fixture.fetchImpl,
    }),
    /Deployed artifact (byte count|SHA-256) mismatch for index\.html/,
  );
});

test('deployment verification workflow binds PR previews and manual URLs to the exact commit SHA', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/v6-deployment-verify.yml', import.meta.url), 'utf8');
  for (const token of [
    'pull_request:',
    'workflow_dispatch:',
    'deployment_url:',
    'issues: read',
    'cloudflare-workers-and-pages[bot]',
    '<code>${expected}</code>',
    'Deploy successful!',
    'steps.preview.outputs.url',
    "github.event.pull_request.head.sha",
    "BQ_EXPECTED_SHA: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}",
    'node scripts/v6-deployment-verify.mjs',
  ]) {
    assert.ok(workflow.includes(token), `deployment verification workflow missing: ${token}`);
  }
});
