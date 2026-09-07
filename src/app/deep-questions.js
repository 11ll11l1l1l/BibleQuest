import { DEEP_QUESTIONS, getDeepQuestion } from '../features/deep-questions/content.js';

const freezeReference=reference=>Object.freeze({...reference});
const publicQuestion=item=>Object.freeze({id:item.id,prompt:item.prompt,options:Object.freeze([...item.options]),references:Object.freeze(item.references.map(freezeReference))});

export function createDeepQuestionsService({lesson,reader,clock=()=>new Date()}) {
  if (!lesson || !reader) throw new Error('Deep Questions requires Lesson and Reader boundaries.');
  let activeId=null;

  const ensureActiveQuestion=()=>{
    if (!activeId) throw new Error('Open a Deep Question before using Deep Questions.');
    return getDeepQuestion(activeId);
  };
  const snapshot=(state,resumed=false)=>{
    const item=ensureActiveQuestion();
    return Object.freeze({question:publicQuestion(item),state,resumed,percent:state.status==='complete'?100:Math.round(state.index/state.totalSteps*100)});
  };

  function library(){return Object.freeze(DEEP_QUESTIONS.map(publicQuestion))}
  function daily(){
    const value=clock();
    const date=value instanceof Date?new Date(value.getTime()):new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error('Deep Questions clock returned an invalid time.');
    return publicQuestion(DEEP_QUESTIONS[date.getDate()%DEEP_QUESTIONS.length]);
  }
  function open(id,{restart=false}={}){
    const item=getDeepQuestion(id);
    const result=lesson.open(item.definition,{restart});
    activeId=item.id;
    return snapshot(result.state,result.resumed);
  }
  function openDaily(options){return open(daily().id,options)}
  function getState(){ensureActiveQuestion();return snapshot(lesson.getState(),true)}
  function respond(value){
    ensureActiveQuestion();
    const result=lesson.respond(value);
    return Object.freeze({...result,...snapshot(result.state,true)});
  }
  function advance(){
    ensureActiveQuestion();
    const result=lesson.advance();
    return Object.freeze({...result,...snapshot(result.state,true)});
  }
  function restart(){
    ensureActiveQuestion();
    const result=lesson.restart();
    return snapshot(result.state,false);
  }
  function prepareReader(referenceIndex=0){
    const item=ensureActiveQuestion();
    const index=Number(referenceIndex);
    if (!Number.isSafeInteger(index)||index<0||index>=item.references.length) throw new Error('Choose an available Scripture reference.');
    const reference=item.references[index];
    reader.setBook(reference.code,reference.chapter);
    return freezeReference(reference);
  }
  function close(){activeId=null;lesson.close()}

  return Object.freeze({library,daily,open,openDaily,getState,respond,advance,restart,prepareReader,close});
}
