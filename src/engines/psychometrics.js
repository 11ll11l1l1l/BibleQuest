import { PSYCHOMETRICS_DEFINITIONS } from '../features/psychometrics/content.js';

const VERSION=1;
const TYPES=Object.freeze(['neo','via','rse']);
const iso=value=>{
  const date=value instanceof Date?new Date(value.getTime()):new Date(value);
  if(!Number.isFinite(date.getTime()))throw new Error('Psychometrics clock returned an invalid time.');
  return date.toISOString();
};
const millis=value=>{
  if(value instanceof Date)return value.getTime();
  const number=Number(value);
  if(Number.isFinite(number))return number;
  const date=new Date(value);
  if(Number.isFinite(date.getTime()))return date.getTime();
  throw new Error('Psychometrics clock returned an invalid time.');
};
const clone=value=>structuredClone(value);
const freeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.values(value).forEach(freeze);return Object.freeze(value)};
const snapshot=value=>freeze(clone(value));
const assertType=type=>{if(!TYPES.includes(type))throw new Error('Unknown Psychometrics assessment.');return type};
const defaultDomain=()=>({answers:{},result:null,startAt:null});
export const emptyPsychometricsState=()=>({version:VERSION,neo:defaultDomain(),via:defaultDomain(),rse:{answers:{},result:null,startAt:null}});

const validRating=(value,min,max)=>{const number=Number(value);if(!Number.isInteger(number)||number<min||number>max)throw new Error(`Psychometrics response must be an integer from ${min} to ${max}.`);return number};
const validStart=value=>{const number=Number(value);return Number.isFinite(number)&&number>0?number:null};
const answerRange=type=>type==='rse'?[0,3]:[1,5];
const normalizeAnswers=(type,input)=>{
  const definition=PSYCHOMETRICS_DEFINITIONS[type],source=input&&typeof input==='object'&&!Array.isArray(input)?input:{},out={};
  const [min,max]=answerRange(type);
  for(const item of definition.items){
    if(!Object.prototype.hasOwnProperty.call(source,item.id))continue;
    try{out[item.id]=validRating(source[item.id],min,max)}catch{}
  }
  return out;
};
const complete=(type,answers)=>PSYCHOMETRICS_DEFINITIONS[type].items.every(item=>Object.prototype.hasOwnProperty.call(answers,item.id));
const keyed=(raw,key)=>key===1?raw:6-raw;
const round3=value=>Number(value.toFixed(3));
const band=mean=>mean<2.5?'Lower expression':mean<3.5?'Midrange / mixed':'Higher expression';

function quality(answers,startAt,total,clockMs){
  const values=Object.values(answers||{}).map(Number).filter(value=>value>=1&&value<=5),counts=[0,0,0,0,0,0];
  for(const value of values)counts[value]+=1;
  const mean=values.reduce((sum,value)=>sum+value,0)/(values.length||1);
  const sd=Math.sqrt(values.reduce((sum,value)=>sum+(value-mean)**2,0)/(values.length||1));
  const minutes=startAt?Math.max(0,(clockMs-startAt)/60000):null;
  const flags=[];
  if(values.length!==total)flags.push(Object.freeze({code:'incomplete',message:`Incomplete: ${values.length}/${total} items.`}));
  if(values.length&&Math.max(...counts)/(values.length||1)>.8)flags.push(Object.freeze({code:'straight-line',message:'One response option was used for more than 80% of answers; consider whether you answered mechanically.'}));
  if(values.length&&sd<.45)flags.push(Object.freeze({code:'low-variation',message:'Very little response variation was detected; consider reviewing your answers.'}));
  if(minutes!==null&&total>=90&&minutes<5)flags.push(Object.freeze({code:'fast',message:`Completion was unusually fast (${minutes.toFixed(1)} min). Speed alone does not invalidate a result, but careful responding improves usefulness.`}));
  if(!flags.length)flags.push(Object.freeze({code:'clear',message:'No obvious straight-lining, very-low-variation, or extreme-speed flag was detected.'}));
  return Object.freeze({flags:Object.freeze(flags),minutes:minutes===null?null:Number(minutes.toFixed(2)),standardDeviation:Number(sd.toFixed(3))});
}

function calculateNeo(answers,startAt,now){
  if(!complete('neo',answers))throw new Error('Answer all 120 IPIP-NEO items before calculating.');
  const facets={},domainValues={N:[],E:[],O:[],A:[],C:[]};
  for(const [facet,domain,name,items] of PSYCHOMETRICS_DEFINITIONS.neo.facets){
    const values=items.map(([text,key],index)=>{void text;const value=keyed(answers[`${facet}_${index+1}`],key);domainValues[domain].push(value);return value});
    const mean=round3(values.reduce((sum,value)=>sum+value,0)/values.length);
    facets[facet]=Object.freeze({name,domain,mean,band:band(mean)});
  }
  const domains={};
  for(const [domain,values] of Object.entries(domainValues)){
    const mean=round3(values.reduce((sum,value)=>sum+value,0)/values.length);
    domains[domain]=Object.freeze({name:PSYCHOMETRICS_DEFINITIONS.neo.domains[domain],mean,band:band(mean)});
  }
  return Object.freeze({assessment:'ipip-neo-120',date:iso(now),facets:Object.freeze(facets),domains:Object.freeze(domains),quality:quality(answers,startAt,120,millis(now))});
}

function calculateVia(answers,startAt,now){
  if(!complete('via',answers))throw new Error('Answer all 96 IPIP-VIA-R items before calculating.');
  const scores={};
  for(const [strength,name,items] of PSYCHOMETRICS_DEFINITIONS.via.strengths){
    const values=items.map(([text,key],index)=>{void text;return keyed(answers[`${strength}_${index+1}`],key)});
    const mean=round3(values.reduce((sum,value)=>sum+value,0)/values.length);
    scores[strength]=Object.freeze({name,mean,band:band(mean)});
  }
  return Object.freeze({assessment:'ipip-via-r-96',date:iso(now),scores:Object.freeze(scores),quality:quality(answers,startAt,96,millis(now))});
}

function calculateRse(answers,now){
  if(!complete('rse',answers))throw new Error('Answer all 10 Rosenberg items before calculating.');
  let score=0;
  for(const item of PSYCHOMETRICS_DEFINITIONS.rse.items){const response=answers[item.id];score+=item.key===1?3-response:response}
  return Object.freeze({assessment:'rosenberg-self-esteem-10',date:iso(now),score});
}

function normalizedDomain(type,input,now){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{},answers=normalizeAnswers(type,source.answers),startAt=validStart(source.startAt);let result=null;
  try{
    if(complete(type,answers)&&source.result&&typeof source.result==='object')result=type==='neo'?calculateNeo(answers,startAt,source.result.date||now):type==='via'?calculateVia(answers,startAt,source.result.date||now):calculateRse(answers,source.result.date||now);
  }catch{result=null}
  return {answers,result,startAt};
}

export function createPsychometricsEngine({clock=()=>new Date()}={}){
  const normalize=input=>{
    const source=input&&typeof input==='object'&&!Array.isArray(input)&&Number(input.version)===VERSION?input:{},now=clock();
    return snapshot({version:VERSION,neo:normalizedDomain('neo',source.neo,now),via:normalizedDomain('via',source.via,now),rse:normalizedDomain('rse',source.rse,now)});
  };
  const begin=(state,type)=>{assertType(type);const current=normalize(state),domain=current[type];if(domain.startAt)return current;return snapshot({...current,[type]:{...domain,startAt:millis(clock())}})};
  const answer=(state,type,id,value)=>{
    assertType(type);const definition=PSYCHOMETRICS_DEFINITIONS[type],item=definition.items.find(row=>row.id===String(id||''));if(!item)throw new Error('Unknown Psychometrics item.');
    const [min,max]=answerRange(type),next=validRating(value,min,max),current=normalize(state),domain=current[type];
    return snapshot({...current,[type]:{...domain,answers:{...domain.answers,[item.id]:next},result:null,startAt:domain.startAt||millis(clock())}});
  };
  const calculate=(state,type)=>{
    assertType(type);const current=normalize(state),domain=current[type],now=clock();
    const result=type==='neo'?calculateNeo(domain.answers,domain.startAt,now):type==='via'?calculateVia(domain.answers,domain.startAt,now):calculateRse(domain.answers,now);
    return snapshot({...current,[type]:{...domain,result}});
  };
  const reset=(state,type)=>{assertType(type);const current=normalize(state);return snapshot({...current,[type]:defaultDomain()})};
  const answered=(state,type)=>{assertType(type);return Object.keys(normalize(state)[type].answers).length};
  return Object.freeze({normalize,begin,answer,calculate,reset,answered,isComplete:(state,type)=>complete(assertType(type),normalize(state)[type].answers),definitions:PSYCHOMETRICS_DEFINITIONS,version:VERSION});
}
