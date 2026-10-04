function fail(code,message){throw Object.assign(new Error(message),{code});}
function freezeList(value){return Object.freeze([...(Array.isArray(value)?value:[])]);}
function selected(state){return state.selected;}
function initial(){return Object.freeze({
  status:'idle',tracks:Object.freeze([]),modules:Object.freeze([]),lessons:Object.freeze([]),revisions:Object.freeze([]),steps:Object.freeze([]),
  selected:Object.freeze({trackId:null,moduleId:null,lessonId:null,revisionId:null}),readiness:null,error:null,
});}

// Feature-local orchestration only. Global route/session/congregation composition remains with the shared owner.
export function createCurriculumAuthoringController({tracks,hierarchy,revisions,readiness}){
  if(!tracks?.listTracks||!hierarchy?.listModules||!revisions?.listRevisions||!readiness?.inspect){
    throw new TypeError('Curriculum authoring requires the scoped authoring repositories.');
  }
  let generation=0,disposed=false,state=initial();const listeners=new Set();
  const publish=patch=>{
    if(disposed)return state;
    state=Object.freeze({...state,...patch});
    for(const listener of listeners)listener(state);
    return state;
  };
  const current=token=>!disposed&&token===generation;
  const selection=patch=>Object.freeze({...state.selected,...patch});
  function invalidate(){
    generation+=1;
    if(disposed)return state;
    state=initial();for(const listener of listeners)listener(state);return state;
  }
  async function operation(kind,work,{preserve=true}={}){
    const token=++generation,previous=state;
    publish({status:kind,error:null});
    try{
      const patch=await work(token);
      if(!current(token))return state;
      return publish({status:'ready',error:null,...patch});
    }catch(error){
      if(!current(token))return state;
      const base=preserve?previous:initial();
      state=Object.freeze({...base,status:'error',error:error?.message||'Curriculum authoring failed.'});
      for(const listener of listeners)listener(state);
      return state;
    }
  }
  function requireSelection(key,message){
    const value=selected(state)[key];if(!value)fail('BQ_AUTHORING_SELECTION',message);return value;
  }
  const replace=(rows,row)=>freezeList([...rows.filter(item=>item.id!==row.id),row].sort((a,b)=>(a.position??0)-(b.position??0)||a.id.localeCompare(b.id)));

  async function load(){
    return operation('loading',async()=>({tracks:freezeList(await tracks.listTracks()),modules:Object.freeze([]),lessons:Object.freeze([]),revisions:Object.freeze([]),steps:Object.freeze([]),selected:Object.freeze({trackId:null,moduleId:null,lessonId:null,revisionId:null}),readiness:null}),{preserve:false});
  }
  async function selectTrack(trackId){
    return operation('loading',async()=>({
      modules:freezeList(await hierarchy.listModules(trackId)),lessons:Object.freeze([]),revisions:Object.freeze([]),steps:Object.freeze([]),
      selected:Object.freeze({trackId,moduleId:null,lessonId:null,revisionId:null}),readiness:null,
    }));
  }
  async function selectModule(moduleId){
    const trackId=requireSelection('trackId','Choose a track before opening a module.');
    return operation('loading',async()=>({
      lessons:freezeList(await hierarchy.listLessons(trackId,moduleId)),revisions:Object.freeze([]),steps:Object.freeze([]),
      selected:selection({moduleId,lessonId:null,revisionId:null}),readiness:null,
    }));
  }
  async function selectLesson(lessonId){
    const {trackId,moduleId}=selected(state);if(!trackId||!moduleId)fail('BQ_AUTHORING_SELECTION','Choose a module before opening a lesson.');
    return operation('loading',async()=>({
      revisions:freezeList(await revisions.listRevisions(trackId,moduleId,lessonId)),steps:Object.freeze([]),
      selected:selection({lessonId,revisionId:null}),readiness:null,
    }));
  }
  async function selectRevision(revisionId){
    const {trackId,moduleId,lessonId}=selected(state);if(!trackId||!moduleId||!lessonId)fail('BQ_AUTHORING_SELECTION','Choose a lesson before opening a revision.');
    return operation('loading',async()=>{
      const [steps,result]=await Promise.all([
        revisions.listSteps(trackId,moduleId,lessonId,revisionId),readiness.inspect(trackId,moduleId,lessonId,revisionId),
      ]);
      return {steps:freezeList(steps),selected:selection({revisionId}),readiness:result};
    });
  }
  async function refreshReadiness(){
    const {trackId,moduleId,lessonId,revisionId}=selected(state);
    if(!trackId||!moduleId||!lessonId||!revisionId)fail('BQ_AUTHORING_SELECTION','Choose a lesson revision before checking publication readiness.');
    return operation('checking',async()=>({readiness:await readiness.inspect(trackId,moduleId,lessonId,revisionId)}));
  }
  async function createTrack(input){
    return operation('saving',async()=>{const row=await tracks.createDraft(input);return {tracks:replace(state.tracks,row),selected:Object.freeze({trackId:row.id,moduleId:null,lessonId:null,revisionId:null}),modules:Object.freeze([]),lessons:Object.freeze([]),revisions:Object.freeze([]),steps:Object.freeze([]),readiness:null};});
  }
  async function updateTrack(input){
    const trackId=requireSelection('trackId','Choose a track before editing it.');
    const row=state.tracks.find(item=>item.id===trackId);if(!row)fail('BQ_AUTHORING_SELECTION','Reload the selected track before editing it.');
    return operation('saving',async()=>({tracks:replace(state.tracks,await tracks.updateDraft(trackId,row.revisionId,input))}));
  }
  async function createModule(input){
    const trackId=requireSelection('trackId','Choose a track before adding a module.');
    return operation('saving',async()=>{const row=await hierarchy.createModuleDraft(trackId,input);return {modules:replace(state.modules,row),selected:selection({moduleId:row.id,lessonId:null,revisionId:null}),lessons:Object.freeze([]),revisions:Object.freeze([]),steps:Object.freeze([]),readiness:null};});
  }
  async function updateModule(input){
    const {trackId,moduleId}=selected(state);if(!trackId||!moduleId)fail('BQ_AUTHORING_SELECTION','Choose a module before editing it.');
    const row=state.modules.find(item=>item.id===moduleId);if(!row)fail('BQ_AUTHORING_SELECTION','Reload the selected module before editing it.');
    return operation('saving',async()=>({modules:replace(state.modules,await hierarchy.updateModuleDraft(trackId,moduleId,row.revisionId,input))}));
  }
  async function createLesson(input){
    const {trackId,moduleId}=selected(state);if(!trackId||!moduleId)fail('BQ_AUTHORING_SELECTION','Choose a module before adding a lesson.');
    return operation('saving',async()=>{const row=await hierarchy.createLessonDraft(trackId,moduleId,input);return {lessons:replace(state.lessons,row),selected:selection({lessonId:row.id,revisionId:null}),revisions:Object.freeze([]),steps:Object.freeze([]),readiness:null};});
  }
  async function updateLesson(input){
    const {trackId,moduleId,lessonId}=selected(state);if(!trackId||!moduleId||!lessonId)fail('BQ_AUTHORING_SELECTION','Choose a lesson before editing it.');
    const row=state.lessons.find(item=>item.id===lessonId);if(!row)fail('BQ_AUTHORING_SELECTION','Reload the selected lesson before editing it.');
    return operation('saving',async()=>({lessons:replace(state.lessons,await hierarchy.updateLessonDraft(trackId,moduleId,lessonId,row.revisionId,input))}));
  }
  async function createRevision(input){
    const {trackId,moduleId,lessonId}=selected(state);if(!trackId||!moduleId||!lessonId)fail('BQ_AUTHORING_SELECTION','Choose a lesson before adding a revision.');
    return operation('saving',async()=>{const row=await revisions.createDraftRevision(trackId,moduleId,lessonId,input);return {revisions:freezeList([row,...state.revisions.filter(item=>item.id!==row.id)]),selected:selection({revisionId:row.id}),steps:Object.freeze([]),readiness:null};});
  }
  async function saveStep(input){
    const {trackId,moduleId,lessonId,revisionId}=selected(state);if(!trackId||!moduleId||!lessonId||!revisionId)fail('BQ_AUTHORING_SELECTION','Choose a lesson revision before saving a step.');
    return operation('saving',async()=>{
      const row=await revisions.saveDraftStep(trackId,moduleId,lessonId,revisionId,input);
      const result=await readiness.inspect(trackId,moduleId,lessonId,revisionId);
      return {steps:replace(state.steps,row),readiness:result};
    });
  }
  return Object.freeze({getState:()=>state,load,selectTrack,selectModule,selectLesson,selectRevision,refreshReadiness,
    createTrack,updateTrack,createModule,updateModule,createLesson,updateLesson,createRevision,saveStep,invalidate,
    subscribe(listener){if(typeof listener!=='function')throw new TypeError('Authoring listener must be a function.');listeners.add(listener);return()=>listeners.delete(listener);},
    dispose(){disposed=true;generation+=1;listeners.clear();state=Object.freeze({...initial(),status:'disposed'});},
  });
}
