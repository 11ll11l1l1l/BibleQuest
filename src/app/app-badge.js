const normalizeBadgeCount = (count) => {
  const numeric = Number(count);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(numeric));
};

export const appBadgeCapability = (navigatorLike = globalThis.navigator) => ({
  set: typeof navigatorLike?.setAppBadge === 'function',
  clear: typeof navigatorLike?.clearAppBadge === 'function',
});

export const setAppBadge = async (count, navigatorLike = globalThis.navigator) => {
  const normalized = normalizeBadgeCount(count);
  const capability = appBadgeCapability(navigatorLike);

  if (normalized === 0) {
    if (!capability.clear) return { status: 'unsupported', count: 0 };
    try {
      await navigatorLike.clearAppBadge();
      return { status: 'cleared', count: 0 };
    } catch {
      return { status: 'failed', count: 0 };
    }
  }

  if (!capability.set) return { status: 'unsupported', count: normalized };
  try {
    await navigatorLike.setAppBadge(normalized);
    return { status: 'set', count: normalized };
  } catch {
    return { status: 'failed', count: normalized };
  }
};

export const clearAppBadge = async (navigatorLike = globalThis.navigator) => {
  if (!appBadgeCapability(navigatorLike).clear) return { status: 'unsupported' };
  try {
    await navigatorLike.clearAppBadge();
    return { status: 'cleared' };
  } catch {
    return { status: 'failed' };
  }
};
