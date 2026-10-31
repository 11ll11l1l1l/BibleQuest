// Optional, user-requested foreground convenience. Never a background alarm.
export function createPracticeWakeLock({ request = () => globalThis.navigator?.wakeLock?.request('screen') } = {}) {
  let sentinel = null, generation = 0;
  async function release() {
    generation++;
    const previous = sentinel;
    sentinel = null;
    try { await previous?.release(); } catch { /* the browser may already have released it */ }
  }
  async function acquire() {
    const token = ++generation, previous = sentinel;
    sentinel = null;
    try { await previous?.release(); } catch {}
    if (token !== generation) return false;
    const next = await request();
    if (!next) throw new Error('Keep-screen-awake is not supported in this browser.');
    if (token !== generation) { try { await next.release(); } catch {} return false; }
    sentinel = next;
    return true;
  }
  return Object.freeze({ acquire, release, isActive: () => Boolean(sentinel && !sentinel.released) });
}
