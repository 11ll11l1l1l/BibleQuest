const SCHEMA=1;
const ASSESSMENT_VERSION='bq_quick_transform_ipip20_v1';
const SOURCE='Quick Transform Personality Foundations';
const FACTORS=Object.freeze({
  E:'Extraversion',A:'Agreeableness',C:'Conscientiousness',S:'Emotional Stability',O:'Openness / Intellect'
});
const BANDS=new Set(['Lower expression','Midrange / mixed','Higher expression']);

function fail(code,message){const error=new Error(message);error.code=code;throw error}
const iso=value=>{const date=new Date(String(value||''));if(!Number.isFinite(date.getTime()))fail('BQ_PERSONALITY_PROFILE_RESULT','Personality profile date was invalid.');return date.toISOString()};
const clone=value=>structuredClone(value);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value))Object.values(value).forEach(freeze);return value&&typeof value==='object'?Object.freeze(value):value};

function normalizeResult(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('BQ_PERSONALITY_PROFILE_RESULT','A completed Quick Transform personality result is required.');
  const scores={};
  for(const [factor,name] of Object.entries(FACTORS)){
    const raw=input.scores?.[factor],mean=Number(raw?.mean),band=String(raw?.band||'');
    if(!Number.isFinite(mean)||mean<1||mean>5||!BANDS.has(band))fail('BQ_PERSONALITY_PROFILE_RESULT',`Personality result for ${name} was invalid.`);
    scores[factor]=Object.freeze({name,mean:Number(mean.toFixed(2)),band});
  }
  return Object.freeze({date:iso(input.date),scores:Object.freeze(scores)});
}

function presentationProfile(result){
  const mean=factor=>Number(result.scores[factor].mean);
  return Object.freeze({
    schema:1,
    contentBoundary:'presentation-only',
    depth:mean('O')>3.4?'deeper-context':mean('O')<2.6?'concrete-first':'balanced',
    structure:mean('C')>3.4?'structured':mean('C')<2.6?'small-steps':'balanced',
    interaction:mean('E')>3.4?'interactive':mean('E')<2.6?'reflective':'balanced',
    challengeStyle:mean('A')<2.6?'direct-evidence-first':mean('A')>3.4?'cooperative':'balanced',
    pacing:mean('S')<2.6?'calm-short-steps':'normal'
  });
}

function normalizeSaved(input,owner){
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.schema)!==SCHEMA)return null;
  if(String(input.assessmentVersion||'')!==ASSESSMENT_VERSION||String(input.owner||'')!==owner)return null;
  try{
    const result=normalizeResult(input.result),savedAt=iso(input.savedAt),presentation=presentationProfile(result);
    return freeze({schema:SCHEMA,assessmentVersion:ASSESSMENT_VERSION,source:SOURCE,owner,scope:owner.startsWith('account:')?'account-device':'guest-device',result,presentation,savedAt});
  }catch{return null}
}

export function createPersonalityProfileService({session,privateStorage,clock=()=>new Date()}){
  if(!session?.getState||!privateStorage?.read||!privateStorage?.write||!privateStorage?.remove)throw new Error('Personality Profile requires Session and private storage owners.');
  const owner=()=>{const state=session.getState();return state?.authenticated&&state?.user?.id?`account:${state.user.id}`:'guest'};
  const key=current=>`personality-profile:${current}`;

  function load(){
    const current=owner(),saved=normalizeSaved(privateStorage.read(key(current),null),current);
    return freeze({status:saved?'ready':'empty',owner:current,scope:current.startsWith('account:')?'account-device':'guest-device',profile:saved});
  }

  function capture(result){
    const current=owner(),normalized=normalizeResult(result),record=freeze({schema:SCHEMA,assessmentVersion:ASSESSMENT_VERSION,source:SOURCE,owner:current,scope:current.startsWith('account:')?'account-device':'guest-device',result:normalized,presentation:presentationProfile(normalized),savedAt:iso(clock())});
    privateStorage.write(key(current),clone(record));
    return record;
  }

  function clear(){const current=owner();privateStorage.remove(key(current));return load()}
  return Object.freeze({load,capture,clear,assessmentVersion:ASSESSMENT_VERSION,source:SOURCE,factors:Object.freeze({...FACTORS})});
}
