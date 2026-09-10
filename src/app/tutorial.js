const STORAGE_KEY = 'tutorial-onboarding';
const VERSION = 1;
export const TUTORIAL_STEP_COUNT = 6;

function normalizeStored(value) {
  if (!value || typeof value !== 'object') return Object.freeze({ completed: false, completedAt: '' });
  return Object.freeze({
    completed: value.completed === true,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : ''
  });
}

const clampStep = value => Math.max(0, Math.min(TUTORIAL_STEP_COUNT - 1, Number.isFinite(Number(value)) ? Number(value) : 0));

export function createTutorialService({ storage, now = () => new Date().toISOString() } = {}) {
  if (!storage?.read || !storage?.write) throw new Error('Tutorial service requires the shared storage boundary.');

  const subscribers = new Set();
  let persisted = normalizeStored(storage.read(STORAGE_KEY, null));
  let active = false;
  let step = 0;

  const snapshot = () => Object.freeze({
    active,
    step,
    totalSteps: TUTORIAL_STEP_COUNT,
    completed: persisted.completed,
    completedAt: persisted.completedAt,
    canBack: active && step > 0,
    isLast: step === TUTORIAL_STEP_COUNT - 1
  });

  const publish = () => {
    const value = snapshot();
    subscribers.forEach(subscriber => subscriber(value));
    return value;
  };

  function open({ force = false, step: requestedStep = 0 } = {}) {
    if (persisted.completed && !force) return snapshot();
    active = true;
    step = clampStep(requestedStep);
    return publish();
  }

  function back() {
    if (!active || step === 0) return snapshot();
    step -= 1;
    return publish();
  }

  function next() {
    if (!active || step >= TUTORIAL_STEP_COUNT - 1) return snapshot();
    step += 1;
    return publish();
  }

  function skip() {
    if (!active) return snapshot();
    active = false;
    return publish();
  }

  function finish() {
    const completedAt = String(now());
    persisted = normalizeStored(storage.write(STORAGE_KEY, { version: VERSION, completed: true, completedAt }));
    active = false;
    step = TUTORIAL_STEP_COUNT - 1;
    return publish();
  }

  return Object.freeze({
    getState: snapshot,
    subscribe(subscriber) {
      if (typeof subscriber !== 'function') throw new Error('Tutorial subscriber must be a function.');
      subscribers.add(subscriber);
      subscriber(snapshot());
      return () => subscribers.delete(subscriber);
    },
    open,
    back,
    next,
    skip,
    finish
  });
}
