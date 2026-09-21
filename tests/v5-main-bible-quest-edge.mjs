import assert from 'node:assert/strict';
import { BIBLE_BOOKS } from '../src/core/bible.js';
import { createBibleQuestService } from '../src/app/bible-quest.js';

function memoryStorage(seed={}){
  const map=new Map(Object.entries(structuredClone(seed)));
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
const records=[];
const progress={record(event){records.push(structuredClone(event));return {applied:true}}};
let now=new Date('2026-09-20T00:00:00Z');
const storage=memoryStorage({
  'reader-state':{translation:'bsb',book:'JHN',chapter:3,read:{'bsb:JHN:1':'2026-09-01','bsb:JHN:2':'2026-09-02'}}
});
const create=()=>createBibleQuestService({storage,books:BIBLE_BOOKS,progress,clock:()=>now});

let quest=create();
let state=quest.snapshot();
assert.equal(state.totalChapters,1189,'Canonical Bible Quest must contain exactly 1,189 chapters.');
assert.equal(state.totalBooks,66,'Canonical Bible Quest must contain exactly 66 Protestant-canon books.');
assert.equal(state.completedChapters,0,'Free Reader history must not advance the ordered Main Bible Quest.');
assert.equal(state.next.code,'GEN');
assert.equal(state.next.chapter,1);
assert.equal(state.percent,0);

quest.setPace(3);
state=quest.snapshot();
assert.equal(state.pace,3);
assert.deepEqual(state.today.map(row=>row.key),['GEN:1','GEN:2','GEN:3']);

assert.throws(()=>quest.completeActive({code:'GEN',chapter:1,translation:'bsb'}),/Open the next Bible Quest chapter/);
state=quest.activateNext();
assert.equal(state.active,true);
assert.equal(state.activeKey,'GEN:1');

assert.throws(()=>quest.completeActive({code:'GEN',chapter:2,translation:'bsb'}),/must continue in order/);
let result=quest.completeActive({code:'GEN',chapter:1,translation:'bsb',source:'reader'});
assert.equal(result.applied,true);
assert.equal(result.completed.key,'GEN:1');
assert.equal(result.state.completedChapters,1);
assert.equal(result.state.next.key,'GEN:2');
assert.equal(records.length,1);
assert.equal(records[0].id,'bible-quest:GEN:1');
assert.equal(records[0].xp,0,'Main Quest chapter completion should be meaningful without farming XP.');

quest=create();
state=quest.snapshot();
assert.equal(state.completedChapters,1,'Main Bible Quest must resume after service recreation/reload.');
assert.equal(state.next.key,'GEN:2');
assert.equal(state.pace,3,'Selected Main Quest pace must persist.');

for(let index=1;index<quest.canonical.length;index++){
  const target=quest.activateNext().next;
  assert.ok(target,'Expected a remaining canonical chapter.');
  const completed=quest.completeActive({code:target.code,chapter:target.chapter,translation:'bsb',source:'reader'});
  assert.equal(completed.applied,true);
}
state=quest.snapshot();
assert.equal(state.completedChapters,1189);
assert.equal(state.completedBooks,66);
assert.equal(state.percent,100);
assert.equal(state.complete,true);
assert.equal(state.next,null);
assert.match(state.completedAt,/^2026-09-20T/);
assert.equal(records.length,1189,'Each canonical Quest chapter should emit exactly one stable meaningful progress event.');

console.log('BibleQuest V5 Main Bible Quest canonical progression regression passed.');
