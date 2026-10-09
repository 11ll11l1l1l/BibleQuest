import { discipleshipContracts } from '../../app/discipleship.js';
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
const snapshot = value => Object.freeze({ ...(value ?? {}) });
function responseText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.text === 'string') return value.text;
  return '';
}
export function createLessonRunner({ service, session, membership, pairId, revisionId, resumeStepId = null, now = () => new Date().toISOString() }) {
  if (!service || !session?.getState || !membership?.getActive || !pairId || !revisionId) throw new TypeError('Lesson runner requires the scoped discipleship service and lesson identity.');
  let generation = 0, disposed = false, loadedContext = null;
  const dirtyResponseSteps = new Set(), responseEditVersions = new Map();
  let state = Object.freeze({ status: 'idle', lesson: null, stepIndex: 0, progress: null, writable: false, mentorId: null, error: null,
    responses: snapshot(), responseDrafts: snapshot(), responseStatus: 'idle', responseError: null, shareStatus: 'idle', shareError: null });
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
    return publish({ status: 'idle', lesson: null, stepIndex: 0, progress: null, writable: false, mentorId: null, error: null,
      responses: snapshot(), responseDrafts: snapshot(), responseStatus: 'idle', responseError: null, shareStatus: 'idle', shareError: null, ...patch });
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
    if (typeof service.loadPrivateResponses !== 'function') {
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
        if (!state.writable && (row.visibility !== 'shared' || !Array.isArray(row.audienceUserIds) || !row.audienceUserIds.includes(state.mentorId))) {
          fail('BQ_LESSON_RESPONSE_SCOPE', 'Mentor preview received a response that was not explicitly shared.');
        }
        if (unchangedSinceRead) {
          responses[row.stepId] = row;
          if (state.writable) drafts[row.stepId] = responseText(row.response);
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
    publish({ status: 'loading', lesson: null, stepIndex: 0, progress: null, writable: false, mentorId: null, error: null,
      responses: snapshot(), responseDrafts: snapshot(), responseStatus: 'idle', responseError: null, shareStatus: 'idle', shareError: null });
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
      if (progress?.currentStepId && !lesson.steps.some(step => step.id === progress.currentStepId)) fail('BQ_LESSON_PROGRESS_INVALID', 'Saved progress does not belong to this lesson revision.');
      const requestedStep = resumeStepId || progress?.currentStepId;
      const stepIndex = requestedStep ? lesson.steps.findIndex(step => step.id === requestedStep) : 0;
      if (stepIndex < 0) fail('BQ_LESSON_PROGRESS_INVALID', 'Saved progress does not belong to this lesson revision.');
      loadedContext = key;
      const writable = pair.menteeId === session.getState().user.id;
      publish({ status: progress?.status === 'completed' ? 'completed' : 'ready', lesson,
        stepIndex, progress, writable, mentorId: pair.mentorId, error: null, responseStatus: 'loading', responseError: null, shareStatus: 'idle', shareError: null });
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
    if (!state.writable) return;
    const stepId = state.lesson?.steps?.[stepIndex]?.id;
    if (!stepId || !dirtyResponseSteps.has(stepId)) return;
    if (typeof service.savePrivateResponse !== 'function') {
      fail('BQ_LESSON_RESPONSE_UNAVAILABLE', 'Private response saving is unavailable. Your draft was not discarded.');
    }
    // A shared response is a mutable row. Revoke its old share before writing
    // newly edited text, or a mentor could see changes without fresh consent.
    const priorShare = state.responses[stepId];
    if (priorShare?.visibility === 'shared') {
      if (!priorShare.id || typeof service.revokeResponseShare !== 'function') {
        fail('BQ_LESSON_SHARE_UNAVAILABLE', 'Cannot update a shared response until access is revoked.');
      }
      publish({ status: 'saving-response', error: null });
      current(token, key);
      await service.revokeResponseShare(pairId, revisionId, stepId, priorShare.id);
      current(token, key);
      publish({ responses: snapshot({ ...state.responses, [stepId]: Object.freeze({
        ...priorShare, visibility: 'owner', audienceUserIds: Object.freeze([]),
      }) }) });
    }
    while (dirtyResponseSteps.has(stepId)) {
      const editVersion = responseEditVersions.get(stepId) ?? 0;
      const text = state.responseDrafts[stepId] ?? '';
      const prior = state.responses[stepId];
      const payload = prior?.response && typeof prior.response === 'object' && !Array.isArray(prior.response)
        ? { ...prior.response, text } : text;
      publish({ status: 'saving-response', error: null });
      current(token, key);
      const result = await service.savePrivateResponse(pairId, revisionId, stepId, payload); current(token, key);
      if ((responseEditVersions.get(stepId) ?? 0) === editVersion) dirtyResponseSteps.delete(stepId);
      const responses = { ...state.responses, [stepId]: Object.freeze({ ...(prior ?? {}), ...(result && typeof result === 'object' ? result : {}),
        stepId, lessonRevisionId: revisionId, response: payload, visibility: 'owner',
        audienceUserIds: Object.freeze([]) }) };
      publish({ responses: snapshot(responses), responseStatus: 'ready', responseError: null });
    }
  }
  async function setResponseSharing(stepId, shared, { confirmed = false } = {}) {
    if (!state.lesson || !stepId || !state.lesson.steps.some(step => step.id === stepId)) {
      fail('BQ_LESSON_RESPONSE_UNAVAILABLE', 'Open a lesson response before changing sharing.');
    }
    if (!state.writable) fail('BQ_LESSON_SHARE_DENIED', 'Only the mentee can change response sharing.');
    if (state.lesson.steps.find(step => step.id === stepId)?.type === 'scripture') {
      fail('BQ_LESSON_SHARE_DENIED', 'Scripture steps do not contain a personal response to share.');
    }
    if (shared && confirmed !== true) fail('BQ_LESSON_SHARE_CONFIRMATION_REQUIRED', 'Confirm sharing with your paired mentor.');
    // Claim the disclosure mutation before any await. Duplicate Share, Revoke
    // and navigation calls cannot run against the same saved response in flight.
    if (state.shareStatus === 'saving' || ['saving', 'saving-response'].includes(state.status)) return state;
    const baseStatus = state.status === 'completed' ? 'completed' : 'ready';
    const token = generation;
    let key;
    try {
      key = context();
      if (key !== loadedContext) fail('BQ_LESSON_CONTEXT_STALE', 'Reload after your account or congregation changes.');
      publish({ shareStatus: 'saving', shareError: null });
      const index = state.lesson.steps.findIndex(step => step.id === stepId);
      await persistResponse(index, token, key); current(token, key);
      const response = state.responses[stepId];
      if (!response?.id) fail('BQ_LESSON_RESPONSE_UNAVAILABLE', 'Save this response before changing sharing.');
      if (!shared && response.visibility !== 'shared') {
        return publish({ status: baseStatus, shareStatus: 'ready', shareError: null });
      }
      if (shared) {
        if (typeof service.shareResponse !== 'function') fail('BQ_LESSON_SHARE_UNAVAILABLE', 'Response sharing is unavailable.');
        await service.shareResponse(pairId, revisionId, stepId, response.id, { confirmed: true });
      } else {
        if (typeof service.revokeResponseShare !== 'function') fail('BQ_LESSON_SHARE_UNAVAILABLE', 'Response sharing is unavailable.');
        await service.revokeResponseShare(pairId, revisionId, stepId, response.id);
      }
      current(token, key);
      const updated = Object.freeze({ ...response, visibility: shared ? 'shared' : 'owner',
        audienceUserIds: Object.freeze(shared && state.mentorId ? [state.mentorId] : []) });
      return publish({ status: baseStatus, responses: snapshot({ ...state.responses, [stepId]: updated }),
        shareStatus: 'ready', shareError: null });
    } catch (error) {
      if (disposed || token !== generation) return state;
      if (isContextFailure(error, key)) {
        generation += 1;
        return clearLesson({ status: 'error', error: error.message });
      }
      return publish({ status: baseStatus, shareStatus: 'error', shareError: error.message });
    }
  }
  const shareResponse = (stepId, options) => setResponseSharing(stepId, true, options);
  const revokeResponseShare = stepId => setResponseSharing(stepId, false);
  async function move(direction) {
    if (!state.lesson || state.shareStatus === 'saving' || !['ready', 'completed', 'save-error'].includes(state.status)) return state;
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
    if (state.shareStatus === 'saving') return state;
    if (!state.lesson || !['ready', 'save-error'].includes(state.status) || state.stepIndex !== state.lesson.steps.length - 1) {
      fail('BQ_LESSON_COMPLETION_DENIED', 'Finish at the Action step before completing this lesson.');
    }
    return save(state.stepIndex, true);
  }
  return Object.freeze({ getIdentity: () => Object.freeze({ pairId, revisionId }), getState: () => state, load, move, complete, updateResponse, shareResponse, revokeResponseShare, invalidate,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { disposed = true; generation += 1; dirtyResponseSteps.clear(); responseEditVersions.clear(); listeners.clear(); state = Object.freeze({ status: 'disposed', lesson: null }); },
  });
}