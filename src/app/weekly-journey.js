const STORAGE_KEY='weekly-journey-state';
const VERSION=2;
export const WEEKLY_JOURNEY_ROUTES=Object.freeze(['recordings','reader','transform','journey-groups','assignments','calendar']);

function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
function validIso(value){
  if(typeof value!=='string'||!value)return '';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString():'';
}
function timeValue(value){const parsed=Date.parse(String(value||''));return Number.isFinite(parsed)?parsed:0}
function latestIso(values){
  let latest='';
  for(const value of values){if(timeValue(value)>timeValue(latest))latest=value}
  return latest;
}
function mondayFor(dateKey){
  if(!validDateKey(dateKey))throw new Error('Weekly Journey requires a valid civil date.');
  const [year,month,day]=dateKey.split('-').map(Number);
  const stamp=Date.UTC(year,month-1,day),date=new Date(stamp);
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new Error('Weekly Journey civil date is invalid.');
  const weekday=date.getUTCDay(),back=(weekday+6)%7;
  return new Date(stamp-back*86400000).toISOString().slice(0,10);
}
function blankDone(){return Object.fromEntries(WEEKLY_JOURNEY_ROUTES.map(route=>[route,false]))}
function blankRouteUpdatedAt(){return Object.fromEntries(WEEKLY_JOURNEY_ROUTES.map(route=>[route,'']))}
function empty(){return {version:VERSION,weeks:{}}}
function normalize(input){
  const sourceVersion=Number(input?.version);
  if(!input||typeof input!=='object'||Array.isArray(input)||![1,VERSION].includes(sourceVersion))return empty();
  const weeks={};
  for(const [key,row] of Object.entries(input.weeks||{})){
    if(!validDateKey(key)||!row||typeof row!=='object'||Array.isArray(row))continue;
    const done=blankDone(),routeUpdatedAt=blankRouteUpdatedAt();
    const legacyUpdatedAt=validIso(row.updatedAt);
    for(const route of WEEKLY_JOURNEY_ROUTES){
      done[route]=row.done?.[route]===true;
      routeUpdatedAt[route]=sourceVersion===1
        ? (done[route]?legacyUpdatedAt:'')
        : validIso(row.routeUpdatedAt?.[route]);
    }
    weeks[key]={
      done,
      routeUpdatedAt,
      updatedAt:latestIso([...Object.values(routeUpdatedAt),legacyUpdatedAt])
    };
  }
  return {version:VERSION,weeks};
}
function clone(value){return JSON.parse(JSON.stringify(value))}
function pruneWeeks(weeks){
  const output={...weeks},keys=Object.keys(output).sort();
  while(keys.length>12)delete output[keys.shift()];
  return output;
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
    nextRoute,
    updatedAt:row.updatedAt||''
  });
}

export function createWeeklyJourneyService({storage,getDateKey,clock=()=>new Date()}){
  if(!storage||typeof storage.read!=='function'||typeof storage.write!=='function')throw new Error('Weekly Journey requires the storage boundary.');
  if(typeof getDateKey!=='function')throw new Error('Weekly Journey requires the progress civil-date boundary.');
  let state=normalize(storage.read(STORAGE_KEY,empty()));
  const listeners=new Set();
  const weekKey=()=>mondayFor(getDateKey(clock()));
  const rowFor=key=>{
    const existing=state.weeks[key];
    if(existing)return {done:{...existing.done},routeUpdatedAt:{...existing.routeUpdatedAt},updatedAt:existing.updatedAt};
    return {done:blankDone(),routeUpdatedAt:blankRouteUpdatedAt(),updatedAt:''};
  };
  const notify=source=>{
    const exported=clone(state);
    for(const listener of listeners){try{listener(Object.freeze({source,state:exported}))}catch(error){console.warn('Weekly Journey state listener failed',error)}}
  };
  const persist=(next,{source='local'}={})=>{
    const normalized=normalize(next);
    storage.write(STORAGE_KEY,normalized);
    state=normalized;
    notify(source);
    return state;
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
    const at=new Date(clock()).toISOString();
    row.done[route]=value;
    row.routeUpdatedAt[route]=at;
    row.updatedAt=latestIso([...Object.values(row.routeUpdatedAt),at]);
    persist({version:VERSION,weeks:pruneWeeks({...state.weeks,[key]:row})});
    return Object.freeze({applied:true,duplicate:false,state:freezeSnapshot(key,row)});
  }
  function toggle(route){const current=snapshot();return setDone(route,!current.done[route]);}
  function exportAccountState(){return clone(state)}
  function replaceAccountState(input){
    persist(input||empty(),{source:'account'});
    return snapshot();
  }
  function mergeFromAccount(remoteInput){
    const remote=normalize(remoteInput),weeks={};
    const keys=new Set([...Object.keys(state.weeks),...Object.keys(remote.weeks)]);
    for(const key of keys){
      const local=rowFor(key),other=remote.weeks[key]||{done:blankDone(),routeUpdatedAt:blankRouteUpdatedAt(),updatedAt:''};
      const done=blankDone(),routeUpdatedAt=blankRouteUpdatedAt();
      for(const route of WEEKLY_JOURNEY_ROUTES){
        const localAt=validIso(local.routeUpdatedAt?.[route]),remoteAt=validIso(other.routeUpdatedAt?.[route]);
        if(timeValue(remoteAt)>timeValue(localAt)){done[route]=other.done?.[route]===true;routeUpdatedAt[route]=remoteAt}
        else if(timeValue(localAt)>timeValue(remoteAt)){done[route]=local.done?.[route]===true;routeUpdatedAt[route]=localAt}
        else{
          const same=(local.done?.[route]===true)===(other.done?.[route]===true);
          done[route]=same?(local.done?.[route]===true):false;
          routeUpdatedAt[route]=localAt||remoteAt;
        }
      }
      weeks[key]={done,routeUpdatedAt,updatedAt:latestIso([...Object.values(routeUpdatedAt),local.updatedAt,other.updatedAt])};
    }
    const merged=normalize({version:VERSION,weeks:pruneWeeks(weeks)});
    if(JSON.stringify(merged)!==JSON.stringify(state))persist(merged,{source:'account'});
    return Object.freeze({state:snapshot()});
  }
  function subscribe(listener){
    if(typeof listener!=='function')throw new Error('Weekly Journey subscription requires a function.');
    listeners.add(listener);
    return()=>listeners.delete(listener);
  }
  return Object.freeze({snapshot,setDone,toggle,exportAccountState,replaceAccountState,mergeFromAccount,subscribe,routes:WEEKLY_JOURNEY_ROUTES});
}
