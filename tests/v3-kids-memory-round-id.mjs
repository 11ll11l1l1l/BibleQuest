import { createKidsMemoryGame } from '../src/app/kids-memory.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const progress={getState:()=>({xp:0,stars:0,coins:0}),record:()=>({state:{xp:0,stars:0,coins:0}})};
const seen=[];
const game=createKidsMemoryGame({progress,roundIdFactory:(mode,sequence)=>{seen.push({mode,sequence});return `${mode}-${sequence}`},random:()=>0});
const first=game.start(390),second=game.replay(390);
assert(first.roundId!==second.roundId,'Replay must receive a new Memory Meadow round identity.');
assert(seen.length===2&&seen.every(row=>row.mode==='kids-memory-match'),'Memory Meadow must use the Games round identity owner.');
console.log('BibleQuest v3 Kids Memory round identity regression passed.');
