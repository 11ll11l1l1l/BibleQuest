const STEP_TYPES=Object.freeze(['scripture','understand','discuss','reflect','apply','pray','action']);
function fail(code,message){throw Object.assign(new Error(message),{code});}
function exact(rows,id,message){const row=rows?.find(item=>item.id===id);if(!row)fail('BQ_AUTHORING_PUBLICATION_STALE',message);return row;}

// Converts already-proven read-only readiness into an immutable backend handoff.
// This function never publishes. The schema-owned atomic mutation remains the authority.
export function preparePublicationRequest(state){
  if(state?.status!=='ready')fail('BQ_AUTHORING_PUBLICATION_STALE','Curriculum authoring is not in a stable ready state.');
  const selected=state.selected||{};
  const {trackId,moduleId,lessonId,revisionId}=selected;
  if(!trackId||!moduleId||!lessonId||!revisionId)fail('BQ_AUTHORING_SELECTION','Choose a lesson revision before preparing publication.');
  const readiness=state.readiness;
  if(readiness?.ready!==true||!readiness.request)fail('BQ_AUTHORING_PUBLICATION_NOT_READY','The selected lesson path is not ready for atomic publication.');

  const track=exact(state.tracks,trackId,'The selected track changed. Refresh publication readiness.');
  const module=exact(state.modules,moduleId,'The selected module changed. Refresh publication readiness.');
  const lesson=exact(state.lessons,lessonId,'The selected lesson changed. Refresh publication readiness.');
  const revision=exact(state.revisions,revisionId,'The selected lesson revision changed. Refresh publication readiness.');
  const request=readiness.request;
  if(request.trackId!==trackId||request.moduleId!==moduleId||request.lessonId!==lessonId||request.lessonRevisionId!==revisionId
    ||request.expectedTrackRevisionId!==track.revisionId||request.expectedModuleRevisionId!==module.revisionId
    ||request.expectedLessonRevisionId!==lesson.revisionId){
    fail('BQ_AUTHORING_PUBLICATION_STALE','Publication readiness no longer matches the loaded curriculum path.');
  }
  if(module.trackId&&module.trackId!==trackId)fail('BQ_AUTHORING_PUBLICATION_STALE','The selected module no longer belongs to the track.');
  if(lesson.moduleId&&lesson.moduleId!==moduleId)fail('BQ_AUTHORING_PUBLICATION_STALE','The selected lesson no longer belongs to the module.');
  if(revision.lessonId&&revision.lessonId!==lessonId)fail('BQ_AUTHORING_PUBLICATION_STALE','The selected revision no longer belongs to the lesson.');
  if(readiness.stepCount!==7||!Array.isArray(state.steps)||state.steps.length!==7){
    fail('BQ_AUTHORING_PUBLICATION_NOT_READY','All seven lesson steps are required before publication.');
  }
  const positions=new Set();
  for(const step of state.steps){
    if(!Number.isInteger(step.position)||step.position<0||step.position>6||step.stepType!==STEP_TYPES[step.position]||positions.has(step.position)){
      fail('BQ_AUTHORING_PUBLICATION_STALE','The loaded lesson steps no longer match the accepted sequence.');
    }
    positions.add(step.position);
  }
  const libraryRevisionIds=Array.isArray(readiness.libraryRevisionIds)?readiness.libraryRevisionIds:[];
  return Object.freeze({...request,libraryRevisionIds:Object.freeze([...libraryRevisionIds])});
}
