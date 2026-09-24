import { describe, expect, it, vi } from 'vitest';
import { appBadgeCapability, clearAppBadge, setAppBadge } from '../../src/app/app-badge.js';

describe('app badge client seam', () => {
  it('reports native capability without assuming support', () => {
    expect(appBadgeCapability({})).toEqual({ set: false, clear: false });
    expect(appBadgeCapability({ setAppBadge() {}, clearAppBadge() {} })).toEqual({
      set: true,
      clear: true,
    });
  });

  it('sets a normalized positive badge count', async () => {
    const setAppBadgeNative = vi.fn().mockResolvedValue(undefined);
    const result = await setAppBadge(3.9, { setAppBadge: setAppBadgeNative });

    expect(setAppBadgeNative).toHaveBeenCalledWith(3);
    expect(result).toEqual({ status: 'set', count: 3 });
  });

  it('clears for zero or invalid counts without calling setAppBadge', async () => {
    const setAppBadgeNative = vi.fn().mockResolvedValue(undefined);
    const clearAppBadgeNative = vi.fn().mockResolvedValue(undefined);
    const navigatorLike = {
      setAppBadge: setAppBadgeNative,
      clearAppBadge: clearAppBadgeNative,
    };

    expect(await setAppBadge(0, navigatorLike)).toEqual({ status: 'cleared', count: 0 });
    expect(await setAppBadge(Number.NaN, navigatorLike)).toEqual({ status: 'cleared', count: 0 });
    expect(setAppBadgeNative).not.toHaveBeenCalled();
    expect(clearAppBadgeNative).toHaveBeenCalledTimes(2);
  });

  it('fails closed when badge APIs are unsupported', async () => {
    expect(await setAppBadge(4, {})).toEqual({ status: 'unsupported', count: 4 });
    expect(await clearAppBadge({})).toEqual({ status: 'unsupported' });
  });

  it('contains native failures and does not invent badge state', async () => {
    const navigatorLike = {
      setAppBadge: vi.fn().mockRejectedValue(new Error('denied')),
      clearAppBadge: vi.fn().mockRejectedValue(new Error('denied')),
    };

    expect(await setAppBadge(2, navigatorLike)).toEqual({ status: 'failed', count: 2 });
    expect(await clearAppBadge(navigatorLike)).toEqual({ status: 'failed' });
  });
});
