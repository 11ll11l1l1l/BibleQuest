import { createAdaptiveLearningService, adaptiveCategory } from '../src/app/adaptive-learning.js';
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
const adaptive=createAdaptiveLearningService({storage,lesson,progress,clock:()=>new Date(now),random:()=>0});

assert(adaptive.questionCount===24,'Adaptive Learning must reuse all 24 verified game questions.');
assert(adaptiveCategory('Genesis')==='Genesis'&&adaptiveCategory('Exodus')==='Exodus'&&adaptiveCategory('Ruth')==='History'&&adaptiveCategory('Psalms')==='Wisdom'&&adaptiveCategory('Daniel')==='Prophets'&&adaptiveCategory('Luke')==='Gospels'&&adaptiveCategory('Acts')==='Acts'&&adaptiveCategory('Romans')==='Letters','Adaptive category mapping no longer matches the retained learning engine.');
let view=adaptive.overview();assert(view.due===0&&view.accuracy===0&&view.weakest===null&&!view.hasActive,'Fresh Adaptive Learning overview is incorrect.');

progress.record({id:'game:seed-a:question:q1',type:'game.question',xp:0,meaningful:false});
progress.record({id:'game:seed-b:question:q2',type:'game.question',xp:0,meaningful:false,metrics:{quizCorrect:1}});
view=adaptive.overview();assert(view.due===1&&view.accuracy===50,'Adaptive Learning did not ingest verified Games question outcomes.');
let profile=adaptive.getProfile();assert(profile.questionStats.q1.seen===1&&profile.questionStats.q1.wrong===1&&profile.questionStats.q1.nextDue==='2026-09-07','External missed game question was not made due immediately.');assert(profile.questionStats.q2.seen===1&&profile.questionStats.q2.correct===1&&profile.questionStats.q2.nextDue==='2026-09-08','External correct game question did not receive the first one-day spacing interval.');assert(Object.values(profile.mastery).every(value=>value===0),'Ordinary Games observation must not invent Adaptive mastery credit.');
adaptive.overview();profile=adaptive.getProfile();assert(profile.questionStats.q1.seen===1&&profile.questionStats.q2.seen===1,'Progress ingestion must be idempotent.');

const selected=adaptive.smartBank();assert(selected.length===7&&new Set(selected.map(item=>item.id)).size===7,'Smart Review must select seven unique questions.');assert(selected[0].id==='q1','A missed due question must outrank unseen questions.');const categoryCounts={};for(const question of selected){const key=adaptiveCategory(question.book);categoryCounts[key]=(categoryCounts[key]||0)+1}assert(Math.max(...Object.values(categoryCounts))<=3,'Smart Review must limit a category to three questions when possible.');

let session=adaptive.start();assert(session.state.totalSteps===7&&session.question?.id==='q1'&&session.kind==='DUE REVIEW','Adaptive Review did not start with the expected weak/due question.');const firstAttempt=session.attemptId;
let answer=adaptive.answer(0);assert(answer.feedback.correct===false&&answer.progress.awardedXp===3,'Incorrect Adaptive answer must award the retained +3 XP.');assert(progress.getState().xp===3,'Adaptive incorrect XP was not written through Progress.');profile=adaptive.getProfile();assert(profile.questionStats.q1.seen===2&&profile.questionStats.q1.wrong===2&&profile.mastery.Genesis===2&&profile.review.includes('q1'),'Adaptive miss did not update question evidence, review queue, and mastery.');
const duplicate=adaptive.answer(0);assert(duplicate.duplicate&&duplicate.progress.duplicate&&progress.getState().xp===3,'Duplicate Adaptive answer must not award or update twice.');profile=adaptive.getProfile();assert(profile.questionStats.q1.seen===2&&profile.mastery.Genesis===2,'Duplicate Adaptive answer changed mastery evidence.');

session=adaptive.next();let correctAnswers=0;while(session.state.status!=='complete'){
  const question=session.question;answer=adaptive.answer(question.answer);assert(answer.feedback.correct===true&&answer.progress.awardedXp===10,'Correct Adaptive answer must award the retained +10 XP.');correctAnswers+=1;session=adaptive.next();
}
assert(correctAnswers===6&&session.state.score.correct===6&&session.state.totalSteps===7,'Adaptive Review score or seven-question lifecycle is wrong.');assert(progress.getState().xp===63,'Adaptive Review retained XP total should be 3 + six correct answers × 10.');assert(progress.getState().counters.quizCorrect===7,'Adaptive correct answers should add six quizCorrect metrics on top of the seeded Games correct answer.');profile=adaptive.getProfile();assert(profile.sessions.length===1&&profile.sessions[0].id===firstAttempt&&profile.sessions[0].score===6,'Adaptive completed-session summary was not persisted exactly once.');assert(adaptive.overview().weakest!==null,'Adaptive mastery should identify a weakest explored area after review.');

const reloadLesson=createLessonEngine({storage,clock:()=>new Date(now)}),reloadAdaptive=createAdaptiveLearningService({storage,lesson:reloadLesson,progress,clock:()=>new Date(now),random:()=>0});const beforeReloadXp=progress.getState().xp;const resumed=reloadAdaptive.resume();assert(resumed.state.status==='complete'&&resumed.state.score.correct===6,'Completed Adaptive Review did not survive service recreation/reload.');assert(progress.getState().xp===beforeReloadXp&&reloadAdaptive.getProfile().sessions.length===1,'Reloading a completed Adaptive Review duplicated reward or session history.');
now=new Date('2026-09-07T04:00:00Z');const nextRound=reloadAdaptive.another();assert(nextRound.attemptId!==firstAttempt&&nextRound.question?.id==='q1','Another Adaptive Review must create a new attempt and prioritize the retained weak item.');

const brokenMemory=new Map([['adaptive-learning',{version:1,mastery:{Genesis:-10},questionStats:{q1:{seen:'bad',nextDue:'bad'}},review:['missing'],sessions:'bad',active:{id:'bad!',questionIds:['missing']}}]]);const brokenStorage={read(key,fallback=null){return brokenMemory.has(key)?clone(brokenMemory.get(key)):clone(fallback)},write(key,value){brokenMemory.set(key,clone(value));return value}};const brokenLesson=createLessonEngine({storage:brokenStorage}),brokenProgress=createProgressService({storage:brokenStorage,store:{setState(value){return typeof value==='function'?value({}):value}},timeZone:'UTC'}),normalized=createAdaptiveLearningService({storage:brokenStorage,lesson:brokenLesson,progress:brokenProgress,random:()=>0});const normalizedProfile=normalized.getProfile();assert(normalizedProfile.mastery.Genesis===0&&normalizedProfile.questionStats.q1.seen===0&&!normalizedProfile.active,'Malformed Adaptive Learning persistence did not normalize safely.');

const badMemory=new Map(),badStorage={read(key,fallback=null){return badMemory.has(key)?clone(badMemory.get(key)):clone(fallback)},write(key,value){badMemory.set(key,clone(value));return value}},badLesson=createLessonEngine({storage:badStorage}),badProgress=createProgressService({storage:badStorage,store:{setState(value){return typeof value==='function'?value({}):value}},timeZone:'UTC'}),badAdaptive=createAdaptiveLearningService({storage:badStorage,lesson:badLesson,progress:badProgress,random:()=>1});let randomError='';try{badAdaptive.start()}catch(error){randomError=error.message}assert(/random source/i.test(randomError)&&!badAdaptive.getProfile().active,'Invalid Adaptive random source must fail before creating an attempt.');

console.log('BibleQuest v3 Adaptive Learning edge regression passed.');
