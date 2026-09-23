import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLegacyAccountResumeRuntime } from '../../src/v6/kernel/legacy-account-resume-runtime.ts';

const authenticated = (id: string) => ({
  status: 'authenticated',
  authenticated: true,
  user: { id, email: `${id}@example.test` },
});

describe('legacy account resume runtime', () => {
  it('resumes independent owners once for repeated authenticated publications', async () => {
    let progressCalls = 0;
    let journeyCalls = 0;
    let refreshCalls = 0;
    const runtime = createLegacyAccountResumeRuntime([
      { key: 'progress', syncNow: async () => { progressCalls += 1; } },
      { key: 'weekly-journey', syncNow: async () => { journeyCalls += 1; } },
    ], () => { refreshCalls += 1; });

    runtime.syncSession(authenticated('user-a'));
    runtime.syncSession(authenticated('user-a'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(progressCalls, 1);
    assert.equal(journeyCalls, 1);
    assert.equal(refreshCalls, 1);
    runtime.dispose();
  });

  it('keeps successful account owners resumable when another owner is offline', async () => {
    let progressCalls = 0;
    let refreshCalls = 0;
    const runtime = createLegacyAccountResumeRuntime([
      { key: 'progress', syncNow: async () => { progressCalls += 1; } },
      { key: 'weekly-journey', syncNow: async () => { throw new Error('offline'); } },
    ], () => { refreshCalls += 1; });

    runtime.syncSession(authenticated('user-a'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(progressCalls, 1);
    assert.equal(refreshCalls, 1);
    runtime.dispose();
  });

  it('switches account-owned slices to guest on sign-out', async () => {
    let guestSwitches = 0;
    const runtime = createLegacyAccountResumeRuntime([
      { key: 'progress', syncNow: async () => undefined, switchToGuest: () => { guestSwitches += 1; } },
    ]);

    runtime.syncSession(authenticated('user-a'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    runtime.syncSession({ status: 'anonymous', authenticated: false, user: null });

    assert.equal(guestSwitches, 1);
    runtime.dispose();
  });
});
