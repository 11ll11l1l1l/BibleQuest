const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function id(value, code = 'BQ_AUTHORING_PUBLICATION_REQUEST') {
  if (typeof value !== 'string' || !UUID.test(value)) {
    fail(code, 'A valid curriculum publication identifier is required.');
  }
  return value.toLowerCase();
}

function normalizeRequest(value, { includeLibrary = false } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('BQ_AUTHORING_PUBLICATION_REQUEST', 'A prepared curriculum publication request is required.');
  }
  const request = {
    trackId: id(value.trackId),
    moduleId: id(value.moduleId),
    lessonId: id(value.lessonId),
    lessonRevisionId: id(value.lessonRevisionId),
    expectedTrackRevisionId: id(value.expectedTrackRevisionId),
    expectedModuleRevisionId: id(value.expectedModuleRevisionId),
    expectedLessonRevisionId: id(value.expectedLessonRevisionId),
  };
  if (includeLibrary) {
    if (value.libraryRevisionIds !== undefined && !Array.isArray(value.libraryRevisionIds)) {
      fail('BQ_AUTHORING_PUBLICATION_REQUEST', 'Library revision references must be an array.');
    }
    const source = value.libraryRevisionIds ?? [];
    if (source.length > 7) {
      fail('BQ_AUTHORING_PUBLICATION_REQUEST', 'A lesson cannot reference more Library revisions than lesson steps.');
    }
    request.libraryRevisionIds = Object.freeze([...new Set(source.map(item => id(item)))]);
  }
  return Object.freeze(request);
}

function timestamp(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    fail('BQ_AUTHORING_PUBLICATION_RESPONSE', 'Publication authority returned an invalid publication timestamp.');
  }
  return value;
}

function normalizeReceipt(data, expected, mode) {
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  if (rows.length !== 1 || !rows[0] || typeof rows[0] !== 'object') {
    fail('BQ_AUTHORING_PUBLICATION_RESPONSE', 'Publication authority returned an invalid response.');
  }
  const row = rows[0];
  const congregationId = id(row.congregation_id, 'BQ_AUTHORING_PUBLICATION_RESPONSE');
  const trackId = id(row.track_id, 'BQ_AUTHORING_PUBLICATION_RESPONSE');
  const moduleId = id(row.module_id, 'BQ_AUTHORING_PUBLICATION_RESPONSE');
  const lessonId = id(row.lesson_id, 'BQ_AUTHORING_PUBLICATION_RESPONSE');
  const lessonRevisionId = id(row.lesson_revision_id, 'BQ_AUTHORING_PUBLICATION_RESPONSE');
  if (congregationId !== expected.congregationId
      || trackId !== expected.request.trackId
      || moduleId !== expected.request.moduleId
      || lessonId !== expected.request.lessonId
      || lessonRevisionId !== expected.request.lessonRevisionId) {
    fail('BQ_AUTHORING_PUBLICATION_RESPONSE', 'Publication authority acknowledged a different curriculum path.');
  }

  const trackPublicationState = row.track_publication_state;
  const modulePublicationState = row.module_publication_state;
  const lessonPublicationState = row.lesson_publication_state;
  if (trackPublicationState !== 'published' || modulePublicationState !== 'published'
      || lessonPublicationState !== (mode === 'withdraw' ? 'withdrawn' : 'published')) {
    fail('BQ_AUTHORING_PUBLICATION_RESPONSE', 'Publication authority returned an unexpected publication state.');
  }

  return Object.freeze({
    congregationId,
    trackId,
    moduleId,
    lessonId,
    lessonRevisionId,
    trackPublicationState,
    modulePublicationState,
    lessonPublicationState,
    publishedAt: timestamp(row.published_at),
  });
}

// Lane B consumes the schema-owned SECURITY DEFINER RPCs only. Authorization,
// tenant binding, staleness checks, Library-reference validation, atomic state
// changes, and retry semantics remain authoritative on the backend.
export function createCurriculumPublicationAuthority({ client, getContext } = {}) {
  if (!client) throw new TypeError('Curriculum publication requires an authenticated database client or client provider.');
  if (typeof getContext !== 'function') throw new TypeError('Curriculum publication requires the existing account/congregation context owner.');
  const provider = typeof client === 'function' ? client : async () => client;

  function context() {
    const current = getContext();
    return Object.freeze({
      userId: id(current?.userId, 'BQ_AUTHORING_PUBLICATION_CONTEXT'),
      congregationId: id(current?.congregationId, 'BQ_AUTHORING_PUBLICATION_CONTEXT'),
    });
  }

  function assertCurrent(expected) {
    const current = context();
    if (current.userId !== expected.userId || current.congregationId !== expected.congregationId) {
      fail('BQ_AUTHORING_PUBLICATION_CONTEXT_STALE', 'Account or congregation changed during curriculum publication. Reload before retrying.');
    }
  }

  async function database(expected) {
    const db = await provider();
    assertCurrent(expected);
    if (typeof db?.rpc !== 'function') {
      fail('BQ_AUTHORING_PUBLICATION_CLIENT', 'An authenticated database client with RPC support is required.');
    }
    return db;
  }

  async function call(name, args, expected, request, mode) {
    const db = await database(expected);
    const { data, error } = await db.rpc(name, args);
    assertCurrent(expected);
    if (error) throw error;
    return normalizeReceipt(data, { congregationId: expected.congregationId, request }, mode);
  }

  return Object.freeze({
    async publish(preparedRequest) {
      const request = normalizeRequest(preparedRequest, { includeLibrary: true });
      const expected = context();
      return call('bible_v7_publish_curriculum_path', {
        p_congregation_id: expected.congregationId,
        p_track_id: request.trackId,
        p_module_id: request.moduleId,
        p_lesson_id: request.lessonId,
        p_lesson_revision_id: request.lessonRevisionId,
        p_expected_track_revision_id: request.expectedTrackRevisionId,
        p_expected_module_revision_id: request.expectedModuleRevisionId,
        p_expected_lesson_revision_id: request.expectedLessonRevisionId,
        p_library_revision_ids: request.libraryRevisionIds,
      }, expected, request, 'publish');
    },

    async withdraw(preparedRequest) {
      const request = normalizeRequest(preparedRequest);
      const expected = context();
      return call('bible_v7_withdraw_curriculum_lesson', {
        p_congregation_id: expected.congregationId,
        p_track_id: request.trackId,
        p_module_id: request.moduleId,
        p_lesson_id: request.lessonId,
        p_lesson_revision_id: request.lessonRevisionId,
        p_expected_track_revision_id: request.expectedTrackRevisionId,
        p_expected_module_revision_id: request.expectedModuleRevisionId,
        p_expected_lesson_revision_id: request.expectedLessonRevisionId,
      }, expected, request, 'withdraw');
    },
  });
}
