import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createGuidedStudyService } from '../src/app/study.js';
import { GUIDED_STUDIES, getGuidedStudy } from '../src/features/study/content.js';

const sourceRoot=path.resolve('src'),jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}};walk(sourceRoot);
const owners=jsFiles.filter(file=>fs.readFileSync(file,'utf8').includes('export function createGuidedStudyService'));
assert.equal(owners.length,1);assert.ok(owners[0].replaceAll('\\','/').endsWith('/src/app/study.js'));
const serviceSource=fs.readFileSync(path.resolve('src/app/study.js'),'utf8'),uiSource=fs.readFileSync(path.resolve('src/features/study/index.js'),'utf8'),contentSource=fs.readFileSync(path.resolve('src/features/study/content.js'),'utf8');
assert.equal(/\b(document|window|localStorage|sessionStorage|createClient|fetch\s*\()/.test(serviceSource),false,'Guided Study owner must not own DOM/storage implementation/backend/fetch.');
for(const contract of['lesson.open','lesson.respond','lesson.advance','lesson.restart','lesson.close','progress.record','reader.setBook'])assert.ok(serviceSource.includes(contract),`Guided Study owner missing ${contract}.`);
assert.equal(/progress\.record|localStorage|sessionStorage|createClient|storage\.|fetch\s*\(/.test(uiSource),false,'Guided Study UI bypasses an owner boundary.');
assert.equal(/progress\.record|localStorage|sessionStorage|createClient|document\.|window\.|fetch\s*\(/.test(contentSource),false,'Guided Study content must remain static definition data.');

assert.equal(GUIDED_STUDIES.length,3);assert.deepEqual(GUIDED_STUDIES.map(item=>item.id),['good-samaritan','abide-and-bear-fruit','faith-that-acts']);
assert.equal(new Set(GUIDED_STUDIES.map(item=>item.definition.id)).size,3);
for(const item of GUIDED_STUDIES){assert.equal(item.definition.steps.length,7);assert.equal(item.definition.steps.filter(step=>step.type==='choice').length,1);assert.equal(item.definition.steps.filter(step=>step.type==='text').length,2);assert.equal(item.definition.steps.at(-1).type,'confirm');assert.ok(item.passage.code&&item.passage.chapter&&item.passage.label)}
assert.throws(()=>getGuidedStudy('../bad'),/Unknown Guided Study/);

const clone=value=>structuredClone(value),memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
const progressEvents=[];const progress={record(event){const existing=progressEvents.find(row=>row.id===event.id);if(existing){assert.deepEqual(existing,event,'Repeated Guided Study progress identity changed semantics.');return Object.freeze({applied:false,duplicate:true})}progressEvents.push(clone(event));return Object.freeze({applied:true,duplicate:false})}};
const readerCalls=[];const reader={setBook(code,chapter){readerCalls.push([code,chapter]);return {book:code,chapter}}};
let now=new Date('2026-09-07T01:00:00Z');
const lesson=createLessonEngine({storage,clock:()=>new Date(now)}),study=createGuidedStudyService({lesson,progress,reader});

const library=study.library();assert.equal(library.length,3);assert.ok(Object.isFrozen(library)&&Object.isFrozen(library[0])&&Object.isFrozen(library[0].passage));assert.equal('definition' in library[0],false,'Library must not expose private correct-answer definitions.');
let opened=study.open('good-samaritan');assert.equal(opened.resumed,false);assert.equal(opened.state.currentStep.id,'passage');assert.equal(opened.percent,0);assert.equal(opened.study.passage.label,'Luke 10:25–37');assert.equal('answer' in opened.state.currentStep,false,'Lesson engine leaked correct answer through Guided Study.');
let passage=study.prepareReader();assert.deepEqual(readerCalls.at(-1),['LUK',10]);assert.equal(passage.from,25);assert.equal(passage.to,37);

study.advance();assert.equal(study.getState().state.currentStep.id,'context');study.advance();assert.equal(study.getState().state.currentStep.id,'observe');
let response=study.respond(1);assert.equal(response.applied,true);assert.equal(response.feedback.correct,true);assert.equal(response.state.score.correct,1);const duplicate=study.respond(1);assert.equal(duplicate.duplicate,true);assert.equal(progressEvents.length,0,'Objective Guided Study response must not invent unverified XP events.');study.advance();
assert.equal(study.getState().state.currentStep.id,'meaning');study.advance();
assert.equal(study.getState().state.currentStep.id,'reflect');assert.throws(()=>study.respond('   '),/required/i);study.respond('I can overlook people when I am rushing.');study.advance();
assert.equal(study.getState().state.currentStep.id,'respond');study.respond('I will make time to listen and help one person this week.');study.advance();
assert.equal(study.getState().state.currentStep.id,'finish');assert.throws(()=>study.respond(false),/Confirm/i);study.respond(true);now=new Date('2026-09-07T01:08:00Z');let completed=study.advance();
assert.equal(completed.completed,true);assert.equal(completed.state.status,'complete');assert.equal(completed.percent,100);assert.equal(completed.state.score.answered,4);assert.equal(completed.state.score.evaluated,1);assert.equal(completed.state.score.correct,1);
assert.equal(progressEvents.length,1);assert.deepEqual(progressEvents[0],{id:'study:good-samaritan:v1:complete',type:'study.complete',xp:0,meaningful:true,metrics:{reflections:1}});assert.equal(study.completionXp,0);
const repeated=study.advance();assert.equal(repeated.duplicate,true);assert.equal(progressEvents.length,1,'Repeated completion must not duplicate Guided Study progress.');

study.close();assert.throws(()=>study.getState(),/Open a Guided Study/);opened=study.open('good-samaritan');assert.equal(opened.resumed,true);assert.equal(opened.state.status,'complete');assert.equal(progressEvents.length,1,'Reopening completed Guided Study must reconcile idempotently.');
let restarted=study.restart();assert.equal(restarted.state.status,'active');assert.equal(restarted.state.index,0);assert.equal(Object.keys(restarted.state.responses).length,0);
study.open('abide-and-bear-fruit');assert.equal(study.getState().study.id,'abide-and-bear-fruit');assert.equal(study.getState().state.currentStep.id,'passage');study.prepareReader();assert.deepEqual(readerCalls.at(-1),['JHN',15]);
study.close();

const reloadedLesson=createLessonEngine({storage,clock:()=>new Date(now)}),reloadedStudy=createGuidedStudyService({lesson:reloadedLesson,progress,reader});
const resumedAbide=reloadedStudy.open('abide-and-bear-fruit');assert.equal(resumedAbide.resumed,true);assert.equal(resumedAbide.state.index,0,'Study session did not survive service recreation.');
reloadedStudy.open('faith-that-acts',{restart:true});assert.equal(reloadedStudy.getState().study.passage.code,'JAS');reloadedStudy.close();

console.log('BibleQuest v3 Guided Study edge regression passed.');
