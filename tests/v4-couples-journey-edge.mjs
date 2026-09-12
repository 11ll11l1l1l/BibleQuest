import { createCouplesFamilyService } from '../src/app/couples-family.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>value===undefined?undefined:structuredClone(value);
const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
let tick=0;
const couples=createCouplesFamilyService({storage,clock:()=>new Date(Date.UTC(2026,8,12,8,0,tick++)),rng:()=>0});

assert(couples.journeyItems().length===12,'Communication Journey must contain exactly 12 self-assessment items.');
assert(couples.journeyLevels().length===5,'Communication Journey must expose exactly five ordered communication levels.');
assert(couples.journeyLevels().map(level=>level.id).join(',')==='growing-together,mostly-connected,mixed-signals,strained-connection,rebuild-carefully','Communication Journey level order changed.');
assert(couples.journeyScale().map(item=>item.value).join(',')==='1,2,3,4,5','Communication Journey rating scale changed.');

const fill=value=>Object.fromEntries(couples.journeyItems().map(item=>[item.id,value]));
let result=couples.analyzeJourneyAssessment(fill(5));
assert(result.total===60&&result.level.id==='growing-together'&&!result.safetyPriority,'All-5 journey result must be Growing Together without a safety flag.');
result=couples.analyzeJourneyAssessment(fill(4));
assert(result.total===48&&result.level.id==='mostly-connected','All-4 journey result must be Mostly Connected.');
result=couples.analyzeJourneyAssessment(fill(3));
assert(result.total===36&&result.level.id==='mixed-signals','All-3 journey result must be Mixed Signals.');
const strained=fill(2);for(const item of couples.journeyItems().slice(0,6))strained[item.id]=3;
result=couples.analyzeJourneyAssessment(strained);
assert(result.total===30&&result.level.id==='strained-connection','30-point journey result must be Strained Connection.');
result=couples.analyzeJourneyAssessment(fill(2));
assert(result.total===24&&result.level.id==='rebuild-carefully'&&result.safetyPriority,'All-2 journey result must be Rebuild Carefully and safety-priority.');

const safety=fill(5);safety.safety=2;
result=couples.analyzeJourneyAssessment(safety);
assert(result.total===57&&result.level.id==='growing-together'&&result.safetyPriority,'Safety priority must be independent of a high total score.');
assert(Object.keys(result.domains).join(',')==='listening,repair,connection,safety','Communication Journey domain summary changed.');
assert(Object.values(result.domains).every(value=>value>=1&&value<=5),'Communication Journey domain averages must stay on the 1–5 scale.');

const recorded=couples.recordJourneyAssessment(fill(5));
assert(recorded.level.id==='growing-together'&&recorded.at,'Recorded journey result must return level and timestamp.');
let stored=memory.get('couples-family-local');
assert(stored.version===2&&stored.journeyAssessments.length===1,'Journey assessment must persist through the existing Couples storage key and v2 state.');
assert(!('answers' in stored.journeyAssessments[0]),'Raw Communication Journey answers must not persist.');
for(const item of couples.journeyItems())assert(!(item.id in stored.journeyAssessments[0]),`Raw journey answer leaked into persisted summary: ${item.id}.`);

for(let i=0;i<14;i+=1)couples.recordJourneyAssessment(i%2?fill(4):fill(3));
stored=memory.get('couples-family-local');
assert(stored.journeyAssessments.length===12,'Communication Journey history must be bounded to 12 summaries.');
const reloaded=createCouplesFamilyService({storage,clock:()=>new Date('2026-09-12T09:00:00.000Z'),rng:()=>0});
assert(reloaded.snapshot().journeyAssessments.length===12,'Communication Journey summary history did not survive reload.');
assert(reloaded.latestJourneyAssessment()?.level?.id===couples.journeyLevels()[stored.journeyAssessments.at(-1).levelId==='mostly-connected'?1:2].id,'Latest Communication Journey level did not survive reload.');

let invalid='';try{reloaded.analyzeJourneyAssessment({...fill(3),heard:6})}catch(error){invalid=error.message}
assert(/1 to 5/i.test(invalid),'Out-of-range journey ratings must fail closed.');
invalid='';try{const partial=fill(3);delete partial.heard;reloaded.recordJourneyAssessment(partial)}catch(error){invalid=error.message}
assert(/1 to 5/i.test(invalid),'Incomplete journey ratings must fail closed.');

const legacyMemory=new Map([['couples-family-local',{version:1,favorites:['c05'],history:[],commitments:[],checkins:[],listenCount:2,commitmentSeq:0}]]);
const legacyStorage={read(key,fallback=null){return legacyMemory.has(key)?clone(legacyMemory.get(key)):clone(fallback)},write(key,value){legacyMemory.set(key,clone(value));return value}};
const migrated=createCouplesFamilyService({storage:legacyStorage,clock:()=>new Date('2026-09-12T10:00:00.000Z'),rng:()=>0});
assert(migrated.snapshot().version===2&&migrated.snapshot().favorites[0]==='c05'&&migrated.snapshot().listenCount===2,'Legacy Couples local state must migrate without losing existing data.');
assert(migrated.snapshot().journeyAssessments.length===0,'Legacy state must initialize an empty journey history safely.');

console.log('BibleQuest v4 Couples Communication Journey edge acceptance passed.');
