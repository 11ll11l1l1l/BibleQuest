const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACK_COLUMNS = 'id,congregation_id,revision_id,publication_state';
const MODULE_COLUMNS = 'id,track_id,revision_id,publication_state';
const LESSON_COLUMNS = 'id,module_id,revision_id,publication_state';
const REVISION_COLUMNS = 'id,lesson_id,published_at';

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

function id(value, code = 'BQ_AUTHORING_ID') {
  if (typeof value !== 'string' || !UUID.test(value)) {
    fail(code, 'A valid curriculum identifier is required.');
  }
  return value.toLowerCase();
}

function recordId(value) {
  return id(value, 'BQ_AUTHORING_RESPONSE');
}

// Read-only recovery boundary for publication lifecycle. It reconstructs the exact
// optimistic hierarchy identity needed by the schema-owned withdrawal RPC after a
// reload; it never changes publication state itself.
export function createWithdrawalPreparationRepository({ client, getContext } = {}) {
  if (!client) throw new TypeError('Withdrawal preparation requires an authenticated database client or client provider.');
  if (typeof getContext !== 'function') throw new TypeError('Withdrawal preparation requires the existing account/congregation context owner.');
  const provider = typeof client === 'function' ? client : async () => client;

  function context() {
    const current = getContext();
    if (current?.canAuthor !== true) {
      fail('BQ_AUTHORING_DENIED', 'Curriculum publication management is unavailable for this account.');
    }
    return Object.freeze({
      userId: id(current.userId),
      congregationId: id(current.congregationId),
    });
  }

  function assertCurrent(expected) {
    const current = context();
    if (current.userId !== expected.userId || current.congregationId !== expected.congregationId) {
      fail('BQ_AUTHORING_CONTEXT_STALE', 'Account or congregation changed. Reload curriculum publication management.');
    }
  }

  async function database(expected) {
    const db = await provider();
    assertCurrent(expected);
    if (typeof db?.from !== 'function') {
      fail('BQ_AUTHORING_CLIENT', 'An authenticated database client is required.');
    }
    return db;
  }

  async function result(request, expected) {
    const { data, error } = await request;
    assertCurrent(expected);
    if (error) throw error;
    return data;
  }

  return Object.freeze({
    async prepare(trackId, moduleId, lessonId) {
      const trackKey = id(trackId);
      const moduleKey = id(moduleId);
      const lessonKey = id(lessonId);
      const expected = context();
      const db = await database(expected);

      const track = await result(db.from('v7_tracks').select(TRACK_COLUMNS)
        .eq('id', trackKey).eq('congregation_id', expected.congregationId).maybeSingle(), expected);
      if (!track || recordId(track.id) !== trackKey || recordId(track.congregation_id) !== expected.congregationId
          || track.publication_state !== 'published') {
        fail('BQ_AUTHORING_WITHDRAWAL_STATE', 'Only a published curriculum track can contain a withdrawable lesson.');
      }

      const module = await result(db.from('v7_modules').select(MODULE_COLUMNS)
        .eq('id', moduleKey).eq('track_id', trackKey).maybeSingle(), expected);
      if (!module || recordId(module.id) !== moduleKey || recordId(module.track_id) !== trackKey
          || module.publication_state !== 'published') {
        fail('BQ_AUTHORING_WITHDRAWAL_STATE', 'The curriculum module is not published in the selected track.');
      }

      const lesson = await result(db.from('v7_lessons').select(LESSON_COLUMNS)
        .eq('id', lessonKey).eq('module_id', moduleKey).maybeSingle(), expected);
      if (!lesson || recordId(lesson.id) !== lessonKey || recordId(lesson.module_id) !== moduleKey
          || !['published', 'withdrawn'].includes(lesson.publication_state)) {
        fail('BQ_AUTHORING_WITHDRAWAL_STATE', 'The curriculum lesson is not published or already withdrawn.');
      }

      const revisions = await result(db.from('v7_lesson_revisions').select(REVISION_COLUMNS)
        .eq('lesson_id', lessonKey).not('published_at', 'is', null)
        .order('published_at', { ascending: false }).limit(2), expected);
      if (!Array.isArray(revisions) || revisions.length !== 1) {
        fail('BQ_AUTHORING_WITHDRAWAL_REVISION', 'The curriculum lesson does not have one unambiguous published revision.');
      }
      const revision = revisions[0];
      if (!revision || recordId(revision.lesson_id) !== lessonKey
          || typeof revision.published_at !== 'string' || !Number.isFinite(Date.parse(revision.published_at))) {
        fail('BQ_AUTHORING_RESPONSE', 'The published lesson revision response is invalid.');
      }

      return Object.freeze({
        trackId: trackKey,
        moduleId: moduleKey,
        lessonId: lessonKey,
        lessonRevisionId: recordId(revision.id),
        expectedTrackRevisionId: recordId(track.revision_id),
        expectedModuleRevisionId: recordId(module.revision_id),
        expectedLessonRevisionId: recordId(lesson.revision_id),
      });
    },
  });
}
