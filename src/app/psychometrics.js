const STORAGE_PREFIX='psychometrics:';

const ownerKey=session=>{
  const state=session?.getState?.();
  return state?.authenticated&&state.user?.id?`account:${String(state.user.id)}`:'guest';
};

export function createPsychometricsService({engine,storage,session}){
  if(!engine||!storage||!session)throw new Error('Psychometrics service requires engine, private storage, and session owners.');

  const key=()=>`${STORAGE_PREFIX}${ownerKey(session)}`;
  const read=()=>engine.normalize(storage.read(key(),null));
  const write=state=>{const normalized=engine.normalize(state);storage.write(key(),normalized);return normalized};

  function open(){return read()}
  function begin(type){return write(engine.begin(read(),type))}
  function answer(type,id,value){return write(engine.answer(read(),type,id,value))}
  function calculate(type){return write(engine.calculate(read(),type))}
  function reset(type){return write(engine.reset(read(),type))}
  function clearCurrentOwner(){storage.remove(key());return read()}
  function progress(type){const state=read(),definition=engine.definitions[type];if(!definition)throw new Error('Unknown Psychometrics assessment.');return Object.freeze({answered:Object.keys(state[type].answers).length,total:definition.total,complete:engine.isComplete(state,type),hasResult:Boolean(state[type].result)});}

  return Object.freeze({open,begin,answer,calculate,reset,clearCurrentOwner,progress,definitions:engine.definitions,owner:()=>ownerKey(session)});
}
