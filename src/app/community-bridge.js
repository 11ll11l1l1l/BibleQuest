const DESTINATIONS=Object.freeze([
  Object.freeze({id:'congregation',label:'Membership & role'}),
  Object.freeze({id:'journey-groups',label:'Journey Groups'}),
  Object.freeze({id:'encouragements',label:'Encouragements'})
]);
const bridgeError=(message,code)=>{const error=new Error(message);error.code=code;return error};
const clean=value=>String(value??'').trim();
const ROLES=new Set(['member','facilitator','leader','pastor','admin']),MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin']);

function projectMembership(row){
  const id=clean(row?.congregationId),name=clean(row?.congregation?.name),role=clean(row?.role),roleLabel=clean(row?.roleLabel);
  if(!id||!name||!roleLabel||row?.roleKnown!==true||!ROLES.has(role))throw bridgeError('Community Bridge received malformed congregation data.','BQ_COMMUNITY_BRIDGE_MALFORMED');
  return Object.freeze({id,name,role,roleLabel,canMinistry:MINISTRY_ROLES.has(role)});
}
function projectGroup(row,allowedCongregations){
  const id=clean(row?.id),congregationId=clean(row?.congregationId),name=clean(row?.name),role=clean(row?.role),memberCount=Number(row?.memberCount),maxMembers=Number(row?.maxMembers);
  if(!id||!allowedCongregations.has(congregationId)||!name||!['leader','member'].includes(role)||!Number.isInteger(memberCount)||!Number.isInteger(maxMembers)||memberCount<1||memberCount>maxMembers)throw bridgeError('Community Bridge rejected out-of-scope Journey Group data.','BQ_COMMUNITY_BRIDGE_SCOPE');
  return Object.freeze({id,congregationId,name,role,memberCount,maxMembers});
}

export function createCommunityBridgeService({session,congregation,journeyGroups,encouragements}={}){
  if(!session||!congregation||!journeyGroups||!encouragements)throw new Error('Community Bridge requires verified session, congregation, Journey Groups and Encouragements owners.');
  const sessionState=()=>session.getState?.()||{};
  const unavailable=state=>Object.freeze({status:state.authenticated?state.remoteAvailable===false?'local-preview':'unavailable':'signed-out',authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,congregations:[],groups:[],encouragementCount:0,destinations:DESTINATIONS});
  function snapshot(){
    const state=sessionState();
    if(!state.authenticated||state.remoteAvailable===false)return unavailable(state);
    const congregations=congregation.list().map(projectMembership),allowedCongregations=new Set(congregations.map(row=>row.id));
    const groups=journeyGroups.snapshot().groups.map(row=>projectGroup(row,allowedCongregations)),allowedGroups=new Set(groups.map(row=>row.id));
    const items=encouragements.snapshot().items;
    if(!Array.isArray(items)||items.some(item=>!allowedGroups.has(clean(item?.groupId))))throw bridgeError('Community Bridge rejected out-of-scope Encouragement data.','BQ_COMMUNITY_BRIDGE_SCOPE');
    return Object.freeze({status:'ready',authenticated:true,remoteAvailable:true,congregations:Object.freeze(congregations),groups:Object.freeze(groups),encouragementCount:items.length,destinations:DESTINATIONS});
  }
  async function load(){
    const state=sessionState();
    if(!state.authenticated||state.remoteAvailable===false)return unavailable(state);
    await encouragements.load();
    return snapshot();
  }
  const clear=()=>{};
  return Object.freeze({load,snapshot,clear,destinations:()=>DESTINATIONS.slice()});
}
