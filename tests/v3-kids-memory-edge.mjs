import { memoryLayout, memoryReward, buildMemoryDeck, KIDS_MEMORY_DELAYS } from '../src/features/games/memory.js';
import { createKidsMemoryGame } from '../src/app/kids-memory.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>structuredClone(value);

assert(memoryLayout(320).pairs===6&&memoryLayout(320).columns===3,'320 px must use 6 pairs / 3 columns.');
assert(memoryLayout(419).pairs===6&&memoryLayout(419).columns===3,'419 px must remain mobile 6 pairs / 3 columns.');
assert(memoryLayout(420).pairs===8&&memoryLayout(420).columns===4,'420 px must switch to 8 pairs / 4 columns.');
assert(memoryLayout(430).pairs===8&&memoryLayout(430).columns===4,'430 px must use 8 pairs / 4 columns.');
assert(KIDS_MEMORY_DELAYS.match===350&&KIDS_MEMORY_DELAYS.mismatch===650,'Retained match/mismatch timing contract changed.');
assert(memoryReward(1).stars===5&&memoryReward(1).coins===20,'Fast completion reward contract failed.');
assert(memoryReward(4).stars===5&&memoryReward(8).stars===4&&memoryReward(12).stars===3&&memoryReward(16).stars===2&&memoryReward(999).stars===2,'Move-based star clamp changed.');

const deterministic=()=>0;
const mobileDeck=buildMemoryDeck(390,deterministic);
assert(mobileDeck.cards.length===12&&mobileDeck.pairs===6&&mobileDeck.columns===3,'Mobile deck contract failed.');
assert(Object.isFrozen(mobileDeck)&&Object.isFrozen(mobileDeck.cards)&&Object.isFrozen(mobileDeck.cards[0]),'Deck snapshots must be immutable.');
const wideDeck=buildMemoryDeck(430,deterministic);
assert(wideDeck.cards.length===16&&wideDeck.pairs===8&&wideDeck.columns===4,'Wide deck contract failed.');

let wallet={xp:77,stars:4,coins:9};
const events=new Map();
const progress={
  getState(){return Object.freeze(clone(wallet))},
  record(input){
    assert(input.xp===0,'Memory Meadow must not award XP.');
    assert(input.type==='game.memory.complete','Memory Meadow completion event type changed.');
    assert(input.meaningful===true,'Memory Meadow completion must remain meaningful.');
    if(events.has(input.id))return Object.freeze({applied:false,duplicate:true,state:Object.freeze(clone(wallet))});
    events.set(input.id,clone(input));
    wallet={...wallet,stars:wallet.stars+input.rewards.stars,coins:wallet.coins+input.rewards.coins};
    return Object.freeze({applied:true,duplicate:false,state:Object.freeze(clone(wallet))});
  }
};
let round=0;
const game=createKidsMemoryGame({progress,roundIdFactory:()=>`memory-test-${++round}`,random:deterministic});
let state=game.start(390);
assert(state.phase==='memory'&&state.cards.length===12&&state.moves===0&&!state.locked,'Memory start state failed.');
assert(state.totalStars===4&&state.totalCoins===9,'Starting wallet balances were not sourced from Progress.');
const firstIcon=state.cards[0].icon;
const pairIndexes=state.cards.map((card,index)=>card.icon===firstIcon?index:-1).filter(index=>index>=0);
assert(pairIndexes.length===2,'Test deck did not contain an exact pair.');
let result=game.flip(pairIndexes[0]);
assert(result.applied&&!result.pending&&result.state.flipped.length===1&&!result.state.locked,'First flip contract failed.');
result=game.flip(pairIndexes[1]);
assert(result.applied&&result.pending?.kind==='match'&&result.pending.delayMs===350&&result.state.moves===1&&result.state.locked,'Second matching flip must lock for 350 ms.');
const staleToken=result.pending.token;
let stale=game.resolve('wrong-token');
assert(!stale.applied&&stale.stale&&game.getState().locked,'Wrong resolution token must be ignored without unlocking.');
result=game.resolve(staleToken);
assert(result.applied&&!result.completed&&!result.state.locked&&result.state.cards.filter(card=>card.done).length===2,'Matched pair resolution failed.');

state=game.replay(390);
const first=0,second=state.cards.findIndex((card,index)=>index>0&&card.icon!==state.cards[first].icon);
assert(second>0,'Test deck did not provide a mismatch.');
game.flip(first);result=game.flip(second);
assert(result.pending?.kind==='mismatch'&&result.pending.delayMs===650&&result.state.locked,'Mismatch must lock for 650 ms.');
const mismatchToken=result.pending.token;
const nextRound=game.replay(390);
stale=game.resolve(mismatchToken);
assert(!stale.applied&&stale.stale&&game.getState().roundId===nextRound.roundId,'Old delayed mismatch must not mutate a replayed round.');

state=game.getState();
while(state.phase==='memory'){
  const remaining=state.cards.map((card,index)=>({card,index})).filter(row=>!row.card.done);
  const icon=remaining[0].card.icon;
  const indexes=remaining.filter(row=>row.card.icon===icon).map(row=>row.index);
  game.flip(indexes[0]);
  const pending=game.flip(indexes[1]).pending;
  state=game.resolve(pending.token).state;
}
assert(state.phase==='memory-complete','Completing every pair did not finish Memory Meadow.');
assert(state.stars>=2&&state.stars<=5&&state.coins===state.stars*4,'Completion reward did not follow retained stars/coins contract.');
assert(state.totalStars===4+state.stars&&state.totalCoins===9+state.coins,'Completion balances did not come back from Progress.');
assert(wallet.xp===77,'Memory Meadow changed XP.');
assert(events.size===1,'Memory Meadow must award exactly one completion event per completed round.');

const finishedRound=state.roundId;
const left=game.leave();
assert(left.phase==='memory-idle'&&left.roundId===null&&left.cards.length===0,'Leaving Memory Meadow must clear child state.');
stale=game.resolve(`${finishedRound}:stale`);
assert(!stale.applied&&stale.stale,'Delayed callbacks after leave must remain stale.');

console.log('BibleQuest v3 Kids Memory edge regression passed.');
