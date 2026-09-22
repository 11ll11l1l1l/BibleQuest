import { createCouplesFamilyService } from '../src/app/couples-family.js';
import { COUPLES_CARDS } from '../src/content/couples-family.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>value===undefined?undefined:structuredClone(value);
const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value}};
let now=new Date('2026-09-08T03:00:00.000Z');
const couples=createCouplesFamilyService({storage,clock:()=>new Date(now),rng:()=>0});

assert(couples.categories().length===8,'Couples local source must expose the eight recovered categories.');
assert(COUPLES_CARDS.length===64,'Couples connection bank must expose 64 cards.');
for(const category of couples.categories())assert(COUPLES_CARDS.filter(card=>card.cat===category.id).length===8,`Couples category ${category.id} must expose eight cards.`);
// Context-reviewed reference allowlist. Any reference change requires a fresh passage-level context audit.
const approvedReferences=Object.freeze({
  c01:'Colossians 3:12–17',c02:'Psalm 139:23–24',c03:'Philippians 1:9–11',c04:'Ephesians 4:1–3',
  c05:'Proverbs 18:13',c06:'1 Thessalonians 5:14–15',c07:'Romans 12:15–16',c08:'Ephesians 4:25–29',
  c09:'James 4:1–3',c10:'Matthew 7:1–5',c11:'Proverbs 28:13',c12:'Proverbs 17:14',
  c13:'1 Thessalonians 5:11',c14:'Genesis 2:18–24',c15:'Romans 12:9–10',c16:'Ecclesiastes 9:7–9',
  c17:'Matthew 6:19–24',c18:'Galatians 6:2–5',c19:'1 Timothy 6:6–10',c20:'2 Corinthians 9:6–8',
  c21:'1 Corinthians 13:4–7',c22:'Colossians 3:12–14',c23:'Philippians 2:3–4',c24:'Genesis 2:18–24',
  c25:'Proverbs 20:7',c26:'Deuteronomy 6:4–9',c27:'Genesis 2:23–24',c28:'Colossians 3:12–17',
  c29:'Psalm 127:1–2',c30:'Galatians 5:13–14',c31:'Proverbs 20:5',c32:'James 1:5–8',
  c33:'Isaiah 40:28–31',c34:'Galatians 5:22–25',c35:'Psalm 62:5–8',c36:'Mark 6:30–32',
  c37:'James 1:19–20',c38:'Proverbs 17:27–28',c39:'Proverbs 18:17',c40:'Proverbs 15:23',
  c41:'Ephesians 4:26–32',c42:'Matthew 5:23–24',c43:'Romans 12:15–18',c44:'Romans 12:9–10',
  c45:'Genesis 2:23–24',c46:'Proverbs 17:22',c47:'1 Thessalonians 5:11',c48:'Philippians 2:3–4',
  c49:'Psalm 127:1–2',c50:'Galatians 6:2–5',c51:'Philippians 2:3–4',c52:'1 Timothy 6:17–19',
  c53:'Ephesians 4:31–32',c54:'1 Corinthians 13:4–5',c55:'Philippians 2:3–4',c56:'Colossians 3:12–14',
  c57:'James 1:19–20',c58:'Psalm 78:4–7',c59:'Genesis 2:23–24',c60:'Philippians 2:2–4',
  c61:'Proverbs 16:9',c62:'Romans 12:9–13',c63:'Ecclesiastes 4:9–12',c64:'Matthew 5:14–16'
});
assert(Object.keys(approvedReferences).length===COUPLES_CARDS.length,'Every Couples card must have a context-reviewed Scripture reference.');
for(const card of COUPLES_CARDS)assert(card.ref===approvedReferences[card.id],`Couples Scripture reference drifted without context review: ${card.id} -> ${card.ref}.`);
assert(COUPLES_CARDS.find(card=>card.id==='c16')?.code==='ECC'&&COUPLES_CARDS.find(card=>card.id==='c16')?.chapter===9,'Best small memory must hand off to Ecclesiastes 9 after contextual review.');
assert(couples.pickCard().id==='c01','Deterministic Couples card selection did not begin at c01.');
assert(couples.pickCard({categoryId:'communication'}).id==='c05','Communication category did not recover c05 as its first card.');
assert(couples.pickCard({categories:['gratitude','intimacy','mission']}).id==='c13','Date-night subset selection is incorrect.');
assert(couples.snapshot().favorites.length===0&&couples.snapshot().checkins.length===0,'Fresh Couples local state must be empty.');

assert(couples.toggleFavorite('c05')===true&&couples.isFavorite('c05'),'Saved-card state did not persist.');
assert(memory.size===1&&memory.has('couples-family-local'),'Couples local state must persist through exactly one shared storage key.');
now=new Date('2026-09-08T04:00:00.000Z');
couples.markDiscussed('c05');
assert(couples.pickCard({categoryId:'communication'}).id==='c06','Couples selection should prefer an unseen communication card after c05 is discussed.');
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
