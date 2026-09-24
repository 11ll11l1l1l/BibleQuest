import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeTelemetryDimensions, telemetryDimensionAllowlist } from '../../src/v6/observability/policy.ts';

test('telemetry event schemas expose only explicit aggregate dimensions', () => {
  assert.deepEqual(telemetryDimensionAllowlist('error.classified'), ['code', 'category', 'routeId']);
  assert.deepEqual(telemetryDimensionAllowlist('assignment.completed'), ['source']);
  assert.deepEqual(telemetryDimensionAllowlist('game.completed'), ['gameId', 'mode', 'completed']);
});

test('telemetry policy strips content-like and identity-like properties even when input is noisy', () => {
  const safe = sanitizeTelemetryDimensions('error.classified', {
    code: 'BQ-MOD-001',
    category: 'App module',
    routeId: 'reader',
    userId: 'user-1',
    accountId: 'account-1',
    congregationId: 'church-1',
    authorization: 'Bearer abc',
    reflection: 'private reflection',
    prayer: 'private prayer',
    content: 'raw content',
  });
  assert.deepEqual(safe, { code: 'BQ-MOD-001', category: 'App module', routeId: 'reader' });
});
