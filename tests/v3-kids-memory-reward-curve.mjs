import { memoryReward } from '../src/features/games/memory.js';
const assert=(c,m)=>{if(!c)throw new Error(m)};
const expected=new Map([[1,5],[3,5],[4,5],[5,5],[7,5],[8,4],[11,4],[12,3],[15,3],[16,2],[40,2]]);
for(const [moves,stars] of expected){const reward=memoryReward(moves);assert(reward.stars===stars&&reward.coins===stars*4,`Memory Meadow reward changed at ${moves} moves.`)}
console.log('BibleQuest v3 Kids Memory reward curve regression passed.');
