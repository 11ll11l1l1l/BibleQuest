function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function identifier(value) {
  const id = String(value ?? '').trim();
  if (!id) fail('BQ_ASSIGNMENT_SELECTION', 'Choose a valid ONE 2 ONE assignment target.');
  return id;
}

function initial() {
  return Object.freeze({
    status: 'idle',
    pairs: Object.freeze([]),
    curriculum: Object.freeze([]),
    selected: Object.freeze({ pairId: null, trackId: null, moduleId: null, lessonId: null }),
    error: null,
  });
}

function freezeRows(rows) {
  return Object.freeze([...(Array.isArray(rows) ? rows : [])]);
}

// Read-only assignment/start preparation. The authoritative assignment mutation
// must remain a race-safe backend boundary (V7 issue #1170).
export function createAssignmentPreparation({ discipleship, getActorId }) {
  if (!discipleship?.listPairs || !discipleship?.loadCurriculum) {
    throw new TypeError('Assignment preparation requires the existing discipleship service.');
  }
  if (typeof getActorId !== 'function') {
    throw new TypeError('Assignment preparation requires the existing authenticated actor owner.');
  }

  let generation = 0;
  let disposed = false;
  let state = initial();
  const listeners = new Set();

  const actor = () => identifier(getActorId());
  const current = token => !disposed && token === generation;
  const publish = patch => {
    if (disposed) return state;
    state = Object.freeze({ ...state, ...patch });
    for (const listener of listeners) listener(state);
    return state;
  };
  const selection = patch => Object.freeze({ ...state.selected, ...patch });
  const ensureActor = expected => {
    if (actor() !== expected) fail('BQ_ASSIGNMENT_CONTEXT_STALE', 'Account changed. Reload assignment preparation.');
  };

  async function operation(status, work, { preserve = true } = {}) {
    const token = ++generation;
    const previous = state;
    publish({ status, error: null });
    try {
      const patch = await work(token);
      if (!current(token)) return state;
      return publish({ status: 'ready', error: null, ...patch });
    } catch (error) {
      if (!current(token)) return state;
      const base = preserve ? previous : initial();
      state = Object.freeze({ ...base, status: 'error', error: error?.message || 'Assignment preparation failed.' });
      for (const listener of listeners) listener(state);
      return state;
    }
  }

  function mentorPairs(rows, actorId) {
    if (!Array.isArray(rows)) fail('BQ_ASSIGNMENT_RESPONSE', 'ONE 2 ONE pair list was invalid.');
    const seen = new Set();
    const allowed = [];
    for (const pair of rows) {
      const id = identifier(pair?.id);
      if (seen.has(id)) fail('BQ_ASSIGNMENT_RESPONSE', 'ONE 2 ONE pair list contained duplicates.');
      seen.add(id);
      if (pair?.state === 'active' && String(pair?.mentorId ?? '') === actorId) allowed.push(pair);
    }
    return freezeRows(allowed);
  }

  function pairById(pairId) {
    const id = identifier(pairId);
    const pair = state.pairs.find(item => item.id === id);
    if (!pair) fail('BQ_ASSIGNMENT_PAIR', 'Choose an active mentee pair before preparing an assignment.');
    return pair;
  }

  function trackById(trackId) {
    const id = identifier(trackId);
    const row = state.curriculum.find(item => item.id === id);
    if (!row) fail('BQ_ASSIGNMENT_CURRICULUM', 'Choose a published track from the selected pair curriculum.');
    return row;
  }

  function moduleById(track, moduleId) {
    const id = identifier(moduleId);
    const row = track.modules?.find(item => item.id === id);
    if (!row) fail('BQ_ASSIGNMENT_CURRICULUM', 'Choose a published module from the selected track.');
    return row;
  }

  function lessonById(module, lessonId) {
    const id = identifier(lessonId);
    const row = module.lessons?.find(item => item.id === id);
    if (!row?.revisionId) fail('BQ_ASSIGNMENT_CURRICULUM', 'Choose a published lesson revision from the selected module.');
    return row;
  }

  async function loadPairs() {
    const actorId = actor();
    return operation('loading', async () => {
      const rows = await discipleship.listPairs();
      ensureActor(actorId);
      return {
        pairs: mentorPairs(rows, actorId),
        curriculum: Object.freeze([]),
        selected: Object.freeze({ pairId: null, trackId: null, moduleId: null, lessonId: null }),
      };
    }, { preserve: false });
  }

  async function selectPair(pairId) {
    const pair = pairById(pairId);
    const actorId = actor();
    if (String(pair.mentorId ?? '') !== actorId || pair.state !== 'active') {
      fail('BQ_ASSIGNMENT_PAIR', 'Only the active mentor can prepare this assignment.');
    }
    return operation('loading', async () => {
      const curriculum = await discipleship.loadCurriculum(pair.id);
      ensureActor(actorId);
      if (!Array.isArray(curriculum)) fail('BQ_ASSIGNMENT_RESPONSE', 'Published curriculum response was invalid.');
      return {
        curriculum: freezeRows(curriculum),
        selected: Object.freeze({ pairId: pair.id, trackId: null, moduleId: null, lessonId: null }),
      };
    });
  }

  function selectTrack(trackId) {
    const track = trackById(trackId);
    publish({ selected: selection({ trackId: track.id, moduleId: null, lessonId: null }) });
    return state;
  }

  function selectModule(moduleId) {
    const track = trackById(state.selected.trackId);
    const module = moduleById(track, moduleId);
    publish({ selected: selection({ moduleId: module.id, lessonId: null }) });
    return state;
  }

  function selectLesson(lessonId) {
    const track = trackById(state.selected.trackId);
    const module = moduleById(track, state.selected.moduleId);
    const lesson = lessonById(module, lessonId);
    publish({ selected: selection({ lessonId: lesson.id }) });
    return state;
  }

  function buildRequest() {
    const pair = pairById(state.selected.pairId);
    const track = trackById(state.selected.trackId);
    const module = moduleById(track, state.selected.moduleId);
    const lesson = lessonById(module, state.selected.lessonId);
    if (String(pair.mentorId ?? '') !== actor()) fail('BQ_ASSIGNMENT_CONTEXT_STALE', 'Account changed. Reload assignment preparation.');
    return Object.freeze({
      pairId: pair.id,
      trackId: track.id,
      moduleId: module.id,
      lessonId: lesson.id,
      lessonRevisionId: identifier(lesson.revisionId),
    });
  }

  function invalidate() {
    generation += 1;
    if (disposed) return state;
    state = initial();
    for (const listener of listeners) listener(state);
    return state;
  }

  return Object.freeze({
    getState: () => state,
    loadPairs,
    selectPair,
    selectTrack,
    selectModule,
    selectLesson,
    buildRequest,
    invalidate,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Assignment preparation listener must be a function.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      generation += 1;
      listeners.clear();
      state = Object.freeze({ ...initial(), status: 'disposed' });
    },
  });
}
