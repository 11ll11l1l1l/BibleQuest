import fs from 'node:fs';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const read=path=>fs.readFileSync(path,'utf8');
const games=read('src/app/games.js');
const memory=read('src/app/kids-memory.js');
const memoryContent=read('src/features/games/memory.js');
const ui=read('src/features/games/index.js');
const progress=read('src/core/progress.js');
const css=read('src/ui/games.css');

assert(games.includes("createKidsMemoryGame({progress,roundIdFactory:makeRoundId})"),'Games owner must create Memory Meadow with Progress and shared round identity.');
assert(games.includes('kidsMemory,start,answer,next,replay'),'Games owner must expose the Memory Meadow child lifecycle without duplicating normal game state.');
assert(memory.includes("progress.record({id:`game:${state.roundId}:memory:complete`"),'Memory Meadow completion must flow through Progress.');
assert(memory.includes("xp:0")&&memory.includes('rewards:reward'),'Memory Meadow must award stars/coins through Progress and no XP.');
assert(!memory.includes('localStorage')&&!memoryContent.includes('localStorage'),'Memory Meadow must not own persistence.');
assert(progress.includes("const REWARD_KEYS = Object.freeze(['stars', 'coins'])"),'Progress must remain the single stars/coins owner.');
assert(ui.includes('clearMemoryTimer')&&ui.includes('scheduleMemory')&&ui.includes('games.kidsMemory.resolve(pending.token)'),'Games UI must own and clean delayed Memory Meadow resolution timers.');
assert(ui.includes("data-memory-index")&&ui.includes("data-memory-complete"),'Memory Meadow UI surfaces must remain present.');
assert(css.includes('.bq-memory-grid')&&css.includes('repeat(var(--memory-columns)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'Memory Meadow responsive/reduced-motion CSS contract is missing.');
console.log('BibleQuest v3 Kids Memory architecture regression passed.');
