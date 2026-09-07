const STORAGE_KEY='open-review';
const VERSION=1;
const INTERVALS=Object.freeze([1,3,7,14,30]);
const CATEGORY_CODES=Object.freeze({
  Genesis:Object.freeze(['GEN']),
  Exodus:Object.freeze(['EXO','LEV','NUM','DEU']),
  History:Object.freeze(['JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST']),
  Wisdom:Object.freeze(['JOB','PSA','PRO','ECC','SNG']),
  Prophets:Object.freeze(['ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL']),
  Gospels:Object.freeze(['MAT','MRK','LUK','JHN']),
  Acts:Object.freeze(['ACT']),
  Letters:Object.freeze(['ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'])
});
const safeInt=(value,fallback=0)=>Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):fallback;
const validCode=value=>/^[0-9A-Z]{3}$/.test(String(value||''));
const validDateKey=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):null;
const keyFor=(code,id)=>`${code}:${id}`;
const splitKey=value=>{const text=String(value||''),index=text.indexOf(':');return index>0?{code:text.slice(0,index),id:text.slice(index+1)}:null};

function defaultState(){return{version:VERSION,attemptSeq:0,items:{},sessions:[],active:null,rated:{}}}
function normalize(input){
  const base=defaultState();
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.version)!==VERSION)return base;
  const items={};
  if(input.items&&typeof input.items==='object'&&!Array.isArray(input.items))for(const [key,row] of Object.entries(input.items)){
    const parsed=splitKey(key);if(!parsed||!validCode(parsed.code)||!parsed.id||parsed.id.length>100||!row||typeof row!=='object'||Array.isArray(row))continue;
    const seen=safeInt(row.seen),got=Math.min(seen,safeInt(row.got)),again=Math.min(seen,safeInt(row.again));
    items[key]={seen,got,again,streak:Math.min(5,safeInt(row.streak)),nextDue:validDateKey(row.nextDue),last:validDateKey(row.last)};
  }
  const sessions=Array.isArray(input.sessions)?input.sessions.filter(row=>row&&typeof row==='object'&&typeof row.id==='string'&&Array.isArray(row.itemKeys)&&row.itemKeys.every(key=>Boolean(splitKey(key)))).slice(-90).map(row=>({id:row.id,date:validDateKey(row.date)||'',got:safeInt(row.got),again:safeInt(row.again),total:safeInt(row.total),itemKeys:[...row.itemKeys]})):[];
  let active=null;
  if(input.active&&typeof input.active==='object'&&!Array.isArray(input.active)&&typeof input.active.id==='string'&&/^[a-z0-9-]{1,80}$/i.test(input.active.id)&&Array.isArray(input.active.itemKeys)&&input.active.itemKeys.length>=1&&input.active.itemKeys.length<=7&&input.active.itemKeys.every(key=>Boolean(splitKey(key))))active={id:input.active.id,itemKeys:[...new Set(input.active.itemKeys)]};
  const rated={};
  if(input.rated&&typeof input.rated==='object'&&!Array.isArray(input.rated))for(const id of Object.keys(input.rated).slice(-5000))if(typeof id==='string'&&id.length<=220)rated[id]=true;
  return{version:VERSION,attemptSeq:safeInt(input.attemptSeq),items,sessions,active,rated};
}
function addDays(key,days){const [year,month,day]=key.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day+days));return date.toISOString().slice(0,10)}
function freezeItem(item,{reveal=false}={}){if(!item)return null;const base={key:item.key,code:item.code,id:item.id,book:item.book,question:item.question,source:item.source,license:item.license};if(reveal){base.answer=item.answer;base.reference=item.reference}return Object.freeze(base)}

export function createOpenReviewService({storage,lesson,progress,recall,games,adaptive,clock=()=>new Date(),random=Math.random}={}){
  if(!storage||!lesson||!progress||!recall||!games||!adaptive)throw new Error('Open Review requires Storage, Lesson, Progress, Recall Pack, Games, and Adaptive Learning owners.');
  if(typeof random!=='function')throw new Error('Open Review requires a random source.');
  if(typeof games.recallReviewQueue!=='function'||typeof games.syncRecallReviewItem!=='function')throw new Error('Open Review requires the Games recall-review interface.');
  if(typeof adaptive.reviewFocusCategory!=='function')throw new Error('Open Review requires the Adaptive weak-area interface.');
  let state=normalize(storage.read(STORAGE_KEY,defaultState()));
  let activeItems=[];
  const save=next=>{storage.write(STORAGE_KEY,next);state=next;return state};
  const today=()=>progress.getDateKey(clock());
  const randomValue=()=>{const value=Number(random());if(!Number.isFinite(value)||value<0||value>=1)throw new Error('Open Review random source must return a value from 0 up to, but not including, 1.');return value};
  const shuffled=list=>{const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(randomValue()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
  const statFor=key=>state.items[key]||{seen:0,got:0,again:0,streak:0,nextDue:null,last:null};
  const gameQueue=()=>games.recallReviewQueue();
  const gameDueCount=()=>Object.values(gameQueue()).reduce((sum,ids)=>sum+ids.length,0);
  const scheduledDueCount=()=>Object.values(state.items).filter(row=>row.nextDue&&row.nextDue<=today()).length;
  const dueCount=()=>Math.max(scheduledDueCount(),gameDueCount());
  const accuracy=()=>{const rows=Object.values(state.items),seen=rows.reduce((sum,row)=>sum+row.seen,0),got=rows.reduce((sum,row)=>sum+row.got,0);return seen?Math.round(got/seen*100):0};
  const summaryFromLesson=lessonState=>{let got=0,again=0;for(const [stepId,value] of Object.entries(lessonState?.responses||{}))if(/-rate$/.test(stepId)){if(Number(value)===1)got++;else if(Number(value)===0)again++}return Object.freeze({got,again,total:state.active?.itemKeys.length||0,gained:got*5+again})};
  const overview=()=>Object.freeze({due:dueCount(),accuracy:accuracy(),weakest:adaptive.reviewFocusCategory(),hasActive:Boolean(state.active),recentSessions:Object.freeze(state.sessions.slice(-5).map(row=>Object.freeze({...row,itemKeys:Object.freeze([...row.itemKeys])})))});

  async function hydrateKey(key){const parsed=splitKey(key);if(!parsed||!validCode(parsed.code))return null;const loaded=await recall.loadBook(parsed.code),item=loaded.items.find(row=>row.id===parsed.id);if(!item)return null;return Object.freeze({key,code:loaded.book.code,id:item.id,book:loaded.book.name,question:item.question,answer:item.answer,reference:item.reference,source:loaded.source,license:loaded.license})}
  async function hydrateKeys(keys){const out=[];for(const key of keys){const item=await hydrateKey(key);if(item)out.push(item)}return out}
  async function scheduledCandidates(limit){
    const rows=Object.entries(state.items).filter(([,row])=>row.nextDue&&row.nextDue<=today()).sort((a,b)=>String(a[1].nextDue).localeCompare(String(b[1].nextDue))||((a[1].got||0)/(a[1].seen||1))-((b[1].got||0)/(b[1].seen||1)));
    return hydrateKeys(rows.slice(0,limit).map(([key])=>key));
  }
  async function gameReviewCandidates(limit,exclude){
    const queue=gameQueue(),keys=[];
    for(const [code,ids] of Object.entries(queue))for(const id of ids){const key=keyFor(code,id);if(exclude.has(key))continue;keys.push(key);exclude.add(key);if(keys.length>=limit)return hydrateKeys(keys)}
    return hydrateKeys(keys);
  }
  async function freshCandidates(limit,exclude){
    const manifest=await recall.loadManifest(),focus=adaptive.reviewFocusCategory(),allowed=new Set(CATEGORY_CODES[focus]||[]);
    let books=manifest.books.filter(book=>allowed.has(book.code));if(!books.length)books=[...manifest.books];books=shuffled(books);
    const out=[];
    for(const book of books.slice(0,3)){
      const loaded=await recall.loadBook(book.code),rows=shuffled(loaded.items);
      for(const row of rows){const key=keyFor(book.code,row.id);if(exclude.has(key)||state.items[key])continue;out.push(Object.freeze({key,code:book.code,id:row.id,book:book.name,question:row.question,answer:row.answer,reference:row.reference,source:loaded.source,license:loaded.license}));exclude.add(key);if(out.length>=limit)return out}
    }
    if(out.length<limit)for(const book of shuffled(manifest.books)){
      const loaded=await recall.loadBook(book.code),rows=shuffled(loaded.items);
      for(const row of rows){const key=keyFor(book.code,row.id);if(exclude.has(key)||state.items[key])continue;out.push(Object.freeze({key,code:book.code,id:row.id,book:book.name,question:row.question,answer:row.answer,reference:row.reference,source:loaded.source,license:loaded.license}));exclude.add(key);if(out.length>=limit)return out}
    }
    return out;
  }
  async function buildSession(count=7){
    const out=await scheduledCandidates(count),exclude=new Set(out.map(item=>item.key));
    if(out.length<count)out.push(...await gameReviewCandidates(count-out.length,exclude));
    if(out.length<count)out.push(...await freshCandidates(count-out.length,exclude));
    return Object.freeze(out.slice(0,count));
  }
  function definitionFor(active,items){
    const steps=[];items.forEach((item,index)=>{const number=index+1;steps.push(Object.freeze({id:`q${number}-prompt`,type:'content',prompt:item.question}));steps.push(Object.freeze({id:`q${number}-rate`,type:'choice',prompt:item.answer,reference:item.reference,choices:Object.freeze(['Review again','Got it'])}))});
    return Object.freeze({id:`open-review:${active.id}`,version:1,title:'Open Smart Review',steps:Object.freeze(steps)});
  }
  const itemAt=lessonState=>activeItems[Math.floor((lessonState?.index||0)/2)]||null;
  const itemKind=item=>{if(!item)return'';const row=statFor(item.key);return row.nextDue&&row.nextDue<=today()?'DUE REVIEW':row.seen?'REINFORCEMENT':'NEW OPEN QUESTION'};
  function snapshot(lessonState,{resumed=false,progressResult=null}={}){
    const complete=lessonState.status==='complete',rate=!complete&&lessonState.currentStep?.type==='choice',item=itemAt(lessonState),summary=summaryFromLesson(lessonState);
    return Object.freeze({attemptId:state.active?.id||'',phase:complete?'complete':rate?'rate':'question',state:lessonState,item:freezeItem(item,{reveal:rate}),kind:itemKind(item),summary,resumed,progress:progressResult,overview:overview()});
  }
  function newAttemptId(){const raw=clock(),date=raw instanceof Date?new Date(raw.getTime()):new Date(raw);if(!Number.isFinite(date.getTime()))throw new Error('Open Review clock returned an invalid time.');const seq=state.attemptSeq+1;return{id:`${date.getTime().toString(36)}-${seq.toString(36)}`,seq}}
  async function start(){
    const items=await buildSession(7);if(items.length!==7)throw new Error('Open Review could not build a seven-question session.');
    const attempt=newAttemptId(),active={id:attempt.id,itemKeys:items.map(item=>item.key)};activeItems=[...items];save({...state,attemptSeq:attempt.seq,active});
    const opened=lesson.open(definitionFor(active,activeItems),{restart:true});return snapshot(opened.state,{resumed:false});
  }
  async function resume(){
    if(!state.active)throw new Error('There is no Open Review to resume.');activeItems=await hydrateKeys(state.active.itemKeys);if(activeItems.length!==state.active.itemKeys.length)throw new Error('A saved Open Review item is no longer available.');
    const opened=lesson.open(definitionFor(state.active,activeItems));return snapshot(opened.state,{resumed:opened.resumed});
  }
  function reveal(){
    if(!state.active)throw new Error('Start Open Review before revealing an answer.');const current=lesson.getState();if(current.status==='complete')return snapshot(current,{resumed:true});if(current.currentStep?.type!=='content')return snapshot(current,{resumed:true});
    const advanced=lesson.advance();return snapshot(advanced.state,{resumed:true});
  }
  function applyRating(item,gotIt,eventId){
    if(state.rated[eventId])return;
    const previous=statFor(item.key),streak=gotIt?Math.min(5,previous.streak+1):0,row={seen:previous.seen+1,got:previous.got+(gotIt?1:0),again:previous.again+(gotIt?0:1),streak,nextDue:gotIt?addDays(today(),INTERVALS[Math.max(0,streak-1)]||30):today(),last:today()};
    games.syncRecallReviewItem(item.code,item.id,!gotIt);
    save({...state,items:{...state.items,[item.key]:row},rated:{...state.rated,[eventId]:true}});
  }
  function finalize(lessonState){
    if(!state.active||lessonState.status!=='complete'||state.sessions.some(row=>row.id===state.active.id))return;
    const summary=summaryFromLesson(lessonState);save({...state,sessions:[...state.sessions,{id:state.active.id,date:today(),got:summary.got,again:summary.again,total:summary.total,itemKeys:[...state.active.itemKeys]}].slice(-90)});
  }
  function rate(rating){
    if(!state.active)throw new Error('Start Open Review before rating recall.');if(!['got','again'].includes(rating))throw new Error('Choose Got it or Review again.');
    const current=lesson.getState();if(current.status==='complete')return snapshot(current,{resumed:true});if(current.currentStep?.type!=='choice')throw new Error('Reveal the reference answer before rating recall.');
    const item=itemAt(current),choice=rating==='got'?1:0,gotIt=choice===1,response=lesson.respond(choice),eventId=`open-review:${state.active.id}:item:${item.code}:${item.id}`,progressResult=progress.record({id:eventId,type:'open-review.recall',xp:gotIt?5:1,meaningful:false,metrics:gotIt?{quizCorrect:1}:{}});
    applyRating(item,gotIt,eventId);const advanced=lesson.advance();finalize(advanced.state);return Object.freeze({applied:response.applied,duplicate:response.duplicate,...snapshot(advanced.state,{resumed:true,progressResult})});
  }
  function restart(){if(!state.active)throw new Error('Start Open Review before restarting.');const result=lesson.restart();return snapshot(result.state,{resumed:false})}
  async function another(){return start()}
  function close(){lesson.close()}
  function getProfile(){const rows={};for(const [key,row] of Object.entries(state.items))rows[key]=Object.freeze({...row});return Object.freeze({items:Object.freeze(rows),sessions:Object.freeze(state.sessions.map(row=>Object.freeze({...row,itemKeys:Object.freeze([...row.itemKeys])}))),active:state.active?Object.freeze({...state.active,itemKeys:Object.freeze([...state.active.itemKeys])}):null})}

  return Object.freeze({overview,start,resume,reveal,rate,restart,another,close,getProfile,buildSession});
}
