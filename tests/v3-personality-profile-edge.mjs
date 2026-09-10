import assert from 'node:assert/strict';

class MemoryStorage{
  constructor(){this.map=new Map()}
  get length(){return this.map.size}
  key(index){return [...this.map.keys()][index]??null}
  getItem(key){return this.map.has(String(key))?this.map.get(String(key)):null}
  setItem(key,value){this.map.set(String(key),String(value))}
  removeItem(key){this.map.delete(String(key))}
  clear(){this.map.clear()}
}
globalThis.localStorage=new MemoryStorage();

const [{storage,privateStorage},{createPersonalityProfileService},{createTransformService}]=await Promise.all([
  import('../src/core/storage.js'),import('../src/app/personality-profile.js'),import('../src/app/transform.js')
]);

const result={date:'2026-09-10T09:00:00.000Z',scores:{
  O:{name:'Openness / Intellect',mean:4,band:'Higher expression'},
  C:{name:'Conscientiousness',mean:4.2,band:'Higher expression'},
  E:{name:'Extraversion',mean:2.2,band:'Lower expression'},
  A:{name:'Agreeableness',mean:2.4,band:'Lower expression'},
  S:{name:'Emotional Stability',mean:2.4,band:'Lower expression'}
}};

let sessionState={authenticated:false,user:null};
const session={getState:()=>sessionState};
let tick=0;
const profile=createPersonalityProfileService({session,privateStorage,clock:()=>new Date(1725960000000+(tick++*1000))});
assert.equal(profile.load().status,'empty','Guest profile should begin empty.');
const guest=profile.capture(result);
assert.equal(guest.assessmentVersion,'bq_quick_transform_ipip20_v1');
assert.equal(guest.owner,'guest');
assert.equal(guest.presentation.depth,'deeper-context');
assert.equal(guest.presentation.structure,'structured');
assert.equal(guest.presentation.interaction,'reflective');
assert.equal(guest.presentation.challengeStyle,'direct-evidence-first');
assert.equal(guest.presentation.pacing,'calm-short-steps');
assert.equal(profile.load().profile.result.scores.O.mean,4);

sessionState={authenticated:true,user:{id:'user-a'}};
assert.equal(profile.load().status,'empty','Account A must not inherit the guest profile.');
const accountA=profile.capture({...result,date:'2026-09-10T10:00:00.000Z'});
assert.equal(accountA.owner,'account:user-a');
sessionState={authenticated:true,user:{id:'user-b'}};
assert.equal(profile.load().status,'empty','Account B must not inherit Account A profile.');
profile.capture({...result,date:'2026-09-10T11:00:00.000Z',scores:{...result.scores,E:{name:'Extraversion',mean:4.4,band:'Higher expression'}}});
assert.equal(profile.load().profile.result.scores.E.mean,4.4);
sessionState={authenticated:true,user:{id:'user-a'}};
assert.equal(profile.load().profile.result.scores.E.mean,2.2,'Account A profile must reopen independently.');
profile.clear();
assert.equal(profile.load().status,'empty','Clear must affect current owner.');
sessionState={authenticated:true,user:{id:'user-b'}};
assert.equal(profile.load().status,'ready','Clearing Account A must not clear Account B.');

assert.throws(()=>profile.capture({...result,scores:{...result.scores,O:{name:'Openness / Intellect',mean:8,band:'Higher expression'}}}),/invalid/i,'Out-of-range factor must fail closed.');
assert.throws(()=>profile.capture({...result,scores:{...result.scores,S:{name:'Emotional Stability',mean:3,band:'invented'}}}),/invalid/i,'Unknown band must fail closed.');

storage.write('personality-profile-portable-control',{ok:true});
privateStorage.write('personality-profile:secret-owner',{secret:'private'});
const exported=storage.exportPortableEntries();
assert(exported.some(row=>row.name==='personality-profile-portable-control'),'Portable control entry should export.');
assert(!exported.some(row=>JSON.stringify(row).includes('private')),'Private profile storage must be excluded from portable backup.');

let captured=0,cleared=0;
const profileSpy={capture(value){captured++;assert.equal(value,result)},clear(){cleared++}};
const engine={
  getState:()=>({personality:{result},bias:{result:null},spiritual:{result:null}}),
  calculatePersonality:()=>({personality:{result},bias:{result:null},spiritual:{result:null}}),
  resetPersonality:()=>({personality:{answers:{},result:null}}),
  recommendations:()=>[],definitions:{},
  setSpiritualAnswer(){},calculateSpiritual(){},setPersonalityAnswer(){},setBiasAnswer(){},calculateBias(){},saveReflection(){},resetSpiritual(){},resetBias(){},resetReflection(){}
};
const progress={record:()=>({awardedXp:0})};
const transform=createTransformService({engine,progress,personalityProfile:profileSpy});
const completed=transform.completePersonalityAssessment();
assert.equal(captured,1,'Transform completion must delegate profile capture exactly once.');
assert.equal(completed.profileSaved,true);
transform.resetPersonality();
assert.equal(cleared,1,'Transform personality reset must clear current-owner profile exactly once.');

console.log('BibleQuest v3 Personality Profile edge/privacy regression passed.');
