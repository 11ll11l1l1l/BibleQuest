const STORAGE_KEY = 'lesson-sessions';
const STORE_VERSION = 1;
const STEP_TYPES = new Set(['content', 'choice', 'confirm', 'text']);
const ID_RE = /^[a-z0-9][a-z0-9._:-]{0,119}$/i;

const cleanText = (value, label, max = 4000, allowEmpty = false) => {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  const text = value.trim();
  if (!allowEmpty && !text) throw new Error(`${label} is required.`);
  if (text.length > max) throw new Error(`${label} is too long.`);
  return text;
};

function normalizeDefinition(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Lesson definition is required.');
  const id = String(input.id || '');
  if (!ID_RE.test(id)) throw new Error('Lesson definition requires a stable id.');
  const version = Number(input.version ?? 1);
  if (!Number.isSafeInteger(version) || version < 1 || version > 1000000) throw new Error('Lesson definition version must be a positive integer.');
  const title = input.title == null ? id : cleanText(input.title, 'Lesson title', 160);
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 100) throw new Error('Lesson definition must contain 1 to 100 steps.');
  const seen = new Set();
  const steps = input.steps.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Lesson step ${index + 1} is invalid.`);
    const stepId = String(raw.id || '');
    if (!ID_RE.test(stepId) || seen.has(stepId)) throw new Error(`Lesson step ${index + 1} requires a unique stable id.`);
    seen.add(stepId);
    const type = String(raw.type || '');
    if (!STEP_TYPES.has(type)) throw new Error(`Lesson step ${stepId} has unsupported type ${type || 'missing'}.`);
    const prompt = cleanText(raw.prompt, `Lesson step ${stepId} prompt`, 4000);
    const reference = raw.reference == null ? '' : cleanText(raw.reference, `Lesson step ${stepId} reference`, 300, true);
    const feedback = {};
    if (raw.feedback != null) {
      if (typeof raw.feedback !== 'object' || Array.isArray(raw.feedback)) throw new Error(`Lesson step ${stepId} feedback must be an object.`);
      for (const key of ['correct', 'incorrect', 'response']) if (raw.feedback[key] != null) feedback[key] = cleanText(raw.feedback[key], `Lesson step ${stepId} feedback`, 1200, true);
    }
    const base = { id: stepId, type, prompt, reference, feedback };
    if (type === 'choice') {
      if (!Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > 12) throw new Error(`Choice step ${stepId} requires 2 to 12 choices.`);
      const choices = raw.choices.map((choice, choiceIndex) => cleanText(choice, `Choice ${choiceIndex + 1} for ${stepId}`, 500));
      let answer = null;
      if (raw.answer != null) {
        answer = Number(raw.answer);
        if (!Number.isSafeInteger(answer) || answer < 0 || answer >= choices.length) throw new Error(`Choice step ${stepId} has an invalid answer index.`);
      }
      return Object.freeze({ ...base, choices: Object.freeze(choices), answer });
    }
    if (type === 'text') {
      const maxLength = Number(raw.maxLength ?? 2000);
      if (!Number.isSafeInteger(maxLength) || maxLength < 1 || maxLength > 10000) throw new Error(`Text step ${stepId} has an invalid maxLength.`);
      return Object.freeze({ ...base, maxLength });
    }
    return Object.freeze(base);
  });
  return Object.freeze({ id, version, title, steps: Object.freeze(steps) });
}

function emptyStore() {
  return { version: STORE_VERSION, sessions: {} };
}

function normalizeStore(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Number(input.version) !== STORE_VERSION || !input.sessions || typeof input.sessions !== 'object' || Array.isArray(input.sessions)) return emptyStore();
  return { version: STORE_VERSION, sessions: { ...input.sessions } };
}

const safeIso = value => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Lesson clock returned an invalid time.');
  return date.toISOString();
};

const persistedIso = value => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

function cloneResponse(value) {
  if (Array.isArray(value)) return Object.freeze([...value]);
  return value;
}

function publicStep(step) {
  if (!step) return null;
  const out = { id: step.id, type: step.type, prompt: step.prompt, reference: step.reference };
  if (step.type === 'choice') out.choices = Object.freeze([...step.choices]);
  if (step.type === 'text') out.maxLength = step.maxLength;
  return Object.freeze(out);
}

function freezeSession(session, definition) {
  const responses = {};
  for (const [key, value] of Object.entries(session.responses || {})) responses[key] = cloneResponse(value);
  const feedback = {};
  for (const [key, value] of Object.entries(session.feedback || {})) feedback[key] = Object.freeze({ ...value });
  const currentStep = session.status === 'complete' ? null : publicStep(definition.steps[session.index]);
  return Object.freeze({
    lessonId: definition.id,
    definitionVersion: definition.version,
    title: definition.title,
    status: session.status,
    index: session.index,
    totalSteps: definition.steps.length,
    currentStep,
    responses: Object.freeze(responses),
    feedback: Object.freeze(feedback),
    score: Object.freeze({ ...session.score }),
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt || null
  });
}

function normalizeResponse(step, value) {
  if (step.type === 'choice') {
    const choice = Number(value);
    if (!Number.isSafeInteger(choice) || choice < 0 || choice >= step.choices.length) throw new Error('Choose one available answer.');
    return choice;
  }
  if (step.type === 'confirm') {
    if (value !== true) throw new Error('Confirm this step before continuing.');
    return true;
  }
  if (step.type === 'text') return cleanText(String(value ?? ''), 'Lesson response', step.maxLength);
  throw new Error('This lesson step does not accept a response.');
}

function feedbackFor(step, response) {
  if (step.type === 'choice' && step.answer != null) {
    const correct = response === step.answer;
    return { correct, message: correct ? (step.feedback.correct || '') : (step.feedback.incorrect || ''), reference: step.reference };
  }
  return { correct: null, message: step.feedback.response || '', reference: step.reference };
}

function responseEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function restorable(raw, definition) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Number(raw.definitionVersion) !== definition.version) return null;
  if (!['active', 'complete'].includes(raw.status)) return null;
  if (!Number.isSafeInteger(raw.index) || raw.index < 0 || raw.index >= definition.steps.length) return null;
  if (raw.status === 'complete' && raw.index !== definition.steps.length - 1) return null;
  if (!raw.responses || typeof raw.responses !== 'object' || Array.isArray(raw.responses)) return null;
  const startedAt = persistedIso(raw.startedAt);
  const updatedAt = persistedIso(raw.updatedAt);
  const completedAt = raw.status === 'complete' ? persistedIso(raw.completedAt) : null;
  if (!startedAt || !updatedAt || (raw.status === 'complete' && !completedAt)) return null;
  const responses = {};
  const feedback = {};
  try {
    for (const [stepId, value] of Object.entries(raw.responses)) {
      const stepIndex = definition.steps.findIndex(step => step.id === stepId);
      if (stepIndex < 0 || stepIndex > raw.index || definition.steps[stepIndex].type === 'content') return null;
      const normalized = normalizeResponse(definition.steps[stepIndex], value);
      responses[stepId] = normalized;
      feedback[stepId] = feedbackFor(definition.steps[stepIndex], normalized);
    }
  } catch { return null; }
  if (raw.status === 'active') {
    const current = definition.steps[raw.index];
    for (let index = 0; index < raw.index; index++) if (definition.steps[index].type !== 'content' && !(definition.steps[index].id in responses)) return null;
    if (current.type === 'content' && current.id in responses) return null;
  } else {
    for (const step of definition.steps) if (step.type !== 'content' && !(step.id in responses)) return null;
  }
  const evaluatedFeedback = Object.values(feedback).filter(item => typeof item.correct === 'boolean');
  const score = { answered: Object.keys(responses).length, evaluated: evaluatedFeedback.length, correct: evaluatedFeedback.filter(item => item.correct).length };
  return { definitionVersion: definition.version, status: raw.status, index: raw.index, responses, feedback, score, startedAt, updatedAt, completedAt };
}

export function createLessonEngine({ storage, clock = () => new Date() }) {
  if (!storage) throw new Error('Lesson engine requires the storage boundary.');
  let bucket = normalizeStore(storage.read(STORAGE_KEY, emptyStore()));
  let activeDefinition = null;

  const currentSession = () => activeDefinition ? bucket.sessions[activeDefinition.id] : null;
  const requireActive = () => {
    const session = currentSession();
    if (!activeDefinition || !session) throw new Error('Open a lesson before using the lesson engine.');
    return session;
  };
  const commit = nextSession => {
    const nextBucket = { version: STORE_VERSION, sessions: { ...bucket.sessions, [activeDefinition.id]: nextSession } };
    storage.write(STORAGE_KEY, nextBucket);
    bucket = nextBucket;
    return freezeSession(nextSession, activeDefinition);
  };
  const fresh = definition => {
    const now = safeIso(clock());
    return { definitionVersion: definition.version, status: 'active', index: 0, responses: {}, feedback: {}, score: { answered: 0, evaluated: 0, correct: 0 }, startedAt: now, updatedAt: now, completedAt: null };
  };

  function open(input, options = {}) {
    const definition = normalizeDefinition(input);
    const restart = options?.restart === true;
    const restored = restart ? null : restorable(bucket.sessions[definition.id], definition);
    if (restored) {
      activeDefinition = definition;
      return Object.freeze({ resumed: true, state: freezeSession(restored, definition) });
    }
    const nextSession = fresh(definition);
    const nextBucket = { version: STORE_VERSION, sessions: { ...bucket.sessions, [definition.id]: nextSession } };
    storage.write(STORAGE_KEY, nextBucket);
    bucket = nextBucket;
    activeDefinition = definition;
    return Object.freeze({ resumed: false, state: freezeSession(nextSession, definition) });
  }

  function getState() {
    const session = requireActive();
    return freezeSession(session, activeDefinition);
  }

  function respond(value) {
    const session = requireActive();
    if (session.status === 'complete') throw new Error('This lesson is already complete.');
    const step = activeDefinition.steps[session.index];
    const normalized = normalizeResponse(step, value);
    if (step.id in session.responses) {
      if (!responseEqual(session.responses[step.id], normalized)) throw new Error('This lesson step is already answered.');
      return Object.freeze({ applied: false, duplicate: true, feedback: Object.freeze({ ...session.feedback[step.id] }), state: getState() });
    }
    const feedback = feedbackFor(step, normalized);
    const evaluated = typeof feedback.correct === 'boolean';
    const now = safeIso(clock());
    const next = {
      ...session,
      responses: { ...session.responses, [step.id]: normalized },
      feedback: { ...session.feedback, [step.id]: feedback },
      score: {
        answered: session.score.answered + 1,
        evaluated: session.score.evaluated + (evaluated ? 1 : 0),
        correct: session.score.correct + (feedback.correct === true ? 1 : 0)
      },
      updatedAt: now
    };
    return Object.freeze({ applied: true, duplicate: false, feedback: Object.freeze({ ...feedback }), state: commit(next) });
  }

  function advance() {
    const session = requireActive();
    if (session.status === 'complete') return Object.freeze({ completed: true, duplicate: true, state: getState() });
    const step = activeDefinition.steps[session.index];
    if (step.type !== 'content' && !(step.id in session.responses)) throw new Error('Complete the current lesson step before continuing.');
    const now = safeIso(clock());
    if (session.index === activeDefinition.steps.length - 1) {
      const next = { ...session, status: 'complete', updatedAt: now, completedAt: now };
      const state = commit(next);
      return Object.freeze({ completed: true, duplicate: false, state, completion: Object.freeze({ lessonId: activeDefinition.id, definitionVersion: activeDefinition.version, score: state.score, responses: state.responses, completedAt: state.completedAt }) });
    }
    const next = { ...session, index: session.index + 1, updatedAt: now };
    return Object.freeze({ completed: false, duplicate: false, state: commit(next) });
  }

  function restart() {
    if (!activeDefinition) throw new Error('Open a lesson before restarting it.');
    return Object.freeze({ resumed: false, state: commit(fresh(activeDefinition)) });
  }

  function close() {
    activeDefinition = null;
  }

  function clear(lessonId) {
    const id = String(lessonId || '');
    if (!ID_RE.test(id)) throw new Error('A valid lesson id is required.');
    if (!(id in bucket.sessions)) return false;
    const sessions = { ...bucket.sessions };
    delete sessions[id];
    const nextBucket = { version: STORE_VERSION, sessions };
    storage.write(STORAGE_KEY, nextBucket);
    bucket = nextBucket;
    if (activeDefinition?.id === id) activeDefinition = null;
    return true;
  }

  return Object.freeze({ open, getState, respond, advance, restart, close, clear });
}
