const BASIC_PROGRESS_EVENT='transform:spiritual:v1:complete';

export function createTransformService({engine,progress}){
  if(!engine||!progress)throw new Error('Transform service requires Transform engine and progress owners.');
  function reconcileBasic(state=engine.getState()){
    if(!state.spiritual.result)return null;
    return progress.record({id:BASIC_PROGRESS_EVENT,type:'transform.spiritual.complete',xp:20,meaningful:true,metrics:{reflections:1}});
  }
  function openBasic(){const state=engine.getState();const progressResult=reconcileBasic(state);return Object.freeze({state,progressResult})}
  function setSpiritualAnswer(id,value){return engine.setSpiritualAnswer(id,value)}
  function calculateSpiritual(){const state=engine.calculateSpiritual();const progressResult=reconcileBasic(state);return Object.freeze({state,progressResult})}
  function resetSpiritual(){return engine.resetSpiritual()}
  return Object.freeze({openBasic,getState:engine.getState,setSpiritualAnswer,calculateSpiritual,resetSpiritual,definitions:engine.definitions,basicProgressEvent:BASIC_PROGRESS_EVENT});
}
