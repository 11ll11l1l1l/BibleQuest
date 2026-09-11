import { createKidsMemoryGame } from '../src/app/kids-memory.js';
const assert=(c,m)=>{if(!c)throw new Error(m)};
const game=createKidsMemoryGame({progress:{getState:()=>({stars:0,coins:0,xp:0}),record:()=>({state:{stars:0,coins:0,xp:0}})},roundIdFactory:()=> 'memory-api',random:()=>0});
for(const method of ['start','flip','resolve','replay','leave','getState'])assert(typeof game[method]==='function',`Memory Meadow API missing ${method}.`);
assert(game.mode.id==='kids-memory-match'&&game.mode.title==='Memory Meadow','Memory Meadow mode identity changed.');
console.log('BibleQuest v3 Kids Memory API surface regression passed.');
