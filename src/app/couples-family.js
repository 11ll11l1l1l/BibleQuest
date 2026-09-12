import { COUPLES_CATEGORIES,COUPLES_CARDS,COUPLES_CHECK_ITEMS,COUPLES_REPAIR_STEPS } from '../content/couples-family.js';
import { COUPLES_JOURNEY_DOMAINS,COUPLES_JOURNEY_ITEMS,COUPLES_JOURNEY_LEVELS,COUPLES_JOURNEY_SAFETY_ITEM_ID,COUPLES_JOURNEY_SCALE } from '../content/couples-journey.js';

const STORAGE_KEY='couples-family-local';
const VERSION=2;
const HISTORY_LIMIT=100;
const COMMITMENT_LIMIT=30;
const CHECKIN_LIMIT=30;
const JOURNEY_LIMIT=12;
const CARD_IDS=new Set(COUPLES_CARDS.map(card=>card.id));
const CATEGORY_IDS=new Set(COUPLES_CATEGORIES.map(category=>category.id));
const CHECK_IDS=COUPLES_CHECK_ITEMS.map(item=>item.id);
const JOURNEY_IDS=COUPLES_JOURNEY_ITEMS.map(item=>item.id);
const JOURNEY_LEVEL_IDS=new Set(COUPLES_JOURNEY_LEVELS.map(level=>level.id));
const JOURNEY_DOMAIN_IDS=COUPLES_JOURNEY_DOMAINS.map(domain=>domain.id);
const validStamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const freeze=value=>Object.freeze(value);
const freezeEntry=value=>freeze({...value});

function normalizeRatings(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const result={};
  for(const id of CHECK_IDS){const score=Number(value[id]);if(!Number.isInteger(score)||score<1||score>5)return null;result[id]=score}
  return result;
}
function normalizeJourneyRatings(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const result={};
  for(const id of JOURNEY_IDS){const score=Number(value[id]);if(!Number.isInteger(score)||score<1||score>5)return null;result[id]=score}
  return result;
}
function journeyLevel(total){
  const score=Number(total);
  if(!Number.isInteger(score)||score<COUPLES_JOURNEY_ITEMS.length||score>COUPLES_JOURNEY_ITEMS.length*5)return null;
  return COUPLES_JOURNEY_LEVELS.find(level=>score>=level.min&&score<=level.max)||null;
}
function normalizeJourneyDomains(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const result={};
  for(const id of JOURNEY_DOMAIN_IDS){const score=Number(value[id]);if(!Number.isFinite(score)||score<1||score>5)return null;result[id]=Math.round(score*100)/100}
  return result;
}
function normalizeJourneySummary(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!validStamp(value.at))return null;
  const total=Number(value.total),level=journeyLevel(total),domains=normalizeJourneyDomains(value.domains);
  if(!level||!domains||!JOURNEY_LEVEL_IDS.has(String(value.levelId))||level.id!==String(value.levelId))return null;
  return {at:value.at,total,levelId:level.id,safetyPriority:Boolean(value.safetyPriority),domains};
}
function normalizeState(value){
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const favorites=[];for(const id of Array.isArray(input.favorites)?input.favorites:[]){const key=String(id);if(CARD_IDS.has(key)&&!favorites.includes(key))favorites.push(key)}
  const history=(Array.isArray(input.history)?input.history:[]).map(item=>({cardId:String(item?.cardId||item?.id||''),at:item?.at})).filter(item=>CARD_IDS.has(item.cardId)&&validStamp(item.at)).slice(-HISTORY_LIMIT);
  const commitments=[];const seenCommitments=new Set();
  for(const item of Array.isArray(input.commitments)?input.commitments:[]){
    const cardId=String(item?.cardId||String(item?.id||'').split('-')[0]||'');const id=String(item?.id||'');
    if(!CARD_IDS.has(cardId)||!id||seenCommitments.has(id)||!validStamp(item?.createdAt||item?.created))continue;
    const card=COUPLES_CARDS.find(candidate=>candidate.id===cardId);seenCommitments.add(id);commitments.push({id,cardId,text:String(item?.text||card.practice),createdAt:item.createdAt||item.created,done:Boolean(item.done)});
  }
  const checkins=[];
  for(const item of Array.isArray(input.checkins)?input.checkins:[]){const a=normalizeRatings(item?.a),b=normalizeRatings(item?.b);if(a&&b&&validStamp(item?.at))checkins.push({at:item.at,a,b})}
  const journeyAssessments=[];
  for(const item of Array.isArray(input.journeyAssessments)?input.journeyAssessments:[]){const normalized=normalizeJourneySummary(item);if(normalized)journeyAssessments.push(normalized)}
  const maxSeq=commitments.reduce((max,item)=>{const match=/^practice-(\d+)$/.exec(item.id);return Math.max(max,match?Number(match[1]):0)},0);
  const commitmentSeq=Number.isSafeInteger(input.commitmentSeq)&&input.commitmentSeq>=maxSeq?input.commitmentSeq:maxSeq;
  const listenCount=Number.isSafeInteger(input.listenCount)&&input.listenCount>=0?input.listenCount:0;
  return {version:VERSION,favorites,history,commitments:commitments.slice(-COMMITMENT_LIMIT),checkins:checkins.slice(-CHECKIN_LIMIT),journeyAssessments:journeyAssessments.slice(-JOURNEY_LIMIT),listenCount,commitmentSeq};
}

export function createCouplesFamilyService({storage,clock=()=>new Date(),rng=Math.random}={}){
  if(!storage?.read||!storage?.write)throw new Error('Couples & Family requires the shared storage boundary.');
  if(typeof rng!=='function')throw new Error('Couples & Family requires a random selector function.');
  let state=normalizeState(storage.read(STORAGE_KEY,null));
  const stamp=()=>{const raw=clock(),date=raw instanceof Date?new Date(raw.getTime()):new Date(raw);if(!Number.isFinite(date.getTime()))throw new Error('Couples & Family clock returned an invalid time.');return date.toISOString()};
  const freezeJourneySummary=item=>freeze({at:item.at,total:item.total,levelId:item.levelId,safetyPriority:item.safetyPriority,domains:freeze({...item.domains})});
  const save=()=>{state=normalizeState(storage.write(STORAGE_KEY,state));return snapshot()};
  const snapshot=()=>freeze({version:VERSION,favorites:freeze([...state.favorites]),history:freeze(state.history.map(freezeEntry)),commitments:freeze(state.commitments.map(freezeEntry)),checkins:freeze(state.checkins.map(item=>freeze({at:item.at,a:freeze({...item.a}),b:freeze({...item.b})}))),journeyAssessments:freeze(state.journeyAssessments.map(freezeJourneySummary)),listenCount:state.listenCount});
  const card=id=>{const found=COUPLES_CARDS.find(item=>item.id===String(id));if(!found)throw new Error('Couples topic not found.');return found};
  const category=id=>{const found=COUPLES_CATEGORIES.find(item=>item.id===String(id));if(!found)throw new Error('Couples category not found.');return found};
  const poolFor=({categoryId='',categories=[]}={})=>{
    if(categoryId){category(categoryId);return COUPLES_CARDS.filter(item=>item.cat===categoryId)}
    if(categories.length){const valid=categories.map(id=>category(id).id);return COUPLES_CARDS.filter(item=>valid.includes(item.cat))}
    return COUPLES_CARDS;
  };
  function pickCard({categoryId='',categories=[],excludeId=''}={}){
    let pool=poolFor({categoryId,categories});if(excludeId&&pool.length>1)pool=pool.filter(item=>item.id!==String(excludeId));
    const raw=Number(rng());const ratio=Number.isFinite(raw)?Math.min(Math.max(raw,0),0.999999999):0;return pool[Math.floor(ratio*pool.length)];
  }
  function toggleFavorite(id){const target=card(id).id;state={...state,favorites:state.favorites.includes(target)?state.favorites.filter(item=>item!==target):[...state.favorites,target]};save();return state.favorites.includes(target)}
  function markDiscussed(id){const target=card(id).id;state={...state,history:[...state.history,{cardId:target,at:stamp()}].slice(-HISTORY_LIMIT)};save();return snapshot()}
  function startPractice(id){const target=card(id),time=stamp(),seq=state.commitmentSeq+1,entry={id:`practice-${seq}`,cardId:target.id,text:target.practice,createdAt:time,done:false};state={...state,commitmentSeq:seq,commitments:[...state.commitments,entry].slice(-COMMITMENT_LIMIT)};save();return freezeEntry(entry)}
  function activePractice(){const item=[...state.commitments].reverse().find(entry=>!entry.done);return item?freezeEntry(item):null}
  function completeActivePractice(){const active=activePractice();if(!active)return null;state={...state,commitments:state.commitments.map(item=>item.id===active.id?{...item,done:true}:item)};save();return freezeEntry(state.commitments.find(item=>item.id===active.id))}
  function recordListen(){state={...state,listenCount:state.listenCount+1};save();return state.listenCount}
  function recordCheckin(a,b){const first=normalizeRatings(a),second=normalizeRatings(b);if(!first||!second)throw new Error('Couple check-in ratings must all be from 1 to 5.');const entry={at:stamp(),a:first,b:second};state={...state,checkins:[...state.checkins,entry].slice(-CHECKIN_LIMIT)};save();return analyzeCheckin(first,second)}
  function analyzeCheckin(a,b){const first=normalizeRatings(a),second=normalizeRatings(b);if(!first||!second)throw new Error('Couple check-in ratings must all be from 1 to 5.');const rows=COUPLES_CHECK_ITEMS.map(item=>freeze({id:item.id,label:item.label,a:first[item.id],b:second[item.id]}));const gap=[...rows].sort((x,y)=>Math.abs(y.a-y.b)-Math.abs(x.a-x.b))[0];const strong=[...rows].sort((x,y)=>(y.a+y.b)-(x.a+x.b))[0];return freeze({rows:freeze(rows),gap,strong})}
  function analyzeJourneyAssessment(value){
    const ratings=normalizeJourneyRatings(value);if(!ratings)throw new Error('Communication Journey ratings must all be from 1 to 5.');
    const total=JOURNEY_IDS.reduce((sum,id)=>sum+ratings[id],0),level=journeyLevel(total);if(!level)throw new Error('Communication Journey score is invalid.');
    const domains={};
    for(const domain of COUPLES_JOURNEY_DOMAINS){const ids=COUPLES_JOURNEY_ITEMS.filter(item=>item.domain===domain.id).map(item=>item.id),sum=ids.reduce((score,id)=>score+ratings[id],0);domains[domain.id]=Math.round((sum/ids.length)*100)/100}
    return freeze({total,level,safetyPriority:ratings[COUPLES_JOURNEY_SAFETY_ITEM_ID]<=2,domains:freeze(domains)});
  }
  function recordJourneyAssessment(value){
    const result=analyzeJourneyAssessment(value),entry={at:stamp(),total:result.total,levelId:result.level.id,safetyPriority:result.safetyPriority,domains:{...result.domains}};
    state={...state,journeyAssessments:[...state.journeyAssessments,entry].slice(-JOURNEY_LIMIT)};save();return freeze({...result,at:entry.at});
  }
  function latestJourneyAssessment(){
    const entry=state.journeyAssessments.at(-1);if(!entry)return null;const level=COUPLES_JOURNEY_LEVELS.find(item=>item.id===entry.levelId);return freeze({at:entry.at,total:entry.total,level,safetyPriority:entry.safetyPriority,domains:freeze({...entry.domains})});
  }
  return freeze({
    snapshot,
    categories:()=>COUPLES_CATEGORIES,
    checkItems:()=>COUPLES_CHECK_ITEMS,
    repairSteps:()=>COUPLES_REPAIR_STEPS,
    journeyItems:()=>COUPLES_JOURNEY_ITEMS,
    journeyLevels:()=>COUPLES_JOURNEY_LEVELS,
    journeyScale:()=>COUPLES_JOURNEY_SCALE,
    journeyDomains:()=>COUPLES_JOURNEY_DOMAINS,
    getCard:card,
    pickCard,
    isFavorite:id=>state.favorites.includes(card(id).id),
    toggleFavorite,
    markDiscussed,
    startPractice,
    activePractice,
    completeActivePractice,
    recordListen,
    recordCheckin,
    analyzeCheckin,
    analyzeJourneyAssessment,
    recordJourneyAssessment,
    latestJourneyAssessment
  });
}
