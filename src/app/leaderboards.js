const PERIODS=Object.freeze([{id:'today',label:'Today'},{id:'week',label:'This Week'},{id:'all',label:'All Time'}]);
const LANES=Object.freeze([{id:'overall',label:'Overall'},{id:'knowledge',label:'Knowledge'},{id:'reading',label:'Reading'},{id:'wisdom',label:'Wisdom'},{id:'mastery',label:'Mastery'},{id:'consistency',label:'Consistency'},{id:'group',label:'Group'},{id:'couples',label:'Couples'}]);
const SCORE_LANES=new Set(LANES.slice(1).map(row=>row.id));
const cleanText=(value,max=80)=>String(value??'').trim().slice(0,max);
const boardError=(message,code)=>{const error=new Error(message);error.code=code;return error};
const browserTimeZone=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return 'UTC'}};

function normalizeTimeZone(value){
  const timeZone=cleanText(value,80)||browserTimeZone();
  try{new Intl.DateTimeFormat('en-US',{timeZone}).format(new Date(0));return timeZone}catch{throw boardError('Leaderboard timezone could not be calculated.','BQ_LEADERBOARD_PERIOD')}
}
function zonedParts(date,timeZone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date),map={};
  for(const part of parts)if(part.type!=='literal')map[part.type]=part.value;
  return {year:Number(map.year),month:Number(map.month),day:Number(map.day),hour:Number(map.hour),minute:Number(map.minute),second:Number(map.second)};
}
function localMidnightIso(year,month,day,timeZone){
  const desired=Date.UTC(year,month-1,day,0,0,0);let instant=desired;
  for(let i=0;i<6;i++){
    const parts=zonedParts(new Date(instant),timeZone),actual=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second),delta=desired-actual;
    if(delta===0)return new Date(instant).toISOString();
    instant+=delta;
  }
  const finalParts=zonedParts(new Date(instant),timeZone);
  if(finalParts.year!==year||finalParts.month!==month||finalParts.day!==day||finalParts.hour!==0||finalParts.minute!==0||finalParts.second!==0)throw boardError('Leaderboard period could not be calculated.','BQ_LEADERBOARD_PERIOD');
  return new Date(instant).toISOString();
}
function sinceFor(period,now=new Date(),timeZone=browserTimeZone()){
  if(period==='all')return null;
  const d=new Date(now);
  if(Number.isNaN(d.getTime()))throw boardError('Leaderboard period could not be calculated.','BQ_LEADERBOARD_PERIOD');
  const zone=normalizeTimeZone(timeZone),parts=zonedParts(d,zone);
  if(period==='today')return localMidnightIso(parts.year,parts.month,parts.day,zone);
  if(period==='week'){
    const calendar=new Date(Date.UTC(parts.year,parts.month-1,parts.day)),daysFromMonday=(calendar.getUTCDay()+6)%7;
    calendar.setUTCDate(calendar.getUTCDate()-daysFromMonday);
    return localMidnightIso(calendar.getUTCFullYear(),calendar.getUTCMonth()+1,calendar.getUTCDate(),zone);
  }
  throw boardError('Choose a supported leaderboard period.','BQ_LEADERBOARD_PERIOD');
}
function normalizeDirectory(row,congregationId){
  const scope=String(row?.congregation_id||''),userId=String(row?.user_id||'');
  if(scope!==congregationId||!userId||row?.active===false)throw boardError('Leaderboard received malformed or out-of-scope member data.','BQ_LEADERBOARD_SCOPE');
  return Object.freeze({userId,displayName:cleanText(row?.display_name)||'Member'});
}
function normalizeScore(row){
  const userId=String(row?.user_id||''),category=String(row?.category||'').trim().toLowerCase(),points=Number(row?.points);
  if(!userId||!SCORE_LANES.has(category)||!Number.isFinite(points)||points<0)throw boardError('Leaderboard received malformed score data.','BQ_LEADERBOARD_SCORE');
  return Object.freeze({userId,category,points:Math.round(points)});
}
function rank(directory,scores,lane){
  const totals=new Map(directory.map(member=>[member.userId,0]));
  for(const score of scores){
    if(!totals.has(score.userId))continue;
    if(lane==='overall'||score.category===lane)totals.set(score.userId,totals.get(score.userId)+score.points);
  }
  return Object.freeze(directory.map(member=>Object.freeze({...member,points:totals.get(member.userId)||0})).sort((a,b)=>b.points-a.points||a.displayName.localeCompare(b.displayName)||a.userId.localeCompare(b.userId)).map((row,index)=>Object.freeze({...row,rank:index+1})));
}

export function createLeaderboardsService({api,session,congregation,clock=()=>new Date()}={}){
  if(!api?.load||!session||!congregation)throw new Error('Leaderboards require shared API, session and congregation owners.');
  let current=Object.freeze({authenticated:false,remoteAvailable:true,status:'idle',congregations:[],congregationId:'',congregationName:'',period:'week',lane:'overall',rows:[],periods:PERIODS,lanes:LANES});
  const sessionState=()=>session.getState?.()||{};
  const snapshot=()=>current;
  const setState=patch=>{current=Object.freeze({...current,...patch});return current};
  const requireAccount=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw boardError('Sign in to view congregation leaderboards.','BQ_LEADERBOARD_AUTH_REQUIRED');if(state.remoteAvailable===false)throw boardError('Leaderboards are unavailable in local preview.','BQ_LEADERBOARD_REMOTE_DISABLED');return state};

  async function load({congregationId,period=current.period,lane=current.lane}={}){
    const sessionNow=requireAccount();
    if(!PERIODS.some(row=>row.id===period))throw boardError('Choose a supported leaderboard period.','BQ_LEADERBOARD_PERIOD');
    if(!LANES.some(row=>row.id===lane))throw boardError('Choose a supported leaderboard lane.','BQ_LEADERBOARD_LANE');
    const memberships=await congregation.load();
    const congregations=memberships.map(row=>Object.freeze({id:row.congregationId,name:row.congregation.name,roleLabel:row.roleLabel,timeZone:cleanText(row.congregation.timezone,80)}));
    if(!congregations.length)return setState({authenticated:true,remoteAvailable:true,status:'ready',congregations,congregationId:'',congregationName:'',period,lane,rows:[]});
    const selected=congregations.find(row=>row.id===String(congregationId||''))||congregations[0];
    congregation.assert(selected.id,'read');
    const result=await api.load(selected.id,sinceFor(period,clock(),selected.timeZone||browserTimeZone()));
    const directory=(Array.isArray(result?.directory)?result.directory:[]).map(row=>normalizeDirectory(row,selected.id));
    const scores=(Array.isArray(result?.scores)?result.scores:[]).map(normalizeScore);
    return setState({authenticated:sessionNow.authenticated===true,remoteAvailable:true,status:'ready',congregations,congregationId:selected.id,congregationName:selected.name,period,lane,rows:rank(directory,scores,lane)});
  }
  function clear(){const state=sessionState();current=Object.freeze({authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,status:'idle',congregations:[],congregationId:'',congregationName:'',period:'week',lane:'overall',rows:[],periods:PERIODS,lanes:LANES})}
  return Object.freeze({snapshot,load,clear,periods:()=>PERIODS.slice(),lanes:()=>LANES.slice()});
}

export const leaderboardContract=Object.freeze({sinceFor,rank});
