import assert from 'node:assert/strict';
import { createAdaptiveLearningService } from '../src/app/adaptive-learning.js';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createProgressService } from '../src/core/progress.js';

const memory=new Map();const clone=value=>structuredClone(value);const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};const store={setState(value){return typeof value==='function'?value({}):value}};const clock=()=>new Date('2026-09-07T03:00:00Z');const progress=createProgressService({storage,store,clock,timeZone:'Asia/Tokyo'}),lesson=createLessonEngine({storage,clock}),adaptive=createAdaptiveLearningService({storage,lesson,progress,clock,random:()=>0});
assert.equal(adaptive.reviewFocusCategory(),'Letters','With all mastery tied on 2026-09-07, Open Review focus should use deterministic daily tie rotation instead of inventing evidence.');
let round=adaptive.start();round=adaptive.answer(round.question.answer);adaptive.next();assert.equal(adaptive.reviewFocusCategory(),'Exodus','After Genesis gains mastery, review focus must move to the least-mastered tied categories.');
console.log('BibleQuest v3 Adaptive review-focus edge regression passed.');
