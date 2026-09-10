import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPsychometricsEngine, emptyPsychometricsState } from '../src/engines/psychometrics.js';
import { createPsychometricsService } from '../src/app/psychometrics.js';
import { NEO_ITEMS, VIA_ITEMS, ROSENBERG_ITEMS, PSYCHOMETRICS_DEFINITIONS, PSYCHOMETRICS_SAFETY } from '../src/features/psychometrics/content.js';

assert.equal(NEO_ITEMS.length,120,'IPIP-NEO migration must retain exactly 120 items.');
assert.equal(PSYCHOMETRICS_DEFINITIONS.neo.facets.length,30,'IPIP-NEO migration must retain exactly 30 facets.');
assert.equal(new Set(PSYCHOMETRICS_DEFINITIONS.neo.facets.map(row=>row[0])).size,30,'IPIP-NEO facet IDs must remain unique.');
for(const domain of['N','E','O','A','C'])assert.equal(PSYCHOMETRICS_DEFINITIONS.neo.facets.filter(row=>row[1]===domain).length,6,`IPIP-NEO domain ${domain} must retain six facets.`);
assert.equal(VIA_ITEMS.length,96,'IPIP-VIA-R migration must retain exactly 96 items.');
assert.equal(PSYCHOMETRICS_DEFINITIONS.via.strengths.length,24,'IPIP-VIA-R migration must retain exactly 24 constructs.');
for(const [code,,items] of PSYCHOMETRICS_DEFINITIONS.via.strengths){assert.equal(items.length,4,`${code} must retain four items.`);assert.equal(items.filter(row=>row[1]===1).length,2,`${code} must retain two positively keyed items.`);assert.equal(items.filter(row=>row[1]===-1).length,2,`${code} must retain two negatively keyed items.`)}
assert.equal(ROSENBERG_ITEMS.length,10,'Rosenberg migration must retain exactly 10 items.');
assert.equal(ROSENBERG_ITEMS.filter(item=>item.key===1).length,5,'Rosenberg scale must retain five positively keyed items.');
assert.equal(ROSENBERG_ITEMS.filter(item=>item.key===-1).length,5,'Rosenberg scale must retain five negatively keyed items.');
assert.match(PSYCHOMETRICS_SAFETY.values,/not a verdict on politics/i);
assert.match(PSYCHOMETRICS_SAFETY.spirituality,/not a measure of salvation/i);
assert.match(PSYCHOMETRICS_SAFETY.depression,/not a diagnosis/i);

let now=new Date('2026-09-10T12:10:00.000Z');
const engine=createPsychometricsEngine({clock:()=>now});
assert.deepEqual(engine.normalize({garbage:true}),engine.normalize(emptyPsychometricsState()),'Unknown persisted schema must fail closed to clean state.');
assert.throws(()=>engine.calculate(emptyPsychometricsState(),'neo'),/120/,'Incomplete NEO must not calculate.');
assert.throws(()=>engine.calculate(emptyPsychometricsState(),'via'),/96/,'Incomplete VIA must not calculate.');
assert.throws(()=>engine.calculate(emptyPsychometricsState(),'rse'),/10/,'Incomplete RSE must not calculate.');
assert.throws(()=>engine.answer(emptyPsychometricsState(),'neo','N1_1',6),/1 to 5/,'Out-of-range NEO response must fail closed.');
assert.throws(()=>engine.answer(emptyPsychometricsState(),'rse','R1',4),/0 to 3/,'Out-of-range RSE response must fail closed.');

let neo=emptyPsychometricsState();
now=new Date('2026-09-10T12:00:00.000Z');neo=engine.begin(neo,'neo');
for(const item of NEO_ITEMS)neo=engine.answer(neo,'neo',item.id,1);
now=new Date('2026-09-10T12:02:00.000Z');neo=engine.calculate(neo,'neo');
assert.equal(Object.keys(neo.neo.result.facets).length,30);
assert.equal(Object.keys(neo.neo.result.domains).length,5);
assert.equal(neo.neo.result.facets.N1.mean,1,'Positive-key NEO facet scoring changed.');
assert.equal(neo.neo.result.facets.C6.mean,5,'All-reverse NEO facet scoring changed.');
assert.equal(neo.neo.result.facets.O6.mean,3,'Balanced historical Values/Openness reverse scoring changed.');
assert.equal(neo.neo.result.domains.N.mean,2.167,'NEO broad-domain aggregation changed.');
assert.equal(neo.neo.result.domains.C.mean,3.167,'NEO Conscientiousness aggregation changed.');
assert(neo.neo.result.quality.flags.some(flag=>flag.code==='straight-line'),'NEO straight-line quality flag missing.');
assert(neo.neo.result.quality.flags.some(flag=>flag.code==='low-variation'),'NEO low-variation quality flag missing.');
assert(neo.neo.result.quality.flags.some(flag=>flag.code==='fast'),'NEO speed quality flag missing.');

let via=emptyPsychometricsState();
now=new Date('2026-09-10T13:00:00.000Z');via=engine.begin(via,'via');
for(const item of VIA_ITEMS)via=engine.answer(via,'via',item.id,1);
now=new Date('2026-09-10T13:07:00.000Z');via=engine.calculate(via,'via');
assert.equal(Object.keys(via.via.result.scores).length,24);
for(const score of Object.values(via.via.result.scores))assert.equal(score.mean,3,'Balanced VIA reverse-key mean changed for all-1 responses.');
assert(via.via.result.quality.flags.some(flag=>flag.code==='straight-line'),'VIA straight-line quality flag missing.');
assert(!via.via.result.quality.flags.some(flag=>flag.code==='fast'),'VIA should not flag a seven-minute completion as <5 minute speed.');
assert.equal(via.via.result.scores.SPI.name,'Spirituality / Religiousness');

let rse=emptyPsychometricsState();
for(const item of ROSENBERG_ITEMS)rse=engine.answer(rse,'rse',item.id,item.key===1?0:3);
rse=engine.calculate(rse,'rse');
assert.equal(rse.rse.result.score,30,'Rosenberg positive/reverse scoring must retain exact 0–30 maximum.');
let rseZero=emptyPsychometricsState();for(const item of ROSENBERG_ITEMS)rseZero=engine.answer(rseZero,'rse',item.id,item.key===1?3:0);rseZero=engine.calculate(rseZero,'rse');assert.equal(rseZero.rse.result.score,0,'Rosenberg minimum scoring changed.');

const memory=new Map();
const storage={read:(key,fallback=null)=>memory.has(key)?structuredClone(memory.get(key)):fallback,write:(key,value)=>{memory.set(key,structuredClone(value));return value},remove:key=>memory.delete(key)};
let sessionState={authenticated:false,user:null};
const session={getState:()=>sessionState};
const service=createPsychometricsService({engine,storage,session});
assert.equal(service.owner(),'guest');
service.answer('rse','R1',0);assert.equal(service.progress('rse').answered,1);
const guestSaved=service.open();
sessionState={authenticated:true,user:{id:'account-a'}};assert.equal(service.progress('rse').answered,0,'Account A must not inherit guest psychometrics state.');
service.answer('rse','R1',3);service.answer('rse','R2',3);
const reopenedA=createPsychometricsService({engine,storage,session});assert.equal(reopenedA.progress('rse').answered,2,'Same owner must reopen saved in-progress state.');
sessionState={authenticated:true,user:{id:'account-b'}};assert.equal(service.progress('rse').answered,0,'Account B must not see account A state.');
sessionState={authenticated:false,user:null};assert.equal(service.open().rse.answers.R1,guestSaved.rse.answers.R1,'Guest state must reopen after account switching.');

memory.set('psychometrics:guest',{version:1,neo:{answers:{N1_1:99},result:{date:'bad'}},via:'bad',rse:{answers:{R1:9},result:{score:999}}});
const malformed=service.open();assert.equal(Object.keys(malformed.neo.answers).length,0,'Malformed NEO persisted answers must fail closed.');assert.equal(Object.keys(malformed.rse.answers).length,0,'Malformed RSE persisted answers must fail closed.');assert.equal(malformed.rse.result,null,'Malformed derived result must never be trusted.');

const storageSource=fs.readFileSync(new URL('../src/core/storage.js',import.meta.url),'utf8');
assert(storageSource.includes("!name.startsWith(PRIVATE_PREFIX)"),'Private psychometrics state must remain excluded from portable backup/export.');
const serviceSource=fs.readFileSync(new URL('../src/app/psychometrics.js',import.meta.url),'utf8');
assert(!/localStorage|sessionStorage|createClient|progress\.record/.test(serviceSource),'Psychometrics service must not bypass private-storage/session or award progress directly.');
const engineSource=fs.readFileSync(new URL('../src/engines/psychometrics.js',import.meta.url),'utf8');
assert(!/localStorage|sessionStorage|document\.|window\.|createClient|progress\.record/.test(engineSource),'Psychometrics engine must remain pure from DOM/storage/backend/progress owners.');

console.log('BibleQuest v3 Psychometrics scoring/privacy edge regression passed.');
