const STORAGE_KEY = 'accessibility-settings';
const TEXT_OPTIONS = new Set(['normal', 'large', 'xlarge']);
const MOTION_OPTIONS = new Set(['system', 'reduce', 'full']);
const CONTRAST_OPTIONS = new Set(['normal', 'strong']);
const DEFAULTS = Object.freeze({ text: 'normal', motion: 'system', contrast: 'normal' });

const normalized = value => Object.freeze({
  text: TEXT_OPTIONS.has(value?.text) ? value.text : DEFAULTS.text,
  motion: MOTION_OPTIONS.has(value?.motion) ? value.motion : DEFAULTS.motion,
  contrast: CONTRAST_OPTIONS.has(value?.contrast) ? value.contrast : DEFAULTS.contrast
});

const defaultMediaQuery = () => {
  try {
    return typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false };
  } catch {
    return { matches: false };
  }
};

export function createAccessibilityService({ storage, mediaQuery = defaultMediaQuery() } = {}) {
  if (!storage?.read || !storage?.write) throw new Error('Accessibility requires the shared storage service.');
  const subscribers = new Set();
  let disposed = false;
  let state;
  try { state = normalized(storage.read(STORAGE_KEY, DEFAULTS)); }
  catch { state = normalized(DEFAULTS); }

  const snapshot = () => {
    const reducedMotion = state.motion === 'reduce' || (state.motion === 'system' && Boolean(mediaQuery?.matches));
    return Object.freeze({ ...state, reducedMotion, effectiveMotion: reducedMotion ? 'reduce' : 'full' });
  };
  const ensureActive = () => { if (disposed) throw new Error('Accessibility service is disposed.'); };
  const publish = () => {
    const value = snapshot();
    subscribers.forEach(subscriber => subscriber(value));
    return value;
  };
  const save = next => {
    ensureActive();
    state = normalized(next);
    storage.write(STORAGE_KEY, state);
    return publish();
  };
  const choose = (field, value, allowed) => {
    if (!allowed.has(value)) throw new Error(`Unsupported accessibility ${field}: ${value}.`);
    return save({ ...state, [field]: value });
  };
  const onMotionPreferenceChange = () => {
    if (!disposed && state.motion === 'system') publish();
  };
  mediaQuery?.addEventListener?.('change', onMotionPreferenceChange);

  return Object.freeze({
    getState() { return snapshot(); },
    subscribe(subscriber) {
      ensureActive();
      if (typeof subscriber !== 'function') throw new Error('Accessibility subscriber must be a function.');
      subscribers.add(subscriber);
      subscriber(snapshot());
      return () => subscribers.delete(subscriber);
    },
    setText(value) { return choose('text', value, TEXT_OPTIONS); },
    setMotion(value) { return choose('motion', value, MOTION_OPTIONS); },
    setContrast(value) { return choose('contrast', value, CONTRAST_OPTIONS); },
    reset() { return save(DEFAULTS); },
    dispose() {
      if (disposed) return;
      disposed = true;
      subscribers.clear();
      mediaQuery?.removeEventListener?.('change', onMotionPreferenceChange);
    }
  });
}
