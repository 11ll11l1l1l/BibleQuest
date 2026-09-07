import { GAME_QUESTIONS } from '../features/games/content.js';

const STORAGE_KEY='adaptive-learning';
const VERSION=1;
const INTERVALS=Object.freeze([1,3,7,14,30]);
export const ADAPTIVE_CATEGORIES=Object.freeze(['Genesis','Exodus','History','Wisdom','Prophets','Gospels','Acts','Letters']);
const QUESTION_MAP=new Map(GAME_QUESTIONS.map(item=>[item.id,item]));
const safeInt=(value,fallback=0)=>Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):fallback;

export function adaptiveCategory(book=''){
  if(book==='Genesis')return'Genesis';
  if(['Exodus','Leviticus','Numbers','Deuteronomy'].includes(book))return'Exodus';
  if(['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther'].includes(book))return'History';
  if(['Job','Psalms','Proverbs','Ecclesiastes','Song of Songs'].includes(book))return'Wisdom';
  if(['Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'].includes(book))return'Prophets';
  if(['Matthew','Mark','Luke','John'].includes(book))return'Gospels';
  if(book==='Acts')return'Acts';
  return'Letters';
}

function defaultState(){
  return{version:VERSION,attemptSeq:0,mastery:Object.fromEntries(ADAPTIVE_CATEGORIES.map(key=>[key,0])),questionStats:{},review:[],sessions:[],active:null,ingested:{},answered:{}};
}
function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null}
function normalize(input){
  const base=defaultState();
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.version)!==VERSION)return base;
  const mastery={...base.mastery};
  for(const key of ADAPTIVE_CATEGORIES)mastery[key]=Math.min(100,safeInt(input.mastery?.[key],0));
  const questionStats={};
  if(input.questionStats&&typeof input.questionStats==='object'&&!Array.isArray(input.questionStats)){
    for(const [id,row] of Object.entries(input.questionStats)){
      if(!QUESTION_MAP.has(id)||!row||typeof row!=='object'||Array.isArray(row))continue;
      const seen=safeInt(row.seen),correct=Math.min(seen,safeInt(row.correct)),wrong=Math.min(seen,safeInt(row.wrong));
      const streak=Math.min(5,safeInt(row.streak)),nextDue=validDateKey(row.nextDue),last=validDateKey(row.last);
      questionStats[id]={seen,correct,wrong,streak,nextDue,last};
    }
  }
  const review=[...new Set(Array.isArray(input.review)?input.review.filter(id=>QUESTION_MAP.has(id)):[])].slice(0,GAME_QUESTIONS.length);
  const sessions=Array.isArray(input.sessions)?input.sessions.filter(row=>row&&typeof row==='object'&&typeof row.id==='string'&&Array.isArray(row.questionIds)&&row.questionIds.every(id=>QUESTION_MAP.has(id))).slice(-60).map(row=>({id:row.id,date:validDateKey(row.date)||'',score:Math.min(row.questionIds.length,safeInt(row.score)),total:row.questionIds.length,questionIds:[...row.questionIds]})):[];
  let active=null;
  if(input.active&&typeof input.active==='object'&&!Array.isArray(input.active)&&typeof input.active.id==='string'&&/^[a-z0-9-]{1,80}$/i.test(input.active.id)&&Array.isArray(input.active.questionIds)&&input.active.questionIds.length>=1&&input.active.questionIds.length<=7&&input.active.questionIds.every(id=>QUESTION_MAP.has(id)))active={id:input.active.id,questionIds:[...new Set(input.active.questionIds)]};
  const ingested={},answered={};
  for(const [target,source] of [['ingested',input.ingested],['answered',input.answered]])if(source&&typeof source==='object'&&!Array.isArray(source))for(const id of Object.keys(source).slice(-5000))if(typeof id==='string'&&id.length<=180)target==='ingested'?ingested[id]=true:answered[id]=true;
  return{version:VERSION,attemptSeq:safeInt(input.attemptSeq),mastery,questionStats,review,sessions,active,ingested,answered};
}
function freezeStats(row={}){return Object.freeze({seen:row.seen||0,correct:row.correct||0,wrong:row.wrong||0,streak:row.streak||0,nextDue:row.nextDue||null,last:row.last||null})}
function addDays(key,days){const [year,month,day]=key.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day+days));return date.toISOString().slice(0,10)}
function immutableProfile(state){const stats={};for(const [id,row] of Object.entries(state.questionStats))stats[id]=freezeStats(row);return Object.freeze({mastery:Object.freeze({...state.mastery}),questionStats:Object.freeze(stats),review:Object.freeze([...state.review]),sessions:Object.freeze(state.sessions.map(row=>Object.freeze({...row,questionIds:Object.freeze([...row.questionIds])}))),active:state.active?Object.freeze({...state.active,questionIds:Object.freeze([...state.active.questionIds])}):null})}

export function createAdaptiveLearningService({storage,lesson,progress,clock=()=>new Date(),random=Math.random}={}){
  if(!storage||!lesson||!progress)throw new Error('Adaptive Learning requires Storage, Lesson, and Progress boundaries.');
  if(typeof random!=='function')throw new Error('Adaptive Learning requires a random source.');
  let state=normalize(storage.read(STORAGE_KEY,defaultState()));

  const save=next=>{storage.write(STORAGE_KEY,next);state=next;return state};
  const today=()=>progress.getDateKey(clock());
  const randomValue=()=>{const value=Number(random());if(!Number.isFinite(value)||value<0||value>=1)throw new Error('Adaptive Learning random source must return a value from 0 up to, but not including, 1.');return value};
  const statFor=(source,id)=>source.questionStats[id]||{seen:0,correct:0,wrong:0,streak:0,nextDue:null,last:null};
  const applyOutcome=(source,question,good,date,{adaptive=false}={})=>{
    const previous=statFor(source,question.id),streak=good?Math.min(5,previous.streak+1):0;
    const row={seen:previous.seen+1,correct:previous.correct+(good?1:0),wrong:previous.wrong+(good?0:1),streak,nextDue:good?addDays(date,INTERVALS[Math.max(0,streak-1)]||30):date,last:date};
    const mastery={...source.mastery},review=[...source.review];
    if(adaptive){
      const category=adaptiveCategory(question.book);mastery[category]=Math.min(100,(mastery[category]||0)+(good?5:2));
      const index=review.indexOf(question.id);if(good&&index>=0)review.splice(index,1);if(!good&&index<0)review.push(question.id);
    }
    return{...source,questionStats:{...source.questionStats,[question.id]:row},mastery,review};
  };
  function syncFromProgress(){
    const events=progress.getState().events||{};let next=state,changed=false;
    for(const [eventId,event] of Object.entries(events)){
      if(event?.type!=='game.question'||next.ingested[eventId])continue;
      const match=/^game:.*:question:([^:]+)$/.exec(eventId),question=match?QUESTION_MAP.get(match[1]):null;if(!question)continue;
      next=applyOutcome(next,question,(event.metrics?.quizCorrect||0)>0,event.date||today(),{adaptive:false});
      next={...next,ingested:{...next.ingested,[eventId]:true}};changed=true;
    }
    if(changed)save(next);return changed;
  }
  const dueCount=()=>{const date=today(),due=Object.values(state.questionStats).filter(row=>row.nextDue&&row.nextDue<=date).length;return Math.max(due,state.review.length)};
  const evidenceAccuracy=()=>{const rows=Object.values(state.questionStats),seen=rows.reduce((sum,row)=>sum+row.seen,0),correct=rows.reduce((sum,row)=>sum+row.correct,0);return seen?Math.round(correct/seen*100):0};
  const weakestTrack=()=>{const explored=ADAPTIVE_CATEGORIES.filter(key=>(state.mastery[key]||0)>0);return explored.sort((a,b)=>state.mastery[a]-state.mastery[b])[0]||null};
  function reviewFocusCategory(){syncFromProgress();const min=Math.min(...ADAPTIVE_CATEGORIES.map(key=>state.mastery[key]||0)),tied=ADAPTIVE_CATEGORIES.filter(key=>(state.mastery[key]||0)===min),day=Math.floor(new Date(`${today()}T00:00:00Z`).getTime()/86400000);return tied[day%tied.length]||'Genesis'}
  const overview=()=>{syncFromProgress();return Object.freeze({due:dueCount(),accuracy:evidenceAccuracy(),weakest:weakestTrack(),mastery:Object.freeze({...state.mastery}),hasActive:Boolean(state.active),recentSessions:Object.freeze(state.sessions.slice(-5).map(row=>Object.freeze({...row,questionIds:Object.freeze([...row.questionIds])})))});};
  function rankQuestions(){
    syncFromProgress();const date=today(),review=new Set(state.review);
    return GAME_QUESTIONS.map(question=>{
      const stat=statFor(state,question.id);let priority=randomValue()*8;
      if(review.has(question.id))priority+=70;if(stat.nextDue&&stat.nextDue<=date)priority+=55;if(!stat.seen)priority+=30;if(stat.seen)priority+=(stat.wrong/stat.seen)*35;
      priority+=(100-(state.mastery[adaptiveCategory(question.book)]||0))*.22;if(question.mode==='context')priority+=8;if(question.mode==='connection')priority+=10;
      return{question,priority};
    }).sort((a,b)=>b.priority-a.priority||a.question.id.localeCompare(b.question.id));
  }
  function smartBank(count=7){
    const ranked=rankQuestions(),out=[],per={};
    for(const item of ranked){const category=adaptiveCategory(item.question.book);if((per[category]||0)>=3)continue;out.push(item.question);per[category]=(per[category]||0)+1;if(out.length>=count)break}
    if(out.length<count)for(const item of ranked)if(!out.includes(item.question)){out.push(item.question);if(out.length>=count)break}
    return Object.freeze(out);
  }
  const definitionFor=active=>Object.freeze({id:`adaptive-review:${active.id}`,version:1,title:'Adaptive Review',steps:Object.freeze(active.questionIds.map(id=>{const q=QUESTION_MAP.get(id);return Object.freeze({id:q.id,type:'choice',prompt:q.q,choices:q.choices,answer:q.answer,reference:q.ref,feedback:Object.freeze({correct:'Remembered.',incorrect:'Review target added.'})})}))});
  const activeQuestion=lessonState=>lessonState.currentStep?QUESTION_MAP.get(lessonState.currentStep.id)||null:null;
  const labelFor=question=>{if(!question)return'';const row=statFor(state,question.id),date=today();return row.nextDue&&row.nextDue<=date?'DUE REVIEW':!row.seen?'NEW':'REINFORCEMENT'};
  const snapshot=(lessonState,{resumed=false,progressResult=null}={})=>{const question=activeQuestion(lessonState);return Object.freeze({attemptId:state.active?.id||'',state:lessonState,question,kind:labelFor(question),resumed,progress:progressResult,overview:overview()})};
  function newAttemptId(){const raw=clock(),date=raw instanceof Date?new Date(raw.getTime()):new Date(raw);if(!Number.isFinite(date.getTime()))throw new Error('Adaptive Learning clock returned an invalid time.');const seq=state.attemptSeq+1;return{id:`${date.getTime().toString(36)}-${seq.toString(36)}`,seq}}
  function start(){
    const bank=smartBank(7);if(bank.length!==7)throw new Error('Adaptive Learning could not build a seven-question review.');
    const attempt=newAttemptId(),active={id:attempt.id,questionIds:bank.map(item=>item.id)};save({...state,attemptSeq:attempt.seq,active});
    const opened=lesson.open(definitionFor(active),{restart:true});return snapshot(opened.state,{resumed:false});
  }
  function resume(){if(!state.active)throw new Error('There is no Adaptive Review to resume.');syncFromProgress();const opened=lesson.open(definitionFor(state.active));return snapshot(opened.state,{resumed:opened.resumed})}
  function reconcileAnswer(lessonState){
    if(!state.active)return null;const question=activeQuestion(lessonState);if(!question||!(question.id in lessonState.responses))return null;
    const feedback=lessonState.feedback[question.id];if(typeof feedback?.correct!=='boolean')throw new Error('Adaptive Learning answer feedback is unavailable.');
    const eventId=`adaptive:${state.active.id}:question:${question.id}`,xp=feedback.correct?10:3;
    const progressResult=progress.record({id:eventId,type:'adaptive.question',xp,meaningful:false,metrics:feedback.correct?{quizCorrect:1}:{}});
    if(!state.answered[eventId]){let next=applyOutcome(state,question,feedback.correct,today(),{adaptive:true});next={...next,answered:{...next.answered,[eventId]:true}};save(next)}
    return progressResult;
  }
  function answer(choice){
    if(!state.active)throw new Error('Start Adaptive Review before answering.');const response=lesson.respond(choice),progressResult=reconcileAnswer(response.state);return Object.freeze({applied:response.applied,duplicate:response.duplicate,feedback:response.feedback,...snapshot(response.state,{resumed:true,progressResult})});
  }
  function finalize(lessonState){
    if(!state.active||lessonState.status!=='complete')return;
    if(state.sessions.some(row=>row.id===state.active.id))return;
    save({...state,sessions:[...state.sessions,{id:state.active.id,date:today(),score:lessonState.score.correct,total:state.active.questionIds.length,questionIds:[...state.active.questionIds]}].slice(-60)});
  }
  function next(){if(!state.active)throw new Error('Start Adaptive Review before continuing.');const advanced=lesson.advance();finalize(advanced.state);return Object.freeze({completed:advanced.completed,duplicate:advanced.duplicate,...snapshot(advanced.state,{resumed:true})})}
  function restart(){if(!state.active)throw new Error('Start Adaptive Review before restarting.');const result=lesson.restart();return snapshot(result.state,{resumed:false})}
  function another(){return start()}
  function close(){lesson.close()}
  function getProfile(){syncFromProgress();return immutableProfile(state)}

  return Object.freeze({overview,reviewFocusCategory,start,resume,answer,next,restart,another,close,getProfile,smartBank,categories:ADAPTIVE_CATEGORIES,questionCount:GAME_QUESTIONS.length});
}
