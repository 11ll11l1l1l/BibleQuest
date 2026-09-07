import { STORY_JOURNEYS, getStoryJourney } from '../features/story-journey/content.js';

const publicStory=item=>Object.freeze({id:item.id,title:item.title,emoji:item.emoji,book:item.book,sceneCount:item.scenes.length,checkpoint:Object.freeze({question:item.checkpoint.question,reference:item.checkpoint.reference})});
const hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

export function createStoryJourneyService({lesson,progress,reader,random=Math.random}) {
  if (!lesson || !progress || !reader) throw new Error('Story Journey requires Lesson, Progress, and Reader boundaries.');
  let activeId=null;

  const requireActive=()=>{
    if(!activeId)throw new Error('Open a Story Journey before using Story Journey.');
    return getStoryJourney(activeId);
  };
  const rewardFor=state=>state.feedback?.checkpoint?.correct===true?15:4;
  const eventId=(item,state)=>`story-journey:${item.id}:v${state.definitionVersion}:${state.startedAt}`;
  const reconcileCheckpoint=(item,state)=>{
    if(!hasOwn(state.responses,'checkpoint'))return null;
    const feedback=state.feedback?.checkpoint;
    if(typeof feedback?.correct!=='boolean')throw new Error('Story Journey checkpoint feedback is unavailable.');
    return progress.record({
      id:eventId(item,state),type:'story-journey-checkpoint',xp:rewardFor(state),meaningful:true,
      metrics:{quizCorrect:feedback.correct?1:0}
    });
  };
  const snapshot=(state,resumed=false,progressResult=null)=>Object.freeze({story:publicStory(requireActive()),state,resumed,percent:state.status==='complete'?100:Math.round(state.index/state.totalSteps*100),progress:progressResult});

  function library(){return Object.freeze(STORY_JOURNEYS.map(publicStory))}
  function chooseRandom(){
    const value=Number(random());
    if(!Number.isFinite(value)||value<0||value>=1)throw new Error('Story Journey random source must return a value from 0 up to, but not including, 1.');
    return STORY_JOURNEYS[Math.floor(value*STORY_JOURNEYS.length)];
  }
  function open(id,{restart=false}={}){
    const item=getStoryJourney(id);
    const result=lesson.open(item.definition,{restart});
    activeId=item.id;
    const progressResult=reconcileCheckpoint(item,result.state);
    return snapshot(result.state,result.resumed,progressResult);
  }
  function startRandom({restart=true}={}){return open(chooseRandom().id,{restart})}
  function getState(){
    const item=requireActive();
    const state=lesson.getState();
    return snapshot(state,true,reconcileCheckpoint(item,state));
  }
  function advance(){
    requireActive();
    const result=lesson.advance();
    return Object.freeze({...result,...snapshot(result.state,true,null)});
  }
  function answer(value){
    const item=requireActive();
    const response=lesson.respond(value);
    const progressResult=reconcileCheckpoint(item,response.state);
    const finish=lesson.advance();
    return Object.freeze({applied:response.applied,duplicate:response.duplicate,feedback:response.feedback,completed:finish.completed,...snapshot(finish.state,true,progressResult)});
  }
  function restart(){
    requireActive();
    const result=lesson.restart();
    return snapshot(result.state,false,null);
  }
  function another(){return startRandom({restart:true})}
  function prepareReader(){
    const item=requireActive();
    reader.setBook(item.reader.code,item.reader.chapter);
    return Object.freeze({label:item.checkpoint.reference,code:item.reader.code,chapter:item.reader.chapter});
  }
  function close(){activeId=null;lesson.close()}

  return Object.freeze({library,open,startRandom,getState,advance,answer,restart,another,prepareReader,close});
}
