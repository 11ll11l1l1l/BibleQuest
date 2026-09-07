import { createOpenReviewService } from '../src/app/open-review.js';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createProgressService } from '../src/core/progress.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>structuredClone(value);
const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value},remove(key){memory.delete(key)}};
let storeState={};const store={setState(patch){storeState=typeof patch==='function'?patch(storeState):{...storeState,...patch};return storeState}};
let now=new Date('2026-09-07T03:00:00Z');
const progress=createProgressService({storage,store,clock:()=>new Date(now),timeZone:'Asia/Tokyo'});
const lesson=createLessonEngine({storage,clock:()=>new Date(now)});
const makeItems=(prefix,count)=>Object.freeze(Array.from({length:count},(_,i)=>Object.freeze({id:`${prefix}${i+1}`,question:`Question ${prefix}${i+1}?`,answer:`Answer ${prefix}${i+1}`,reference:`Ref ${prefix}${i+1}`})));
const packs={GEN:{book:Object.freeze({code:'GEN',name:'Genesis',questions:12,path:'data/packs/questions/GEN.json'}),source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',items:makeItems('g',12)},EXO:{book:Object.freeze({code:'EXO',name:'Exodus',questions:8,path:'data/packs/questions/EXO.json'}),source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',items:makeItems('e',8)}};
const recall={async loadManifest(){return Object.freeze({source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',books:Object.freeze(Object.values(packs).map(pack=>pack.book))})},async loadBook(code){if(!packs[code])throw new Error('missing pack');return packs[code]}};
let queue={EXO:['e1']};
const games={recallReviewQueue(){const out={};for(const [code,ids] of Object.entries(queue))out[code]=Object.freeze([...ids]);return Object.freeze(out)},syncRecallReviewItem(code,id,needsReview){const ids=queue[code]||[];queue={...queue,[code]:needsReview?[...new Set([...ids,id])]:ids.filter(value=>value!==id)};return Object.freeze([...(queue[code]||[])])}};
const adaptive={reviewFocusCategory(){return'Genesis'}};
const review=createOpenReviewService({storage,lesson,progress,recall,games,adaptive,clock:()=>new Date(now),random:()=>0});

let overview=review.overview();assert(overview.due===1&&overview.accuracy===0&&overview.weakest==='Genesis'&&!overview.hasActive,'Fresh Open Review overview did not include the Games review queue and weak-area focus.');
let session=await review.start();assert(session.phase==='question'&&session.state.totalSteps===14&&session.item.id==='e1','Open Review must build seven question/rating pairs and prioritize the existing Games review item.');assert(!('answer' in session.item),'Open Review exposed the reference answer before reveal.');assert(session.item.source==='unfoldingWord Translation Questions v90'&&session.item.license==='CC BY-SA 4.0','Open Review lost required open-pack attribution.');
let beforeRevealError='';try{review.rate('again')}catch(error){beforeRevealError=error.message}assert(/Reveal the reference answer/i.test(beforeRevealError),'Open Review must reject rating before answer reveal.');
session=review.reveal();assert(session.phase==='rate'&&session.item.answer==='Answer e1'&&session.item.reference==='Ref e1','Open Review reveal did not expose the source answer/reference.');
session=review.rate('again');assert(progress.getState().xp===1,'Review again must award retained +1 XP.');assert(queue.EXO.includes('e1'),'Review again must keep the item in the shared Games review queue.');let profile=review.getProfile();assert(profile.items['EXO:e1'].seen===1&&profile.items['EXO:e1'].again===1&&profile.items['EXO:e1'].streak===0&&profile.items['EXO:e1'].nextDue==='2026-09-07','Review again did not make the item due immediately.');

for(let i=0;i<6;i++){assert(session.phase==='question','Open Review did not advance to the next question after rating.');session=review.reveal();session=review.rate('got')}
assert(session.phase==='complete'&&session.summary.got===6&&session.summary.again===1&&session.summary.total===7&&session.summary.gained===31,'Open Review completion summary is incorrect.');assert(progress.getState().xp===31,'Open Review retained XP total should be +1 plus six × +5.');assert(progress.getState().counters.quizCorrect===6,'Got it ratings should retain the six quizCorrect metrics used by the old recall path.');profile=review.getProfile();assert(profile.sessions.length===1&&profile.sessions[0].got===6&&profile.sessions[0].again===1,'Open Review session history was not persisted exactly once.');

const completedXp=progress.getState().xp,reloadLesson=createLessonEngine({storage,clock:()=>new Date(now)}),reloadReview=createOpenReviewService({storage,lesson:reloadLesson,progress,recall,games,adaptive,clock:()=>new Date(now),random:()=>0}),resumed=await reloadReview.resume();assert(resumed.phase==='complete'&&resumed.summary.got===6&&resumed.summary.again===1,'Completed Open Review did not survive service recreation/reload.');assert(progress.getState().xp===completedXp&&reloadReview.getProfile().sessions.length===1,'Reloading completed Open Review duplicated XP or history.');

let next=await reloadReview.another();assert(next.item.id==='e1'&&next.kind==='DUE REVIEW','A Review again item must be first in the next same-day session.');next=reloadReview.reveal();next=reloadReview.rate('got');profile=reloadReview.getProfile();assert(profile.items['EXO:e1'].streak===1&&profile.items['EXO:e1'].nextDue==='2026-09-08'&&!queue.EXO.includes('e1'),'Got it must remove the shared review item and schedule the first one-day interval.');
const spacing=[['2026-09-08T03:00:00Z','2026-09-11'],['2026-09-11T03:00:00Z','2026-09-18'],['2026-09-18T03:00:00Z','2026-10-02'],['2026-10-02T03:00:00Z','2026-11-01']];
for(const [date,expected] of spacing){now=new Date(date);queue={...queue,EXO:['e1']};let round=await reloadReview.another();assert(round.item.id==='e1','Due/shared review item was not prioritized for spacing verification.');round=reloadReview.reveal();reloadReview.rate('got');assert(reloadReview.getProfile().items['EXO:e1'].nextDue===expected,`Open Review spacing interval did not advance to ${expected}.`)}

const badMemory=new Map([['open-review',{version:1,attemptSeq:-1,items:{'BAD':{seen:'x'}},sessions:'bad',active:{id:'bad!',itemKeys:['BAD']},rated:'bad'}]]);const badStorage={read(key,fallback=null){return badMemory.has(key)?clone(badMemory.get(key)):clone(fallback)},write(key,value){badMemory.set(key,clone(value));return value}};const badLesson=createLessonEngine({storage:badStorage}),badProgress=createProgressService({storage:badStorage,store:{setState(value){return typeof value==='function'?value({}):value}},timeZone:'UTC'}),normalized=createOpenReviewService({storage:badStorage,lesson:badLesson,progress:badProgress,recall,games,adaptive,random:()=>0});const normalizedProfile=normalized.getProfile();assert(Object.keys(normalizedProfile.items).length===0&&!normalizedProfile.active,'Malformed Open Review persistence did not normalize safely.');
const invalidRandom=createOpenReviewService({storage:badStorage,lesson:badLesson,progress:badProgress,recall,games,adaptive,random:()=>1});let randomError='';try{await invalidRandom.start()}catch(error){randomError=error.message}assert(/random source/i.test(randomError),'Invalid Open Review random source must fail explicitly.');

console.log('BibleQuest v3 Open Review edge regression passed.');
