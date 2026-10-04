const PAIR_STATES = Object.freeze(['invited', 'active', 'declined', 'suspended', 'ended']);
const LESSON_STEPS = Object.freeze(['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action']);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function identifier(value) {
  return String(value ?? '').trim();
}

function staleContext() {
  fail('BQ_DISCIPLESHIP_CONTEXT_STALE', 'Your account or congregation changed. Reload ONE 2 ONE before continuing.');
}

function normalizePair(row, context) {
  const pair = Object.freeze({
    id: identifier(row?.id),
    congregationId: identifier(row?.congregationId ?? row?.congregation_id),
    mentorId: identifier(row?.mentorId ?? row?.mentor_id),
    menteeId: identifier(row?.menteeId ?? row?.mentee_id),
    state: identifier(row?.state ?? row?.status).toLowerCase(),
  });
  if (!pair.id || pair.congregationId !== context.congregationId
    || !pair.mentorId || !pair.menteeId || pair.mentorId === pair.menteeId
    || !PAIR_STATES.includes(pair.state)) {
    fail('BQ_DISCIPLESHIP_PAIR_RESPONSE', 'Pair data was incomplete or outside the selected congregation.');
  }
  if (pair.mentorId !== context.userId && pair.menteeId !== context.userId) {
    fail('BQ_DISCIPLESHIP_PAIR_DENIED', 'This pair does not belong to the signed-in participant.');
  }
  return pair;
}

function normalizeLesson(row, pair) {
  const lesson = row?.lesson ?? row;
  const revisionId = identifier(lesson?.revisionId ?? lesson?.revision_id);
  const lessonId = identifier(lesson?.id ?? lesson?.lessonId ?? lesson?.lesson_id);
  const steps = Array.isArray(lesson?.steps) ? lesson.steps : [];
  if (!lessonId || !revisionId || lesson?.published === false || !steps.length) {
    fail('BQ_DISCIPLESHIP_LESSON_RESPONSE', 'The assigned lesson revision is unavailable or unpublished.');
  }
  const normalizedSteps = steps.map((step, index) => {
    const type = identifier(step?.type ?? step?.stepType ?? step?.step_type).toLowerCase();
    if (type !== LESSON_STEPS[index]) {
      fail('BQ_DISCIPLESHIP_LESSON_RESPONSE', 'Lesson steps do not match the accepted ONE 2 ONE sequence.');
    }
    return Object.freeze({ ...step, type });
  });
  if (normalizedSteps.length !== LESSON_STEPS.length) {
    fail('BQ_DISCIPLESHIP_LESSON_RESPONSE', 'Lesson steps do not match the accepted ONE 2 ONE sequence.');
  }
  return Object.freeze({
    ...lesson,
    id: lessonId,
    revisionId,
    pairId: pair.id,
    congregationId: pair.congregationId,
    steps: Object.freeze(normalizedSteps),
  });
}

function assertOperationalProgress(progress, pair) {
  const rows = Array.isArray(progress) ? progress : [progress];
  const safeRows = rows.map(row => {
    const rowPairId = identifier(row?.pairId ?? row?.pair_id);
    const rowCongregationId = identifier(row?.congregationId ?? row?.congregation_id);
    const learnerId = identifier(row?.learnerId ?? row?.learner_id ?? row?.userId ?? row?.user_id);
    if ((rowPairId && rowPairId !== pair.id)
      || (rowCongregationId && rowCongregationId !== pair.congregationId)
      || (learnerId && learnerId !== pair.menteeId)) {
      fail('BQ_DISCIPLESHIP_PROGRESS_SCOPE', 'Progress data was outside the selected pair.');
    }
    if (!row || typeof row !== 'object') return row;
    return Object.freeze({
      pairId: pair.id,
      learnerId: pair.menteeId,
      lessonRevisionId: identifier(row.lessonRevisionId ?? row.lesson_revision_id),
      status: identifier(row.status),
      startedAt: row.startedAt ?? row.started_at ?? null,
      completedAt: row.completedAt ?? row.completed_at ?? null,
      updatedAt: row.updatedAt ?? row.updated_at ?? null,
    });
  });
  return Array.isArray(progress) ? Object.freeze(safeRows) : safeRows[0];
}

export function createDiscipleshipService({ repository, session, membership }) {
  if (!repository || !session?.getState || !membership?.getActive) {
    throw new Error('Discipleship service requires repository, session and congregation membership boundaries.');
  }

  function currentContext() {
    const auth = session.getState();
    const userId = auth?.authenticated && auth?.user?.id ? String(auth.user.id) : '';
    if (!userId) fail('BQ_DISCIPLESHIP_AUTH_REQUIRED', 'Sign in to open ONE 2 ONE.');
    const active = membership.getActive();
    if (!active?.congregationId || String(active.userId ?? userId) !== userId) {
      fail('BQ_DISCIPLESHIP_SCOPE_REQUIRED', 'Choose an active congregation before opening ONE 2 ONE.');
    }
    return Object.freeze({ userId, congregationId: String(active.congregationId) });
  }

  function assertCurrent(context) {
    const now = currentContext();
    if (now.userId !== context.userId || now.congregationId !== context.congregationId) staleContext();
  }

  async function inContext(operation) {
    const context = currentContext();
    const result = await operation(context);
    assertCurrent(context);
    return result;
  }

  async function resolvePair(pairId, context, { active = true } = {}) {
    const requestedId = identifier(pairId);
    if (!requestedId) fail('BQ_DISCIPLESHIP_PAIR_REQUIRED', 'Choose a ONE 2 ONE pair first.');
    const raw = await repository.getPair(requestedId, context);
    assertCurrent(context);
    const pair = normalizePair(raw, context);
    if (pair.id !== requestedId) fail('BQ_DISCIPLESHIP_PAIR_RESPONSE', 'Pair response did not match the requested pair.');
    if (active && pair.state !== 'active') {
      fail('BQ_DISCIPLESHIP_PAIR_INACTIVE', 'This ONE 2 ONE pair is not active.');
    }
    return pair;
  }

  async function listPairs() {
    return inContext(async context => {
      const rows = await repository.listPairs(context);
      const pairs = (Array.isArray(rows) ? rows : []).map(row => normalizePair(row, context));
      const seen = new Set();
      for (const pair of pairs) {
        if (seen.has(pair.id)) fail('BQ_DISCIPLESHIP_PAIR_RESPONSE', 'Pair list contained duplicate records.');
        seen.add(pair.id);
      }
      return Object.freeze(pairs);
    });
  }

  async function loadCurriculum(pairId) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      const curriculum = await repository.loadCurriculum(pair, context);
      assertCurrent(context);
      if (!Array.isArray(curriculum)) fail('BQ_DISCIPLESHIP_CURRICULUM_RESPONSE', 'Curriculum response was invalid.');
      return Object.freeze(curriculum.map(track => {
        const trackPairId = identifier(track?.pairId ?? track?.pair_id);
        const trackCongregationId = identifier(track?.congregationId ?? track?.congregation_id);
        if ((trackPairId && trackPairId !== pair.id)
          || (trackCongregationId && trackCongregationId !== pair.congregationId)) {
          fail('BQ_DISCIPLESHIP_CURRICULUM_SCOPE', 'Curriculum data was outside the selected pair.');
        }
        return Object.freeze({ ...track });
      }));
    });
  }

  async function loadLesson(pairId, lessonRevisionId) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      const requestedRevisionId = identifier(lessonRevisionId);
      if (!requestedRevisionId) fail('BQ_DISCIPLESHIP_LESSON_REQUIRED', 'Choose a published lesson revision first.');
      const raw = await repository.loadLessonRevision(requestedRevisionId, pair, context);
      assertCurrent(context);
      const lesson = normalizeLesson(raw, pair);
      if (lesson.revisionId !== requestedRevisionId) {
        fail('BQ_DISCIPLESHIP_LESSON_RESPONSE', 'Lesson response did not match the requested revision.');
      }
      return lesson;
    });
  }

  async function loadOperationalProgress(pairId, lessonRevisionId) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      const progress = await repository.loadOperationalProgress(identifier(lessonRevisionId), pair, context);
      assertCurrent(context);
      return assertOperationalProgress(progress, pair);
    });
  }

  async function saveProgress(pairId, lessonRevisionId, progress) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      if (context.userId !== pair.menteeId) fail('BQ_DISCIPLESHIP_PROGRESS_DENIED', 'Only the mentee can update personal lesson progress.');
      const result = await repository.saveProgress(identifier(lessonRevisionId), progress, pair, context);
      assertCurrent(context);
      return result;
    });
  }

  async function savePrivateResponse(pairId, lessonRevisionId, stepId, response) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      if (context.userId !== pair.menteeId) fail('BQ_DISCIPLESHIP_RESPONSE_DENIED', 'Only the mentee can save a personal lesson response.');
      const result = await repository.savePrivateResponse({
        lessonRevisionId: identifier(lessonRevisionId),
        stepId: identifier(stepId),
        response,
        visibility: 'owner',
        pair,
        context,
      });
      assertCurrent(context);
      return result;
    });
  }

  async function shareResponse(pairId, lessonRevisionId, stepId, responseId, { confirmed = false } = {}) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      if (context.userId !== pair.menteeId) fail('BQ_DISCIPLESHIP_SHARE_DENIED', 'Only the mentee can share a personal response.');
      if (confirmed !== true) fail('BQ_DISCIPLESHIP_SHARE_CONFIRMATION_REQUIRED', 'Confirm the named recipient before sharing this response.');
      const result = await repository.setResponseShare({
        lessonRevisionId: identifier(lessonRevisionId),
        stepId: identifier(stepId),
        responseId: identifier(responseId),
        audienceUserIds: Object.freeze([pair.mentorId]),
        pair,
        context,
      });
      assertCurrent(context);
      return result;
    });
  }

  return Object.freeze({
    listPairs,
    loadCurriculum,
    loadLesson,
    loadOperationalProgress,
    saveProgress,
    savePrivateResponse,
    shareResponse,
  });
}

export const discipleshipContracts = Object.freeze({ pairStates: PAIR_STATES, lessonSteps: LESSON_STEPS });
