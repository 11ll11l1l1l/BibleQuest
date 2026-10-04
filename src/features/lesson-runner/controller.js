import { discipleshipContracts } from '../../app/discipleship.js';
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
const snapshot = value => Object.freeze({ ...(value ?? {}) });
function responseText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.text === 'string') return value.text;
  return '';
}
export function createLessonRunner({ service, session, membership, pairId, revisionId, now = () => new Date().toISOString() }) {
  if (!service || !session?.getState || !membership?.getActive || !pairId || !revisionId) throw new TypeError('Lesson runner requires the scoped discipleship service and lesson identity.');
  let generation = 0, disposed = false, loadedContext = null;
  const dirtyResponseSteps = new Set(), responseEditVersions = new Map();
  let state = Object.freeze({ status: 'idle', lesson: null, stepIndex: 0, progress: null, writable: false, error: null,
    responses: snapshot(), responseDrafts: snapshot(), responseStatus: 'idle', responseError: null });
  const listeners = new Set();
  const publish = patch => { state = Object.freeze({ ...state, ...patch }); for (const listener of listeners) listener(state); return state; };
  function context() {
    const auth = session.getState(), active = membership.getActive();
    if (!auth?.authenticated || !auth.user?.id || !active?.congregationId || (active.userId && active.userId !== auth.user.id)) {
      fail('BQ_LESSON_CONTEXT_REQUIRED', 'Sign in and select a congregation to open this lesson.');
    }
    return `${auth.user.id}:${active.congregationId}`;
  }
  function current(token, key) {
    if (disposed || token !== generation || key !== context()) fail('BQ_LESSON_CONTEXT_STALE', 'Reload this lesson after your account or congregation changes.');
  }
  function clearLesson(patch = {}) {
    dirtyResponseSteps.clear(); responseEditVersions.clear();
    loadedContext = null;
    return publish({ status: 'idle', lesson: null, stepIndex: 0, progress: null, writable: false, error: null,
      responses: snapshot(), responseDrafts: snapshot(), responseStatus: 'idle', responseError: null, ...patch });
  }
  function invalidate() {
    generation += 1;
    return clearLesson();
  }
  function isContextFailure(error, key) {
    if (error?.code?.includes('CONTEXT')) return true;
    if (!key) return false;
    try { return context() !== key; } catch { return true; }
  }
  async function hydrateResponses(token, key, lesson) {
    if (!state.writable || typeof service.loadPrivateResponses !== 'function') {
      return publish({ responseStatus: 'ready', responseError: null });
    }
    const hydrationVersions = new Map(responseEditVersions);
    publish({ responseStatus: 'loading', responseError: null });
    try {
      const rows = await service.loadPrivateResponses(pairId, revisionId); current(token, key);
      if (!Array.isArray(rows)) fail('BQ_LESSON_RESPONSE_INVALID', 'Saved lesson responses were unavailable.');
      const allowedSteps = new Set(lesson.steps.map(step => step.id));
      const responses = { ...state.responses }, drafts = { ...state.responseDrafts };
      for (const row of rows) {
        if (!row?.stepId || !allowedSteps.has(row.stepId)) {
          fail('BQ_LESSON_RESPONSE_INVALID', 'A saved response did not belong to this lesson revision.');
        }
        const unchangedSinceRead = (responseEditVersions.get(row.stepId) ?? 0) === (hydrationVersions.get(row.stepId) ?? 0);
        if (unchangedSinceRead) {
          responses[row.stepId] = row;
          drafts[row.stepId] = responseText(row.response);
        }
      }
      return publish({ responses: snapshot(responses), responseDrafts: snapshot(drafts), responseStatus: 'ready', responseError: null });
    } catch (error) {
      if (disposed || token !== generation) return state;
      if (isContextFailure(error, key)) {
        generation += 1;
        return clearLesson({ status: 'error', error: error.message });
      }
      return publish({ responseStatus: 'error', responseError: error.message });
    }
  }
  async function load() {
    if (disposed) return state;
    const token = ++generation;
    dirtyResponseSteps.clear(); responseEditVersions.clear();
    publish({ status: 'loading', lesson: null, stepIndex: 0, progress: null, writable: false, error: null,
      responses: snapshot(), responseDrafts: snapshot(), responseStatus: 'idle', responseError: null });
    try {
      const key = context();
      const pairs = await service.listPairs(); current(token, key);
      const pair = pairs.find(row => row.id === pairId && row.state === 'active');
      if (!pair) fail('BQ_LESSON_PAIR_DENIED', 'This active pair is unavailable.');
      const lesson = await service.loadLesson(pairId, revisionId); current(token, key);
      if (lesson.revisionId !== revisionId || lesson.steps?.length !== discipleshipContracts.lessonSteps.length
          || lesson.steps.some((step, index) => !step.id || step.type !== discipleshipContracts.lessonSteps[index])
          || new Set(lesson.steps.map(step => step.id)).size !== lesson.steps.length) {
        fail('BQ_LESSON_REVISION_INVALID', 'The assigned lesson steps are unavailable.');
      }
      const rows = await service.loadOperationalProgress(pairId, revisionId); current(token, key);
      if (!Array.isArray(rows) || rows.length > 1) fail('BQ_LESSON_PROGRESS_INVALID', 'This lesson has ambiguous progress.');
      const progress = rows[0] ?? null;
      if (progress && !['not_started', 'in_progress', 'completed'].includes(progress.status)) fail('BQ_LESSON_PROGRESS_INVALID', 'This lesson has an invalid progress state.');
      const stepIndex = progress?.currentStepId ? lesson.steps.findIndex(step => step.id === progress.currentStepId) : 0;
      if (stepIndex < 0) fail('BQ_LESSON_PROGRESS_INVALID', 'Saved progress does not belong to this lesson revision.');
      loadedContext = key;
      const writable = pair.menteeId === session.getState().user.id;
      publish({ status: progress?.status === 'completed' ? 'completed' : 'ready', lesson,
        stepIndex, progress, writable, error: null, responseStatus: writable ? 'loading' : 'ready', responseError: null });
      await hydrateResponses(token, key, lesson);
      return state;
    } catch (error) {
      if (disposed || token !== generation) return state;
      return clearLesson({ status: 'error', error: error.message });
    }
  }
  function updateResponse(value, stepId = state.lesson?.steps?.[state.stepIndex]?.id) {
    if (!state.lesson || !stepId) fail('BQ_LESSON_RESPONSE_UNAVAILABLE', 'Open a lesson step before editing its response.');
    if (!state.writable) fail('BQ_LESSON_RESPONSE_DENIED', 'Only the mentee can edit personal lesson responses.');
    let key;
    try {
      key = context();
      if (key !== loadedContext) fail('BQ_LESSON_CONTEXT_STALE', 'Reload after your account or congregation changes.');
    } catch (error) {
      generation += 1;
      clearLesson({ status: 'error', error: error.message });
      throw error;
    }
    if (!state.lesson.steps.some(step => step.id === stepId)) fail('BQ_LESSON_RESPONSE_UNAVAILABLE', 'This response does not belong to the open lesson revision.');
    dirtyResponseSteps.add(stepId);
    responseEditVersions.set(stepId, (responseEditVersions.get(stepId) ?? 0) + 1);
    return publish({ responseDrafts: snapshot({ ...state.responseDrafts, [stepId]: String(value ?? '') }), responseError: null });
  }
  async function persistResponse(stepIndex, token, key) {
    if (!state.writable || typeof service.savePrivateResponse !== 'function') return;
    const stepId = state.lesson?.steps?.[stepIndex]?.id;
    if (!stepId || !dirtyResponseSteps.has(stepId)) return;
    const text = state.responseDrafts[stepId] ?? '';
    const prior = state.responses[stepId];
    const payload = prior?.response && typeof prior.response === 'object' && !Array.isArray(prior.response)
      ? { ...prior.response, text } : text;
    publish({ status: 'saving-response', error: null });
    current(token, key);
    const result = await service.savePrivateResponse(pairId, revisionId, stepId, payload); current(token, key);
    dirtyResponseSteps.delete(stepId);
    const responses = { ...state.responses, [stepId]: Object.freeze({ ...(prior ?? {}), ...(result && typeof result === 'object' ? result : {}),
      stepId, lessonRevisionId: revisionId, response: payload }) };
    publish({ responses: snapshot(responses), responseStatus: 'ready', responseError: null });
  }
  async function move(direction) {
    if (!state.lesson || !['ready', 'completed', 'save-error'].includes(state.status)) return state;
    if (![1, -1].includes(direction)) throw new TypeError('Move one lesson step at a time.');
    try {
      if (context() !== loadedContext) fail('BQ_LESSON_CONTEXT_STALE', 'Reload after your account or congregation changes.');
    } catch (error) { generation += 1; return clearLesson({ status: 'error', error: error.message }); }
    const target = state.stepIndex + direction;
    if (target < 0 || target >= state.lesson.steps.length) return state;
    if (!state.writable || state.progress?.status === 'completed') return publish({ stepIndex: target });
    return save(target, false);
  }
  async function save(target, completed) {
    const token = generation;
    let key;
    try {
      key = context();
      if (key !== loadedContext) fail('BQ_LESSON_CONTEXT_STALE', 'Reload after your account or congregation changes.');
      if (!state.writable) fail('BQ_LESSON_WRITE_DENIED', 'Only the mentee can save lesson progress.');
      // Claim the write synchronously before the first await so a same-tick second
      // navigation cannot enter another progress save while this one is in flight.
      publish({ status: 'saving', error: null });
      await persistResponse(state.stepIndex, token, key);
      const progress = { status: completed ? 'completed' : 'in_progress', currentStepId: state.lesson.steps[target].id,
        startedAt: state.progress?.startedAt || now(), completedAt: completed ? now() : null };
      publish({ status: 'saving', error: null });
      current(token, key);
      await service.saveProgress(pairId, revisionId, progress); current(token, key);
      return publish({ status: completed ? 'completed' : 'ready', stepIndex: target, progress: Object.freeze(progress) });
    } catch (error) {
      if (disposed || token !== generation) return state;
      // Stale-context errors clear the lesson; ordinary failures preserve the last saved position and response draft.
      if (isContextFailure(error, key)) {
        generation += 1;
        return clearLesson({ status: 'error', error: error.message });
      }
      return publish({ status: 'save-error', error: error.message });
    }
  }
  async function complete() {
    if (!state.lesson || !['ready', 'save-error'].includes(state.status) || state.stepIndex !== state.lesson.steps.length - 1) {
      fail('BQ_LESSON_COMPLETION_DENIED', 'Finish at the Action step before completing this lesson.');
    }
    return save(state.stepIndex, true);
  }
  return Object.freeze({ getIdentity: () => Object.freeze({ pairId, revisionId }), getState: () => state, load, move, complete, updateResponse, invalidate,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { disposed = true; generation += 1; dirtyResponseSteps.clear(); responseEditVersions.clear(); listeners.clear(); state = Object.freeze({ status: 'disposed', lesson: null }); },
  });
}