import assert from 'node:assert/strict';
import {BIBLE_WORLD_ARTWORK,createBibleWorldService} from '../src/app/bible-world.js';

let mastery={Genesis:100,Exodus:80,History:60,Wisdom:40,Prophets:20,Gospels:0,Acts:0,Letters:0};
const adaptive={getProfile:()=>({mastery:{...mastery}})};
const reader={setBook(){}};
const world=createBibleWorldService({adaptive,reader});

assert.deepEqual(BIBLE_WORLD_ARTWORK,{locked:'assets/world-locked.webp',revealed:'assets/world-revealed.webp'});
let state=world.snapshot();
assert.equal(state.artwork.locked,'assets/world-locked.webp');
assert.equal(state.artwork.revealed,'assets/world-revealed.webp');
assert.equal(state.artwork.revealPercent,38,'Artwork reveal must be the rounded mean of the eight retained mastery categories.');
assert.equal(state.regions.every(row=>row.accessible),true,'Artwork reveal must never gate Bible World regions.');

mastery={Genesis:100,Exodus:100,History:100,Wisdom:100,Prophets:100,Gospels:100,Acts:100,Letters:100};
state=world.snapshot();
assert.equal(state.artwork.revealPercent,100);

mastery={Genesis:120,Exodus:-50,History:50,Wisdom:0,Prophets:0,Gospels:0,Acts:0,Letters:0};
state=world.snapshot();
assert.equal(state.artwork.revealPercent,19,'Artwork projection must clamp malformed category evidence before averaging.');
assert.equal(Object.isFrozen(state.artwork),true);
assert.equal(Object.isFrozen(world.artwork),true);
console.log('BibleQuest v3 Bible World artwork edge regression passed');
