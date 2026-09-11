import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGameLauncherService } from '../src/app/games.js';

const ui=fs.readFileSync('src/features/games/index.js','utf8');
assert.match(ui,/data-kids-bible-card/,'Kids Bible launcher card is missing.');
assert.match(ui,/data-kids-bible-open/,'Kids Bible launcher action is missing.');
assert.match(ui,/Kids Bible Who Am I\?/,'Kids context is not visible in the flattened Games launcher.');
assert.match(ui,/Three clues\. One Bible hero\. Can you guess\?/,'Historical Kids Bible description changed.');
assert.match(ui,/if\(target\.closest\('\[data-kids-bible-open\]'\)\)\{render\(games\.start\('character-detective'\)\);return\}/,'Kids Bible action must enter the existing Character Detective lifecycle.');

const events=[];
const progress={record(event){events.push(structuredClone(event));return{applied:true}}};
const storage={read(_key,fallback=null){return fallback},write(_key,value){return value}};
const recall={async loadManifest(){return{source:'test',license:'test',books:[]}},async loadBook(){throw new Error('unused')}};
const games=createGameLauncherService({progress,storage,recall,roundIdFactory:(mode,sequence)=>`${mode}-${sequence}`,clock:()=>new Date('2026-09-11T00:00:00Z')});

assert.equal(games.modes.filter(mode=>mode.id==='character-detective').length,1,'There must remain one Character Detective owner.');
let state=games.start('character-detective');
assert.equal(state.phase,'detective');
assert.equal(state.detectiveItem.id,'d1');
assert.equal(state.detectiveItem.clues.length,3);
state=games.answerDetective('DAVID');
assert.equal(state.correct,true);
assert.equal(state.gained,12,'Kids alias must preserve Character Detective XP semantics.');
assert.equal(events.filter(event=>event.type==='game.detective').length,1,'Kids alias must use the existing detective progress event.');
assert.equal(events.filter(event=>event.type==='game.detective.complete').length,1,'Kids alias must use the existing detective completion event.');

console.log('BibleQuest v3 Kids Bible Who Am I edge regression passed');
