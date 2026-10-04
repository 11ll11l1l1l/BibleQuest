const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACK_COLUMNS = 'id,congregation_id,publication_state';
const MODULE_COLUMNS = 'id,track_id,publication_state';
const LESSON_COLUMNS = 'id,module_id,publication_state';
const REVISION_COLUMNS = 'id,lesson_id,revision_number,locale,summary,published_at,created_by';
const STEP_COLUMNS = 'id,lesson_revision_id,position,step_type,content,scripture_refs,library_revision_id';
const STEP_TYPES = Object.freeze(['scripture','understand','discuss','reflect','apply','pray','action']);
const MAX_JSON_BYTES = 40000;

function fail(code, message) { throw Object.assign(new Error(message), {code}); }
function id(value) {
  if (typeof value !== 'string' || !UUID.test(value)) fail('BQ_AUTHORING_ID', 'A valid curriculum identifier is required.');
  return value.toLowerCase();
}
function responseId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) fail('BQ_AUTHORING_RESPONSE', 'Curriculum response contains an invalid identifier.');
  return value.toLowerCase();
}
function text(value, max) {
  if (typeof value !== 'string' || value.trim().length > max) fail('BQ_AUTHORING_CONTENT', 'Curriculum text is invalid or exceeds its limit.');
  return value.trim();
}
function locale(value) {
  let canonical;
  try { if (typeof value === 'string') canonical=Intl.getCanonicalLocales(value)[0]; } catch { /* handled below */ }
  if (!canonical) fail('BQ_AUTHORING_CONTENT', 'A valid lesson language is required.');
  return canonical;
}
function shape(input, allowed) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).some(key => !allowed.includes(key))) {
    fail('BQ_AUTHORING_CONTENT', 'Only editable lesson revision fields are supported.');
  }
}
function jsonClone(value, depth = 0) {
  if (depth > 12) fail('BQ_AUTHORING_CONTENT', 'Lesson step content is too deeply nested.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(item=>jsonClone(item,depth+1));
  if (value && typeof value === 'object' && (Object.getPrototypeOf(value)===Object.prototype || Object.getPrototypeOf(value)===null)) {
    return Object.fromEntries(Object.entries(value).map(([key,item])=>{
      if (!key || key.length > 120) fail('BQ_AUTHORING_CONTENT', 'Lesson step content contains an invalid field name.');
      return [key,jsonClone(item,depth+1)];
    }));
  }
  fail('BQ_AUTHORING_CONTENT', 'Lesson step content must be JSON-safe data.');
}
function boundedJson(value, expectedArray = false) {
  const cloned=jsonClone(value);
  if (expectedArray ? !Array.isArray(cloned) : (!cloned || Array.isArray(cloned) || typeof cloned!=='object')) {
    fail('BQ_AUTHORING_CONTENT', expectedArray ? 'Scripture references must be a JSON array.' : 'Lesson step content must be a JSON object.');
  }
  if (new TextEncoder().encode(JSON.stringify(cloned)).length > MAX_JSON_BYTES) {
    fail('BQ_AUTHORING_CONTENT', 'Lesson step content exceeds its size limit.');
  }
  return cloned;
}

export function normalizeLessonRevisionDraft(input) {
  shape(input,['locale','summary']);
  return Object.freeze({locale:locale(input.locale),summary:text(input.summary ?? '',4000)});
}

export function normalizeLessonStepDraft(input) {
  shape(input,['position','content','scriptureRefs','libraryRevisionId']);
  if (!Number.isInteger(input.position) || input.position < 0 || input.position > 6) {
    fail('BQ_AUTHORING_CONTENT', 'Lesson step position must be between 0 and 6.');
  }
  let libraryRevisionId=null;
  if (input.libraryRevisionId !== undefined && input.libraryRevisionId !== null && input.libraryRevisionId !== '') {
    libraryRevisionId=id(input.libraryRevisionId);
  }
  return Object.freeze({
    position:input.position,
    step_type:STEP_TYPES[input.position],
    content:boundedJson(input.content ?? {}),
    scripture_refs:boundedJson(input.scriptureRefs ?? [],true),
    library_revision_id:libraryRevisionId,
  });
}

// Draft revision/step authoring only. Published lesson revisions remain immutable and are never mutated here.
export function createLessonRevisionAuthoringRepository({ client, getContext }) {
  if (typeof getContext !== 'function') throw new TypeError('Authoring requires the existing account/congregation owner.');
  const provider = typeof client === 'function' ? client : async () => client;

  function context() {
    const current=getContext();
    if (current?.canAuthor !== true) fail('BQ_AUTHORING_DENIED', 'Curriculum authoring is unavailable for this account.');
    return Object.freeze({userId:id(current.userId),congregationId:id(current.congregationId)});
  }
  function assertCurrent(expected) {
    const current=context();
    if (current.userId!==expected.userId || current.congregationId!==expected.congregationId) {
      fail('BQ_AUTHORING_CONTEXT_STALE', 'Account or congregation changed. Reload curriculum authoring.');
    }
  }
  async function database(expected) {
    const db=await provider();
    assertCurrent(expected);
    if (typeof db?.from !== 'function') fail('BQ_AUTHORING_CLIENT', 'An authenticated database client is required.');
    return db;
  }
  async function result(request, expected) {
    const {data,error}=await request;
    assertCurrent(expected);
    if (error) throw error;
    return data;
  }
  async function requireDraftLesson(db,expected,trackKey,moduleKey,lessonKey) {
    const track=await result(db.from('v7_tracks').select(TRACK_COLUMNS)
      .eq('id',trackKey).eq('congregation_id',expected.congregationId).maybeSingle(),expected);
    if (!track || responseId(track.id)!==trackKey || responseId(track.congregation_id)!==expected.congregationId) {
      fail('BQ_AUTHORING_PARENT', 'The curriculum track is unavailable in the selected congregation.');
    }
    if (track.publication_state!=='draft') fail('BQ_AUTHORING_CONFLICT', 'The parent track is no longer editable.');

    const module=await result(db.from('v7_modules').select(MODULE_COLUMNS)
      .eq('id',moduleKey).eq('track_id',trackKey).maybeSingle(),expected);
    if (!module || responseId(module.id)!==moduleKey || responseId(module.track_id)!==trackKey) {
      fail('BQ_AUTHORING_PARENT', 'The curriculum module is unavailable in this track.');
    }
    if (module.publication_state!=='draft') fail('BQ_AUTHORING_CONFLICT', 'The parent module is no longer editable.');

    const lesson=await result(db.from('v7_lessons').select(LESSON_COLUMNS)
      .eq('id',lessonKey).eq('module_id',moduleKey).maybeSingle(),expected);
    if (!lesson || responseId(lesson.id)!==lessonKey || responseId(lesson.module_id)!==moduleKey) {
      fail('BQ_AUTHORING_PARENT', 'The curriculum lesson is unavailable in this module.');
    }
    if (lesson.publication_state!=='draft') fail('BQ_AUTHORING_CONFLICT', 'The lesson is no longer editable.');
  }
  function revisionRecord(row,lessonKey) {
    if (!row || responseId(row.lesson_id)!==lessonKey || !Number.isInteger(row.revision_number) || row.revision_number < 1) {
      fail('BQ_AUTHORING_RESPONSE', 'Lesson revision response is invalid.');
    }
    return Object.freeze({
      id:responseId(row.id), lessonId:lessonKey, revisionNumber:row.revision_number,
      locale:locale(row.locale), summary:typeof row.summary==='string'?row.summary:'',
      publishedAt:row.published_at ?? null, createdBy:responseId(row.created_by),
      editable:row.published_at == null,
    });
  }
  function stepRecord(row,revisionKey) {
    if (!row || responseId(row.lesson_revision_id)!==revisionKey || !Number.isInteger(row.position)
        || row.position<0 || row.position>6 || row.step_type!==STEP_TYPES[row.position]) {
      fail('BQ_AUTHORING_RESPONSE', 'Lesson step response is invalid.');
    }
    return Object.freeze({
      id:responseId(row.id), revisionId:revisionKey, position:row.position, stepType:row.step_type,
      content:boundedJson(row.content ?? {}), scriptureRefs:boundedJson(row.scripture_refs ?? [],true),
      libraryRevisionId:row.library_revision_id==null?null:responseId(row.library_revision_id),
    });
  }
  async function requireDraftRevision(db,expected,lessonKey,revisionKey) {
    const data=await result(db.from('v7_lesson_revisions').select(REVISION_COLUMNS)
      .eq('id',revisionKey).eq('lesson_id',lessonKey).maybeSingle(),expected);
    if (!data) fail('BQ_AUTHORING_PARENT', 'The lesson revision is unavailable for this lesson.');
    const revision=revisionRecord(data,lessonKey);
    if (!revision.editable) fail('BQ_AUTHORING_CONFLICT', 'Published lesson revisions are immutable.');
    return revision;
  }

  return Object.freeze({
    async listRevisions(trackId,moduleId,lessonId) {
      const trackKey=id(trackId), moduleKey=id(moduleId), lessonKey=id(lessonId), expected=context(), db=await database(expected);
      await requireDraftLesson(db,expected,trackKey,moduleKey,lessonKey);
      const data=await result(db.from('v7_lesson_revisions').select(REVISION_COLUMNS)
        .eq('lesson_id',lessonKey).order('revision_number',{ascending:false}).limit(100),expected);
      if (!Array.isArray(data)) fail('BQ_AUTHORING_RESPONSE', 'Lesson revision list response is invalid.');
      return Object.freeze(data.map(row=>revisionRecord(row,lessonKey)));
    },
    async createDraftRevision(trackId,moduleId,lessonId,input) {
      const trackKey=id(trackId), moduleKey=id(moduleId), lessonKey=id(lessonId), draft=normalizeLessonRevisionDraft(input);
      const expected=context(), db=await database(expected);
      await requireDraftLesson(db,expected,trackKey,moduleKey,lessonKey);
      const latest=await result(db.from('v7_lesson_revisions').select('revision_number')
        .eq('lesson_id',lessonKey).order('revision_number',{ascending:false}).limit(1),expected);
      if (!Array.isArray(latest)) fail('BQ_AUTHORING_RESPONSE', 'Lesson revision counter response is invalid.');
      const previous=latest.length?latest[0]?.revision_number:0;
      if (!Number.isInteger(previous) || previous<0 || previous>=2147483647) fail('BQ_AUTHORING_RESPONSE', 'Lesson revision counter is invalid.');
      const data=await result(db.from('v7_lesson_revisions').insert({
        lesson_id:lessonKey,revision_number:previous+1,...draft,created_by:expected.userId,
      }).select(REVISION_COLUMNS).single(),expected);
      const created=revisionRecord(data,lessonKey);
      if (!created.editable || created.createdBy!==expected.userId || created.revisionNumber!==previous+1) {
        fail('BQ_AUTHORING_RESPONSE', 'The created lesson revision did not match this authoring request.');
      }
      return created;
    },
    async listSteps(trackId,moduleId,lessonId,revisionId) {
      const trackKey=id(trackId), moduleKey=id(moduleId), lessonKey=id(lessonId), revisionKey=id(revisionId);
      const expected=context(), db=await database(expected);
      await requireDraftLesson(db,expected,trackKey,moduleKey,lessonKey);
      await requireDraftRevision(db,expected,lessonKey,revisionKey);
      const data=await result(db.from('v7_lesson_steps').select(STEP_COLUMNS)
        .eq('lesson_revision_id',revisionKey).order('position').limit(7),expected);
      if (!Array.isArray(data) || data.length>7) fail('BQ_AUTHORING_RESPONSE', 'Lesson step list response is invalid.');
      const seen=new Set();
      const steps=data.map(row=>{
        const step=stepRecord(row,revisionKey);
        if (seen.has(step.position)) fail('BQ_AUTHORING_RESPONSE', 'Lesson step response contains duplicate positions.');
        seen.add(step.position);return step;
      });
      return Object.freeze(steps);
    },
    async saveDraftStep(trackId,moduleId,lessonId,revisionId,input) {
      const trackKey=id(trackId), moduleKey=id(moduleId), lessonKey=id(lessonId), revisionKey=id(revisionId);
      const draft=normalizeLessonStepDraft(input), expected=context(), db=await database(expected);
      await requireDraftLesson(db,expected,trackKey,moduleKey,lessonKey);
      await requireDraftRevision(db,expected,lessonKey,revisionKey);
      const data=await result(db.from('v7_lesson_steps').upsert({
        lesson_revision_id:revisionKey,...draft,
      },{onConflict:'lesson_revision_id,position'}).select(STEP_COLUMNS).single(),expected);
      const saved=stepRecord(data,revisionKey);
      if (saved.position!==draft.position || saved.stepType!==draft.step_type) {
        fail('BQ_AUTHORING_RESPONSE', 'The saved lesson step did not match this authoring request.');
      }
      return saved;
    },
  });
}
