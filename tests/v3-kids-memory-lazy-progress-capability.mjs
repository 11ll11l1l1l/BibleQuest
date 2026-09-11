import { createKidsMemoryGame } from '../src/app/kids-memory.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const game=createKidsMemoryGame({progress:{record(){}},roundIdFactory:()=> 'lazy-progress'});
assert(game.getState().phase==='memory-idle','Memory Meadow child must construct without demanding unused balance state.');
let failed=false;
try{game.start(390)}catch(error){failed=/Progress balance state/.test(error.message)}
assert(failed,'Launching Memory Meadow must still fail loudly when Progress balance state is unavailable.');
console.log('BibleQuest v3 Kids Memory lazy Progress capability regression passed.');
