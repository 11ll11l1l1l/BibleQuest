import { SPIRITUAL_ITEMS, SPIRITUAL_GUIDES, PERSONALITY_FACTORS, PERSONALITY_ITEMS, BIAS_TASKS } from '../features/transform/content.js';

const STORAGE_KEY = 'transform-state';
const VERSION = 1;
const HISTORY_LIMIT = 10;
const REFLECTION_LIMITS = Object.freeze({ practice:500, noticed:1200, action:1200, prayer:1200 });

const safeIso = value => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Transform clock returned an invalid time.');
  return date.toISOString();
};
const persistedIso = value => { try { return typeof value === 'string' ? safeIso(value) : null; } catch { return null; } };
const boundedText = (value, label, max) => {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  const text = value.trim();
  if (text.length > max) throw new Error(`${label} is too long.`);
  return text;
};
const rating = value => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) throw new Error('Transform ratings must be integers from 1 to 5.');
  return number;
};
const choice = (value, max) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number >= max) throw new Error('Choose one available Transform response.');
  return number;
};

function defaults() {
  return { version:VERSION, spiritual:{answers:{},result:null}, personality:{answers:{},result:null}, bias:{answers:{},result:null}, reflection:{practice:'',noticed:'',action:'',prayer:''}, history:[] };
}
const completeAnswers = (items,answers) => items.every(item => Object.prototype.hasOwnProperty.call(answers,item.id));

function spiritualResult(answers,date) {
  if (!completeAnswers(SPIRITUAL_ITEMS,answers)) throw new Error('Answer all 12 spiritual reflection dimensions before calculating.');
  const scores=SPIRITUAL_ITEMS.map((item,index)=>({id:item.id,dimension:item.dimension,score:answers[item.id],index}));
  const focus=[...scores].sort((a,b)=>a.score-b.score||a.index-b.index).slice(0,3).map(item=>({dimension:item.dimension,score:item.score,guide:SPIRITUAL_GUIDES[item.dimension]}));
  return {date,scores:scores.map(({index,...item})=>item),focus};
}
const bandFor=mean=>mean<2.8?'Lower expression':mean>3.6?'Higher expression':'Midrange / mixed';
function personalityResult(answers,date) {
  if (!completeAnswers(PERSONALITY_ITEMS,answers)) throw new Error('Answer all 20 personality items before calculating.');
  const scores={};
  for(const [factor,definition] of Object.entries(PERSONALITY_FACTORS)){
    const items=PERSONALITY_ITEMS.filter(item=>item.factor===factor);
    const values=items.map(item=>item.key===1?answers[item.id]:6-answers[item.id]);
    const mean=Number((values.reduce((sum,value)=>sum+value,0)/values.length).toFixed(2));
    scores[factor]={name:definition.name,mean,band:bandFor(mean)};
  }
  return {date,scores};
}
function biasResult(answers,date) {
  if (!completeAnswers(BIAS_TASKS,answers)) throw new Error('Answer all five thinking-pattern scenarios before calculating.');
  const signals=BIAS_TASKS.map(task=>({id:task.id,title:task.signal,helpful:answers[task.id]===task.best,practice:task.practice}));
  return {date,helpful:signals.filter(item=>item.helpful).length,total:BIAS_TASKS.length,signals};
}
function normalizeRatings(items,input){const out={};if(!input||typeof input!=='object'||Array.isArray(input))return out;for(const item of items){try{if(Object.prototype.hasOwnProperty.call(input,item.id))out[item.id]=rating(input[item.id])}catch{}}return out}
function normalizeBias(input){const out={};if(!input||typeof input!=='object'||Array.isArray(input))return out;for(const task of BIAS_TASKS){try{if(Object.prototype.hasOwnProperty.call(input,task.id))out[task.id]=choice(input[task.id],task.options.length)}catch{}}return out}
function normalizeReflection(input){const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};const out={};for(const[key,max]of Object.entries(REFLECTION_LIMITS))out[key]=typeof source[key]==='string'?source[key].trim().slice(0,max):'';return out}
function normalizeHistory(input){if(!Array.isArray(input))return[];return input.flatMap(row=>{if(!row||typeof row!=='object'||!['spiritual','personality','bias','reflection'].includes(row.type))return[];const date=persistedIso(row.date);if(!date)return[];return[{type:row.type,date,summary:typeof row.summary==='string'?row.summary.slice(0,240):''}]}).slice(-HISTORY_LIMIT)}
function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.version)!==VERSION)return defaults();
  const spiritualAnswers=normalizeRatings(SPIRITUAL_ITEMS,input.spiritual?.answers),personalityAnswers=normalizeRatings(PERSONALITY_ITEMS,input.personality?.answers),biasAnswers=normalizeBias(input.bias?.answers);
  const spiritualDate=persistedIso(input.spiritual?.result?.date),personalityDate=persistedIso(input.personality?.result?.date),biasDate=persistedIso(input.bias?.result?.date);let spiritual=null,personality=null,bias=null;
  try{if(spiritualDate&&completeAnswers(SPIRITUAL_ITEMS,spiritualAnswers))spiritual=spiritualResult(spiritualAnswers,spiritualDate)}catch{}
  try{if(personalityDate&&completeAnswers(PERSONALITY_ITEMS,personalityAnswers))personality=personalityResult(personalityAnswers,personalityDate)}catch{}
  try{if(biasDate&&completeAnswers(BIAS_TASKS,biasAnswers))bias=biasResult(biasAnswers,biasDate)}catch{}
  return{version:VERSION,spiritual:{answers:spiritualAnswers,result:spiritual},personality:{answers:personalityAnswers,result:personality},bias:{answers:biasAnswers,result:bias},reflection:normalizeReflection(input.reflection),history:normalizeHistory(input.history)};
}
function deepFreeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.values(value).forEach(deepFreeze);return Object.freeze(value)}
const snapshot=state=>deepFreeze(structuredClone(state));

export function createTransformEngine({storage,clock=()=>new Date()}){
  if(!storage)throw new Error('Transform engine requires the storage boundary.');
  let state=normalize(storage.read(STORAGE_KEY,defaults()));
  const getState=()=>snapshot(state);
  const commit=next=>{const normalized=normalize(next);storage.write(STORAGE_KEY,normalized);state=normalized;return getState()};
  const addHistory=(base,type,date,summary)=>({...base,history:[...base.history,{type,date,summary:String(summary||'').slice(0,240)}].slice(-HISTORY_LIMIT)});
  function setRating(domain,items,id,value){const item=items.find(row=>row.id===String(id||''));if(!item)throw new Error(`Unknown ${domain} Transform item.`);const nextValue=rating(value);if(state[domain].answers[item.id]===nextValue)return Object.freeze({applied:false,state:getState()});return Object.freeze({applied:true,state:commit({...state,[domain]:{answers:{...state[domain].answers,[item.id]:nextValue},result:null}})})}
  function setBiasAnswer(id,value){const task=BIAS_TASKS.find(row=>row.id===String(id||''));if(!task)throw new Error('Unknown thinking-pattern task.');const nextValue=choice(value,task.options.length);if(state.bias.answers[task.id]===nextValue)return Object.freeze({applied:false,state:getState()});return Object.freeze({applied:true,state:commit({...state,bias:{answers:{...state.bias.answers,[task.id]:nextValue},result:null}})})}
  function calculateSpiritual(){if(state.spiritual.result)return getState();const date=safeIso(clock()),result=spiritualResult(state.spiritual.answers,date),base={...state,spiritual:{...state.spiritual,result}};return commit(addHistory(base,'spiritual',date,result.focus.map(item=>item.dimension).join(', ')))}
  function calculatePersonality(){if(state.personality.result)return getState();const date=safeIso(clock()),result=personalityResult(state.personality.answers,date),base={...state,personality:{...state.personality,result}};return commit(addHistory(base,'personality',date,Object.values(result.scores).map(item=>`${item.name}: ${item.band}`).join('; ')))}
  function calculateBias(){if(state.bias.result)return getState();const date=safeIso(clock()),result=biasResult(state.bias.answers,date),base={...state,bias:{...state.bias,result}};return commit(addHistory(base,'bias',date,`${result.helpful}/${result.total} bias-resistant responses`))}
  function saveReflection(input={}){if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Reflection update must be an object.');const nextReflection={...state.reflection};let changed=false;for(const[key,max]of Object.entries(REFLECTION_LIMITS)){if(!Object.prototype.hasOwnProperty.call(input,key))continue;const value=boundedText(input[key],`Reflection ${key}`,max);if(nextReflection[key]!==value){nextReflection[key]=value;changed=true}}if(!changed)return Object.freeze({applied:false,state:getState()});const date=safeIso(clock()),base={...state,reflection:nextReflection},summary=nextReflection.action||nextReflection.noticed||nextReflection.practice||'Private reflection updated';return Object.freeze({applied:true,state:commit(addHistory(base,'reflection',date,summary))})}
  function recommendations(){const out=[],scores=state.personality.result?.scores;if(scores){Object.entries(scores).sort((a,b)=>Math.abs(b[1].mean-3)-Math.abs(a[1].mean-3)||a[0].localeCompare(b[0])).slice(0,2).forEach(([factor,score])=>{const definition=PERSONALITY_FACTORS[factor],body=score.band==='Higher expression'?definition.highPractice:score.band==='Lower expression'?definition.lowPractice:'Notice one context where this tendency helps and one where a different response would serve better.';out.push({title:`${definition.name}: ${score.band}`,body})})}state.bias.result?.signals?.filter(item=>!item.helpful).slice(0,2).forEach(item=>out.push({title:item.title,body:item.practice}));if(!out.length)out.push({title:'Start with observation',body:'For one week, pause once a day and ask: “What pattern in me is shaping this choice, and what response would be faithful and wise?”'});return deepFreeze(structuredClone(out.slice(0,4)))}
  function resetDomain(domain){if(!['spiritual','personality','bias'].includes(domain))throw new Error('Unknown Transform reset domain.');return commit({...state,[domain]:{answers:{},result:null}})}
  const resetReflection=()=>commit({...state,reflection:{practice:'',noticed:'',action:'',prayer:''}}),resetAll=()=>commit(defaults());
  return Object.freeze({getState,setSpiritualAnswer:(id,value)=>setRating('spiritual',SPIRITUAL_ITEMS,id,value),calculateSpiritual,setPersonalityAnswer:(id,value)=>setRating('personality',PERSONALITY_ITEMS,id,value),calculatePersonality,setBiasAnswer,calculateBias,saveReflection,recommendations,resetSpiritual:()=>resetDomain('spiritual'),resetPersonality:()=>resetDomain('personality'),resetBias:()=>resetDomain('bias'),resetReflection,resetAll,definitions:Object.freeze({spiritual:SPIRITUAL_ITEMS,personality:PERSONALITY_ITEMS,bias:BIAS_TASKS,factors:PERSONALITY_FACTORS,spiritualGuides:SPIRITUAL_GUIDES})});
}
