import fs from 'node:fs';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const ui=fs.readFileSync('src/features/games/index.js','utf8');
const css=fs.readFileSync('src/ui/games.css','utf8');

for(const token of ['data-memory-open','data-memory-replay','data-memory-index','data-memory-grid','data-memory-meadow','data-memory-complete','aria-live="polite"'])assert(ui.includes(token),`Memory Meadow UI token missing: ${token}`);
assert(ui.includes('memoryWidth()'),'Memory Meadow must choose pair count from the current rendered width.');
assert(ui.includes('state.locked||card.open||card.done'),'Resolved/open cards and locked pairs must not accept duplicate input.');
assert(css.includes('aspect-ratio:1'),'Memory Meadow cards must preserve a square touch surface.');
assert(css.includes('min-height:58px'),'Memory Meadow mobile targets must remain comfortably above 44 px.');
console.log('BibleQuest v3 Kids Memory UI contract regression passed.');
