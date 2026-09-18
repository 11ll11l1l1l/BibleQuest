export interface BadgeNavigator {
  readonly setAppBadge?: (count?: number) => Promise<void> | void;
  readonly clearAppBadge?: () => Promise<void> | void;
}

export function createBadgeAdapter(navigatorLike: BadgeNavigator | null | undefined) {
  const supported = typeof navigatorLike?.setAppBadge === 'function' && typeof navigatorLike?.clearAppBadge === 'function';
  return Object.freeze({
    supported,
    async set(count: number): Promise<boolean> {
      if (!supported) return false;
      const safeCount = Math.max(0, Math.min(999, Math.floor(Number(count) || 0)));
      try {
        if (safeCount === 0) await navigatorLike!.clearAppBadge!();
        else await navigatorLike!.setAppBadge!(safeCount);
        return true;
      } catch {
        return false;
      }
    },
    async clear(): Promise<boolean> {
      if (!supported) return false;
      try {
        await navigatorLike!.clearAppBadge!();
        return true;
      } catch {
        return false;
      }
    },
  });
}
