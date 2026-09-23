import assert from 'node:assert/strict';
import {createGameLauncherService} from '../src/app/games.js';

const clone=value=>structuredClone(value);
const stored={};
const storage={
  read(key,fallback=null){return key in stored?clone(stored[key]):clone(fallback)},
  write(key,value){stored[key]=clone(value);return value},
  remove(key){delete stored[key]}
};
const events=[];
const progress={record(event){if(events.some(row=>row.id===event.id))return{applied:false,duplicate:true};events.push(clone(event));return{applied:true,duplicate:false}}};
const recall={async loadManifest(){return{books:[],source:'test',license:'test'}},async loadBook(){throw new Error('unused')}};
let sequence=0;
const make=()=>createGameLauncherService({progress,storage,recall,roundIdFactory:mode=>`${mode}-resume-${++sequence}`,clock:()=>new Date('2026-09-21T00:00:00Z')});

let games=make();
const started=games.start('quick-recall');
const roundId=started.roundId,questionId=started.question.id,correctChoice=started.question.answer;
const answered=games.answer(correctChoice);
assert.equal(answered.locked,true);
assert.equal(answered.score,1);
assert.equal(answered.gained,10);
assert.equal(events.length,1);
games.leave();

games=make();
let resumed=games.getState();
assert.equal(resumed.phase,'question');
assert.equal(resumed.mode,'quick-recall');
assert.equal(resumed.roundId,roundId);
assert.equal(resumed.index,0);
assert.equal(resumed.question.id,questionId);
assert.equal(resumed.locked,true);
assert.equal(resumed.selected,correctChoice);
assert.equal(resumed.correct,true);
assert.equal(resumed.score,1);
assert.equal(resumed.gained,10);
assert.equal(games.answer(correctChoice).duplicate,true,'Reloaded answered question must remain locked.');
assert.equal(events.length,1,'Reloaded answered question must not award duplicate XP.');

games.next();
const second=games.getState();
assert.equal(second.index,1);
assert.equal(second.locked,false);
games=make();
resumed=games.getState();
assert.equal(resumed.index,1,'Reload must resume the exact next question index.');
assert.equal(resumed.question.id,second.question.id,'Reload must resume the exact question.');
assert.equal(resumed.score,1);
assert.equal(resumed.gained,10);

games.showLauncher();
assert.equal(make().getState().phase,'launcher','Explicitly choosing the launcher must discard the active round.');

stored['games-active-round']={version:1,phase:'question',mode:'quick-recall',roundId:'tampered',questionIds:['wrong'],index:0,score:999,gained:999,locked:false,selected:null,correct:null};
assert.equal(make().getState().phase,'launcher','Malformed active-round storage must fail closed.');

console.log('V5 Quick Recall exact refresh/resume and duplicate-XP contract: PASS');
