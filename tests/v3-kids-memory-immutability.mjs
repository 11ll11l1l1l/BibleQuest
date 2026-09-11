import { createKidsMemoryGame } from '../src/app/kids-memory.js';
const assert=(c,m)=>{if(!c)throw new Error(m)};
const game=createKidsMemoryGame({progress:{getState:()=>({stars:0,coins:0,xp:0}),record:()=>({state:{stars:0,coins:0,xp:0}})},roundIdFactory:()=> 'freeze-test',random:()=>0});
const state=game.start(390);
assert(Object.isFrozen(state)&&Object.isFrozen(state.cards)&&Object.isFrozen(state.cards[0])&&Object.isFrozen(state.flipped),'Memory Meadow snapshots must be immutable.');
console.log('BibleQuest v3 Kids Memory immutability regression passed.');
