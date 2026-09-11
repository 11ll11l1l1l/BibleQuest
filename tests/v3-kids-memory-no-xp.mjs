import fs from 'node:fs';
const source=fs.readFileSync('src/app/kids-memory.js','utf8');
if(!source.includes("type:'game.memory.complete',xp:0"))throw new Error('Memory Meadow must retain explicit zero-XP completion.');
console.log('BibleQuest v3 Kids Memory zero-XP regression passed.');
