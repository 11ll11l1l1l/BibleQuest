import { EXPLORER_BY_ID, EXPLORER_BY_KIND, EXPLORER_ITEMS } from '../features/explorer/content.js';

const STORAGE_KEY='explorer-state-v1';
const KINDS=Object.freeze(['person','place']);

const clone=value=>JSON.parse(JSON.stringify(value));
const validIso=value=>{
  if(typeof value!=='string'||!value)return '';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString():'';
};
const timeValue=value=>{const parsed=Date.parse(String(value||''));return Number.isFinite(parsed)?parsed:0};
const latest=(...values)=>values.map(validIso).filter(Boolean).sort((a,b)=>timeValue(b)-timeValue(a))[0]||'';
const emptyCycle=()=>({cycle:0,seen:[],lastId:'',updatedAt:''});
const emptySession=()=>null;
const empty=()=>({version:1,cycles:{person:emptyCycle(),place:emptyCycle()},sessions:{person:emptySession(),place:emptySession()}});

function normalizeCycle(kind,input){
  const pool=EXPLORER_BY_KIND[kind];
  const allowed=new Set(pool.map(row=>row.id));
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const cycle=Math.max(0,Number.isSafeInteger(Number(source.cycle))?Number(source.cycle):0);
  const seen=[...new Set((Array.isArray(source.seen)?source.seen:[]).map(String).filter(id=>allowed.has(id)))];
  const lastId=allowed.has(String(source.lastId||''))?String(source.lastId):'';
  return {cycle,seen,lastId,updatedAt:validIso(source.updatedAt)};
}

function normalizeSession(kind,input,cycle){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const id=String(input.itemId||''),item=EXPLORER_BY_ID[id];
  if(!item||item.kind!==kind)return null;
  const sessionCycle=Math.max(0,Number.isSafeInteger(Number(input.cycle))?Number(input.cycle):0);
  if(sessionCycle!==cycle)return null;
  const clueIndex=Math.max(0,Math.min(item.clues.length-1,Number.isSafeInteger(Number(input.clueIndex))?Number(input.clueIndex):0));
  return {
    kind,itemId:id,cycle:sessionCycle,clueIndex,revealed:input.revealed===true,
    updatedAt:validIso(input.updatedAt)
  };
}

function normalize(input){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const cycles={},sessions={};
  for(const kind of KINDS){
    cycles[kind]=normalizeCycle(kind,source.cycles?.[kind]);
    sessions[kind]=normalizeSession(kind,source.sessions?.[kind],cycles[kind].cycle);
  }
  return {version:1,cycles,sessions};
}

function chooseNewerSession(local,remote,cycle){
  const a=normalizeSession(local?.kind||remote?.kind||'person',local,cycle);
  const b=normalizeSession(remote?.kind||local?.kind||'person',remote,cycle);
  if(!a)return b;
  if(!b)return a;
  const at=timeValue(a.updatedAt),bt=timeValue(b.updatedAt);
  if(bt>at)return b;
  if(at>bt)return a;
  if(a.revealed!==b.revealed)return a.revealed?a:b;
  return a.clueIndex>=b.clueIndex?a:b;
}

function mergeStates(localInput,remoteInput){
  const local=normalize(localInput),remote=normalize(remoteInput),cycles={},sessions={};
  for(const kind of KINDS){
    const a=local.cycles[kind],b=remote.cycles[kind];
    let merged;
    if(b.cycle>a.cycle)merged={...b};
    else if(a.cycle>b.cycle)merged={...a};
    else{
      const poolOrder=new Map(EXPLORER_BY_KIND[kind].map((row,index)=>[row.id,index]));
      const seen=[...new Set([...a.seen,...b.seen])].sort((x,y)=>(poolOrder.get(x)??999)-(poolOrder.get(y)??999));
      const newer=timeValue(b.updatedAt)>timeValue(a.updatedAt)?b:a;
      merged={cycle:a.cycle,seen,lastId:newer.lastId||a.lastId||b.lastId||'',updatedAt:latest(a.updatedAt,b.updatedAt)};
    }
    cycles[kind]=merged;
    const sessionA=local.sessions[kind]?.cycle===merged.cycle?local.sessions[kind]:null;
    const sessionB=remote.sessions[kind]?.cycle===merged.cycle?remote.sessions[kind]:null;
    sessions[kind]=chooseNewerSession(sessionA,sessionB,merged.cycle);
  }
  return {version:1,cycles,sessions};
}

export function createExplorerService({storage,clock=()=>new Date(),random=Math.random}={}){
  if(!storage?.read||!storage?.write)throw new Error('Bible Explorer requires the shared storage boundary.');
  if(typeof random!=='function')throw new Error('Bible Explorer requires a random selection source.');

  let state=normalize(storage.read(STORAGE_KEY,empty()));
  const listeners=new Set();
  const nowIso=()=>{
    const raw=clock(),date=raw instanceof Date?new Date(raw.getTime()):new Date(raw);
    if(!Number.isFinite(date.getTime()))throw new Error('Bible Explorer time is invalid.');
    return date.toISOString();
  };
  const persist=(next,{source='local'}={})=>{
    state=normalize(next);
    storage.write(STORAGE_KEY,state);
    const exported=clone(state);
    for(const listener of listeners){
      try{listener(Object.freeze({source,state:exported}))}
      catch(error){console.warn('Bible Explorer state listener failed',error)}
    }
    return state;
  };
  const requireKind=kind=>{
    const normalized=String(kind||'').trim();
    if(!KINDS.includes(normalized))throw new Error('Bible Explorer mode must be person or place.');
    return normalized;
  };
  const freezeItem=item=>Object.freeze({...item,clues:Object.freeze([...item.clues]),reader:Object.freeze({...item.reader})});

  function snapshot(kind){
    const normalized=requireKind(kind),cycle=state.cycles[normalized],session=state.sessions[normalized];
    const item=session?EXPLORER_BY_ID[session.itemId]:null;
    return Object.freeze({
      kind:normalized,
      cycle:cycle.cycle,
      seen:Object.freeze([...cycle.seen]),
      seenCount:cycle.seen.length,
      total:EXPLORER_BY_KIND[normalized].length,
      remaining:Math.max(0,EXPLORER_BY_KIND[normalized].length-cycle.seen.length),
      lastId:cycle.lastId,
      session:session?Object.freeze({
        item:freezeItem(item),
        clueIndex:session.clueIndex,
        clue:item.clues[session.clueIndex],
        revealed:session.revealed,
        updatedAt:session.updatedAt
      }):null
    });
  }

  function choose(kind,cycle){
    const pool=EXPLORER_BY_KIND[kind];
    let nextCycle={...cycle};
    let available=pool.filter(item=>!nextCycle.seen.includes(item.id));
    if(!available.length){
      nextCycle={cycle:cycle.cycle+1,seen:[],lastId:cycle.lastId,updatedAt:cycle.updatedAt};
      available=pool.filter(item=>pool.length<2||item.id!==cycle.lastId);
      if(!available.length)available=[...pool];
    }
    const raw=Number(random());
    const normalizedRandom=Number.isFinite(raw)?Math.min(0.999999999,Math.max(0,raw)):0;
    const chosen=available[Math.floor(normalizedRandom*available.length)]||available[0];
    return {chosen,cycle:nextCycle};
  }

  function start(kind){
    const normalized=requireKind(kind),existing=state.sessions[normalized];
    if(existing&&!existing.revealed)return Object.freeze({resumed:true,state:snapshot(normalized)});
    const at=nowIso(),picked=choose(normalized,state.cycles[normalized]);
    const cycle={
      ...picked.cycle,
      seen:[...new Set([...picked.cycle.seen,picked.chosen.id])],
      lastId:picked.chosen.id,
      updatedAt:at
    };
    const session={kind:normalized,itemId:picked.chosen.id,cycle:cycle.cycle,clueIndex:0,revealed:false,updatedAt:at};
    persist({...state,cycles:{...state.cycles,[normalized]:cycle},sessions:{...state.sessions,[normalized]:session}});
    return Object.freeze({resumed:false,state:snapshot(normalized)});
  }

  function nextClue(kind){
    const normalized=requireKind(kind),session=state.sessions[normalized];
    if(!session)throw new Error('Start a Bible Explorer case first.');
    if(session.revealed)return snapshot(normalized);
    const item=EXPLORER_BY_ID[session.itemId];
    if(session.clueIndex>=item.clues.length-1)return snapshot(normalized);
    const next={...session,clueIndex:session.clueIndex+1,updatedAt:nowIso()};
    persist({...state,sessions:{...state.sessions,[normalized]:next}});
    return snapshot(normalized);
  }

  function reveal(kind){
    const normalized=requireKind(kind),session=state.sessions[normalized];
    if(!session)throw new Error('Start a Bible Explorer case first.');
    if(session.revealed)return snapshot(normalized);
    persist({...state,sessions:{...state.sessions,[normalized]:{...session,revealed:true,updatedAt:nowIso()}}});
    return snapshot(normalized);
  }

  function nextCase(kind){
    const normalized=requireKind(kind),session=state.sessions[normalized];
    if(!session?.revealed)throw new Error('Reveal the current Bible Explorer answer before continuing.');
    persist({...state,sessions:{...state.sessions,[normalized]:null}});
    return start(normalized).state;
  }

  function connections(){
    return Object.freeze(EXPLORER_ITEMS.map(freezeItem));
  }

  function exportAccountState(){return clone(state)}
  function replaceAccountState(input){persist(normalize(input),{source:'account'});return Object.freeze(KINDS.map(snapshot))}
  function mergeFromAccount(remoteInput){
    const merged=mergeStates(state,remoteInput);
    if(JSON.stringify(merged)!==JSON.stringify(state))persist(merged,{source:'account'});
    return Object.freeze({people:snapshot('person'),places:snapshot('place')});
  }
  function subscribe(listener){
    if(typeof listener!=='function')throw new Error('Bible Explorer subscription requires a function.');
    listeners.add(listener);
    return()=>listeners.delete(listener);
  }

  return Object.freeze({
    modes:KINDS,
    snapshot,start,nextClue,reveal,nextCase,connections,
    exportAccountState,replaceAccountState,mergeFromAccount,subscribe
  });
}
