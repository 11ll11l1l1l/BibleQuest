const STORAGE_KEY='weekly-journey-state';
const VERSION=1;
export const WEEKLY_JOURNEY_ROUTES=Object.freeze(['recordings','reader','transform','journey-groups','assignments','calendar']);

function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
function mondayFor(dateKey){
  if(!validDateKey(dateKey))throw new Error('Weekly Journey requires a valid civil date.');
  const [year,month,day]=dateKey.split('-').map(Number);
  const stamp=Date.UTC(year,month-1,day),date=new Date(stamp);
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new Error('Weekly Journey civil date is invalid.');
  const weekday=date.getUTCDay(),back=(weekday+6)%7;
  return new Date(stamp-back*86400000).toISOString().slice(0,10);
}
function empty(){return {version:VERSION,weeks:{}}}
function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.version)!==VERSION)return empty();
  const weeks={};
  for(const [key,row] of Object.entries(input.weeks||{})){
    if(!validDateKey(key)||!row||typeof row!=='object'||Array.isArray(row))continue;
    const done={};
    for(const route of WEEKLY_JOURNEY_ROUTES)done[route]=row.done?.[route]===true;
    weeks[key]={done,updatedAt:typeof row.updatedAt==='string'?row.updatedAt:''};
  }
  return {version:VERSION,weeks};
}
function freezeSnapshot(weekKey,row){
  const doneRoutes=WEEKLY_JOURNEY_ROUTES.filter(route=>row.done[route]);
  const nextRoute=WEEKLY_JOURNEY_ROUTES.find(route=>!row.done[route])||null;
  return Object.freeze({
    weekKey,
    done:Object.freeze({...row.done}),
    doneRoutes:Object.freeze(doneRoutes),
    completed:doneRoutes.length,
    total:WEEKLY_JOURNEY_ROUTES.length,
    complete:doneRoutes.length===WEEKLY_JOURNEY_ROUTES.length,
    nextRoute
  });
}

export function createWeeklyJourneyService({storage,getDateKey,clock=()=>new Date()}){
  if(!storage||typeof storage.read!=='function'||typeof storage.write!=='function')throw new Error('Weekly Journey requires the storage boundary.');
  if(typeof getDateKey!=='function')throw new Error('Weekly Journey requires the progress civil-date boundary.');
  let state=normalize(storage.read(STORAGE_KEY,empty()));
  const weekKey=()=>mondayFor(getDateKey(clock()));
  const rowFor=key=>{
    const existing=state.weeks[key];
    if(existing)return {done:{...existing.done},updatedAt:existing.updatedAt};
    return {done:Object.fromEntries(WEEKLY_JOURNEY_ROUTES.map(route=>[route,false])),updatedAt:''};
  };
  function snapshot(){
    const key=weekKey();
    return freezeSnapshot(key,rowFor(key));
  }
  function setDone(route,value=true){
    if(!WEEKLY_JOURNEY_ROUTES.includes(route))throw new Error('Unknown Weekly Journey route.');
    if(typeof value!=='boolean')throw new Error('Weekly Journey completion must be boolean.');
    const key=weekKey(),row=rowFor(key);
    if(row.done[route]===value)return Object.freeze({applied:false,duplicate:true,state:freezeSnapshot(key,row)});
    row.done[route]=value;
    row.updatedAt=new Date(clock()).toISOString();
    const weeks={...state.weeks,[key]:row};
    const keys=Object.keys(weeks).sort();
    while(keys.length>12)delete weeks[keys.shift()];
    const next={version:VERSION,weeks};
    storage.write(STORAGE_KEY,next);
    state=next;
    return Object.freeze({applied:true,duplicate:false,state:freezeSnapshot(key,row)});
  }
  function toggle(route){const current=snapshot();return setDone(route,!current.done[route]);}
  return Object.freeze({snapshot,setDone,toggle,routes:WEEKLY_JOURNEY_ROUTES});
}
