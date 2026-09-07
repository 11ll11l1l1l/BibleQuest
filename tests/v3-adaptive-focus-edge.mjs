import assert from 'node:assert/strict';
import { createAdaptiveLearningService, adaptiveCategory } from '../src/app/adaptive-learning.js';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createProgressService } from '../src/core/progress.js';

const memory=new Map();const clone=value=>structuredClone(value);const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};const store={setState(value){return typeof value==='function'?value({}):value}};const clock=()=>new Date('2026-09-07T03:00:00Z');const progress=createProgressService({storage,store,clock,timeZone:'Asia/Tokyo'}),lesson=createLessonEngine({storage,clock}),adaptive=createAdaptiveLearningService({storage,lesson,progress,clock,random:()=>0});
assert.equal(adaptive.reviewFocusCategory(),'Letters','With all mastery tied on 2026-09-07, Open Review focus should use deterministic daily tie rotation instead of inventing evidence.');
let round=adaptive.start();assert.equal(adaptiveCategory(round.question.book),'Genesis','Deterministic zero-random Adaptive ranking should begin with the retained Genesis connection question in this fixture.');round=adaptive.answer(round.question.answer);adaptive.next();assert.equal(adaptive.getProfile().mastery.Genesis,5,'Correct Adaptive Genesis retrieval should update Genesis mastery before weak-area focus is recalculated.');assert.equal(adaptive.reviewFocusCategory(),'Gospels','After Genesis leaves the minimum-mastery tie, the same daily tie rotation should select Gospels from the seven remaining minimum categories.');
console.log('BibleQuest v3 Adaptive review-focus edge regression passed.');
