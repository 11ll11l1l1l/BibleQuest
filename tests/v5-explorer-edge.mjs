import assert from 'node:assert/strict';
import { createExplorerService } from '../src/app/explorer.js';

function memoryStorage(seed={}){
  const map=new Map(Object.entries(structuredClone(seed)));
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function make(storage=memoryStorage(),iso='2026-09-21T08:00:00.000Z'){
  let now=new Date(iso);
  const service=createExplorerService({storage,clock:()=>new Date(now),random:()=>0});
  return {service,storage,setTime(value){now=new Date(value)}};
}

const device=make();
const people=[];
let started=device.service.start('person');
people.push(started.state.session.item.id);
for(let index=1;index<10;index++){
  device.service.reveal('person');
  const next=device.service.nextCase('person');
  people.push(next.session.item.id);
}
assert.equal(new Set(people).size,10,'Bible Explorer must exhaust all ten people before repeating.');
assert.equal(device.service.snapshot('person').seenCount,10,'People cycle must record all ten unique items.');
const lastPerson=people.at(-1);
device.service.reveal('person');
const nextCycle=device.service.nextCase('person');
assert.equal(nextCycle.cycle,1,'People pool exhaustion must advance the cycle number.');
assert.notEqual(nextCycle.session.item.id,lastPerson,'Cycle rollover must not immediately repeat the final item when alternatives exist.');

const places=[];
const placeDevice=make(memoryStorage(),'2026-09-21T09:00:00.000Z');
let placeStart=placeDevice.service.start('place');
places.push(placeStart.state.session.item.id);
for(let index=1;index<5;index++){
  placeDevice.service.reveal('place');
  const next=placeDevice.service.nextCase('place');
  places.push(next.session.item.id);
}
assert.equal(new Set(places).size,5,'Bible Explorer must exhaust all five places before repeating.');
assert.equal(placeDevice.service.snapshot('place').seenCount,5);

const reloadStorage=memoryStorage();
const original=make(reloadStorage,'2026-09-21T10:00:00.000Z');
const first=original.service.start('person').state;
original.service.nextClue('person');
original.service.nextClue('person');
const before=original.service.snapshot('person');
assert.equal(before.session.clueIndex,2);

const reloaded=createExplorerService({
  storage:reloadStorage,
  clock:()=>new Date('2026-09-21T11:00:00.000Z'),
  random:()=>0.9
});
const resumed=reloaded.start('person');
assert.equal(resumed.resumed,true,'Reload must resume an unfinished Explorer case instead of rerolling it.');
assert.equal(resumed.state.session.item.id,first.session.item.id,'Reload must preserve the exact Explorer item.');
assert.equal(resumed.state.session.clueIndex,2,'Reload must preserve the exact revealed clue position.');

reloaded.reveal('person');
const revealedStable=reloaded.nextClue('person');
assert.equal(revealedStable.session.revealed,true,'A revealed Explorer case must remain revealed when another clue is requested.');
assert.equal(revealedStable.session.clueIndex,2,'A revealed Explorer case must not advance its clue position.');
const afterReveal=reloaded.snapshot('person');
assert.equal(afterReveal.session.revealed,true);
assert.equal(afterReveal.session.item.reader.code.length>=3,true,'Every Explorer item must expose a Reader target.');

const all=reloaded.connections();
assert.equal(all.length,15,'Explorer Connections must expose all retained people and places.');
assert.equal(all.every(item=>item.refs&&item.reader?.code&&item.reader?.chapter),true,'Every Explorer connection must carry Scripture reference and Reader target.');

const independent=make(memoryStorage(),'2026-09-21T12:00:00.000Z');
independent.service.start('person');
independent.service.start('place');
independent.service.nextClue('place');
assert.equal(independent.service.snapshot('person').session.clueIndex,0,'Starting Places must not destroy the unfinished People session.');
assert.equal(independent.service.snapshot('place').session.clueIndex,1,'People and Places must keep independent resumable sessions.');

console.log('BibleQuest V5 Bible Explorer repetition/resume regression passed.');
