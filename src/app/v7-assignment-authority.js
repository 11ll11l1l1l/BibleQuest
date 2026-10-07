function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function required(value, label) {
  const id = String(value ?? '').trim();
  if (!id) fail('BQ_ASSIGNMENT_IDENTIFIER_REQUIRED', `${label} is required.`);
  return id;
}

function normalizeRequest(request) {
  if (!request || typeof request !== 'object') {
    fail('BQ_ASSIGNMENT_REQUEST_REQUIRED', 'A prepared ONE 2 ONE assignment request is required.');
  }
  return Object.freeze({
    pairId: required(request.pairId, 'Pair'),
    trackId: required(request.trackId, 'Track'),
    moduleId: required(request.moduleId, 'Module'),
    lessonId: required(request.lessonId, 'Lesson'),
    lessonRevisionId: required(request.lessonRevisionId, 'Lesson revision'),
  });
}

export function createV7AssignmentAuthority({ client, session, membership }) {
  if (!session?.getState || !membership?.getActive) {
    throw new Error('V7 assignment authority requires the shared session and congregation membership boundaries.');
  }
  const provider = typeof client === 'function' ? client : async () => client;

  function context() {
    const auth = session.getState();
    const userId = auth?.authenticated && auth?.user?.id ? String(auth.user.id) : '';
    const active = membership.getActive();
    if (!userId) fail('BQ_ASSIGNMENT_AUTH_REQUIRED', 'Sign in before creating a ONE 2 ONE assignment.');
    if (!active?.congregationId || (active.userId && String(active.userId) !== userId)) {
      fail('BQ_ASSIGNMENT_SCOPE_REQUIRED', 'Choose an active congregation before creating a ONE 2 ONE assignment.');
    }
    return Object.freeze({ userId, congregationId: String(active.congregationId) });
  }

  function assertCurrent(expected) {
    const current = context();
    if (current.userId !== expected.userId || current.congregationId !== expected.congregationId) {
      fail('BQ_ASSIGNMENT_CONTEXT_STALE', 'Your account or congregation changed. Re-open assignment preparation.');
    }
  }

  async function createAssignment(preparedRequest) {
    const request = normalizeRequest(preparedRequest);
    const expected = context();
    const db = await provider();
    assertCurrent(expected);
    if (!db?.rpc) fail('BQ_ASSIGNMENT_CLIENT_REQUIRED', 'An authenticated database client with RPC support is required.');

    const { data, error } = await db.rpc('bible_v7_create_pair_assignment', {
      p_pair_id: request.pairId,
      p_track_id: request.trackId,
      p_module_id: request.moduleId,
      p_lesson_id: request.lessonId,
      p_lesson_revision_id: request.lessonRevisionId,
    });
    assertCurrent(expected);
    if (error) throw error;

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    if (rows.length !== 1) {
      fail('BQ_ASSIGNMENT_ACK_INVALID', 'Assignment creation did not return one stable assignment.');
    }
    const row = rows[0];
    const id = String(row?.assignment_id ?? '').trim();
    const status = String(row?.assignment_status ?? '').trim();
    if (!id || !['assigned', 'started', 'completed'].includes(status)) {
      fail('BQ_ASSIGNMENT_ACK_INVALID', 'Assignment creation returned an invalid assignment identity or status.');
    }

    return Object.freeze({ id, status, ...request });
  }

  return Object.freeze({ createAssignment });
}
