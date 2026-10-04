const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACK_COLUMNS = 'id,congregation_id,revision_id,publication_state';
const MODULE_COLUMNS = 'id,track_id,revision_id,publication_state';
const LESSON_COLUMNS = 'id,module_id,revision_id,publication_state';
const REVISION_COLUMNS = 'id,lesson_id,published_at';
const STEP_COLUMNS = 'id,lesson_revision_id,position,step_type,library_revision_id';
const STEP_TYPES = Object.freeze(['scripture','understand','discuss','reflect','apply','pray','action']);

function fail(code, message) { throw Object.assign(new Error(message), {code}); }
function id(value, response = false) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    fail(response ? 'BQ_AUTHORING_RESPONSE' : 'BQ_AUTHORING_ID', response
      ? 'Publication readiness response contains an invalid identifier.'
      : 'A valid curriculum identifier is required.');
  }
  return value.toLowerCase();
}
function state(value) {
  if (!['draft','published','withdrawn'].includes(value)) fail('BQ_AUTHORING_RESPONSE', 'Publication readiness response contains an invalid state.');
  return value;
}

// Read-only preparation for the schema-owned atomic publish mutation.
export function createPublicationReadinessRepository({client,getContext}) {
  if (typeof getContext !== 'function') throw new TypeError('Publication readiness requires the existing account/congregation owner.');
  const provider=typeof client==='function'?client:async()=>client;
  function context() {
    const current=getContext();
    if(current?.canAuthor!==true) fail('BQ_AUTHORING_DENIED','Curriculum authoring is unavailable for this account.');
    return Object.freeze({userId:id(current.userId),congregationId:id(current.congregationId)});
  }
  function assertCurrent(expected) {
    const current=context();
    if(current.userId!==expected.userId || current.congregationId!==expected.congregationId) {
      fail('BQ_AUTHORING_CONTEXT_STALE','Account or congregation changed. Reload curriculum authoring.');
    }
  }
  async function db(expected) {
    const resolved=await provider();assertCurrent(expected);
    if(typeof resolved?.from!=='function') fail('BQ_AUTHORING_CLIENT','An authenticated database client is required.');
    return resolved;
  }
  async function result(request,expected) {
    const {data,error}=await request;assertCurrent(expected);if(error) throw error;return data;
  }
  function exact(row,key,parentKey,parentValue,scopeKey,scopeValue) {
    if(!row || id(row.id,true)!==key) fail('BQ_AUTHORING_PARENT','The requested curriculum path is unavailable.');
    if(parentKey && id(row[parentKey],true)!==parentValue) fail('BQ_AUTHORING_RESPONSE','Publication readiness returned a mismatched curriculum parent.');
    if(scopeKey && id(row[scopeKey],true)!==scopeValue) fail('BQ_AUTHORING_RESPONSE','Publication readiness returned curriculum outside the selected congregation.');
    return row;
  }
  return Object.freeze({
    async inspect(trackId,moduleId,lessonId,lessonRevisionId) {
      const trackKey=id(trackId),moduleKey=id(moduleId),lessonKey=id(lessonId),revisionKey=id(lessonRevisionId);
      const expected=context(),client=await db(expected);
      const track=exact(await result(client.from('v7_tracks').select(TRACK_COLUMNS)
        .eq('id',trackKey).eq('congregation_id',expected.congregationId).maybeSingle(),expected),trackKey,null,null,'congregation_id',expected.congregationId);
      const module=exact(await result(client.from('v7_modules').select(MODULE_COLUMNS)
        .eq('id',moduleKey).eq('track_id',trackKey).maybeSingle(),expected),moduleKey,'track_id',trackKey);
      const lesson=exact(await result(client.from('v7_lessons').select(LESSON_COLUMNS)
        .eq('id',lessonKey).eq('module_id',moduleKey).maybeSingle(),expected),lessonKey,'module_id',moduleKey);
      const revision=exact(await result(client.from('v7_lesson_revisions').select(REVISION_COLUMNS)
        .eq('id',revisionKey).eq('lesson_id',lessonKey).maybeSingle(),expected),revisionKey,'lesson_id',lessonKey);
      const rows=await result(client.from('v7_lesson_steps').select(STEP_COLUMNS)
        .eq('lesson_revision_id',revisionKey).order('position').limit(8),expected);
      if(!Array.isArray(rows) || rows.length>7) fail('BQ_AUTHORING_RESPONSE','Publication readiness returned an invalid lesson-step set.');
      const positions=new Set(),libraryRevisionIds=new Set();
      for(const row of rows) {
        if(id(row.lesson_revision_id,true)!==revisionKey || !Number.isInteger(row.position) || row.position<0 || row.position>6
          || row.step_type!==STEP_TYPES[row.position] || positions.has(row.position)) {
          fail('BQ_AUTHORING_RESPONSE','Publication readiness returned a malformed lesson-step sequence.');
        }
        id(row.id,true);positions.add(row.position);
        if(row.library_revision_id!=null) libraryRevisionIds.add(id(row.library_revision_id,true));
      }
      const blockers=[];
      if(state(track.publication_state)!=='draft') blockers.push('track_not_draft');
      if(state(module.publication_state)!=='draft') blockers.push('module_not_draft');
      if(state(lesson.publication_state)!=='draft') blockers.push('lesson_not_draft');
      if(revision.published_at!=null) blockers.push('revision_already_published');
      if(rows.length!==7 || positions.size!==7 || STEP_TYPES.some((_,position)=>!positions.has(position))) blockers.push('seven_steps_incomplete');
      const ready=blockers.length===0;
      return Object.freeze({
        ready,
        blockers:Object.freeze(blockers),
        stepCount:rows.length,
        libraryRevisionIds:Object.freeze([...libraryRevisionIds].sort()),
        request:ready?Object.freeze({
          trackId:trackKey,moduleId:moduleKey,lessonId:lessonKey,lessonRevisionId:revisionKey,
          expectedTrackRevisionId:id(track.revision_id,true),
          expectedModuleRevisionId:id(module.revision_id,true),
          expectedLessonRevisionId:id(lesson.revision_id,true),
        }):null,
      });
    },
  });
}
