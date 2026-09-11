import { KIDS_MEMORY_DELAYS } from '../src/features/games/memory.js';
if(KIDS_MEMORY_DELAYS.match!==350||KIDS_MEMORY_DELAYS.mismatch!==650)throw new Error('Memory Meadow timing contract changed.');
console.log('BibleQuest v3 Kids Memory delay contract passed.');
