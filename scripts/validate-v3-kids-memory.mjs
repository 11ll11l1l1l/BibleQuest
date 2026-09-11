import fs from 'node:fs';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const games=fs.readFileSync('src/app/games.js','utf8');
const child=fs.readFileSync('src/app/kids-memory.js','utf8');
const progress=fs.readFileSync('src/core/progress.js','utf8');
const ui=fs.readFileSync('src/features/games/index.js','utf8');

assert(games.includes("import { createKidsMemoryGame } from './kids-memory.js';"),'Games app owner must import the Memory Meadow child lifecycle.');
assert(games.includes('const kidsMemory=createKidsMemoryGame({progress,roundIdFactory:makeRoundId});'),'Games must inject existing Progress and round identity owners into Memory Meadow.');
assert(child.includes("import { KIDS_MEMORY_DELAYS, KIDS_MEMORY_MODE, buildMemoryDeck, memoryReward }"),'Memory Meadow child must depend on its feature contract.');
assert(child.includes("type:'game.memory.complete'")&&child.includes('rewards:reward')&&child.includes('xp:0'),'Memory Meadow completion must use a zero-XP Progress reward event.');
assert(!child.includes('localStorage')&&!child.includes('sessionStorage'),'Memory Meadow cannot create a persistence owner.');
assert(progress.includes("const REWARD_KEYS = Object.freeze(['stars', 'coins'])"),'Progress must own retained Kids stars/coins balances.');
assert(ui.includes('clearMemoryTimer')&&ui.includes('scheduleMemory'),'Memory Meadow delayed pair resolution must be owned and cleaned by the mounted Games UI.');
console.log('BibleQuest v3 Kids Memory architecture validator passed.');
