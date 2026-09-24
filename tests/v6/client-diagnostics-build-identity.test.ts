import assert from 'node:assert/strict';
import test from 'node:test';

import { createClientDiagnosticsService } from '../../src/core/client-diagnostics.js';

test('client diagnostics exposes the exact release build identity', async () => {
  const service = createClientDiagnosticsService({
    probe: async () => ({ reachable: true, reason: 'ok', status: 200 }),
    online: () => true,
    clock: () => Date.UTC(2026, 8, 24, 0, 0, 0),
    buildSha: '0123456789abcdef0123456789abcdef01234567',
  });

  assert.deepEqual(service.release, {
    sha: '0123456789abcdef0123456789abcdef01234567',
  });

  const diagnostic = await service.classify(new Error('module failed'), {
    kind: 'module',
    route: 'reader',
    forceProbe: true,
  });

  assert.equal(diagnostic.code, 'BQ-MOD-001');
  assert.equal(diagnostic.route, 'reader');
  assert.equal(diagnostic.buildSha, service.release.sha);
  assert.equal(diagnostic.serverReachable, true);
});

test('client diagnostics keeps a safe development identity outside the Vite build', () => {
  const service = createClientDiagnosticsService({
    probe: async () => ({ reachable: true }),
    buildSha: '   ',
  });

  assert.equal(service.release.sha, 'development');
});
