import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createGameLauncherService } from '../src/app/games.js';
import { GAME_MODES, GAME_QUESTIONS, buildGameRound } from '../src/features/games/content.js';

const sourceRoot=path.resolve('src'),jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}};walk(sourceRoot);
const owners=jsFiles.filter(file=>fs.readFileSync(file,'utf8').includes('export function createGameLauncherService'));
assert.equal(owners.length,1);assert.ok(owners[0].replaceAll('\\','/').endsWith('/src/app/games.js'));
const serviceSource=fs.readFileSync(path.resolve('src/app/games.js'),'utf8'),uiSource=fs.readFileSync(path.resolve('src/features/games/index.js'),'utf8');
assert.equal(/\b(document|window|localStorage|sessionStorage|createClient|fetch\s*\()/.test(serviceSource),false,'Game owner must not own DOM/storage implementation/backend/pack fetch.');
for(const contract of['progress.record','storage.read','storage.write','recall.loadManifest','recall.loadBook'])assert.ok(serviceSource.includes(contract));
assert.equal(/progress\.record|localStorage|sessionStorage|createClient|window\.BQ|storage\.|fetch\s*\(/.test(uiSource),false,'Games UI bypasses an owner boundary.');

assert.deepEqual(GAME_MODES.map(mode=>mode.id),['quick-recall','context-challenge','mixed-quest','per-book-recall']);
assert.equal(GAME_QUESTIONS.length,24);assert.equal(buildGameRound('quick-recall').length,10);assert.equal(buildGameRound('context-challenge').length,9);assert.equal(buildGameRound('mixed-quest').length,10);
assert.throws(()=>buildGameRound('per-book-recall'),/Unknown BibleQuest game mode/);

const events=[];const progress={record(event){if(events.some(row=>row.id===event.id))return{applied:false,duplicate:true};events.push(structuredClone(event));return{applied:true}}};
let stored={};const storage={read(key,fallback=null){return key in stored?structuredClone(stored[key]):fallback},write(key,value){stored[key]=structuredClone(value);return value}};
const recallRows=Array.from({length:12},(_,index)=>Object.freeze({id:`r${index+1}`,reference:`1:${index+1}`,question:`Recall question ${index+1}?`,answer:`Answer ${index+1}.`}));
const recall={
  async loadManifest(){return Object.freeze({source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',books:Object.freeze([Object.freeze({code:'RUT',name:'Ruth',questions:12,path:'data/packs/questions/RUT.json'}),Object.freeze({code:'JHN',name:'John',questions:20,path:'data/packs/questions/JHN.json'})])})},
  async loadBook(code){if(code!=='RUT')throw new Error('That Bible book has no Per-book Recall pack.');return Object.freeze({book:Object.freeze({code:'RUT',name:'Ruth',questions:12,path:'data/packs/questions/RUT.json'}),source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',items:Object.freeze(recallRows)})}
};
const make=()=>createGameLauncherService({progress,storage,recall,roundIdFactory:(mode,sequence)=>`${mode}-round-${sequence}`,clock:()=>new Date('2026-09-07T00:00:00Z')});
const games=make();assert.equal(games.getState().phase,'launcher');
const quick=games.start('quick-recall');assert.equal(quick.total,10);assert.equal(games.answer(quick.question.answer).gained,10);assert.equal(games.answer(0).duplicate,true);games.next();assert.throws(()=>games.next(),/Answer the current question/);
const context=games.start('context-challenge');assert.equal(context.total,9);while(games.getState().phase==='question'){if(!games.getState().locked)games.answer(games.getState().question.answer);games.next()}assert.equal(games.getState().phase,'complete');
const mixed=games.start('mixed-quest');assert.equal(mixed.total,10);while(games.getState().phase==='question'){if(!games.getState().locked)games.answer(games.getState().question.answer);games.next()}assert.equal(games.lastResult('mixed-quest').score,10);
assert.throws(()=>games.start('per-book-recall'),/Open the Per-book Recall library/);

let library=await games.openRecallLibrary();assert.equal(library.phase,'recall-library');assert.equal(library.recallBooks.length,2);assert.equal(games.visibleRecallBooks().length,2);
games.setRecallQuery('Ruth');assert.deepEqual(games.visibleRecallBooks().map(book=>book.code),['RUT']);await games.openRecallLibrary();
let deck=await games.startRecallBook('RUT');assert.equal(deck.phase,'recall-question');assert.equal(deck.total,10);assert.equal(deck.recallItem.id,'r1');assert.throws(()=>games.rateRecall('got'),/Reveal/);
games.revealRecall();let rated=games.rateRecall('again');assert.equal(rated.index,1);assert.equal(rated.gained,1);assert.equal(games.recallSummary('RUT').review,1);
for(let index=1;index<10;index++){games.revealRecall();rated=games.rateRecall('got')}
assert.equal(rated.phase,'recall-complete');assert.equal(rated.remembered,9);assert.equal(rated.reviewAgain,1);assert.equal(rated.gained,46);assert.equal(rated.remainingReview,1);
let summary=games.recallSummary('RUT');assert.equal(summary.seen,10);assert.equal(summary.got,9);assert.equal(summary.again,1);assert.equal(summary.last.remembered,9);assert.equal(summary.last.total,10);assert.equal(summary.last.remaining,1);
const recallQuestionEvents=events.filter(row=>row.type==='game.recall');assert.equal(recallQuestionEvents.length,10);assert.equal(recallQuestionEvents[0].xp,1);assert.equal(recallQuestionEvents[1].xp,5);assert.equal(events.filter(row=>row.type==='game.recall.complete').length,1);

const reloaded=make();summary=reloaded.recallSummary('RUT');assert.equal(summary.review,1);assert.equal(summary.last.remembered,9,'Per-book Recall result must survive service recreation.');await reloaded.openRecallLibrary();deck=await reloaded.startRecallBook('RUT');assert.equal(deck.recallItem.id,'r1','Review item must be prioritized in the next book session.');reloaded.revealRecall();reloaded.rateRecall('got');assert.equal(reloaded.recallSummary('RUT').review,0,'Got it must remove a persisted review item.');
assert.throws(()=>games.recallSummary('../bad'),/Unknown Per-book Recall book/);
assert.throws(()=>games.rateRecall('bad'),/Open a Per-book Recall question|Choose Got it/);

console.log('BibleQuest v3 Games edge regression passed');
