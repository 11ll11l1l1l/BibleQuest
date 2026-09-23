import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLegacySessionBridge, createSessionContextStore } from '../../src/v6/kernel/index.ts';

describe('legacy session bridge', () => {
  it('projects authenticated identity without inventing membership or tenant authority', async () => {
    const context = createSessionContextStore();
    const resumed: string[] = [];
    const bridge = createLegacySessionBridge(context, async (userId) => { resumed.push(userId); });

    bridge.sync({ status: 'authenticated', authenticated: true, user: { id: 'user-a', email: 'a@example.test' } });
    await Promise.resolve();

    const snapshot = context.snapshot();
    assert.equal(snapshot.status, 'authenticated');
    assert.equal(snapshot.identity.userId, 'user-a');
    assert.deepEqual(snapshot.memberships, []);
    assert.deepEqual(resumed, ['user-a']);
  });

  it('deduplicates unrelated legacy store publications for the same session', async () => {
    const context = createSessionContextStore();
    let resumes = 0;
    const bridge = createLegacySessionBridge(context, async () => { resumes += 1; });
    const state = { status: 'authenticated', authenticated: true, user: { id: 'user-a' } };

    bridge.sync(state);
    bridge.sync(state);
    bridge.sync({ ...state, user: { id: 'user-a' } });
    await Promise.resolve();

    assert.equal(resumes, 1);
  });

  it('fails closed for authenticated legacy state without a usable user id', () => {
    const context = createSessionContextStore();
    context.setAuthenticated({ userId: 'user-a' });
    const bridge = createLegacySessionBridge(context);

    bridge.sync({ status: 'authenticated', authenticated: true, user: { id: '   ' } });

    assert.equal(context.snapshot().status, 'anonymous');
  });

  it('maps boot/authentication and sign-out transitions without retaining prior identity', () => {
    const context = createSessionContextStore();
    const bridge = createLegacySessionBridge(context);

    bridge.sync({ status: 'booting', authenticated: false, user: null });
    assert.equal(context.snapshot().status, 'authenticating');

    bridge.sync({ status: 'authenticated', authenticated: true, user: { id: 'user-a' } });
    assert.equal(context.snapshot().status, 'authenticated');

    bridge.sync({ status: 'guest', authenticated: false, user: null });
    const guest = context.snapshot();
    assert.equal(guest.status, 'anonymous');
    assert.equal(guest.identity, null);
    assert.deepEqual(guest.memberships, []);
  });

  it('stops projecting legacy state after disposal', () => {
    const context = createSessionContextStore();
    const bridge = createLegacySessionBridge(context);
    bridge.dispose();

    bridge.sync({ status: 'authenticated', authenticated: true, user: { id: 'user-a' } });

    assert.equal(context.snapshot().status, 'anonymous');
  });
});
