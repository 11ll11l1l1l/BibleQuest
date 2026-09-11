import { memoryLayout, buildMemoryDeck } from '../src/features/games/memory.js';
import { createKidsMemoryGame } from '../src/app/kids-memory.js';
const assert=(c,m)=>{if(!c)throw new Error(m)};
for(const value of [0,-1,NaN,Infinity]){let failed=false;try{memoryLayout(value)}catch{failed=true}assert(failed,'Invalid Memory Meadow width must fail.');}
let failed=false;try{buildMemoryDeck(390,()=>1)}catch{failed=true}assert(failed,'Out-of-range random source must fail.');
const game=createKidsMemoryGame({progress:{getState:()=>({stars:0,coins:0,xp:0}),record:()=>({state:{stars:0,coins:0,xp:0}})},roundIdFactory:()=> 'invalid-test',random:()=>0});
game.start(390);failed=false;try{game.flip(999)}catch{failed=true}assert(failed,'Invalid Memory Meadow card index must fail.');
console.log('BibleQuest v3 Kids Memory invalid input regression passed.');
