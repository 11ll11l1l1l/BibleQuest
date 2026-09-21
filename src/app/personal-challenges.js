import { PERSONAL_CHALLENGE_TEMPLATES, PERSONAL_CHALLENGE_TEMPLATE_BY_KEY } from '../features/challenges/content.js';

const STORAGE_KEY='personal-challenges-state-v1';

function iso(value){
  const date=value instanceof Date?new Date(value.getTime()):new Date(value);
  if(!Number.isFinite(date.getTime()))throw new Error('Personal Challenge time is invalid.');
  return date.toISOString();
}
function validIso(value){
  if(typeof value!=='string'||!value)return '';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString():'';
}
function timeValue(value){const parsed=Date.parse(String(value||''));return Number.isFinite(parsed)?parsed:0}
function earliest(...values){return values.map(validIso).filter(Boolean).sort((a,b)=>timeValue(a)-timeValue(b))[0]||''}
function latest(...values){return values.map(validIso).filter(Boolean).sort((a,b)=>timeValue(b)-timeValue(a))[0]||''}
function clone(value){return JSON.parse(JSON.stringify(value))}

function normalize(input){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const output={};
  for(const template of PERSONAL_CHALLENGE_TEMPLATES){
    const row=source[template.key];
    if(!row||typeof row!=='object'||Array.isArray(row))continue;
    const completedAt={};
    const legacyDone=Array.isArray(row.done)?row.done.map(String):[];
    const sourceCompleted=row.completedAt&&typeof row.completedAt==='object'&&!Array.isArray(row.completedAt)?row.completedAt:{};
    for(let day=1;day<=template.steps.length;day++){
      const key=String(day);
      if(!legacyDone.includes(key)&&!Object.prototype.hasOwnProperty.call(sourceCompleted,key))continue;
      const at=validIso(sourceCompleted[key])||validIso(row.updatedAt)||validIso(row.startedAt);
      if(at)completedAt[key]=at;
    }
    const completedDays=Object.keys(completedAt).sort((a,b)=>Number(a)-Number(b));
    const startedAt=validIso(row.startedAt)||validIso(row.updatedAt)||latest(...Object.values(completedAt));
    const updatedAt=latest(row.updatedAt,startedAt,...Object.values(completedAt));
    if(startedAt||completedDays.length){
      output[template.key]={startedAt,updatedAt,completedAt};
    }
  }
  return output;
}

function mergeStates(localInput,remoteInput){
  const local=normalize(localInput),remote=normalize(remoteInput),merged={};
  for(const template of PERSONAL_CHALLENGE_TEMPLATES){
    const a=local[template.key]||{},b=remote[template.key]||{};
    const completedAt={};
    for(let day=1;day<=template.steps.length;day++){
      const key=String(day),at=earliest(a.completedAt?.[key],b.completedAt?.[key]);
      if(at)completedAt[key]=at;
    }
    const startedAt=earliest(a.startedAt,b.startedAt);
    const updatedAt=latest(a.updatedAt,b.updatedAt,startedAt,...Object.values(completedAt));
    if(startedAt||Object.keys(completedAt).length)merged[template.key]={startedAt,updatedAt,completedAt};
  }
  return merged;
}

export function createPersonalChallengesService({storage,clock=()=>new Date()}={}){
  if(!storage?.read||!storage?.write)throw new Error('Personal Challenges require the shared storage boundary.');

  let state=normalize(storage.read(STORAGE_KEY,{}));
  const listeners=new Set();
  const notify=source=>{
    const exported=clone(state);
    for(const listener of listeners){
      try{listener(Object.freeze({source,state:exported}))}
      catch(error){console.warn('Personal Challenge state listener failed',error)}
    }
  };
  const persist=(next,{source='local'}={})=>{
    state=normalize(next);
    storage.write(STORAGE_KEY,state);
    notify(source);
    return state;
  };
  const requireTemplate=key=>{
    const template=PERSONAL_CHALLENGE_TEMPLATE_BY_KEY[String(key||'')];
    if(!template)throw new Error('Unknown Personal Challenge.');
    return template;
  };
  const rowFor=key=>state[key]||{startedAt:'',updatedAt:'',completedAt:{}};

  function snapshot(key){
    const template=requireTemplate(key),row=rowFor(template.key);
    const completedAt={...(row.completedAt||{})};
    const completed=Object.keys(completedAt).length;
    let nextDay=null;
    for(let day=1;day<=template.steps.length;day++){
      if(!completedAt[String(day)]){nextDay=day;break}
    }
    const days=template.steps.map((step,index)=>{
      const day=index+1,done=Boolean(completedAt[String(day)]),isNext=!done&&day===nextDay;
      return Object.freeze({
        day,label:step.label,code:step.code,chapter:step.chapter,
        done,isNext,locked:!done&&!isNext,completedAt:completedAt[String(day)]||''
      });
    });
    return Object.freeze({
      key:template.key,title:template.title,type:template.type,daysTotal:template.steps.length,desc:template.desc,
      started:Boolean(row.startedAt),startedAt:row.startedAt||'',updatedAt:row.updatedAt||'',
      completed,percent:Math.round((completed/template.steps.length)*100),
      complete:completed===template.steps.length,nextDay,days:Object.freeze(days)
    });
  }

  function list(){return Object.freeze(PERSONAL_CHALLENGE_TEMPLATES.map(template=>snapshot(template.key)))}

  function start(key){
    const template=requireTemplate(key),row=rowFor(template.key);
    if(row.startedAt)return Object.freeze({applied:false,duplicate:true,state:snapshot(template.key)});
    const at=iso(clock());
    persist({...state,[template.key]:{...row,startedAt:at,updatedAt:at,completedAt:{...(row.completedAt||{})}}});
    return Object.freeze({applied:true,duplicate:false,state:snapshot(template.key)});
  }

  function completeNext(key,day){
    const template=requireTemplate(key),current=snapshot(template.key),target=Number(day);
    if(!current.started)throw new Error('Start this Personal Challenge before completing a day.');
    if(current.complete)return Object.freeze({applied:false,duplicate:true,state:current});
    if(!Number.isInteger(target)||target!==current.nextDay)throw new Error('Complete day '+current.nextDay+' before later Personal Challenge days.');
    const row=rowFor(template.key);
    if(row.completedAt?.[String(target)])return Object.freeze({applied:false,duplicate:true,state:current});
    const at=iso(clock());
    persist({...state,[template.key]:{
      ...row,
      startedAt:row.startedAt||at,
      updatedAt:at,
      completedAt:{...(row.completedAt||{}),[String(target)]:at}
    }});
    return Object.freeze({applied:true,duplicate:false,state:snapshot(template.key)});
  }

  function exportAccountState(){
    return Object.fromEntries(Object.entries(state).map(([key,row])=>[key,{
      ...clone(row),
      done:Object.keys(row.completedAt||{}).sort((a,b)=>Number(a)-Number(b))
    }]));
  }
  function replaceAccountState(input){persist(normalize(input),{source:'account'});return list()}
  function mergeFromAccount(remoteInput){
    const merged=mergeStates(state,remoteInput);
    if(JSON.stringify(merged)!==JSON.stringify(state))persist(merged,{source:'account'});
    return Object.freeze({state:list()});
  }
  function subscribe(listener){
    if(typeof listener!=='function')throw new Error('Personal Challenge subscription requires a function.');
    listeners.add(listener);
    return()=>listeners.delete(listener);
  }

  return Object.freeze({
    list,snapshot,start,completeNext,exportAccountState,replaceAccountState,mergeFromAccount,subscribe,
    templates:PERSONAL_CHALLENGE_TEMPLATES
  });
}
