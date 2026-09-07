import { WISDOM_SITUATIONS, getWisdomSituation } from '../features/wisdom-situations/content.js';

const hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

function publicSituation(item,reveal=false){
  const base={id:item.id,title:item.title,tension:item.tension,scenario:item.scenario,options:Object.freeze([...item.options]),difficulty:item.difficulty};
  if(!reveal)return Object.freeze(base);
  return Object.freeze({...base,best:item.best,why:item.why,rationales:Object.freeze([...item.rationales]),refs:Object.freeze([...item.refs])});
}

export function createWisdomSituationsService({lesson,progress,random=Math.random}){
  if(!lesson||!progress)throw new Error('Wisdom Situations requires Lesson and Progress boundaries.');
  let activeId=null,lastId='';

  const requireActive=()=>{
    if(!activeId)throw new Error('Open a Wisdom Situation before using Wisdom Situations.');
    return getWisdomSituation(activeId);
  };
  const eventId=(item,state)=>`wisdom-situation:${item.id}:v${state.definitionVersion}:${state.startedAt}`;
  const reconcile=(item,state)=>{
    if(!hasOwn(state.responses,'judgment'))return null;
    return progress.record({id:eventId(item,state),type:'wisdom-situation.complete',xp:8,meaningful:true,metrics:{situations:1}});
  };
  const snapshot=(state,resumed=false,progressResult=null)=>{
    const item=requireActive();
    const answered=hasOwn(state.responses,'judgment');
    return Object.freeze({situation:publicSituation(item,answered),state,resumed,answered,progress:progressResult});
  };
  const chooseRandom=()=>{
    const pool=WISDOM_SITUATIONS.length>1?WISDOM_SITUATIONS.filter(item=>item.id!==lastId):WISDOM_SITUATIONS;
    const value=Number(random());
    if(!Number.isFinite(value)||value<0||value>=1)throw new Error('Wisdom Situations random source must return a value from 0 up to, but not including, 1.');
    return pool[Math.floor(value*pool.length)];
  };

  function count(){return WISDOM_SITUATIONS.length}
  function open(id,{restart=false}={}){
    const item=getWisdomSituation(id);
    const result=lesson.open(item.definition,{restart});
    activeId=item.id;lastId=item.id;
    return snapshot(result.state,result.resumed,reconcile(item,result.state));
  }
  function startRandom(){return open(chooseRandom().id,{restart:true})}
  function getState(){
    const item=requireActive();
    const state=lesson.getState();
    return snapshot(state,true,reconcile(item,state));
  }
  function answer(value){
    const item=requireActive();
    const response=lesson.respond(value);
    const progressResult=reconcile(item,response.state);
    const finish=lesson.advance();
    return Object.freeze({applied:response.applied,duplicate:response.duplicate,feedback:response.feedback,completed:finish.completed,...snapshot(finish.state,true,progressResult)});
  }
  function restart(){
    requireActive();
    const result=lesson.restart();
    return snapshot(result.state,false,null);
  }
  function another(){return startRandom()}
  function close(){activeId=null;lesson.close()}

  return Object.freeze({count,open,startRandom,getState,answer,restart,another,close});
}
