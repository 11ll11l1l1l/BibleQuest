const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACK_SCOPE_COLUMNS = 'id,congregation_id,publication_state';
const MODULE_COLUMNS = 'id,track_id,title,summary,revision_id,display_order,publication_state';
const LESSON_COLUMNS = 'id,module_id,title,revision_id,display_order,publication_state';
const STATES = new Set(['draft','published','withdrawn']);

function fail(code, message) { throw Object.assign(new Error(message), {code}); }
function id(value) {
  if (typeof value !== 'string' || !UUID.test(value)) fail('BQ_AUTHORING_ID', 'A valid curriculum identifier is required.');
  return value.toLowerCase();
}
function responseId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) fail('BQ_AUTHORING_RESPONSE', 'Curriculum response contains an invalid identifier.');
  return value.toLowerCase();
}
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
    fail('BQ_AUTHORING_CONTENT', 'Curriculum text is missing or exceeds its limit.');
  }
  return value.trim();
}
function order(value) {
  if (!Number.isInteger(value ?? 0) || (value ?? 0) < 0) fail('BQ_AUTHORING_CONTENT', 'Curriculum order must be a non-negative integer.');
  return value ?? 0;
}
function shape(input, allowed) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).some(key => !allowed.includes(key))) {
    fail('BQ_AUTHORING_CONTENT', 'Only editable curriculum fields are supported.');
  }
}

export function normalizeModuleDraft(input) {
  shape(input, ['title','summary','position']);
  return Object.freeze({
    title:text(input.title,240,true),
    summary:text(input.summary ?? '',4000),
    display_order:order(input.position),
  });
}

export function normalizeLessonDraft(input) {
  shape(input, ['title','position']);
  return Object.freeze({
    title:text(input.title,240,true),
    display_order:order(input.position),
  });
}

// This repository is congregation-scoped composition for hierarchy metadata only.
// Authenticated RLS remains authorization; canAuthor is a trusted UX capability guard.
export function createHierarchyAuthoringRepository({ client, getContext, newRevisionId = () => crypto.randomUUID() }) {
  if (typeof getContext !== 'function') throw new TypeError('Authoring requires the existing account/congregation owner.');
  const provider = typeof client === 'function' ? client : async () => client;

  function context() {
    const current = getContext();
    if (current?.canAuthor !== true) fail('BQ_AUTHORING_DENIED', 'Curriculum authoring is unavailable for this account.');
    return Object.freeze({userId:id(current.userId),congregationId:id(current.congregationId)});
  }
  function assertCurrent(expected) {
    const current = context();
    if (current.userId !== expected.userId || current.congregationId !== expected.congregationId) {
      fail('BQ_AUTHORING_CONTEXT_STALE', 'Account or congregation changed. Reload curriculum authoring.');
    }
  }
  async function database(expected) {
    const db = await provider();
    assertCurrent(expected);
    if (typeof db?.from !== 'function') fail('BQ_AUTHORING_CLIENT', 'An authenticated database client is required.');
    return db;
  }
  async function result(request, expected) {
    const {data,error} = await request;
    assertCurrent(expected);
    if (error) throw error;
    return data;
  }
  function state(value) {
    if (!STATES.has(value)) fail('BQ_AUTHORING_RESPONSE', 'Curriculum response contains an invalid publication state.');
    return value;
  }
  function trackRecord(row, expected, trackId) {
    if (!row || responseId(row.id)!==trackId || responseId(row.congregation_id)!==expected.congregationId) {
      fail('BQ_AUTHORING_RESPONSE', 'Curriculum track response is outside the selected congregation.');
    }
    return Object.freeze({id:trackId, publicationState:state(row.publication_state)});
  }
  function moduleRecord(row, trackId) {
    if (!row || responseId(row.track_id)!==trackId) fail('BQ_AUTHORING_RESPONSE', 'Curriculum module response does not match its track.');
    return Object.freeze({
      id:responseId(row.id), trackId, revisionId:responseId(row.revision_id),
      title:row.title, summary:row.summary, position:row.display_order, publicationState:state(row.publication_state),
    });
  }
  function lessonRecord(row, moduleId) {
    if (!row || responseId(row.module_id)!==moduleId) fail('BQ_AUTHORING_RESPONSE', 'Curriculum lesson response does not match its module.');
    return Object.freeze({
      id:responseId(row.id), moduleId, revisionId:responseId(row.revision_id),
      title:row.title, position:row.display_order, publicationState:state(row.publication_state),
    });
  }
  async function requireTrack(db, expected, trackId, editable = false) {
    const data=await result(db.from('v7_tracks').select(TRACK_SCOPE_COLUMNS)
      .eq('id',trackId).eq('congregation_id',expected.congregationId).maybeSingle(),expected);
    if (!data) fail('BQ_AUTHORING_PARENT', 'The curriculum track is unavailable in the selected congregation.');
    const track=trackRecord(data,expected,trackId);
    if (editable && track.publicationState!=='draft') {
      fail('BQ_AUTHORING_CONFLICT', 'The parent track is no longer editable. Reload before saving.');
    }
    return track;
  }
  async function requireModule(db, expected, trackId, moduleId, editable = false) {
    const data=await result(db.from('v7_modules').select(MODULE_COLUMNS)
      .eq('id',moduleId).eq('track_id',trackId).maybeSingle(),expected);
    if (!data) fail('BQ_AUTHORING_PARENT', 'The curriculum module is unavailable in this track.');
    const module=moduleRecord(data,trackId);
    if (editable && module.publicationState!=='draft') {
      fail('BQ_AUTHORING_CONFLICT', 'The parent module is no longer editable. Reload before saving.');
    }
    return module;
  }

  return Object.freeze({
    async listModules(trackId) {
      const trackKey=id(trackId), expected=context(), db=await database(expected);
      await requireTrack(db,expected,trackKey);
      const data=await result(db.from('v7_modules').select(MODULE_COLUMNS)
        .eq('track_id',trackKey).order('display_order').order('id').limit(100),expected);
      if (!Array.isArray(data)) fail('BQ_AUTHORING_RESPONSE', 'Curriculum module list response is invalid.');
      return Object.freeze(data.map(row=>moduleRecord(row,trackKey)));
    },
    async createModuleDraft(trackId, input) {
      const trackKey=id(trackId), draft=normalizeModuleDraft(input), expected=context(), db=await database(expected);
      await requireTrack(db,expected,trackKey,true);
      const data=await result(db.from('v7_modules').insert({...draft,track_id:trackKey,publication_state:'draft'})
        .select(MODULE_COLUMNS).single(),expected);
      const created=moduleRecord(data,trackKey);
      if (created.publicationState!=='draft') fail('BQ_AUTHORING_RESPONSE', 'The created module did not remain a draft.');
      return created;
    },
    async updateModuleDraft(trackId, moduleId, expectedRevisionId, input) {
      const trackKey=id(trackId), moduleKey=id(moduleId), revision=id(expectedRevisionId), draft=normalizeModuleDraft(input);
      const expected=context(), db=await database(expected), nextRevision=id(newRevisionId());
      if (nextRevision===revision) fail('BQ_AUTHORING_REVISION', 'Editing requires a new revision identifier.');
      await requireTrack(db,expected,trackKey,true);
      const data=await result(db.from('v7_modules').update({...draft,revision_id:nextRevision})
        .eq('id',moduleKey).eq('track_id',trackKey).eq('publication_state','draft').eq('revision_id',revision)
        .select(MODULE_COLUMNS).maybeSingle(),expected);
      if (!data) fail('BQ_AUTHORING_CONFLICT', 'The module changed or is no longer editable. Reload before saving.');
      const updated=moduleRecord(data,trackKey);
      if (updated.id!==moduleKey || updated.revisionId!==nextRevision || updated.publicationState!=='draft') {
        fail('BQ_AUTHORING_RESPONSE', 'The saved module did not match this edit.');
      }
      return updated;
    },
    async listLessons(trackId, moduleId) {
      const trackKey=id(trackId), moduleKey=id(moduleId), expected=context(), db=await database(expected);
      await requireTrack(db,expected,trackKey);
      await requireModule(db,expected,trackKey,moduleKey);
      const data=await result(db.from('v7_lessons').select(LESSON_COLUMNS)
        .eq('module_id',moduleKey).order('display_order').order('id').limit(100),expected);
      if (!Array.isArray(data)) fail('BQ_AUTHORING_RESPONSE', 'Curriculum lesson list response is invalid.');
      return Object.freeze(data.map(row=>lessonRecord(row,moduleKey)));
    },
    async createLessonDraft(trackId, moduleId, input) {
      const trackKey=id(trackId), moduleKey=id(moduleId), draft=normalizeLessonDraft(input), expected=context(), db=await database(expected);
      await requireTrack(db,expected,trackKey,true);
      await requireModule(db,expected,trackKey,moduleKey,true);
      const data=await result(db.from('v7_lessons').insert({...draft,module_id:moduleKey,publication_state:'draft'})
        .select(LESSON_COLUMNS).single(),expected);
      const created=lessonRecord(data,moduleKey);
      if (created.publicationState!=='draft') fail('BQ_AUTHORING_RESPONSE', 'The created lesson did not remain a draft.');
      return created;
    },
    async updateLessonDraft(trackId, moduleId, lessonId, expectedRevisionId, input) {
      const trackKey=id(trackId), moduleKey=id(moduleId), lessonKey=id(lessonId), revision=id(expectedRevisionId);
      const draft=normalizeLessonDraft(input), expected=context(), db=await database(expected), nextRevision=id(newRevisionId());
      if (nextRevision===revision) fail('BQ_AUTHORING_REVISION', 'Editing requires a new revision identifier.');
      await requireTrack(db,expected,trackKey,true);
      await requireModule(db,expected,trackKey,moduleKey,true);
      const data=await result(db.from('v7_lessons').update({...draft,revision_id:nextRevision})
        .eq('id',lessonKey).eq('module_id',moduleKey).eq('publication_state','draft').eq('revision_id',revision)
        .select(LESSON_COLUMNS).maybeSingle(),expected);
      if (!data) fail('BQ_AUTHORING_CONFLICT', 'The lesson changed or is no longer editable. Reload before saving.');
      const updated=lessonRecord(data,moduleKey);
      if (updated.id!==lessonKey || updated.revisionId!==nextRevision || updated.publicationState!=='draft') {
        fail('BQ_AUTHORING_RESPONSE', 'The saved lesson did not match this edit.');
      }
      return updated;
    },
  });
}
