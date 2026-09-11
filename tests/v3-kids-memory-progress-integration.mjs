import { createProgressService } from '../src/core/progress.js';
import { createKidsMemoryGame } from '../src/app/kids-memory.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>structuredClone(value);
const db=new Map();
const storage={read(key,fallback){return db.has(key)?clone(db.get(key)):clone(fallback)},write(key,value){db.set(key,clone(value));return value}};
const store={state:{},setState(patch){this.state=typeof patch==='function'?patch(this.state):{...this.state,...patch};return this.state}};
const progress=createProgressService({storage,store,clock:()=>new Date('2026-09-11T00:00:00Z'),timeZone:'Asia/Tokyo'});
const game=createKidsMemoryGame({progress,roundIdFactory:()=>`integration-${Math.random()}`,random:()=>0});
let state=game.start(390);
const xpBefore=progress.getState().xp;
while(state.phase==='memory'){
  const remaining=state.cards.map((card,index)=>({card,index})).filter(row=>!row.card.done);
  const icon=remaining[0].card.icon;
  const indexes=remaining.filter(row=>row.card.icon===icon).map(row=>row.index);
  game.flip(indexes[0]);
  const pending=game.flip(indexes[1]).pending;
  state=game.resolve(pending.token).state;
}
const after=progress.getState();
assert(state.phase==='memory-complete','Real Progress integration did not finish Memory Meadow.');
assert(after.xp===xpBefore,'Memory Meadow awarded XP through real Progress.');
assert(after.stars===state.stars&&after.coins===state.coins,'Real Progress did not persist Memory Meadow stars/coins.');
assert(after.totalActivities===1&&after.streak===1,'Memory Meadow completion must count as one meaningful activity.');
const event=Object.values(after.events).find(row=>row.type==='game.memory.complete');
assert(event&&event.xp===0&&event.rewards.stars===state.stars&&event.rewards.coins===state.coins,'Stored Memory Meadow reward event is incorrect.');
console.log('BibleQuest v3 Kids Memory Progress integration passed.');
