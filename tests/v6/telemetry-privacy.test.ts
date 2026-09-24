import assert from 'node:assert/strict';
import test from 'node:test';
import { createTelemetryClient } from '../../src/v6/observability/client.ts';

test('registered telemetry never serializes raw account identity or sensitive content', async () => {
  const sent: any[] = [];
  const client = createTelemetryClient({
    buildSha: '64ce38dc8a6973a4518f2f0f85f48763c51d0a84',
    actor: () => ({ kind: 'registered', guestSessionId: 'must-not-survive' }),
    eventId: () => 'event-registered-0001',
    clock: () => new Date('2026-09-25T00:00:00.000Z'),
    sink: { async send(event) { sent.push(event); } },
  });

  const result = await client.track('feature.opened', {
    featureId: 'reader',
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'private@example.com',
    token: 'secret-token',
    note: 'private note',
    scriptureContent: 'sensitive authored or reading content',
  });

  assert.equal(result.sent, true);
  assert.deepEqual(result.event.actor, { kind: 'registered' });
  assert.deepEqual(result.event.dimensions, { featureId: 'reader' });
  assert.equal(JSON.stringify(sent[0]).includes('private@example.com'), false);
  assert.equal(JSON.stringify(sent[0]).includes('11111111'), false);
  assert.equal(JSON.stringify(sent[0]).includes('secret-token'), false);
});

test('guest telemetry uses only an opaque session-scoped id and safe aggregate dimensions', async () => {
  let observed: any = null;
  const client = createTelemetryClient({
    buildSha: '64ce38d',
    actor: () => ({ kind: 'guest', guestSessionId: 'guest-session-0001' }),
    eventId: () => 'event-guest-000001',
    clock: () => new Date('2026-09-25T01:00:00.000Z'),
    sink: { async send(event) { observed = event; } },
  });

  await client.track('route.viewed', {
    routeId: 'play',
    searchQuery: 'private search',
    book: 'John',
    chapter: 3,
    verse: 16,
  });

  assert.deepEqual(observed.actor, { kind: 'guest', guestSessionId: 'guest-session-0001' });
  assert.deepEqual(observed.dimensions, { routeId: 'play' });
});

test('telemetry sink failures are non-fatal to the observed product flow', async () => {
  const client = createTelemetryClient({
    buildSha: '64ce38d',
    actor: () => ({ kind: 'guest', guestSessionId: 'guest-session-0002' }),
    eventId: () => 'event-guest-000002',
    sink: { async send() { throw new Error('offline'); } },
  });
  const result = await client.track('app.session.started', { installMode: 'browser', online: false });
  assert.equal(result.sent, false);
  assert.equal(result.reason, 'sink-failed');
  assert.deepEqual(result.event.dimensions, { installMode: 'browser', online: false });
});

test('guest telemetry fails closed without a valid session id', async () => {
  const client = createTelemetryClient({
    buildSha: '64ce38d',
    actor: () => ({ kind: 'guest', guestSessionId: 'x' }),
    eventId: () => 'event-guest-000003',
    sink: { async send() {} },
  });
  await assert.rejects(() => client.track('route.viewed', { routeId: 'home' }), /valid session-scoped id/);
});
