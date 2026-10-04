const STEP_TYPES = Object.freeze(['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action']);
const PROGRESS_STATES = Object.freeze(['not_started', 'in_progress', 'completed']);

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function id(value) {
  return String(value ?? '').trim();
}

function instant(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  return Number.isNaN(Date.parse(text)) ? null : text;
}

function requireClockInstant(clock) {
  const value = instant(clock());
  if (!value) fail('BQ_DISCIPLESHIP_STATE_CLOCK_INVALID', 'Lesson state requires a valid completion timestamp.');
  return value;
}

function normalizeLesson(lesson, requestedRevisionId) {
  const revisionId = id(lesson?.revisionId ?? lesson?.revision_id);
  if (!revisionId || revisionId !== requestedRevisionId || !Array.isArray(lesson?.steps) || lesson.steps.length !== STEP_TYPES.length) {
    fail('BQ_DISCIPLESHIP_STATE_LESSON_INVALID', 'The assigned lesson revision cannot be resumed safely.');
  }

  const seen = new Set();
  const steps = lesson.steps.map((step, index) => {
    const stepId = id(step?.id);
    const type = id(step?.type ?? step?.stepType ?? step?.step_type).toLowerCase();
    if (!stepId || seen.has(stepId) || type !== STEP_TYPES[index]) {
      fail('BQ_DISCIPLESHIP_STATE_LESSON_INVALID', 'The assigned lesson steps cannot be resumed safely.');
    }
    seen.add(stepId);
    return Object.freeze({ id: stepId, type, index });
  });

  return Object.freeze({ revisionId, steps: Object.freeze(steps) });
}

function progressRow(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length > 1) fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'More than one progress record exists for this assignment.');
    return value[0] ?? null;
  }
  if (typeof value !== 'object') fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'Saved lesson progress is invalid.');
  return value;
}

function normalizeProgress(value, lesson) {
  const row = progressRow(value);
  if (!row) {
    return Object.freeze({
      persisted: false,
      status: 'not_started',
      currentStepId: null,
      startedAt: null,
      completedAt: null,
      updatedAt: null,
    });
  }

  const revisionId = id(row.lessonRevisionId ?? row.lesson_revision_id);
  const status = id(row.status);
  const currentStepId = id(row.currentStepId ?? row.current_step_id) || null;
  const startedAt = instant(row.startedAt ?? row.started_at);
  const completedAt = instant(row.completedAt ?? row.completed_at);
  const updatedAt = instant(row.updatedAt ?? row.updated_at);
  const stepIds = new Set(lesson.steps.map(step => step.id));
  const finalStepId = lesson.steps.at(-1).id;

  if (revisionId && revisionId !== lesson.revisionId) {
    fail('BQ_DISCIPLESHIP_PROGRESS_SCOPE', 'Saved progress belongs to another lesson revision.');
  }
  if (!PROGRESS_STATES.includes(status)) {
    fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'Saved lesson progress has an invalid state.');
  }
  if (currentStepId && !stepIds.has(currentStepId)) {
    fail('BQ_DISCIPLESHIP_PROGRESS_STEP_INVALID', 'Saved lesson progress points to a step outside the assigned revision.');
  }

  if (status === 'not_started') {
    if (currentStepId || startedAt || completedAt) {
      fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'Not-started progress contains active or completed state.');
    }
  } else if (status === 'in_progress') {
    if (!currentStepId || !startedAt || completedAt) {
      fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'In-progress lesson state is incomplete or contradictory.');
    }
  } else if (!startedAt || !completedAt || currentStepId !== finalStepId) {
    fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'Completed lesson state must finish on the Action step with start and completion times.');
  }

  return Object.freeze({ persisted: true, status, currentStepId, startedAt, completedAt, updatedAt });
}

function normalizeResponses(value, lesson) {
  if (!Array.isArray(value)) fail('BQ_DISCIPLESHIP_RESPONSE_INVALID', 'Private lesson responses are unavailable.');
  const stepById = new Map(lesson.steps.map(step => [step.id, step]));
  const seen = new Set();
  const responses = value.map(response => {
    const stepId = id(response?.stepId ?? response?.lesson_step_id);
    if (!stepById.has(stepId) || seen.has(stepId)) {
      fail('BQ_DISCIPLESHIP_RESPONSE_INVALID', 'A private response does not belong to one unique step in the assigned revision.');
    }
    seen.add(stepId);
    return Object.freeze({ ...response, stepId, stepType: stepById.get(stepId).type });
  });
  return Object.freeze(responses);
}

function snapshot(pairId, lesson, progress, responses) {
  const firstStepId = lesson.steps[0].id;
  const finalStepId = lesson.steps.at(-1).id;
  const resumeStepId = progress.status === 'completed' ? finalStepId : (progress.currentStepId || firstStepId);
  const byStep = Object.freeze(Object.fromEntries(responses.map(response => [response.stepId, response])));
  const prayerStep = lesson.steps.find(step => step.type === 'pray');
  const actionStep = lesson.steps.find(step => step.type === 'action');

  return Object.freeze({
    pairId,
    lessonRevisionId: lesson.revisionId,
    status: progress.status,
    persisted: progress.persisted,
    completed: progress.status === 'completed',
    currentStepId: progress.currentStepId,
    resumeStepId,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    updatedAt: progress.updatedAt,
    responses,
    responsesByStep: byStep,
    prayerResponse: byStep[prayerStep.id] ?? null,
    actionResponse: byStep[actionStep.id] ?? null,
  });
}

function mutationReceipt(pairId, lessonRevisionId, progress) {
  return Object.freeze({
    pairId,
    lessonRevisionId,
    status: progress.status,
    persisted: true,
    completed: progress.status === 'completed',
    currentStepId: progress.currentStepId,
    resumeStepId: progress.currentStepId,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
  });
}

export function createDiscipleshipLessonStateService({ discipleship, clock = () => new Date().toISOString() }) {
  const required = ['loadLesson', 'loadOperationalProgress', 'loadPrivateResponses', 'saveProgress', 'savePrivateResponse'];
  if (!discipleship || required.some(method => typeof discipleship[method] !== 'function') || typeof clock !== 'function') {
    throw new Error('Lesson continuity requires the integrated discipleship service and a clock.');
  }

  // Serialize same-lesson progress writes in one client instance so a slower older request
  // cannot overwrite a newer navigation/completion request. Backend/RLS remains authority.
  const mutationTails = new Map();

  function enqueue(pairId, lessonRevisionId, operation) {
    const key = `${pairId}\u0000${lessonRevisionId}`;
    const previous = mutationTails.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(operation);
    const tail = run.catch(() => undefined);
    mutationTails.set(key, tail);
    void tail.finally(() => {
      if (mutationTails.get(key) === tail) mutationTails.delete(key);
    });
    return run;
  }

  async function lessonFor(pairId, lessonRevisionId) {
    const pair = id(pairId);
    const revision = id(lessonRevisionId);
    if (!pair || !revision) fail('BQ_DISCIPLESHIP_STATE_SCOPE_REQUIRED', 'Choose a ONE 2 ONE pair and assigned lesson revision first.');
    const lesson = normalizeLesson(await discipleship.loadLesson(pair, revision), revision);
    return { pairId: pair, revisionId: revision, lesson };
  }

  async function progressFor(pairId, lessonRevisionId) {
    const resolved = await lessonFor(pairId, lessonRevisionId);
    const value = await discipleship.loadOperationalProgress(resolved.pairId, resolved.revisionId);
    return { resolved, progress: normalizeProgress(value, resolved.lesson) };
  }

  async function load(pairId, lessonRevisionId) {
    const resolved = await lessonFor(pairId, lessonRevisionId);
    const [progressValue, responseValue] = await Promise.all([
      discipleship.loadOperationalProgress(resolved.pairId, resolved.revisionId),
      discipleship.loadPrivateResponses(resolved.pairId, resolved.revisionId),
    ]);
    const progress = normalizeProgress(progressValue, resolved.lesson);
    const responses = normalizeResponses(responseValue, resolved.lesson);
    return snapshot(resolved.pairId, resolved.lesson, progress, responses);
  }

  async function saveCurrentStep(pairId, lessonRevisionId, stepId) {
    const pair = id(pairId);
    const revision = id(lessonRevisionId);
    if (!pair || !revision) fail('BQ_DISCIPLESHIP_STATE_SCOPE_REQUIRED', 'Choose a ONE 2 ONE pair and assigned lesson revision first.');
    return enqueue(pair, revision, async () => {
      const { resolved, progress } = await progressFor(pair, revision);
      if (progress.status === 'completed') fail('BQ_DISCIPLESHIP_PROGRESS_COMPLETED', 'This lesson is already complete and cannot be silently reopened.');
      const target = id(stepId);
      if (!resolved.lesson.steps.some(step => step.id === target)) {
        fail('BQ_DISCIPLESHIP_PROGRESS_STEP_INVALID', 'The requested resume step is outside the assigned lesson revision.');
      }
      const next = {
        status: 'in_progress',
        currentStepId: target,
        startedAt: progress.startedAt || requireClockInstant(clock),
        completedAt: null,
      };
      await discipleship.saveProgress(resolved.pairId, resolved.revisionId, next);
      return mutationReceipt(resolved.pairId, resolved.revisionId, next);
    });
  }

  async function complete(pairId, lessonRevisionId) {
    const pair = id(pairId);
    const revision = id(lessonRevisionId);
    if (!pair || !revision) fail('BQ_DISCIPLESHIP_STATE_SCOPE_REQUIRED', 'Choose a ONE 2 ONE pair and assigned lesson revision first.');
    return enqueue(pair, revision, async () => {
      const { resolved, progress } = await progressFor(pair, revision);
      const finalStepId = resolved.lesson.steps.at(-1).id;
      if (progress.status === 'completed') return mutationReceipt(resolved.pairId, resolved.revisionId, progress);
      if (progress.status !== 'in_progress' || progress.currentStepId !== finalStepId || !progress.startedAt) {
        fail('BQ_DISCIPLESHIP_COMPLETION_NOT_READY', 'Reach the Action step before completing this lesson.');
      }
      const next = {
        status: 'completed',
        currentStepId: finalStepId,
        startedAt: progress.startedAt,
        completedAt: requireClockInstant(clock),
      };
      await discipleship.saveProgress(resolved.pairId, resolved.revisionId, next);
      return mutationReceipt(resolved.pairId, resolved.revisionId, next);
    });
  }

  async function savePrivateStepResponse(pairId, lessonRevisionId, stepId, response) {
    const resolved = await lessonFor(pairId, lessonRevisionId);
    const target = id(stepId);
    if (!resolved.lesson.steps.some(step => step.id === target)) {
      fail('BQ_DISCIPLESHIP_RESPONSE_SCOPE', 'The response step is outside the assigned lesson revision.');
    }
    return discipleship.savePrivateResponse(resolved.pairId, resolved.revisionId, target, response);
  }

  return Object.freeze({ load, saveCurrentStep, complete, savePrivateStepResponse });
}

export const discipleshipLessonStateContracts = Object.freeze({
  stepTypes: STEP_TYPES,
  progressStates: PROGRESS_STATES,
});
