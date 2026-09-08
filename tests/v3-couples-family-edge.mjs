import { createCouplesFamilyService } from '../src/app/couples-family.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>value===undefined?undefined:structuredClone(value);
const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
let now=new Date('2026-09-08T03:00:00.000Z');
const couples=createCouplesFamilyService({storage,clock:()=>new Date(now),rng:()=>0});

assert(couples.categories().length===8,'Couples local source must expose the eight recovered categories.');
assert(couples.pickCard().id==='c01','Deterministic Couples card selection did not begin at c01.');
assert(couples.pickCard({categoryId:'communication'}).id==='c05','Communication category did not recover c05 as its first card.');
assert(couples.pickCard({categories:['gratitude','intimacy','mission']}).id==='c13','Date-night subset selection is incorrect.');
assert(couples.snapshot().favorites.length===0&&couples.snapshot().checkins.length===0,'Fresh Couples local state must be empty.');

assert(couples.toggleFavorite('c05')===true&&couples.isFavorite('c05'),'Saved-card state did not persist.');
assert(memory.size===1&&memory.has('couples-family-local'),'Couples local state must persist through exactly one shared storage key.');
now=new Date('2026-09-08T04:00:00.000Z');
couples.markDiscussed('c05');
const practice=couples.startPractice('c05');
assert(practice.id==='practice-1'&&practice.cardId==='c05'&&practice.text==='For one conversation, summarize before giving your opinion.','7-day practice did not preserve recovered card action text.');
assert(couples.activePractice()?.id==='practice-1','Latest active 7-day practice was not recoverable.');
assert(couples.recordListen()===1,'Listen First completion count did not increment.');
const ratingsA=Object.fromEntries(couples.checkItems().map((item,index)=>[item.id,index===0?5:3]));
const ratingsB=Object.fromEntries(couples.checkItems().map((item,index)=>[item.id,index===0?4:3]));
const result=couples.recordCheckin(ratingsA,ratingsB);
assert(result.rows.length===6&&result.strong.id==='heard'&&result.gap.id==='heard','Couple check-in comparison did not retain recovered six-item semantics.');

const reloaded=createCouplesFamilyService({storage,clock:()=>new Date(now),rng:()=>0});
const snapshot=reloaded.snapshot();
assert(snapshot.favorites.includes('c05')&&snapshot.history[0]?.cardId==='c05','Saved/discussed Couples state did not survive service recreation.');
assert(snapshot.commitments[0]?.id==='practice-1'&&snapshot.checkins.length===1&&snapshot.listenCount===1,'Practice/check-in/listening state did not survive reload.');
assert(reloaded.completeActivePractice()?.done===true&&!reloaded.activePractice(),'Completing the active 7-day practice did not persist.');

let ratingError='';try{reloaded.recordCheckin({...ratingsA,heard:6},ratingsB)}catch(error){ratingError=error.message}assert(/1 to 5/i.test(ratingError),'Couples check-in must reject out-of-range ratings.');
let cardError='';try{reloaded.getCard('missing')}catch(error){cardError=error.message}assert(/not found/i.test(cardError),'Unknown Couples topics must fail explicitly.');
let categoryError='';try{reloaded.pickCard({categoryId:'missing'})}catch(error){categoryError=error.message}assert(/category not found/i.test(categoryError),'Unknown Couples categories must fail explicitly.');

const malformedMemory=new Map([['couples-family-local',{version:99,favorites:['c05','c05','bad'],history:[{id:'c06',at:'2026-09-01T00:00:00.000Z'},{id:'bad',at:'bad'}],commitments:[{id:'c06-123',text:'legacy practice',created:'2026-09-02T00:00:00.000Z',done:false},{id:'bad',text:'bad',created:'bad'}],checkins:[{at:'2026-09-03T00:00:00.000Z',a:{heard:3},b:{heard:3}}],listenCount:-9}]]);
const malformedStorage={read(key,fallback=null){return malformedMemory.has(key)?clone(malformedMemory.get(key)):clone(fallback)},write(key,value){malformedMemory.set(key,clone(value));return value}};
const normalized=createCouplesFamilyService({storage:malformedStorage,clock:()=>new Date('2026-09-08T05:00:00.000Z'),rng:()=>0});
const clean=normalized.snapshot();
assert(clean.favorites.length===1&&clean.favorites[0]==='c05','Malformed Couples favorites must retain only valid unique cards.');
assert(clean.history.length===1&&clean.history[0].cardId==='c06','Legacy discussed-card id shape must normalize safely.');
assert(clean.commitments.length===1&&clean.commitments[0].cardId==='c06','Valid legacy local practice shape must normalize safely.');
assert(clean.checkins.length===0&&clean.listenCount===0,'Invalid check-in/listen persistence must fail closed to safe defaults.');

let boundaryError='';try{createCouplesFamilyService({storage:{read(){return null}}})}catch(error){boundaryError=error.message}assert(/shared storage boundary/i.test(boundaryError),'Couples local owner must require the shared storage boundary.');
let clockError='';try{createCouplesFamilyService({storage,clock:()=>new Date('invalid'),rng:()=>0}).startPractice('c01')}catch(error){clockError=error.message}assert(/invalid time/i.test(clockError),'Couples local owner must reject an invalid clock.');

console.log('BibleQuest v3 Couples/family local edge regression passed.');
