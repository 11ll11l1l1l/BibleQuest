import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createClientDiagnosticsService } from '../../src/core/client-diagnostics.js';

const bootstrapPath = fileURLToPath(new URL('../../src/app/bootstrap.js', import.meta.url));
const secret = 'private-token-should-never-escape';

test('client diagnostics drop raw exception, query, probe, worker, and content details', async () => {
  const diagnostics = createClientDiagnosticsService({
    probe: async () => ({ reachable: true, reason: secret, status: 200 }),
    online: () => true,
    clock: () => 0,
    serviceWorkerState: () => ({ supported: true, controlled: true, state: secret }),
    contentState: () => ({ status: secret, ready: true }),
  });

  const classified = await diagnostics.classify(
    new Error(`Authorization: Bearer ${secret}`),
    { kind: 'module', route: `reader?token=${secret}#private`, forceProbe: true },
  );
  assert.equal(classified.code, 'BQ-MOD-001');
  assert.equal(classified.route, 'reader');
  assert.doesNotMatch(JSON.stringify(classified), new RegExp(secret));

  const runtime = await diagnostics.runtimeState({ forceProbe: true });
  assert.equal(runtime.connectivity.reason, 'unknown');
  assert.equal(runtime.serviceWorker.state, 'unknown');
  assert.equal(runtime.content.status, 'unknown');
  assert.doesNotMatch(JSON.stringify(runtime), new RegExp(secret));
});

test('startup recovery does not log or render raw exception details', async () => {
  const source = await readFile(bootstrapPath, 'utf8');
  assert.equal(source.includes("console.error('BibleQuest failed to start.',error)"), false);
  assert.equal(source.includes('error?.message?'), false);
  assert.equal(source.includes('escapeStartupMessage(error.message)'), false);
  assert.match(source, /console\.error\('BibleQuest failed to start\.'\)/);
  assert.match(source, /data-startup-error-detail>Unexpected startup error\.<\/small>/);
});
