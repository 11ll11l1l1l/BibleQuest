import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAccountResumeCoordinator, createSessionContextStore } from '../../src/v6/kernel/index.ts';

const identity = (userId: string) => ({ userId, email: `${userId}@example.test` });

describe('account resume coordinator', () => {
  it('resumes owners independently when one owner rejects', async () => {
    const session = createSessionContextStore();
    let goodCalls = 0;
    let badCalls = 0;
    const good = { key: 'progress', syncNow: async () => { goodCalls += 1; return 'ok'; } };
    const bad = { key: 'journey', syncNow: async () => { badCalls += 1; throw new Error('offline'); } };
    const coordinator = createAccountResumeCoordinator(session, [good, bad]);

    session.setAuthenticated(identity('user-a'));
    const result = await coordinator.resumeCurrentAccount();

    assert.equal(result?.userId, 'user-a');
    assert.equal(result?.current, true);
    assert.deepEqual(result?.settled.map((row) => row.status), ['fulfilled', 'rejected']);
    assert.equal(goodCalls, 1);
    assert.equal(badCalls, 1);
    coordinator.dispose();
  });

  it('marks a slow previous-account resume stale after account switch', async () => {
    const session = createSessionContextStore();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const owner = { key: 'weekly-journey', syncNow: () => wait };
    const coordinator = createAccountResumeCoordinator(session, [owner]);

    session.setAuthenticated(identity('user-a'));
    const pending = coordinator.resumeCurrentAccount();
    session.setAuthenticated(identity('user-b'));
    release();

    const result = await pending;
    assert.equal(result?.userId, 'user-a');
    assert.equal(result?.current, false);
    coordinator.dispose();
  });

  it('clears previous-account local slices before a direct authenticated account switch', async () => {
    const session = createSessionContextStore();
    let guestSwitches = 0;
    let syncCalls = 0;
    const coordinator = createAccountResumeCoordinator(session, [
      {
        key: 'progress',
        syncNow: async () => { syncCalls += 1; },
        switchToGuest: () => { guestSwitches += 1; },
      },
    ]);

    session.setAuthenticated(identity('user-a'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    session.setAuthenticated(identity('user-b'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(guestSwitches, 1);
    assert.equal(syncCalls, 2);
    coordinator.dispose();
  });

  it('clears account-owned local slices on sign-out without remote writes', () => {
    const session = createSessionContextStore();
    let guestSwitches = 0;
    const coordinator = createAccountResumeCoordinator(session, [
      { key: 'progress', syncNow: async () => undefined, switchToGuest: () => { guestSwitches += 1; } },
    ]);

    session.setAuthenticated(identity('user-a'));
    session.clear();

    assert.equal(guestSwitches, 1);
    coordinator.dispose();
  });

  it('rejects duplicate owner keys to keep durable slices unambiguous', () => {
    const session = createSessionContextStore();
    const owner = { key: 'progress', syncNow: async () => undefined };
    assert.throws(
      () => createAccountResumeCoordinator(session, [owner, owner]),
      /Duplicate account resume owner key/,
    );
  });
});
