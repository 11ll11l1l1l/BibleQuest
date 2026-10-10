/** BibleQuest V7 shared motion contract, owned by Lane D.
 * All actions remain synchronous; animations are disposable enhancements.
 * Library and ONE 2 ONE components consume these functions from their lanes.
 */
export const V7_MOTION_API_VERSION = 1;
export const V7_MOTION_TOKENS = Object.freeze({
  micro: 150, standard: 220, page: 300, card: 280, settle: 280,
  ease: 'cubic-bezier(.2,.8,.2,1)',
  springEase: 'cubic-bezier(.22,1.2,.36,1)',
});
const running = new WeakMap();
const noop = () => {};

export function motionEnabled(environment = {}) {
  const doc = environment.document ?? globalThis.document;
  const preference = doc?.documentElement?.dataset?.bqEffectiveMotion
    || doc?.documentElement?.dataset?.bqMotion;
  if (preference === 'reduce' || preference === 'off') return false;
  const media = environment.matchMedia ?? globalThis.matchMedia;
  if (typeof media === 'function') {
    try { if (media('(prefers-reduced-motion: reduce)').matches) return false; }
    catch { return false; }
  }
  return true;
}
export function cleanupMotion(element) {
  const stop = element && running.get(element);
  if (typeof stop === 'function') stop();
}
function run(element, frames, duration, easing, options = {}) {
  if (!element) return noop;
  cleanupMotion(element);
  const environment = options.environment || {};
  if (typeof element.animate !== 'function' ||
    !motionEnabled(environment)) return noop;
  let animation;
  try {
    animation = element.animate(frames, { duration, easing, fill: 'none' });
  } catch { return noop; }
  if (!animation || typeof animation.cancel !== 'function') return noop;

  const doc = environment.document ?? globalThis.document;
  const teardown = [];
  const detach = () => {
    for (const dispose of teardown.splice(0)) {
      try { dispose(); } catch { /* Passive cleanup never blocks navigation. */ }
    }
  };
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    detach();
    if (running.get(element) === stop) running.delete(element);
    try { animation.cancel(); } catch {}
  };
  const settled = () => {
    detach();
    if (running.get(element) === stop) running.delete(element);
  };
  running.set(element, stop);

  // Motion preference may change while an effect is in progress (including
  // the in-app accessibility selector). Do not retain an animation until
  // the next click, and detach every observer on cancellation/completion.
  const onPreference = () => {
    if (doc?.hidden || !motionEnabled(environment)) stop();
  };
  try {
    const query = environment.matchMedia ?? globalThis.matchMedia;
    const media = typeof query === 'function'
      ? query('(prefers-reduced-motion: reduce)') : null;
    if (typeof media?.addEventListener === 'function') {
      media.addEventListener('change', onPreference);
      teardown.push(() => media.removeEventListener('change', onPreference));
    } else if (typeof media?.addListener === 'function') {
      media.addListener(onPreference);
      teardown.push(() => media.removeListener(onPreference));
    }
    const Observer = environment.MutationObserver
      ?? doc?.defaultView?.MutationObserver ?? globalThis.MutationObserver;
    if (typeof Observer === 'function' && doc?.documentElement) {
      const observer = new Observer(onPreference);
      observer.observe(doc.documentElement, {
        attributes: true, attributeFilter: ['data-bq-effective-motion', 'data-bq-motion'],
      });
      teardown.push(() => observer.disconnect());
    }
    if (typeof doc?.addEventListener === 'function') {
      doc.addEventListener('visibilitychange', onPreference);
      teardown.push(() => doc.removeEventListener('visibilitychange', onPreference));
    }
  } catch {
    // A failing optional observer does not disable the primary control.
    detach();
  }
  // Never let WAAPI control visibility, focus, route changes or action timing.
  Promise.resolve(animation.finished).then(settled, settled);
  onPreference();
  return stop;
}
export function pressFeedback(element, options) {
  return run(element, [
    { transform: 'scale(1)' }, { transform: 'scale(.97)' },
    { transform: 'scale(1)' }
  ], V7_MOTION_TOKENS.micro, V7_MOTION_TOKENS.ease, options);
}
export function pageTransition(element, options) {
  return run(element, [
    { opacity: .94, transform: 'translateY(6px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], V7_MOTION_TOKENS.page, V7_MOTION_TOKENS.ease, options);
}
export function cardReveal(element, options) {
  return run(element, [
    { opacity: .9, transform: 'translateY(5px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], V7_MOTION_TOKENS.card, V7_MOTION_TOKENS.ease, options);
}
export function deckSpring(element, { delta = 0, environment } = {}) {
  const safeDelta = Math.max(-48, Math.min(48, Number(delta) || 0));
  return run(element, [
    { transform: `translateX(${safeDelta}px)` },
    { transform: 'translateX(0)' }
  ], V7_MOTION_TOKENS.settle, V7_MOTION_TOKENS.springEase, { environment });
}
