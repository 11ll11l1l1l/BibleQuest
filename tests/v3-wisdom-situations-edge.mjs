import { createLessonEngine } from '../src/engines/lesson.js';
import { createProgressService } from '../src/core/progress.js';
import { createWisdomSituationsService } from '../src/app/wisdom-situations.js';
import { WISDOM_SITUATIONS, getWisdomSituation } from '../src/features/wisdom-situations/content.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>structuredClone(value);
const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
let storeState={};
const store={setState(patch){storeState=typeof patch==='function'?patch(storeState):{...storeState,...patch};return storeState}};
let lessonTick=0;
const lesson=createLessonEngine({storage,clock:()=>new Date(Date.UTC(2026,8,7,5,0,lessonTick++))});
const progress=createProgressService({storage,store,clock:()=>new Date('2026-09-07T05:00:00Z'),timeZone:'Asia/Tokyo'});
const randomValues=[0,0.5,0];
const wisdom=createWisdomSituationsService({lesson,progress,random:()=>randomValues.shift()??0});

assert(wisdom.count()===24 && WISDOM_SITUATIONS.length===24,'Wisdom Situations must retain all 24 recovered v2 scenarios.');
assert(Object.isFrozen(WISDOM_SITUATIONS)&&Object.isFrozen(WISDOM_SITUATIONS[0])&&Object.isFrozen(WISDOM_SITUATIONS[0].options)&&Object.isFrozen(WISDOM_SITUATIONS[0].rationales),'Wisdom static definitions must be immutable.');
for(const item of WISDOM_SITUATIONS){
  assert(item.options.length===4&&item.rationales.length===4,'Every Wisdom Situation must retain four options and four rationales.');
  assert(Number.isSafeInteger(item.best)&&item.best>=0&&item.best<4,'Every Wisdom Situation must have one valid strongest option.');
  assert(item.refs.length>=1&&item.definition.steps.length===1&&item.definition.steps[0].type==='choice','Every Wisdom Situation must retain Scripture references and one Lesson choice step.');
}
assert(getWisdomSituation('hw24').title==='A good cause with bad methods','Recovered Wisdom content lookup is incomplete.');
let missing='';try{getWisdomSituation('missing')}catch(error){missing=error.message}assert(/Unknown Wisdom Situation/.test(missing),'Unknown Wisdom content ids must fail explicitly.');

const opened=wisdom.open('hw01');
assert(!opened.resumed&&!opened.answered&&opened.situation.title==='Confidentiality or protection?','Wisdom Situation did not open a fresh Lesson-backed attempt.');
assert(opened.situation.best===undefined&&opened.situation.rationales===undefined&&opened.situation.refs===undefined,'Wisdom answer/rationale/reference reveal must stay hidden before the choice.');
const before=progress.getState();
const correct=wisdom.answer(2);
assert(correct.completed&&correct.answered&&correct.feedback.correct===true,'Strongest Wisdom choice must lock and complete the Lesson attempt.');
assert(correct.situation.best===2&&correct.situation.rationales.length===4&&correct.situation.refs.includes('Proverbs 11:13'),'Wisdom completion must reveal strongest option, all rationales, and Scripture references.');
assert(correct.progress?.applied&&correct.progress.awardedXp===8,'Wisdom completion must award the recovered +8 XP exactly once.');
assert(progress.getState().xp-before.xp===8&&progress.getState().counters.situations-before.counters.situations===1,'Wisdom completion must add +8 XP and +1 situations through Progress.');
assert(progress.getState().counters.quizCorrect===before.counters.quizCorrect,'Wisdom must not convert its strongest-option exercise into Bible quiz correctness progress.');

const reopened=wisdom.open('hw01');
assert(reopened.resumed&&reopened.state.status==='complete'&&reopened.progress?.duplicate,'Reopening a completed Wisdom attempt must resume and reconcile as duplicate.');
const afterReopen=progress.getState();
assert(afterReopen.xp===before.xp+8&&afterReopen.counters.situations===before.counters.situations+1,'Reopening a completed Wisdom attempt duplicated progress.');

const replay=wisdom.restart();
assert(!replay.resumed&&!replay.answered&&replay.state.status==='active','Wisdom replay must create a fresh Lesson attempt.');
const weaker=wisdom.answer(0);
assert(weaker.feedback.correct===false&&weaker.completed,'A plausible-but-weaker choice must still complete the Wisdom attempt.');
assert(weaker.progress?.applied&&weaker.progress.awardedXp===8,'Recovered Wisdom +8 XP must not depend on choosing the strongest option.');
assert(progress.getState().xp===before.xp+16&&progress.getState().counters.situations===before.counters.situations+2,'A new Wisdom attempt must be eligible for one new recovered reward.');

const next=wisdom.another();
assert(next.situation.id!=='hw01','Another Wisdom Situation must not immediately repeat the previous scenario when alternatives exist.');
assert(next.state.status==='active'&&!next.answered,'Another Wisdom Situation must start a fresh Lesson-backed attempt.');
wisdom.close();
let closed='';try{wisdom.getState()}catch(error){closed=error.message}assert(/Open a Wisdom Situation/.test(closed),'Wisdom owner must enforce its public boundary after close.');

const invalid=createWisdomSituationsService({lesson:createLessonEngine({storage:{read(_key,fallback){return clone(fallback)},write(_key,value){return value}}}),progress,random:()=>1});
let randomError='';try{invalid.startRandom()}catch(error){randomError=error.message}assert(/random source/.test(randomError),'Out-of-range Wisdom random sources must fail explicitly.');
console.log('BibleQuest v3 Wisdom Situations edge regression passed.');
