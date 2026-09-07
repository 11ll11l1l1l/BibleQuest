import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createStoryJourneyService } from '../src/app/story-journey.js';
import { STORY_JOURNEYS, getStoryJourney } from '../src/features/story-journey/content.js';

const sourceRoot=path.resolve('src'),jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}};walk(sourceRoot);
const owners=jsFiles.filter(file=>fs.readFileSync(file,'utf8').includes('export function createStoryJourneyService'));
assert.equal(owners.length,1);assert.ok(owners[0].replaceAll('\\','/').endsWith('/src/app/story-journey.js'));
const serviceSource=fs.readFileSync(path.resolve('src/app/story-journey.js'),'utf8'),uiSource=fs.readFileSync(path.resolve('src/features/story-journey/index.js'),'utf8'),contentSource=fs.readFileSync(path.resolve('src/features/story-journey/content.js'),'utf8');
assert.equal(/\b(document|window|localStorage|sessionStorage|createClient|fetch\s*\()/.test(serviceSource),false,'Story Journey owner must not own DOM/storage/backend access.');
for(const contract of['lesson.open','lesson.respond','lesson.advance','lesson.restart','lesson.close','progress.record','reader.setBook'])assert.ok(serviceSource.includes(contract),`Story Journey owner missing ${contract}.`);
assert.equal(/lesson\.|progress\.|localStorage|sessionStorage|createClient|storage\.|fetch\s*\(/.test(uiSource),false,'Story Journey UI bypasses an owner boundary.');
assert.equal(/progress\.|localStorage|sessionStorage|createClient|document\.|window\.|fetch\s*\(/.test(contentSource),false,'Story Journey content must remain static definition data.');

assert.equal(STORY_JOURNEYS.length,10);assert.deepEqual(STORY_JOURNEYS.map(item=>item.id),Array.from({length:10},(_,index)=>`s${index+1}`));
for(const story of STORY_JOURNEYS){
  assert.equal(story.scenes.length,5);assert.equal(story.definition.steps.length,6);assert.deepEqual(story.definition.steps.slice(0,5).map(step=>step.type),Array(5).fill('content'));assert.equal(story.definition.steps[5].type,'choice');assert.equal(story.definition.steps[5].id,'checkpoint');assert.equal(story.checkpoint.choices.length,4);assert.ok(Number.isSafeInteger(story.checkpoint.answer));
}
assert.equal(getStoryJourney('s1').title,'David & Goliath');assert.equal(getStoryJourney('s10').checkpoint.answer,0);assert.throws(()=>getStoryJourney('../bad'),/Unknown Story Journey/);

const clone=value=>structuredClone(value),memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
let tick=Date.parse('2026-09-07T04:30:00Z');const clock=()=>new Date(tick+=1000);
const lesson=createLessonEngine({storage,clock});
const events=new Map();let xpTotal=0;
const progress={record(input){const existing=events.get(input.id);if(existing){assert.deepEqual(input,existing);return Object.freeze({applied:false,duplicate:true,awardedXp:0})}events.set(input.id,clone(input));xpTotal+=input.xp;return Object.freeze({applied:true,duplicate:false,awardedXp:input.xp})}};
const readerCalls=[];const reader={setBook(code,chapter){readerCalls.push([code,chapter]);return {book:code,chapter}}};
const story=createStoryJourneyService({lesson,progress,reader,random:()=>0.95});

const library=story.library();assert.equal(library.length,10);assert.ok(Object.isFrozen(library)&&Object.isFrozen(library[0]));assert.equal('definition' in library[0],false);assert.equal('answer' in library[0].checkpoint,false,'Story Journey library leaked the checkpoint answer.');
let state=story.open('s1');assert.equal(state.resumed,false);assert.equal(state.state.currentStep.id,'scene-1');assert.equal(state.percent,0);assert.throws(()=>story.answer(1),/does not accept a response/i);
for(let expected=2;expected<=5;expected++){state=story.advance();assert.equal(state.state.currentStep.id,`scene-${expected}`)}
state=story.advance();assert.equal(state.state.currentStep.id,'checkpoint');assert.equal(state.state.currentStep.type,'choice');assert.equal(state.state.currentStep.reference,'1 Samuel 17:34–47');
const complete=story.answer(1);assert.equal(complete.completed,true);assert.equal(complete.state.status,'complete');assert.equal(complete.feedback.correct,true);assert.equal(complete.progress.applied,true);assert.equal(complete.progress.awardedXp,15);assert.equal(xpTotal,15);assert.equal(events.size,1);const correctEvent=[...events.values()][0];assert.equal(correctEvent.type,'story-journey-checkpoint');assert.equal(correctEvent.xp,15);assert.equal(correctEvent.metrics.quizCorrect,1);
story.close();assert.throws(()=>story.getState(),/Open a Story Journey/);
state=story.open('s1');assert.equal(state.resumed,true);assert.equal(state.state.status,'complete');assert.equal(state.progress.duplicate,true);assert.equal(xpTotal,15);assert.equal(events.size,1,'Reopening a completed story duplicated its reward.');
const scripture=story.prepareReader();assert.deepEqual(readerCalls.at(-1),['1SA',17]);assert.equal(scripture.label,'1 Samuel 17:34–47');
state=story.restart();assert.equal(state.state.status,'active');assert.equal(state.state.currentStep.id,'scene-1');for(let index=0;index<5;index++)state=story.advance();const wrong=story.answer(0);assert.equal(wrong.feedback.correct,false);assert.equal(wrong.progress.awardedXp,4);assert.equal(xpTotal,19);assert.equal(events.size,2,'A restarted Story Journey should be a new rewardable attempt.');assert.equal([...events.values()].at(-1).metrics.quizCorrect,0);
const randomStory=story.another();assert.equal(randomStory.story.id,'s10');assert.equal(randomStory.state.currentStep.id,'scene-1');assert.equal(randomStory.resumed,false);
story.close();

const badRandom=createStoryJourneyService({lesson,progress,reader,random:()=>1});assert.throws(()=>badRandom.startRandom(),/random source/);
console.log('BibleQuest v3 Story Journey edge regression passed.');
