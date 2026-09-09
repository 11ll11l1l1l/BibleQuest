const ROLES=Object.freeze(['member','facilitator','leader','pastor','admin']);
const AWARD_ROLES=new Set(['leader','pastor','admin']);
const PRESETS=Object.freeze([
  Object.freeze({code:'consistency',icon:'🔥',title:'Consistency Award'}),
  Object.freeze({code:'scripture-explorer',icon:'📖',title:'Scripture Explorer'}),
  Object.freeze({code:'encourager',icon:'💛',title:'Encourager'}),
  Object.freeze({code:'journey-finisher',icon:'🗺️',title:'Journey Finisher'}),
  Object.freeze({code:'comeback',icon:'🌱',title:'Comeback Award'}),
  Object.freeze({code:'group-helper',icon:'🤝',title:'Group Helper'}),
  Object.freeze({code:'reflection',icon:'💭',title:'Reflection Award'}),
  Object.freeze({code:'most-improved',icon:'📈',title:'Most Improved'}),
  Object.freeze({code:'pastor-recognition',icon:'🏅',title:'Pastor / Leader Recognition'})
]);
const cleanText=(value,max)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const recognitionError=(message,code)=>{const error=new Error(message);error.code=code;return error};

function normalizeDirectory(row,congregationId){
  const scope=String(row?.congregation_id||''),userId=String(row?.user_id||''),role=String(row?.role||'').trim().toLowerCase();
  if(scope!==congregationId||!userId||!ROLES.includes(role)||row?.active===false)throw recognitionError('Recognition received malformed or out-of-scope member data.','BQ_RECOGNITION_SCOPE');
  return Object.freeze({userId,displayName:cleanText(row?.display_name,80)||'Member',role,joinedAt:row?.joined_at||null,avatar:row?.avatar&&typeof row.avatar==='object'?Object.freeze({...row.avatar}):Object.freeze({})});
}
function normalizeCatalog(row){
  const id=cleanText(row?.id,100),name=cleanText(row?.name,120),icon=cleanText(row?.icon,16),category=cleanText(row?.category,80),description=cleanText(row?.description,240);
  if(!id||!name||!icon)throw recognitionError('Recognition received malformed badge catalog data.','BQ_RECOGNITION_BADGE');
  return Object.freeze({id,name,icon,category,description});
}
function normalizeEarnedBadge(row,congregationId,memberIds,catalog){
  const scope=String(row?.congregation_id||''),userId=String(row?.user_id||''),badgeId=cleanText(row?.badge_id,100);
  if(scope!==congregationId||!userId||!memberIds.has(userId)||!badgeId)throw recognitionError('Recognition received malformed or out-of-scope earned badge data.','BQ_RECOGNITION_SCOPE');
  const meta=catalog.get(badgeId);
  return Object.freeze({userId,badgeId,name:meta?.name||badgeId,icon:meta?.icon||'🎖️',category:meta?.category||'Achievement',earnedAt:row?.earned_at||null});
}
function normalizeRecognition(row,congregationId,directory){
  const id=String(row?.id||''),scope=String(row?.congregation_id||''),userId=String(row?.user_id||''),awardedBy=String(row?.awarded_by||''),awardCode=cleanText(row?.award_code,100),title=cleanText(row?.title,120),icon=cleanText(row?.icon,16)||'🏅';
  if(!id||scope!==congregationId||!userId||!awardCode||!title||row?.visible===false)throw recognitionError('Recognition received malformed or out-of-scope award data.','BQ_RECOGNITION_SCOPE');
  const recipient=directory.get(userId);
  return Object.freeze({id,userId,displayName:recipient?.displayName||'Former member',recipientActive:Boolean(recipient),awardedBy,awardCode,title,note:cleanText(row?.note,1200),icon,createdAt:row?.created_at||null});
}

export function createCongregationRecognitionService({api,session,congregation}={}){
  if(!api?.load||!api?.award||!session||!congregation)throw new Error('Congregation Recognition requires shared API, session and congregation owners.');
  let current=Object.freeze({authenticated:false,remoteAvailable:true,status:'idle',congregations:[],congregationId:'',congregationName:'',role:'',roleLabel:'',canAward:false,members:[],recognitions:[],badges:[],presets:PRESETS});
  const sessionState=()=>session.getState?.()||{};
  const snapshot=()=>current;
  const setState=patch=>{current=Object.freeze({...current,...patch});return current};
  const requireAccount=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw recognitionError('Sign in to view congregation recognition.','BQ_RECOGNITION_AUTH_REQUIRED');if(state.remoteAvailable===false)throw recognitionError('Congregation recognition is unavailable in local preview.','BQ_RECOGNITION_REMOTE_DISABLED');return state};

  async function load({congregationId=current.congregationId}={}){
    requireAccount();
    const memberships=await congregation.load();
    const congregations=memberships.map(row=>Object.freeze({id:String(row.congregationId),name:cleanText(row.congregation?.name,100)||'Congregation',role:String(row.role||''),roleLabel:cleanText(row.roleLabel,40)||'Member',canAward:AWARD_ROLES.has(String(row.role||''))}));
    if(!congregations.length)return setState({authenticated:true,remoteAvailable:true,status:'ready',congregations,congregationId:'',congregationName:'',role:'',roleLabel:'',canAward:false,members:[],recognitions:[],badges:[]});
    const selected=congregations.find(row=>row.id===String(congregationId||''))||congregations[0];
    congregation.assert(selected.id,'read');
    const result=await api.load(selected.id);
    const members=(Array.isArray(result?.directory)?result.directory:[]).map(row=>normalizeDirectory(row,selected.id));
    const directory=new Map(members.map(row=>[row.userId,row])),memberIds=new Set(directory.keys());
    const catalogRows=(Array.isArray(result?.catalog)?result.catalog:[]).map(normalizeCatalog),catalog=new Map(catalogRows.map(row=>[row.id,row]));
    const badges=(Array.isArray(result?.badges)?result.badges:[]).map(row=>normalizeEarnedBadge(row,selected.id,memberIds,catalog));
    const recognitions=(Array.isArray(result?.recognitions)?result.recognitions:[]).map(row=>normalizeRecognition(row,selected.id,directory));
    const badgeMap=new Map();for(const badge of badges){if(!badgeMap.has(badge.userId))badgeMap.set(badge.userId,[]);badgeMap.get(badge.userId).push(badge)}
    const decorated=members.map(member=>Object.freeze({...member,badges:Object.freeze((badgeMap.get(member.userId)||[]).slice().sort((a,b)=>String(b.earnedAt||'').localeCompare(String(a.earnedAt||''))) )}));
    return setState({authenticated:true,remoteAvailable:true,status:'ready',congregations,congregationId:selected.id,congregationName:selected.name,role:selected.role,roleLabel:selected.roleLabel,canAward:selected.canAward,members:Object.freeze(decorated),recognitions:Object.freeze(recognitions),badges:Object.freeze(badges)});
  }

  async function award({targetUserId,awardCode,title='',note=''}={}){
    const state=requireAccount(),scope=current.congregations.find(row=>row.id===current.congregationId);
    if(!scope)throw recognitionError('Load an active congregation before giving recognition.','BQ_RECOGNITION_SCOPE');
    if(!scope.canAward||!AWARD_ROLES.has(scope.role))throw recognitionError('Only congregation leaders, pastors and admins can give special recognition.','BQ_RECOGNITION_PERMISSION');
    congregation.assert(scope.id,'read');
    const target=current.members.find(row=>row.userId===String(targetUserId||''));if(!target)throw recognitionError('Choose an active member of this congregation.','BQ_RECOGNITION_TARGET');
    const preset=PRESETS.find(row=>row.code===String(awardCode||''));if(!preset)throw recognitionError('Choose a supported recognition award.','BQ_RECOGNITION_AWARD');
    const payload={congregation_id:scope.id,user_id:target.userId,awarded_by:String(state.user.id),award_code:preset.code,title:cleanText(title,120)||preset.title,note:cleanText(note,1200)||null,icon:preset.icon};
    const saved=await api.award(payload);
    if(!saved||String(saved.congregation_id||'')!==scope.id||String(saved.user_id||'')!==target.userId||String(saved.awarded_by||'')!==String(state.user.id))throw recognitionError('Recognition response did not match the requested congregation award.','BQ_RECOGNITION_RESPONSE');
    return load({congregationId:scope.id});
  }
  function clear(){const state=sessionState();current=Object.freeze({authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,status:'idle',congregations:[],congregationId:'',congregationName:'',role:'',roleLabel:'',canAward:false,members:[],recognitions:[],badges:[],presets:PRESETS})}
  return Object.freeze({snapshot,load,award,clear,presets:()=>PRESETS.slice()});
}

export const congregationRecognitionContract=Object.freeze({awardRoles:Object.freeze([...AWARD_ROLES]),presets:PRESETS});
