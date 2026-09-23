import { describe, expect, it, vi } from 'vitest';
import { createAccountResumeCoordinator, createSessionContextStore } from '../../src/v6/kernel/index.ts';

const identity = (userId: string) => ({ userId, email: `${userId}@example.test` });

describe('account resume coordinator', () => {
  it('resumes owners independently when one owner rejects', async () => {
    const session = createSessionContextStore();
    const good = { key: 'progress', syncNow: vi.fn(async () => 'ok') };
    const bad = { key: 'journey', syncNow: vi.fn(async () => Promise.reject(new Error('offline'))) };
    const coordinator = createAccountResumeCoordinator(session, [good, bad]);

    session.setAuthenticated(identity('user-a'));
    const result = await coordinator.resumeCurrentAccount();

    expect(result?.userId).toBe('user-a');
    expect(result?.current).toBe(true);
    expect(result?.settled.map((row) => row.status)).toEqual(['fulfilled', 'rejected']);
    expect(good.syncNow).toHaveBeenCalled();
    expect(bad.syncNow).toHaveBeenCalled();
    coordinator.dispose();
  });

  it('marks a slow previous-account resume stale after account switch', async () => {
    const session = createSessionContextStore();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const owner = { key: 'weekly-journey', syncNow: vi.fn(() => wait) };
    const coordinator = createAccountResumeCoordinator(session, [owner]);

    session.setAuthenticated(identity('user-a'));
    const pending = coordinator.resumeCurrentAccount();
    session.setAuthenticated(identity('user-b'));
    release();

    const result = await pending;
    expect(result?.userId).toBe('user-a');
    expect(result?.current).toBe(false);
    coordinator.dispose();
  });

  it('clears account-owned local slices on sign-out without remote writes', () => {
    const session = createSessionContextStore();
    const switchToGuest = vi.fn();
    const coordinator = createAccountResumeCoordinator(session, [
      { key: 'progress', syncNow: vi.fn(async () => undefined), switchToGuest },
    ]);

    session.setAuthenticated(identity('user-a'));
    session.clear();

    expect(switchToGuest).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });

  it('rejects duplicate owner keys to keep durable slices unambiguous', () => {
    const session = createSessionContextStore();
    const owner = { key: 'progress', syncNow: vi.fn(async () => undefined) };
    expect(() => createAccountResumeCoordinator(session, [owner, owner])).toThrow(/Duplicate account resume owner key/);
  });
});
