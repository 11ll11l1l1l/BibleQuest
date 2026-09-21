import { WISDOM_SITUATIONS, getWisdomSituation, localizeWisdomSituation } from '../features/wisdom-situations/content.js';
import { assertNeutralAssessment, reviewNeutralContent } from '../core/doctrinal-safety.js';

const SELECTOR_KEY='wisdom-situations-cycle-v2';
const hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const byId=new Map(WISDOM_SITUATIONS.map(item=>[item.id,item]));
const safetyFor=item=>{
  const safety=reviewNeutralContent({q:item.scenario,a:item.why,ref:item.refs.join(' · ')},{reason:'Wisdom Situations compares plausible applied judgments; its preferred option is not a declaration of universally binding doctrine.'});
  assertNeutralAssessment({safety},`Wisdom Situation ${item.id}`);
  return safety;
};
const hashText=value=>{
  let hash=2166136261;
  for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}
  return hash>>>0;
};
const displayOrderFor=(item,state)=>{
  const order=[0,1,2,3];
  let seed=hashText(`${item.id}|${state?.startedAt||''}`);
  for(let index=order.length-1;index>0;index--){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const swap=seed%(index+1);
    [order[index],order[swap]]=[order[swap],order[index]];
  }
  return order;
};
const emptySelector=()=>({version:2,cycle:0,seen:[],currentId:'',lastId:''});
function normalizeSelector(input){
  const source=input&&typeof input==='object'&&!Array.isArray(input)&&Number(input.version)===2?input:{};
  const valid=id=>byId.has(String(id||''))?String(id):'';
  const seen=[...new Set((Array.isArray(source.seen)?source.seen:[]).map(String).filter(id=>byId.has(id)))];
  return {
    version:2,
    cycle:Math.max(0,Number.isSafeInteger(Number(source.cycle))?Number(source.cycle):0),
    seen,
    currentId:valid(source.currentId),
    lastId:valid(source.lastId)
  };
}

function publicSituation(item,state,reveal=false,locale='en'){
  const localized=localizeWisdomSituation(item,locale);
  const order=displayOrderFor(item,state);
  const options=Object.freeze(order.map(index=>localized.options[index]));
  const base={
    id:item.id,domain:item.domain,pack:item.pack,title:localized.title,tension:localized.tension,scenario:localized.scenario,
    options,difficulty:item.difficulty,safety:safetyFor(item)
  };
  if(!reveal)return Object.freeze(base);
  return Object.freeze({
    ...base,
    best:order.indexOf(item.best),
    why:localized.why,
    rationales:Object.freeze(order.map(index=>localized.rationales[index])),
    refs:Object.freeze([...item.refs])
  });
}

export function createWisdomSituationsService({lesson,progress,storage,random=Math.random,getLocale=()=> 'en'}){
  if(!lesson||!progress||!storage?.read||!storage?.write)throw new Error('Wisdom Situations requires Lesson, Progress, and Storage boundaries.');
  let activeId=null;
  let selector=normalizeSelector(storage.read(SELECTOR_KEY,emptySelector()));

  const persistSelector=next=>{
    selector=normalizeSelector(next);
    storage.write(SELECTOR_KEY,selector);
    return selector;
  };
  const requireActive=()=>{
    if(!activeId)throw new Error('Open a Wisdom Situation before using Wisdom Situations.');
    return getWisdomSituation(activeId);
  };
  const eventId=(item,state)=>`wisdom-situation:${item.id}:v${state.definitionVersion}`;
  const reconcile=(item,state)=>{
    if(!hasOwn(state.responses,'judgment'))return null;
    return progress.record({id:eventId(item,state),type:'wisdom-situation.complete',xp:8,meaningful:true,metrics:{situations:1}});
  };
  const snapshot=(state,resumed=false,progressResult=null)=>{
    const item=requireActive();
    const answered=hasOwn(state.responses,'judgment');
    const order=displayOrderFor(item,state);
    const canonicalSelected=answered?Number(state.responses.judgment):null;
    const selected=answered?order.indexOf(canonicalSelected):null;
    return Object.freeze({
      situation:publicSituation(item,state,answered,getLocale()),
      state,resumed,answered,selected,progress:progressResult,
      cycle:Object.freeze({number:selector.cycle,seen:selector.seen.length,total:WISDOM_SITUATIONS.length})
    });
  };
  const setCurrent=(id,{markSeen=true}={})=>{
    const normalized=String(id||'');
    if(!byId.has(normalized))throw new Error(`Unknown Wisdom Situation: ${id||'missing'}.`);
    const seen=markSeen?[...new Set([...selector.seen,normalized])]:selector.seen;
    persistSelector({...selector,seen,currentId:normalized,lastId:normalized});
  };
  const clearCurrent=()=>persistSelector({...selector,currentId:''});
  const chooseRandom=()=>{
    let seen=[...selector.seen],cycle=selector.cycle;
    let available=WISDOM_SITUATIONS.filter(item=>!seen.includes(item.id));
    if(!available.length){
      cycle+=1;seen=[];
      available=WISDOM_SITUATIONS.filter(item=>WISDOM_SITUATIONS.length<2||item.id!==selector.lastId);
      if(!available.length)available=[...WISDOM_SITUATIONS];
    }
    const value=Number(random());
    if(!Number.isFinite(value)||value<0||value>=1)throw new Error('Wisdom Situations random source must return a value from 0 up to, but not including, 1.');
    const chosen=available[Math.floor(value*available.length)]||available[0];
    persistSelector({...selector,cycle,seen:[...seen,chosen.id],currentId:chosen.id,lastId:chosen.id});
    return chosen;
  };

  function count(){return WISDOM_SITUATIONS.length}
  function open(id,{restart=false,track=true}={}){
    const item=getWisdomSituation(id);
    safetyFor(item);
    const result=lesson.open(item.definition,{restart});
    activeId=item.id;
    if(track)setCurrent(item.id,{markSeen:true});
    return snapshot(result.state,result.resumed,reconcile(item,result.state));
  }
  function startRandom(){
    if(selector.currentId&&byId.has(selector.currentId))return open(selector.currentId,{restart:false,track:false});
    const chosen=chooseRandom();
    return open(chosen.id,{restart:true,track:false});
  }
  function getState(){
    const item=requireActive();
    const state=lesson.getState();
    return snapshot(state,true,reconcile(item,state));
  }
  function answer(value){
    const item=requireActive();
    safetyFor(item);
    const before=lesson.getState();
    const order=displayOrderFor(item,before);
    const displayChoice=Number(value);
    if(!Number.isSafeInteger(displayChoice)||displayChoice<0||displayChoice>=order.length)throw new Error('Choose one available answer.');
    const canonicalChoice=order[displayChoice];
    const response=lesson.respond(canonicalChoice);
    const progressResult=reconcile(item,response.state);
    const finish=lesson.advance();
    return Object.freeze({
      applied:response.applied,duplicate:response.duplicate,feedback:response.feedback,completed:finish.completed,
      ...snapshot(finish.state,true,progressResult)
    });
  }
  function restart(){
    requireActive();
    const result=lesson.restart();
    return snapshot(result.state,false,null);
  }
  function another(){
    requireActive();
    clearCurrent();
    const chosen=chooseRandom();
    return open(chosen.id,{restart:true,track:false});
  }
  function close(){activeId=null;lesson.close()}

  return Object.freeze({count,open,startRandom,getState,answer,restart,another,close});
}
