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

function normalizePosition(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const position = Number(value);
  return Number.isInteger(position) && position >= 0 ? position : null;
}

function normalizeCurriculumNode(row, kind, pair) {
  const id = identifier(row?.id);
  const revisionId = identifier(row?.revisionId ?? row?.revision_id);
  const title = identifier(row?.title);
  const position = normalizePosition(row?.position);
  const rowPairId = identifier(row?.pairId ?? row?.pair_id);
  const rowCongregationId = identifier(row?.congregationId ?? row?.congregation_id);
  if (!id || !revisionId || !title || position === null) {
    fail('BQ_DISCIPLESHIP_CURRICULUM_RESPONSE', `${kind} must include an id, revision, title, and ordered position.`);
  }
  if ((rowPairId && rowPairId !== pair.id)
    || (rowCongregationId && rowCongregationId !== pair.congregationId)) {
    fail('BQ_DISCIPLESHIP_CURRICULUM_SCOPE', 'Curriculum data was outside the selected pair.');
  }
  return { id, revisionId, title, position };
}

function normalizeChildren(rows, parent, kind, pair) {
  if (!Array.isArray(rows)) fail('BQ_DISCIPLESHIP_CURRICULUM_RESPONSE', `${kind} hierarchy was invalid.`);
  const normalized = rows.map(row => {
    const node = normalizeCurriculumNode(row, kind, pair);
    const declaredParent = identifier(row?.[`${parent.kind}Id`] ?? row?.[`${parent.kind}_id`]);
    if (declaredParent && declaredParent !== parent.id) {
      fail('BQ_DISCIPLESHIP_CURRICULUM_SCOPE', `${kind} did not belong to its requested parent.`);
    }
    return Object.freeze({ ...node, ...(parent.kind === 'track' ? { trackId: parent.id } : { moduleId: parent.id }) });
  });
  const ids = new Set();
  const positions = new Set();
  for (const node of normalized) {
    if (ids.has(node.id) || positions.has(node.position)) {
      fail('BQ_DISCIPLESHIP_CURRICULUM_RESPONSE', `${kind} hierarchy contains duplicate ids or positions.`);
    }
    ids.add(node.id);
    positions.add(node.position);
  }
  return Object.freeze(normalized.sort((a, b) => a.position - b.position));
}

function normalizeCurriculum(rows, pair) {
  if (!Array.isArray(rows)) fail('BQ_DISCIPLESHIP_CURRICULUM_RESPONSE', 'Curriculum response was invalid.');
  const tracks = rows.map(row => {
    const track = normalizeCurriculumNode(row, 'Track', pair);
    const rawModules = Array.isArray(row.modules) ? row.modules : [];
    const modules = normalizeChildren(rawModules, { kind: 'track', id: track.id }, 'Module', pair).map(module => {
      const rawModule = rawModules.find(candidate => identifier(candidate?.id) === module.id);
      const lessons = normalizeChildren(rawModule?.lessons, { kind: 'module', id: module.id }, 'Lesson', pair);
      return Object.freeze({ ...module, lessons });
    });
    return Object.freeze({ ...track, modules: Object.freeze(modules) });
  });
  const ids = new Set();
  const positions = new Set();
  for (const track of tracks) {
    if (ids.has(track.id) || positions.has(track.position)) {
      fail('BQ_DISCIPLESHIP_CURRICULUM_RESPONSE', 'Track hierarchy contains duplicate ids or positions.');
    }
    ids.add(track.id);
    positions.add(track.position);
  }
  return Object.freeze(tracks.sort((a, b) => a.position - b.position));
}

function assertOperationalProgress(progress, pair, requestedRevisionId) {
  const rows = Array.isArray(progress) ? progress : [progress];
  const safeRows = rows.map(row => {
    const rowPairId = identifier(row?.pairId ?? row?.pair_id);
    const rowCongregationId = identifier(row?.congregationId ?? row?.congregation_id);
    const learnerId = identifier(row?.learnerId ?? row?.learner_id ?? row?.userId ?? row?.user_id);
    const lessonRevisionId = identifier(row?.lessonRevisionId ?? row?.lesson_revision_id);
    if ((rowPairId && rowPairId !== pair.id)
      || (rowCongregationId && rowCongregationId !== pair.congregationId)
      || (learnerId && learnerId !== pair.menteeId)
      || (lessonRevisionId && lessonRevisionId !== requestedRevisionId)) {
      fail('BQ_DISCIPLESHIP_PROGRESS_SCOPE', 'Progress data was outside the selected pair.');
    }
    if (!row || typeof row !== 'object') return row;
    return Object.freeze({
      pairId: pair.id,
      learnerId: pair.menteeId,
      lessonRevisionId: requestedRevisionId,
      currentStepId: identifier(row.currentStepId ?? row.current_step_id) || null,
      status: identifier(row.status),
      startedAt: row.startedAt ?? row.started_at ?? null,
      completedAt: row.completedAt ?? row.completed_at ?? null,
      updatedAt: row.updatedAt ?? row.updated_at ?? null,
    });
  });
  return Array.isArray(progress) ? Object.freeze(safeRows) : safeRows[0];
}

function privateResponseSnapshot(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(privateResponseSnapshot));
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, privateResponseSnapshot(entry)])));
  }
  return value;
}

function normalizePrivateResponses(rows, pair, revisionId) {
  if (!Array.isArray(rows)) fail('BQ_DISCIPLESHIP_RESPONSE_INVALID', 'Private lesson responses were unavailable.');
  const ids = new Set();
  const steps = new Set();
  return Object.freeze(rows.map(row => {
    const id = identifier(row?.id);
    const stepId = identifier(row?.stepId ?? row?.lesson_step_id);
    const learnerId = identifier(row?.learnerId ?? row?.learner_id);
    const sourceRevision = identifier(row?.lessonRevisionId ?? row?.lesson_revision_id);
    const pairId = identifier(row?.pairId ?? row?.pair_id);
    const congregationId = identifier(row?.congregationId ?? row?.congregation_id);
    if (learnerId !== pair.menteeId || sourceRevision !== revisionId
        || (pairId && pairId !== pair.id) || (congregationId && congregationId !== pair.congregationId)) {
      fail('BQ_DISCIPLESHIP_RESPONSE_SCOPE', 'Private lesson responses were outside the requested learner or revision.');
    }
    if (!id || !stepId || !Object.hasOwn(row, 'response') || row.response === undefined
        || ids.has(id) || steps.has(stepId)) {
      fail('BQ_DISCIPLESHIP_RESPONSE_INVALID', 'Private lesson responses were incomplete or duplicated.');
    }
    const audienceUserIds = row.audienceUserIds;
    if (!Array.isArray(audienceUserIds) || audienceUserIds.length > 1
        || audienceUserIds.some(recipient => recipient !== pair.mentorId)) {
      fail('BQ_DISCIPLESHIP_RESPONSE_SCOPE', 'Private lesson response audience was outside the paired mentor.');
    }
    ids.add(id);
    steps.add(stepId);
    return Object.freeze({ id, stepId, lessonRevisionId: revisionId, visibility: audienceUserIds.length ? 'shared' : 'owner',
      audienceUserIds: Object.freeze([...audienceUserIds]),
      response: privateResponseSnapshot(row.response), updatedAt: row.updatedAt ?? row.updated_at ?? null });
  }));
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
      return normalizeCurriculum(curriculum, pair);
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
      const revisionId = identifier(lessonRevisionId);
      if (!revisionId) fail('BQ_DISCIPLESHIP_LESSON_REQUIRED', 'Choose a published lesson revision first.');
      const progress = await repository.loadOperationalProgress(revisionId, pair, context);
      assertCurrent(context);
      return assertOperationalProgress(progress, pair, revisionId);
    });
  }

  async function loadPrivateResponses(pairId, lessonRevisionId) {
    return inContext(async context => {
      const pair = await resolvePair(pairId, context);
      if (context.userId !== pair.menteeId) fail('BQ_DISCIPLESHIP_RESPONSE_DENIED', 'Only the mentee can read personal lesson responses.');
      const revisionId = identifier(lessonRevisionId);
      if (!revisionId) fail('BQ_DISCIPLESHIP_LESSON_REQUIRED', 'Choose a published lesson revision first.');
      const responses = await repository.loadPrivateResponses(revisionId, pair, context);
      assertCurrent(context);
      return normalizePrivateResponses(responses, pair, revisionId);
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
    loadPrivateResponses,
    saveProgress,
    savePrivateResponse,
    shareResponse,
  });
}

export const discipleshipContracts = Object.freeze({ pairStates: PAIR_STATES, lessonSteps: LESSON_STEPS });
