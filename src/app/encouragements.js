const PRESETS=Object.freeze({
  pray:Object.freeze({emoji:'🙏',label:'Praying for you'}),
  cheer:Object.freeze({emoji:'👏',label:'Keep going!'}),
  heart:Object.freeze({emoji:'💛',label:'Glad we’re growing together'}),
  word:Object.freeze({emoji:'📖',label:'Keep in the Word'}),
  flame:Object.freeze({emoji:'🔥',label:'Nice consistency!'})
});

const encouragementError=(message,code)=>{const error=new Error(message);error.code=code;return error};
const utcDay=value=>{const time=Date.parse(value);return Number.isFinite(time)?new Date(time).toISOString().slice(0,10):''};

function normalize(row,groups){
  const id=String(row?.id||''),groupId=String(row?.group_id||''),senderId=String(row?.sender_id||''),kind=String(row?.kind||''),createdAt=String(row?.created_at||'');
  const group=groups.find(item=>item.id===groupId);
  if(!id||!group||!senderId||!group.members.some(member=>member.userId===senderId)||!PRESETS[kind]||!utcDay(createdAt))throw encouragementError('Encouragements received malformed or unauthorized data.','BQ_ENCOURAGEMENTS_MALFORMED');
  if(row?.recipient_id!==null&&row?.recipient_id!==undefined)throw encouragementError('Targeted encouragements are not enabled in this milestone.','BQ_ENCOURAGEMENTS_SCOPE');
  return Object.freeze({id,groupId,senderId,kind,createdAt,day:utcDay(createdAt),...PRESETS[kind]});
}

export function createEncouragementsService({api,session,journeyGroups,now=()=>new Date()}={}){
  if(!api||!session||!journeyGroups)throw new Error('Encouragements requires shared API, session and Journey Groups owners.');
  let groups=[],items=[];
  const sessionState=()=>session.getState?.()||{};
  const identity=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw encouragementError('Sign in to use Encouragements.','BQ_ENCOURAGEMENTS_AUTH_REQUIRED');if(state.remoteAvailable===false)throw encouragementError('Encouragements are unavailable in local preview.','BQ_ENCOURAGEMENTS_REMOTE_DISABLED');return String(state.user.id)};
  const snapshot=()=>Object.freeze({authenticated:sessionState().authenticated===true,remoteAvailable:sessionState().remoteAvailable!==false,userId:String(sessionState().user?.id||''),groups:groups.slice(),items:items.slice(),presets:PRESETS});
  async function load(){identity();const groupState=await journeyGroups.load();groups=groupState.groups.slice();const allowed=new Set(groups.map(group=>group.id));const rows=groups.length?await api.list([...allowed]):[];items=(Array.isArray(rows)?rows:[]).map(row=>normalize(row,groups)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));return snapshot()}
  async function send(groupId,kind){const userId=identity(),id=String(groupId||''),preset=String(kind||''),group=groups.find(row=>row.id===id);if(!group||!group.members.some(member=>member.userId===userId))throw encouragementError('You can encourage only an active Journey Group you belong to.','BQ_ENCOURAGEMENTS_PERMISSION');if(!PRESETS[preset])throw encouragementError('Choose a supported encouragement.','BQ_ENCOURAGEMENTS_KIND');const day=utcDay(now());if(items.some(item=>item.groupId===id&&item.senderId===userId&&item.kind===preset&&item.day===day))throw encouragementError('You already sent that encouragement to this group today.','BQ_ENCOURAGEMENTS_DUPLICATE');await api.send(id,preset);return load()}
  function clear(){groups=[];items=[]}
  return Object.freeze({snapshot,load,send,clear});
}
