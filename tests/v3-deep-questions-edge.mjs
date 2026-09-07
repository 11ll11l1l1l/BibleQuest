import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createDeepQuestionsService } from '../src/app/deep-questions.js';
import { DEEP_QUESTIONS, getDeepQuestion } from '../src/features/deep-questions/content.js';

const sourceRoot=path.resolve('src'),jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}};walk(sourceRoot);
const owners=jsFiles.filter(file=>fs.readFileSync(file,'utf8').includes('export function createDeepQuestionsService'));
assert.equal(owners.length,1);assert.ok(owners[0].replaceAll('\\','/').endsWith('/src/app/deep-questions.js'));
const serviceSource=fs.readFileSync(path.resolve('src/app/deep-questions.js'),'utf8'),uiSource=fs.readFileSync(path.resolve('src/features/deep-questions/index.js'),'utf8'),contentSource=fs.readFileSync(path.resolve('src/features/deep-questions/content.js'),'utf8');
assert.equal(/\b(document|window|localStorage|sessionStorage|createClient|fetch\s*\(|progress\.)/.test(serviceSource),false,'Deep Questions owner must delegate lifecycle/persistence and must not own DOM/storage/backend/progress.');
for(const contract of['lesson.open','lesson.respond','lesson.advance','lesson.restart','lesson.close','reader.setBook'])assert.ok(serviceSource.includes(contract),`Deep Questions owner missing ${contract}.`);
assert.equal(/lesson\.|progress\.|localStorage|sessionStorage|createClient|storage\.|fetch\s*\(/.test(uiSource),false,'Deep Questions UI bypasses an owner boundary.');
assert.equal(/progress\.|localStorage|sessionStorage|createClient|document\.|window\.|fetch\s*\(/.test(contentSource),false,'Deep Questions content must remain static definition data.');

assert.equal(DEEP_QUESTIONS.length,18);assert.deepEqual(DEEP_QUESTIONS.map(item=>item.id),Array.from({length:18},(_,index)=>`p${index+1}`));
assert.equal(new Set(DEEP_QUESTIONS.map(item=>item.definition.id)).size,18);
for(const item of DEEP_QUESTIONS){assert.equal(item.definition.steps.length,3);assert.deepEqual(item.definition.steps.map(step=>step.type),['choice','content','text']);assert.equal('answer' in item.definition.steps[0],false,'Deep Question must not define a scored spiritual answer.');assert.equal(item.references.length,3);assert.equal(item.options.length,4)}
assert.throws(()=>getDeepQuestion('../bad'),/Unknown Deep Question/);

const clone=value=>structuredClone(value),memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
const readerCalls=[];const reader={setBook(code,chapter){readerCalls.push([code,chapter]);return {book:code,chapter}}};
const lesson=createLessonEngine({storage,clock:()=>new Date('2026-09-07T04:00:00Z')});
const deep=createDeepQuestionsService({lesson,reader,clock:()=>new Date(2026,8,7,12,0,0)});

const library=deep.library();assert.equal(library.length,18);assert.ok(Object.isFrozen(library)&&Object.isFrozen(library[0])&&Object.isFrozen(library[0].references));assert.equal('definition' in library[0],false);assert.equal('reflection' in library[0],false,'Library must not reveal the reflection before the member responds.');assert.equal(deep.daily().id,'p8','Rotating Deep Question no longer follows the retained day-of-month rule.');
let opened=deep.open('p1');assert.equal(opened.resumed,false);assert.equal(opened.state.currentStep.id,'response');assert.equal(opened.percent,0);assert.equal('answer' in opened.state.currentStep,false,'Lesson engine leaked a scored answer into Deep Questions.');
let response=deep.respond(0);assert.equal(response.applied,true);assert.equal(response.feedback.correct,null);assert.match(response.feedback.message,/does not score/i);assert.equal(response.state.score.evaluated,0);assert.equal(response.state.score.correct,0);const duplicate=deep.respond(0);assert.equal(duplicate.duplicate,true);assert.throws(()=>deep.respond(1),/already answered/i);
let reflection=deep.advance();assert.equal(reflection.state.currentStep.id,'reflection');assert.match(reflection.state.currentStep.prompt,/forgiveness, repentance/i);assert.match(reflection.state.currentStep.reference,/Matthew 18:21/);let passage=deep.prepareReader(0);assert.deepEqual(readerCalls.at(-1),['MAT',18]);assert.equal(passage.label,'Matthew 18:21–35');assert.throws(()=>deep.prepareReader(9),/available Scripture reference/);
let note=deep.advance();assert.equal(note.state.currentStep.id,'note');assert.throws(()=>deep.respond('   '),/required/i);deep.respond('Forgiveness and restored trust are related, but the passages should be examined separately.');
deep.close();assert.throws(()=>deep.getState(),/Open a Deep Question/);
opened=deep.open('p1');assert.equal(opened.resumed,true);assert.equal(opened.state.currentStep.id,'note');assert.match(opened.state.responses.note,/restored trust/,'Private Deep Questions note did not survive leave/return.');
let completed=deep.advance();assert.equal(completed.completed,true);assert.equal(completed.state.status,'complete');assert.equal(completed.percent,100);assert.equal(completed.state.score.answered,2);assert.equal(completed.state.score.evaluated,0);assert.equal(completed.state.score.correct,0);const repeated=deep.advance();assert.equal(repeated.duplicate,true);
deep.close();opened=deep.open('p1');assert.equal(opened.resumed,true);assert.equal(opened.state.status,'complete');let restarted=deep.restart();assert.equal(restarted.state.status,'active');assert.equal(restarted.state.index,0);assert.equal(Object.keys(restarted.state.responses).length,0);
deep.open('p2',{restart:true});deep.respond(1);deep.advance();deep.prepareReader(0);assert.deepEqual(readerCalls.at(-1),['PRO',21]);deep.close();

console.log('BibleQuest v3 Deep Questions edge regression passed.');
