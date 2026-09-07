import assert from 'node:assert/strict';
import { createGameLauncherService } from '../src/app/games.js';

let stored={};const storage={read(key,fallback=null){return key in stored?structuredClone(stored[key]):structuredClone(fallback)},write(key,value){stored[key]=structuredClone(value);return value}};
const progress={record(){return{applied:true,duplicate:false}}};
const recall={async loadManifest(){return{books:[]}},async loadBook(){throw new Error('unused')}};
const games=createGameLauncherService({progress,storage,recall,roundIdFactory:(mode,sequence)=>`${mode}-${sequence}`});
let queue=games.recallReviewQueue();assert.deepEqual(queue,{});assert.equal(Object.isFrozen(queue),true);
let ids=games.syncRecallReviewItem('RUT','r1',true);assert.deepEqual(ids,['r1']);assert.deepEqual(games.recallReviewQueue(),{RUT:['r1']});assert.deepEqual(stored['games-recall'].review.RUT,['r1']);
ids=games.syncRecallReviewItem('RUT','r1',true);assert.deepEqual(ids,['r1'],'Repeated review add must be idempotent.');
games.syncRecallReviewItem('RUT','r2',true);assert.deepEqual(games.recallReviewQueue(),{RUT:['r1','r2']});
games.syncRecallReviewItem('RUT','r1',false);assert.deepEqual(games.recallReviewQueue(),{RUT:['r2']});
games.syncRecallReviewItem('RUT','r2',false);assert.deepEqual(games.recallReviewQueue(),{RUT:[]});
assert.throws(()=>games.syncRecallReviewItem('../bad','r1',true),/identity is invalid/i);assert.throws(()=>games.syncRecallReviewItem('RUT','',true),/identity is invalid/i);
const reloaded=createGameLauncherService({progress,storage,recall,roundIdFactory:(mode,sequence)=>`${mode}-${sequence}`});assert.deepEqual(reloaded.recallReviewQueue(),{RUT:[]},'Recall review interface state must survive service recreation.');
console.log('BibleQuest v3 Games recall-review interface edge regression passed.');
