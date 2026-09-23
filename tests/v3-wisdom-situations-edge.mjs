import { createLessonEngine } from '../src/engines/lesson.js';
import { createProgressService } from '../src/core/progress.js';
import { createWisdomSituationsService } from '../src/app/wisdom-situations.js';
import { WISDOM_SITUATIONS, getWisdomSituation, localizeWisdomSituation } from '../src/features/wisdom-situations/content.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>structuredClone(value);
const memoryStorage=()=>{
  const memory=new Map();
  return {
    read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},
    write(key,value){memory.set(key,clone(value));return value}
  };
};
const createHarness=({locale='en',random=()=>0,start='2026-09-21T08:00:00Z'}={})=>{
  const storage=memoryStorage();
  let tick=0,storeState={};
  const store={setState(patch){storeState=typeof patch==='function'?patch(storeState):{...storeState,...patch};return storeState}};
  const lesson=createLessonEngine({storage,clock:()=>new Date(new Date(start).getTime()+tick++*1000)});
  const progress=createProgressService({storage,store,clock:()=>new Date(start),timeZone:'Asia/Tokyo'});
  const wisdom=createWisdomSituationsService({lesson,progress,storage,random,getLocale:()=>locale});
  return {storage,lesson,progress,wisdom};
};

assert(WISDOM_SITUATIONS.length===72,'Wisdom Situations must contain exactly 72 authored scenarios after the V5 expansion.');
const packs=WISDOM_SITUATIONS.reduce((out,item)=>(out[item.pack]=(out[item.pack]||0)+1,out),{});
assert(packs.foundation===24&&packs.advanced===24&&packs.expert===24,'Wisdom Situations must retain three 24-scenario packs.');
assert(Math.max(...WISDOM_SITUATIONS.map(item=>item.difficulty))===8,'Wisdom difficulty scale must reach level 8.');
assert(WISDOM_SITUATIONS.filter(item=>item.difficulty>=6).length===48,'All 48 Advanced/Expert scenarios must be level 6 or harder.');
assert(WISDOM_SITUATIONS.filter(item=>item.difficulty===8).length>=12,'The bank must contain a substantial level-8 set.');
assert(Object.isFrozen(WISDOM_SITUATIONS)&&Object.isFrozen(WISDOM_SITUATIONS[0])&&Object.isFrozen(WISDOM_SITUATIONS[0].options),'Wisdom definitions must remain immutable.');

for(const item of WISDOM_SITUATIONS){
  assert(item.options.length===4&&item.rationales.length===4,`${item.id} must contain four plausible options and four counter-rationales.`);
  assert(Number.isSafeInteger(item.best)&&item.best>=0&&item.best<4,`${item.id} must have one canonical strongest option.`);
  assert(item.refs.length>=1&&item.definition.steps.length===1&&item.definition.steps[0].type==='choice',`${item.id} must retain Scripture references and one Lesson choice step.`);
  for(const locale of ['tl','ceb']){
    const localized=localizeWisdomSituation(item,locale);
    assert(localized.title&&localized.tension&&localized.scenario&&localized.why,`${item.id} is missing ${locale} scenario text.`);
    assert(localized.options.length===4&&localized.options.every(Boolean),`${item.id} is missing ${locale} answer choices.`);
    assert(localized.rationales.length===4&&localized.rationales.every(Boolean),`${item.id} is missing ${locale} counter-rationales.`);
  }
}
assert(getWisdomSituation('hw72').title==='Correcting misinformation in the family group chat','Expert Wisdom content lookup is incomplete.');

const primary=createHarness();
const opened=primary.wisdom.open('hw01',{restart:true});
assert(!opened.answered&&opened.situation.title==='Confidentiality or protection?','Wisdom hw01 did not open.');
assert(opened.situation.best===undefined&&opened.situation.rationales===undefined&&opened.situation.refs===undefined,'Answer/rationale/reference reveal must stay hidden before a choice.');
assert(opened.situation.options.length===4,'Wisdom must expose four plausible display choices.');

const before=primary.progress.getState();
const first=primary.wisdom.answer(0);
assert(first.completed&&first.answered,'Wisdom choice must complete the one-step case.');
assert(first.situation.rationales.length===4&&first.situation.refs.includes('Proverbs 11:13'),'Completion must reveal four rationales and Scripture references.');
assert((first.feedback.correct===true)===(first.selected===first.situation.best),'Shuffled display choice must map back to the canonical strongest judgment correctly.');
assert(first.progress?.applied&&first.progress.awardedXp===8,'First completion of a scenario must award exactly +8 XP.');
assert(primary.progress.getState().xp-before.xp===8,'First Wisdom completion must add +8 XP.');

const bestPositions=new Set([first.situation.best]);
for(let attempt=0;attempt<10;attempt++){
  const replay=primary.wisdom.restart();
  assert(!replay.answered,'Restart must create a fresh attempt.');
  const result=primary.wisdom.answer(0);
  bestPositions.add(result.situation.best);
  assert(result.progress?.duplicate===true||result.progress?.awardedXp===0,'Replaying the same scenario must not award repeat XP.');
}
assert(bestPositions.size>=3,'Strongest answer display position must vary across attempts instead of teaching a fixed letter pattern.');
assert(primary.progress.getState().xp===before.xp+8,'Replay farming must not increase Wisdom XP beyond the first scenario completion.');

const sequence=createHarness({random:()=>0,start:'2026-09-21T09:00:00Z'});
const ids=[sequence.wisdom.startRandom().situation.id];
for(let index=1;index<72;index++)ids.push(sequence.wisdom.another().situation.id);
assert(new Set(ids).size===72,'A Wisdom cycle must exhaust all 72 scenarios before any repeat.');
const last=ids.at(-1);
const rollover=sequence.wisdom.another();
assert(rollover.cycle.number===1,'Wisdom pool exhaustion must increment the cycle number.');
assert(rollover.situation.id!==last,'A new Wisdom cycle must not immediately repeat the previous scenario when alternatives exist.');

const resumeStorage=memoryStorage();
let resumeTick=0,resumeStore={};
const resumeLesson=createLessonEngine({storage:resumeStorage,clock:()=>new Date(Date.UTC(2026,8,21,10,0,resumeTick++))});
const resumeProgress=createProgressService({storage:resumeStorage,store:{setState(patch){resumeStore=typeof patch==='function'?patch(resumeStore):{...resumeStore,...patch};return resumeStore}},clock:()=>new Date('2026-09-21T10:00:00Z'),timeZone:'Asia/Tokyo'});
const firstRuntime=createWisdomSituationsService({lesson:resumeLesson,progress:resumeProgress,storage:resumeStorage,random:()=>0,getLocale:()=> 'tl'});
const started=firstRuntime.startRandom();
const startedId=started.situation.id;
firstRuntime.close();
const secondRuntime=createWisdomSituationsService({lesson:resumeLesson,progress:resumeProgress,storage:resumeStorage,random:()=>0.9,getLocale:()=> 'tl'});
const resumed=secondRuntime.startRandom();
assert(resumed.situation.id===startedId&&resumed.resumed===true,'Leaving and reopening Wisdom must resume the current case rather than reroll it.');
assert(resumed.situation.title===localizeWisdomSituation(getWisdomSituation(startedId),'tl').title,'Selected Tagalog locale must localize the resumed scenario.');

const ceb=createHarness({locale:'ceb',start:'2026-09-21T11:00:00Z'});
const cebOpened=ceb.wisdom.open('hw72',{restart:true});
assert(cebOpened.situation.title===localizeWisdomSituation(getWisdomSituation('hw72'),'ceb').title,'Cebuano locale must localize Expert scenarios.');
assert(cebOpened.situation.options.join(' ')!==getWisdomSituation('hw72').options.join(' '),'Cebuano choices must not silently fall back to the English answer bank.');

const invalid=createHarness({random:()=>1});
let randomError='';try{invalid.wisdom.startRandom()}catch(error){randomError=error.message}
assert(/random source/.test(randomError),'Out-of-range Wisdom random sources must fail explicitly.');

console.log('BibleQuest v5 Wisdom Situations 72-item multilingual level-8 edge regression passed.');
