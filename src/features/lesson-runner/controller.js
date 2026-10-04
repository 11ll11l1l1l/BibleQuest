import { discipleshipContracts } from '../../app/discipleship.js';
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
export function createLessonRunner({ service, session, membership, pairId, revisionId, now = () => new Date().toISOString() }) {
  if (!service || !session?.getState || !membership?.getActive || !pairId || !revisionId) throw new TypeError('Lesson runner requires the scoped discipleship service and lesson identity.');
  let generation = 0, disposed = false, loadedContext = null;
  let state = Object.freeze({ status: 'idle', lesson: null, stepIndex: 0, progress: null, writable: false, error: null });
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
  function invalidate() {
    generation += 1;
    loadedContext = null;
    return publish({ status: 'idle', lesson: null, stepIndex: 0, progress: null, writable: false, error: null });
  }
  async function load() {
    if (disposed) return state;
    const token = ++generation;
    publish({ status: 'loading', lesson: null, stepIndex: 0, progress: null, writable: false, error: null });
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
      return publish({ status: progress?.status === 'completed' ? 'completed' : 'ready', lesson,
        stepIndex, progress, writable: pair.menteeId === session.getState().user.id, error: null });
    } catch (error) {
      if (disposed || token !== generation) return state;
      return publish({ status: 'error', lesson: null, error: error.message, writable: false });
    }
  }
  async function move(direction) {
    if (!state.lesson || !['ready', 'completed', 'save-error'].includes(state.status)) return state;
    if (![1, -1].includes(direction)) throw new TypeError('Move one lesson step at a time.');
    try {
      if (context() !== loadedContext) fail('BQ_LESSON_CONTEXT_STALE', 'Reload after your account or congregation changes.');
    } catch (error) { invalidate(); return publish({ status: 'error', error: error.message }); }
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
      const progress = { status: completed ? 'completed' : 'in_progress', currentStepId: state.lesson.steps[target].id,
        startedAt: state.progress?.startedAt || now(), completedAt: completed ? now() : null };
      publish({ status: 'saving', error: null });
      current(token, key);
      await service.saveProgress(pairId, revisionId, progress); current(token, key);
      return publish({ status: completed ? 'completed' : 'ready', stepIndex: target, progress: Object.freeze(progress) });
    } catch (error) {
      if (disposed || token !== generation) return state;
      // Stale-context errors clear the lesson; ordinary failures preserve the last saved position.
      if (error.code?.includes('CONTEXT') || (key && (() => { try { return context() !== key; } catch { return true; } })())) {
        invalidate(); return publish({ status: 'error', error: error.message });
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
  return Object.freeze({ getIdentity: () => Object.freeze({ pairId, revisionId }), getState: () => state, load, move, complete, invalidate,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { disposed = true; generation += 1; listeners.clear(); state = Object.freeze({ status: 'disposed', lesson: null }); },
  });
}
