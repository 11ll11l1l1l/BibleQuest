import assert from 'node:assert/strict';
import { DOCTRINAL_SAFETY, assertBinaryScorable, assertNeutralAssessment, classifyDoctrinalContent, reviewAuthoredBinary, reviewImportedRecall, reviewNeutralContent } from '../src/core/doctrinal-safety.js';
import { GAME_QUESTIONS } from '../src/features/games/content.js';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createGuidedStudyService } from '../src/app/study.js';
import { createStoryJourneyService } from '../src/app/story-journey.js';
import { createDeepQuestionsService } from '../src/app/deep-questions.js';
import { createWisdomSituationsService } from '../src/app/wisdom-situations.js';
import { createDailyMissionService } from '../src/app/daily-mission.js';

const cases=[
  [{q:'Who built the ark?',a:'Noah',r:'Genesis 6'},'allow'],
  [{q:'Who is justified before God?',a:'The doers of the law are justified before God.',r:'Romans 2:13'},'quarantine'],
  [{q:'In Romans 2:13, whom does Paul say are justified in the statement made in that verse?',a:'The doers of the law are justified before God.',r:'Romans 2:13'},'context'],
  [{q:'What did Peter tell the multitude to do?',a:'Repent and be baptized.',r:'Acts 2:38'},'context'],
  [{q:'After many days, what hope was abandoned by the crew?',a:'They abandoned hope that they should be saved.',r:'Acts 27:20'},'allow'],
  [{q:'Can a Christian lose salvation?',a:'This is a disputed doctrinal question.',r:'Hebrews 6:4-6'},'quarantine'],
  [{q:'Must Christians tithe?',a:'This requires broader biblical and pastoral context.',r:'Malachi 3:10'},'quarantine']
];
for(const [item,expected] of cases)assert.equal(classifyDoctrinalContent(item).action,expected,`${item.q} should classify ${expected}.`);
assert.equal(DOCTRINAL_SAFETY.version,3);
assert.equal(Object.isFrozen(DOCTRINAL_SAFETY),true);
assert.match(DOCTRINAL_SAFETY.authority,/Scripture first/i);

assert.throws(()=>reviewAuthoredBinary({q:'How is a person saved?',a:'By grace through faith.',ref:'Ephesians 2:8'},{label:'unsafe authored fixture'}),/cannot enter binary scoring/i);
const contextual=reviewAuthoredBinary({q:'What did Peter tell the multitude to do?',a:'Repent and be baptized.',ref:'Acts 2:38'},{label:'context fixture'});
assert.equal(contextual.action,'context');
assert.equal(contextual.classification,'PASSAGE_CONTEXT');
assert.match(contextual.contextNote,/passage|baptism|context/i);
assert.doesNotThrow(()=>assertBinaryScorable({q:'Passage question',ref:'Acts 2:38',safety:contextual},'context fixture'));
const neutral=reviewNeutralContent({q:'Can forgiveness exist without restored trust?',ref:'Matthew 18:21–35'});
assert.equal(neutral.action,'neutral');
assert.equal(neutral.classification,'INTERPRETIVE_OR_DOCTRINAL');
assert.doesNotThrow(()=>assertNeutralAssessment({safety:neutral},'neutral fixture'));
assert.throws(()=>assertBinaryScorable({q:'Interpretive',ref:'Matthew 18',safety:neutral}),/has not passed doctrinal-safety review/i);

const staleAllow=reviewImportedRecall({q:'How is a person saved?',a:'By grace through faith.',r:'2:8',bookName:'Ephesians',safety:{action:'allow',topics:[]}});
assert.equal(staleAllow.action,'quarantine','A stale imported allow tag must not override a high-risk runtime classification.');
const missingTag=reviewImportedRecall({q:'Who built the ark?',a:'Noah',r:'Genesis 6'});
assert.equal(missingTag.action,'quarantine','Imported content without a recognized safety action must fail closed.');
const importedContext=reviewImportedRecall({q:'Who was baptized in the passage?',a:'The named believer.',r:'2:38',bookName:'Acts',safety:{action:'allow',topics:[]}});
assert.equal(importedContext.action,'context','Runtime reclassification must upgrade sensitive imported content from allow to context.');

assert.equal(GAME_QUESTIONS.length,24);
for(const question of GAME_QUESTIONS)assert.doesNotThrow(()=>assertBinaryScorable(question,`Game question ${question.id}`));
assert.equal(GAME_QUESTIONS.find(row=>row.id==='q1').safety.action,'allow');
assert.equal(GAME_QUESTIONS.find(row=>row.id==='q10').safety.action,'context','Baptism narrative recall should keep passage context.');
assert.equal(GAME_QUESTIONS.find(row=>row.id==='q17').safety.action,'context','Holy Spirit narrative recall should keep passage context.');
assert.equal(GAME_QUESTIONS.find(row=>row.id==='q21').safety.action,'context','Connection questions should be passage-context classified.');

const memoryStorage=()=>{const bucket=new Map();return{read(key,fallback){return bucket.has(key)?structuredClone(bucket.get(key)):structuredClone(fallback)},write(key,value){bucket.set(key,structuredClone(value));return value}}};
const reader={setBook(){return null}};
const progressEvents=[];
const progress={record(event){progressEvents.push(structuredClone(event));return Object.freeze({...event,date:'2026-09-08',awardedXp:event.xp})},getDateKey(){return'2026-09-08'},getState(){return{events:{}}}};

{
  const lesson=createLessonEngine({storage:memoryStorage(),clock:()=>new Date('2026-09-08T00:00:00Z')});
  const study=createGuidedStudyService({lesson,progress,reader});
  let view=study.open('faith-that-acts',{restart:true});
  view=study.advance();
  view=study.advance();
  assert.equal(view.state.currentStep.id,'observe');
  assert.equal(view.safety.action,'context','James 2 scored observation must carry passage context.');
  assert.doesNotThrow(()=>assertBinaryScorable({q:view.state.currentStep.prompt,ref:view.state.currentStep.reference,safety:view.safety},'Guided Study observation'));
  study.close();
}

{
  const lesson=createLessonEngine({storage:memoryStorage(),clock:()=>new Date('2026-09-08T00:00:00Z')});
  const story=createStoryJourneyService({lesson,progress,reader,random:()=>0});
  const view=story.open('s8',{restart:true});
  assert.equal(view.story.checkpoint.safety.action,'context','Story Journey checkpoint must be reviewed as passage-context scoring.');
  story.close();
}

{
  const lesson=createLessonEngine({storage:memoryStorage(),clock:()=>new Date('2026-09-08T00:00:00Z')});
  const deep=createDeepQuestionsService({lesson,reader,clock:()=>new Date('2026-09-08T00:00:00Z')});
  const view=deep.open('p1',{restart:true});
  assert.equal(view.question.safety.action,'neutral');
  assert.equal(view.question.safety.classification,'INTERPRETIVE_OR_DOCTRINAL');
  deep.close();
}

{
  const lesson=createLessonEngine({storage:memoryStorage(),clock:()=>new Date('2026-09-08T00:00:00Z')});
  const before=progressEvents.length;
  const wisdom=createWisdomSituationsService({lesson,progress,random:()=>0});
  const opened=wisdom.open('hw04',{restart:true});
  assert.equal(opened.situation.safety.action,'neutral');
  wisdom.answer(0);
  const event=progressEvents.slice(before).find(row=>row.type==='wisdom-situation.complete');
  assert.ok(event,'Wisdom completion event missing.');
  assert.deepEqual(event.metrics,{situations:1},'Neutral Wisdom assessment must not become quizCorrect evidence.');
  wisdom.close();
}

{
  const lesson=createLessonEngine({storage:memoryStorage(),clock:()=>new Date('2026-09-08T00:00:00Z')});
  const daily=createDailyMissionService({lesson,progress,reader,clock:()=>new Date('2026-09-08T12:00:00Z')});
  const view=daily.open();
  assert.ok(['allow','context'].includes(view.safety.action));
  assert.doesNotThrow(()=>assertBinaryScorable({q:view.state.currentStep.prompt,ref:view.state.currentStep.reference,safety:view.safety},'Daily Journey retrieve'));
  daily.close();
}

console.log('BibleQuest v3 doctrinal-safety edge regression passed.');
