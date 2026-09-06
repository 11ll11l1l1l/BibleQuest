import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createGameLauncherService } from '../src/app/games.js';
import { GAME_MODES, GAME_QUESTIONS, buildGameRound } from '../src/features/games/content.js';
import { DETECTIVE_MODE, DETECTIVES } from '../src/features/games/detectives.js';
import { TIMELINE_MODE, TIMELINES } from '../src/features/games/timelines.js';

const sourceRoot=path.resolve('src'),jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}};walk(sourceRoot);
const owners=jsFiles.filter(file=>fs.readFileSync(file,'utf8').includes('export function createGameLauncherService'));
assert.equal(owners.length,1);assert.ok(owners[0].replaceAll('\\','/').endsWith('/src/app/games.js'));
const serviceSource=fs.readFileSync(path.resolve('src/app/games.js'),'utf8'),uiSource=fs.readFileSync(path.resolve('src/features/games/index.js'),'utf8');
assert.equal(/\b(document|window|localStorage|sessionStorage|createClient|fetch\s*\()/.test(serviceSource),false,'Game owner must not own DOM/storage implementation/backend/pack fetch.');
for(const contract of['progress.record','storage.read','storage.write','recall.loadManifest','recall.loadBook','answerDetective','replayDetective','moveTimeline','checkTimeline','replayTimeline'])assert.ok(serviceSource.includes(contract));
assert.equal(/progress\.record|localStorage|sessionStorage|createClient|window\.BQ|storage\.|fetch\s*\(/.test(uiSource),false,'Games UI bypasses an owner boundary.');

assert.deepEqual(GAME_MODES.map(mode=>mode.id),['quick-recall','context-challenge','mixed-quest','per-book-recall']);
assert.equal(DETECTIVE_MODE.id,'character-detective');assert.equal(DETECTIVES.length,5);assert.equal(new Set(DETECTIVES.map(item=>item.id)).size,5);
for(const item of DETECTIVES){assert.equal(item.clues.length,3);assert.ok(item.answer);assert.ok(item.ref)}
assert.equal(TIMELINE_MODE.id,'timeline-challenge');assert.equal(TIMELINES.length,3);assert.equal(new Set(TIMELINES.map(item=>item.id)).size,3);for(const item of TIMELINES){assert.equal(item.items.length,6);assert.equal(new Set(item.items).size,6)}
assert.equal(GAME_QUESTIONS.length,24);assert.equal(buildGameRound('quick-recall').length,10);assert.equal(buildGameRound('context-challenge').length,9);assert.equal(buildGameRound('mixed-quest').length,10);assert.throws(()=>buildGameRound('per-book-recall'),/Unknown BibleQuest game mode/);

const events=[];const progress={record(event){if(events.some(row=>row.id===event.id))return{applied:false,duplicate:true};events.push(structuredClone(event));return{applied:true}}};
let stored={};const storage={read(key,fallback=null){return key in stored?structuredClone(stored[key]):fallback},write(key,value){stored[key]=structuredClone(value);return value}};
const recallRows=Array.from({length:12},(_,index)=>Object.freeze({id:`r${index+1}`,reference:`1:${index+1}`,question:`Recall question ${index+1}?`,answer:`Answer ${index+1}.`}));
const recall={async loadManifest(){return Object.freeze({source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',books:Object.freeze([Object.freeze({code:'RUT',name:'Ruth',questions:12,path:'data/packs/questions/RUT.json'}),Object.freeze({code:'JHN',name:'John',questions:20,path:'data/packs/questions/JHN.json'})])})},async loadBook(code){if(code!=='RUT')throw new Error('That Bible book has no Per-book Recall pack.');return Object.freeze({book:Object.freeze({code:'RUT',name:'Ruth',questions:12,path:'data/packs/questions/RUT.json'}),source:'unfoldingWord Translation Questions v90',license:'CC BY-SA 4.0',items:Object.freeze(recallRows)})}};
const make=()=>createGameLauncherService({progress,storage,recall,roundIdFactory:(mode,sequence)=>`${mode}-round-${sequence}`,clock:()=>new Date('2026-09-07T00:00:00Z')});
const games=make();assert.equal(games.getState().phase,'launcher');assert.deepEqual(games.modes.map(mode=>mode.id),['quick-recall','context-challenge','mixed-quest','per-book-recall','character-detective','timeline-challenge']);

const quick=games.start('quick-recall');assert.equal(quick.total,10);assert.equal(games.answer(quick.question.answer).gained,10);assert.equal(games.answer(0).duplicate,true);games.next();assert.throws(()=>games.next(),/Answer the current question/);
const context=games.start('context-challenge');assert.equal(context.total,9);while(games.getState().phase==='question'){if(!games.getState().locked)games.answer(games.getState().question.answer);games.next()}assert.equal(games.getState().phase,'complete');
const mixed=games.start('mixed-quest');assert.equal(mixed.total,10);while(games.getState().phase==='question'){if(!games.getState().locked)games.answer(games.getState().question.answer);games.next()}assert.equal(games.lastResult('mixed-quest').score,10);

let detective=games.start('character-detective');assert.equal(detective.phase,'detective');assert.equal(detective.detectiveItem.id,'d1');assert.equal(detective.total,1);assert.throws(()=>games.answerDetective('   '),/Enter a Bible character/);
const detectiveEventsBefore=events.length;let checked=games.answerDetective('DAVID');assert.equal(checked.applied,true);assert.equal(checked.correct,true);assert.equal(checked.score,1);assert.equal(checked.gained,12);assert.equal(events.length,detectiveEventsBefore+2);assert.equal(events.at(-2).type,'game.detective');assert.equal(events.at(-2).xp,12);assert.equal(events.at(-1).type,'game.detective.complete');
const detectiveDuplicate=games.answerDetective('David');assert.equal(detectiveDuplicate.duplicate,true);assert.equal(events.length,detectiveEventsBefore+2,'Duplicate detective submission must not award XP twice.');assert.equal(games.lastResult('character-detective').gained,12);
detective=games.replayDetective();assert.equal(detective.detectiveItem.id,'d2');checked=games.answerDetective('Moses');assert.equal(checked.correct,false);assert.equal(checked.gained,3);games.showLauncher();assert.throws(()=>games.answerDetective('Joseph'),/Start Character Detective/);

let timeline=games.start('timeline-challenge');assert.equal(timeline.phase,'timeline');assert.equal(timeline.timelineItem.id,'t1');assert.equal(timeline.timelineCurrent[0],'Moses leads Israel from Egypt');assert.equal(timeline.timelineCurrent[1],'Abraham leaves his homeland');
const timelineEventsBefore=events.length;let timelineCheck=games.checkTimeline();assert.equal(timelineCheck.applied,true);assert.equal(timelineCheck.correct,false);assert.equal(timelineCheck.gained,4);assert.equal(timelineCheck.timelineAttempted,true);assert.equal(events.length,timelineEventsBefore+1);assert.equal(events.at(-1).xp,4);
const repeatMiss=games.checkTimeline();assert.equal(repeatMiss.applied,false);assert.equal(repeatMiss.noAward,true);assert.equal(repeatMiss.gained,4);assert.equal(events.length,timelineEventsBefore+1,'Repeated wrong Timeline checks must not farm XP.');
timeline=games.moveTimeline(0,1);assert.equal(timeline.timelineCurrent[0],'Abraham leaves his homeland');assert.equal(timeline.timelineCurrent[1],'Moses leads Israel from Egypt');timelineCheck=games.checkTimeline();assert.equal(timelineCheck.correct,true);assert.equal(timelineCheck.locked,true);assert.equal(timelineCheck.score,1);assert.equal(timelineCheck.gained,20,'Timeline recovery should total the original +20 success reward.');assert.equal(events.at(-2).type,'game.timeline');assert.equal(events.at(-2).xp,16);assert.equal(events.at(-1).type,'game.timeline.complete');assert.equal(games.lastResult('timeline-challenge').gained,20);
const lockedMove=games.moveTimeline(1,1);assert.deepEqual(lockedMove.timelineCurrent,timelineCheck.timelineCurrent,'Solved Timeline must not continue moving.');timeline=games.replayTimeline();assert.equal(timeline.timelineItem.id,'t2');assert.equal(timeline.gained,0);games.showLauncher();assert.throws(()=>games.checkTimeline(),/Start Timeline/);
assert.throws(()=>games.start('per-book-recall'),/Open the Per-book Recall library/);

let library=await games.openRecallLibrary();assert.equal(library.phase,'recall-library');assert.equal(library.recallBooks.length,2);assert.equal(games.visibleRecallBooks().length,2);games.setRecallQuery('Ruth');assert.deepEqual(games.visibleRecallBooks().map(book=>book.code),['RUT']);await games.openRecallLibrary();
let deck=await games.startRecallBook('RUT');assert.equal(deck.phase,'recall-question');assert.equal(deck.total,10);assert.equal(deck.recallItem.id,'r1');assert.throws(()=>games.rateRecall('got'),/Reveal/);games.revealRecall();let rated=games.rateRecall('again');assert.equal(rated.index,1);assert.equal(rated.gained,1);assert.equal(games.recallSummary('RUT').review,1);for(let index=1;index<10;index++){games.revealRecall();rated=games.rateRecall('got')}
assert.equal(rated.phase,'recall-complete');assert.equal(rated.remembered,9);assert.equal(rated.reviewAgain,1);assert.equal(rated.gained,46);assert.equal(rated.remainingReview,1);let summary=games.recallSummary('RUT');assert.equal(summary.seen,10);assert.equal(summary.got,9);assert.equal(summary.again,1);assert.equal(summary.last.remembered,9);assert.equal(summary.last.total,10);assert.equal(summary.last.remaining,1);
const recallQuestionEvents=events.filter(row=>row.type==='game.recall');assert.equal(recallQuestionEvents.length,10);assert.equal(recallQuestionEvents[0].xp,1);assert.equal(recallQuestionEvents[1].xp,5);assert.equal(events.filter(row=>row.type==='game.recall.complete').length,1);

const reloaded=make();summary=reloaded.recallSummary('RUT');assert.equal(summary.review,1);assert.equal(summary.last.remembered,9);assert.equal(reloaded.lastResult('character-detective').gained,3);assert.equal(reloaded.lastResult('timeline-challenge').gained,20,'Timeline result must survive service recreation.');await reloaded.openRecallLibrary();deck=await reloaded.startRecallBook('RUT');assert.equal(deck.recallItem.id,'r1');reloaded.revealRecall();reloaded.rateRecall('got');assert.equal(reloaded.recallSummary('RUT').review,0);assert.throws(()=>games.recallSummary('../bad'),/Unknown Per-book Recall book/);assert.throws(()=>games.rateRecall('bad'),/Open a Per-book Recall question|Choose Got it/);

console.log('BibleQuest v3 Games edge regression passed');
