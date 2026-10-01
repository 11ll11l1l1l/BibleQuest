import assert from 'node:assert/strict';
import test from 'node:test';

import { runLiveSmoke } from '../../scripts/v6-live-smoke.mjs';

const candidateSha = 'a'.repeat(40);

function responseFor(url) {
  const path = new URL(url).pathname;
  if (path === '/') {
    return new Response('<!doctype html><html><body><div id="app"></div></body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  if (path === '/bq-build.json') {
    return new Response(JSON.stringify({ sha: candidateSha }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (path === '/manifest.webmanifest') {
    return new Response(JSON.stringify({
      name: 'BibleQuest',
      display: 'standalone',
      shortcuts: [{ url: './#/reader' }, { url: './#/assignments' }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/manifest+json' },
    });
  }
  if (path === '/offline-shell-sw.js') {
    return new Response([
      "self.addEventListener('fetch',()=>{});",
      'caches.open("bq");',
      "self.addEventListener('push',()=>{});",
      'self.registration.showNotification("BibleQuest");',
      "self.addEventListener('notificationclick',()=>{});",
      'self.clients.openWindow?.("/#/notification-center");',
    ].join('\n'), {
      status: 200,
      headers: { 'content-type': 'text/javascript' },
    });
  }
  return new Response('missing', { status: 404 });
}

test('live smoke proves the exact deployed SHA and required PWA shell endpoints', async () => {
  const evidence = await runLiveSmoke({
    deploymentUrl: 'https://candidate.mybiblequest.pages.dev',
    expectedSha: candidateSha,
    fetchImpl: async input => responseFor(input),
    now: () => new Date('2026-10-02T00:00:00Z'),
  });

  assert.equal(evidence.sourceSha, candidateSha);
  assert.equal(evidence.deploymentOrigin, 'https://candidate.mybiblequest.pages.dev');
  assert.equal(evidence.schemaVersion, 2);
  assert.equal(evidence.checks.length, 6);
  assert.ok(evidence.checks.some(check => check.kind === 'route-shortcuts'));
  assert.ok(evidence.checks.some(check => check.kind === 'offline-cache-contract'));
  assert.ok(evidence.checks.some(check => check.kind === 'push-worker-contract'));
  assert.ok(evidence.checks.every(check => check.ok));
});

test('live smoke fails closed when the deployed build identity differs', async () => {
  await assert.rejects(
    runLiveSmoke({
      deploymentUrl: 'https://candidate.mybiblequest.pages.dev',
      expectedSha: 'b'.repeat(40),
      fetchImpl: async input => responseFor(input),
    }),
    /Live smoke build SHA mismatch/,
  );
});
