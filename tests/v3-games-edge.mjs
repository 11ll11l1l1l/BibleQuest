import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createGameLauncherService } from '../src/app/games.js';
import { GAME_MODES, GAME_QUESTIONS, buildGameRound } from '../src/features/games/content.js';

const sourceRoot=path.resolve('src');
const jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js'))jsFiles.push(full)}};
walk(sourceRoot);
const launcherOwners=jsFiles.filter(file=>fs.readFileSync(file,'utf8').includes('export function createGameLauncherService'));
assert.equal(launcherOwners.length,1,'Exactly one v3 Game Launcher owner is required.');
assert.ok(launcherOwners[0].replaceAll('\\','/').endsWith('/src/app/games.js'),'Game Launcher ownership must remain in src/app/games.js.');
const gameServiceSource=fs.readFileSync(path.resolve('src/app/games.js'),'utf8');
assert.equal(/\b(document|window|localStorage|sessionStorage|createClient)\b/.test(gameServiceSource),false,'Game Launcher service must remain DOM/storage-implementation/backend independent.');
for(const contract of['progress.record','storage.read','storage.write','buildGameRound']) assert.ok(gameServiceSource.includes(contract),`Game Launcher missing required owner contract ${contract}.`);
const gameUiSource=fs.readFileSync(path.resolve('src/features/games/index.js'),'utf8');
assert.equal(/progress\.record|localStorage|sessionStorage|createClient|window\.BQ|storage\./.test(gameUiSource),false,'Games UI must not bypass launcher/progress/storage boundaries.');

assert.deepEqual(GAME_MODES.map(mode=>mode.id),['quick-recall','context-challenge','mixed-quest']);
assert.equal(GAME_QUESTIONS.length,24);
assert.equal(buildGameRound('quick-recall').length,10);
assert.equal(buildGameRound('context-challenge').length,9);
const mixed=buildGameRound('mixed-quest');
assert.equal(mixed.length,10);
assert.deepEqual(mixed.map(row=>row.id),['q1','q5','q9','q11','q15','q16','q19','q22','q23','q21']);
assert.ok(mixed.some(row=>row.mode==='basic'),'Mixed Quest must contain recall questions.');
assert.ok(mixed.some(row=>row.mode==='context'),'Mixed Quest must contain context questions.');
assert.ok(mixed.some(row=>row.mode==='connection'),'Mixed Quest must contain connection questions.');
for(const question of GAME_QUESTIONS){
  assert.ok(question.id);
  assert.equal(question.choices.length,4);
  assert.ok(Number.isInteger(question.answer));
  assert.ok(question.answer>=0&&question.answer<question.choices.length);
  assert.ok(question.ref);
  assert.ok(question.why);
}

const events=[];
const progress={
  record(event){
    if(events.some(row=>row.id===event.id)) throw new Error(`duplicate progress event ${event.id}`);
    events.push(structuredClone(event));
    return {applied:true};
  }
};
let stored={};
const storage={
  read(key,fallback=null){return key in stored?structuredClone(stored[key]):fallback},
  write(key,value){stored[key]=structuredClone(value);return value}
};
const games=createGameLauncherService({
  progress,
  storage,
  roundIdFactory:(mode,sequence)=>`${mode}-round-${sequence}`,
  clock:()=>new Date('2026-09-07T00:00:00Z')
});

assert.equal(games.getState().phase,'launcher');
assert.equal(games.lastResult('quick-recall'),null);
const quick=games.start('quick-recall');
assert.equal(quick.phase,'question');
assert.equal(quick.total,10);
assert.equal(quick.index,0);
assert.equal(quick.question.id,'q1');

const firstCorrect=quick.question.answer;
const first=games.answer(firstCorrect);
assert.equal(first.applied,true);
assert.equal(first.locked,true);
assert.equal(first.correct,true);
assert.equal(first.score,1);
assert.equal(first.gained,10);
assert.equal(events.length,1);
assert.equal(events[0].metrics.quizCorrect,1);
assert.equal(events[0].meaningful,false);

const duplicate=games.answer(0);
assert.equal(duplicate.applied,false);
assert.equal(duplicate.duplicate,true);
assert.equal(duplicate.score,1);
assert.equal(duplicate.gained,10);
assert.equal(events.length,1);

games.next();
assert.equal(games.getState().index,1);
assert.equal(games.getState().locked,false);
assert.throws(()=>games.next(),/Answer the current question/);

const context=games.start('context-challenge');
assert.equal(context.total,9);
assert.equal(context.question.id,'q5');
assert.equal(context.score,0);
const wrongChoice=context.question.answer===0?1:0;
const wrong=games.answer(wrongChoice);
assert.equal(wrong.correct,false);
assert.equal(wrong.score,0);
assert.equal(wrong.gained,3);
assert.equal(events.at(-1).metrics.quizCorrect,undefined);

while(games.getState().phase==='question'){
  if(!games.getState().locked) games.answer(games.getState().question.answer);
  games.next();
}
const complete=games.getState();
assert.equal(complete.phase,'complete');
assert.equal(complete.total,9);
assert.equal(events.at(-1).type,'game.round.complete');
assert.equal(events.at(-1).meaningful,true);
assert.equal(games.lastResult('context-challenge').score,8);
assert.equal(games.lastResult('context-challenge').total,9);

const replay=games.replay();
assert.equal(replay.phase,'question');
assert.equal(replay.mode,'context-challenge');
assert.equal(replay.score,0);
assert.equal(replay.index,0);
assert.notEqual(replay.roundId,context.roundId);

games.showLauncher();
const mixedState=games.start('mixed-quest');
assert.equal(mixedState.total,10);
assert.equal(mixedState.question.id,'q1');
while(games.getState().phase==='question'){
  if(!games.getState().locked) games.answer(games.getState().question.answer);
  games.next();
}
assert.equal(games.getState().phase,'complete');
assert.equal(games.getState().score,10);
assert.equal(games.getState().gained,100);
const mixedResult=games.lastResult('mixed-quest');
assert.deepEqual(mixedResult,{score:10,total:10,gained:100,completedAt:'2026-09-07T00:00:00.000Z'});

const reloaded=createGameLauncherService({
  progress:{record(){throw new Error('reload result lookup must not write progress')}},
  storage,
  roundIdFactory:()=> 'reload-round',
  clock:()=>new Date('2026-09-07T00:00:00Z')
});
assert.deepEqual(reloaded.lastResult('mixed-quest'),mixedResult,'Mixed Quest result must survive service recreation through the storage boundary.');

const launcher=games.showLauncher();
assert.equal(launcher.phase,'launcher');
assert.equal(launcher.mode,null);
assert.equal(launcher.total,0);
assert.throws(()=>games.start('not-real'),/Unknown BibleQuest game mode/);
assert.throws(()=>games.lastResult('not-real'),/Unknown BibleQuest game mode/);
assert.throws(()=>games.answer(0),/Start a BibleQuest game/);

console.log('BibleQuest v3 Games edge regression passed');
