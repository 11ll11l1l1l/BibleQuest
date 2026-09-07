import assert from 'node:assert/strict';
import { createRecallPackService } from '../src/core/recall-packs.js';
import { createOpenReviewService } from '../src/app/open-review.js';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createProgressService } from '../src/core/progress.js';

const clone=value=>structuredClone(value);
const manifest={question_books:[{code:'ACT',name:'Acts',questions:7,path:'data/packs/questions/ACT.json'}]};
const pack=[
  {id:'c1',r:'1:8',q:'What did Jesus tell the apostles they would receive from the Holy Spirit?',a:'Jesus said the apostles would receive power.',safety:{action:'context',topics:['holy-spirit']}},
  ...Array.from({length:6},(_,index)=>({id:`a${index+1}`,r:`1:${index+10}`,q:`Textual question ${index+1}?`,a:`Textual answer ${index+1}.`,safety:{action:'allow',topics:[]}}))
];
const fetcher=async path=>path==='data/packs/manifest.json'?{ok:true,async json(){return clone(manifest)}}:path==='data/packs/questions/ACT.json'?{ok:true,async json(){return clone(pack)}}:{ok:false};
const recall=createRecallPackService({fetcher});
const loaded=await recall.loadBook('ACT');
const contextual=loaded.items.find(item=>item.id==='c1');
assert.equal(contextual.answer,'Jesus said the apostles would receive power.','Imported reference answer must remain unchanged.');
assert.equal(contextual.safety.action,'context');
assert.match(contextual.contextNote,/Holy Spirit|passage|context|universal/i);
assert.equal(contextual.contextNote,contextual.safety.contextNote,'Presentation context must be derived from the current trusted safety review.');
assert.equal(Object.isFrozen(contextual),true);

const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value},remove(key){memory.delete(key)}};
let storeState={};const store={setState(patch){storeState=typeof patch==='function'?patch(storeState):{...storeState,...patch};return storeState}};
const now=new Date('2026-09-08T03:00:00Z');
const progress=createProgressService({storage,store,clock:()=>new Date(now),timeZone:'Asia/Tokyo'});
const lesson=createLessonEngine({storage,clock:()=>new Date(now)});
let queue={ACT:['c1']};
const games={recallReviewQueue(){return Object.freeze({ACT:Object.freeze([...queue.ACT])})},syncRecallReviewItem(code,id,needsReview){queue={...queue,[code]:needsReview?[...new Set([...(queue[code]||[]),id])]:(queue[code]||[]).filter(value=>value!==id)};return Object.freeze([...(queue[code]||[])])}};
const adaptive={reviewFocusCategory(){return'Acts'}};
const review=createOpenReviewService({storage,lesson,progress,recall,games,adaptive,clock:()=>new Date(now),random:()=>0});
let session=await review.start();
assert.equal(session.item.id,'c1','Context fixture must be first through the shared Games review queue.');
assert.equal('answer' in session.item,false,'Open Review exposed the source answer before reveal.');
assert.equal('reference' in session.item,false,'Open Review exposed the reference before reveal.');
assert.equal('contextNote' in session.item,false,'Open Review exposed BibleQuest context before answer reveal.');
session=review.reveal();
assert.equal(session.item.answer,contextual.answer,'Open Review changed the imported reference answer.');
assert.equal(session.item.reference,contextual.reference,'Open Review changed the Scripture reference.');
assert.equal(session.item.contextNote,contextual.contextNote,'Open Review lost trusted Recall context metadata at reveal.');
assert.equal(session.item.source,'unfoldingWord Translation Questions v90','Open Review source attribution must remain separate from BibleQuest context.');
assert.equal(session.item.license,'CC BY-SA 4.0','Open Review license attribution must remain separate from BibleQuest context.');

console.log('BibleQuest v3 doctrinal context presentation edge regression passed.');
