const TEAM_TYPE='game_team';
const ROLES=Object.freeze(['member','facilitator','leader','pastor','admin']);
const ROLE_LABELS=Object.freeze({member:'Member',facilitator:'Facilitator',leader:'Leader',pastor:'Pastor',admin:'Admin'});
const cleanText=(value,max=120)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const teamError=(message,code)=>{const error=new Error(message);error.code=code;return error};

function normalizeTeam(row,allowedCongregations){
  const id=String(row?.id||''),congregationId=String(row?.congregation_id||''),createdBy=String(row?.created_by||''),name=cleanText(row?.name,60),teamType=String(row?.team_type||'');
  if(!id||!congregationId||!allowedCongregations.has(congregationId)||!name||teamType!==TEAM_TYPE||row?.active===false)throw teamError('Team Center received malformed or out-of-scope team data.','BQ_TEAM_CENTER_SCOPE');
  return Object.freeze({id,congregationId,createdBy,name,teamType,createdAt:row?.created_at||null});
}
function normalizeMember(row,allowedTeams){
  const teamId=String(row?.team_id||''),userId=String(row?.user_id||'');
  if(!teamId||!allowedTeams.has(teamId)||!userId)throw teamError('Team Center received malformed or out-of-scope team membership data.','BQ_TEAM_CENTER_SCOPE');
  return Object.freeze({teamId,userId,joinedAt:row?.joined_at||null});
}
function normalizeDirectory(row,allowedCongregations){
  const congregationId=String(row?.congregation_id||''),userId=String(row?.user_id||''),role=String(row?.role||'').trim().toLowerCase();
  if(!congregationId||!allowedCongregations.has(congregationId)||!userId||!ROLES.includes(role)||row?.active===false)throw teamError('Team Center received malformed or out-of-scope congregation member data.','BQ_TEAM_CENTER_SCOPE');
  return Object.freeze({congregationId,userId,displayName:cleanText(row?.display_name,80)||'Member',role,roleLabel:ROLE_LABELS[role],joinedAt:row?.joined_at||null});
}

export function createTeamCenterService({api,session,congregation}){
  if(!api||!session||!congregation)throw new Error('Team Center requires shared API, session and congregation owners.');
  let teams=[],congregations=[],directory=[],contextUserId='',contextCongregationId='',loadRequest=0;
  const sessionState=()=>session.getState?.()||{};
  const currentUserId=()=>{const state=sessionState();return state.authenticated&&state.user?.id?String(state.user.id):''};
  const activeCongregationId=()=>String(congregation.getActive?.()?.congregationId||'');
  const identity=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw teamError('Sign in to use Team Center.','BQ_TEAM_CENTER_AUTH_REQUIRED');if(state.remoteAvailable===false)throw teamError('Team Center is unavailable in local preview.','BQ_TEAM_CENTER_REMOTE_DISABLED');return String(state.user.id)};
  const staleContext=()=>teamError('The account or active congregation changed. Reload Team Center before continuing.','BQ_TEAM_CENTER_CONTEXT_STALE');
  const clearContext=(userId='')=>{teams=[];congregations=[];directory=[];contextUserId=String(userId||'');contextCongregationId=''};
  const contextCurrent=(userId,congregationId=contextCongregationId)=>Boolean(userId)&&Boolean(congregationId)&&contextUserId===userId&&currentUserId()===userId&&contextCongregationId===String(congregationId)&&activeCongregationId()===String(congregationId);
  const snapshot=()=>{const state=sessionState(),userId=currentUserId(),activeId=activeCongregationId(),visible=!contextUserId||(contextUserId===userId&&(!contextCongregationId||contextCongregationId===activeId));return Object.freeze({authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,activeCongregationId:visible?contextCongregationId:'',teams:visible?teams.slice():[],congregations:visible?congregations.slice():[],directory:visible?directory.slice():[]})};
  const findTeam=id=>contextCurrent(currentUserId())?teams.find(row=>row.id===String(id||''))||null:null;
  const requireLoadedCongregation=(userId,congregationId)=>{const id=String(congregationId||'');if(!contextCurrent(userId,id))throw staleContext();return id};
  const requireManage=team=>{const userId=currentUserId();if(!team||!contextCurrent(userId,team.congregationId))throw staleContext();if(!team.canManage)throw teamError('Your congregation role does not allow this Team Center action.','BQ_TEAM_CENTER_PERMISSION');congregation.assert(team.congregationId,'ministry');return team};

  async function load(){
    const userId=identity(),request=++loadRequest;if(contextUserId!==userId)clearContext(userId);
    let memberships;
    try{memberships=await congregation.load()}catch(error){if(request!==loadRequest||currentUserId()!==userId)return snapshot();throw error}
    if(request!==loadRequest||currentUserId()!==userId)return snapshot();
    const activeId=activeCongregationId(),activeMembership=(Array.isArray(memberships)?memberships:[]).find(row=>String(row?.congregationId||'')===activeId&&(!row?.userId||String(row.userId)===userId))||null;
    const nextCongregations=(Array.isArray(memberships)?memberships:[]).map(row=>{const id=String(row?.congregationId||''),isActive=Boolean(activeMembership&&id===activeId);return Object.freeze({id,name:row?.congregation?.name||'Congregation',role:row?.role,roleLabel:row?.roleLabel,isActive,canManage:isActive&&congregation.can(id,'ministry')})}).filter(row=>row.id);
    if(contextCongregationId&&contextCongregationId!==activeId){teams=[];directory=[];contextCongregationId=''}
    if(!activeMembership){congregations=nextCongregations;teams=[];directory=[];contextCongregationId='';return snapshot()}
    let result;
    try{result=await api.list(activeId)}catch(error){if(request!==loadRequest||currentUserId()!==userId||activeCongregationId()!==activeId)return snapshot();throw error}
    if(request!==loadRequest||currentUserId()!==userId||activeCongregationId()!==activeId)return snapshot();
    const allowedCongregations=new Set([activeId]),rawTeams=Array.isArray(result?.teams)?result.teams:[],rawMembers=Array.isArray(result?.members)?result.members:[],rawDirectory=Array.isArray(result?.directory)?result.directory:[];
    const normalizedTeams=rawTeams.map(row=>normalizeTeam(row,allowedCongregations)),allowedTeams=new Set(normalizedTeams.map(row=>row.id));
    const members=rawMembers.map(row=>normalizeMember(row,allowedTeams));
    const nextDirectory=rawDirectory.map(row=>normalizeDirectory(row,allowedCongregations));
    const directoryKey=new Map(nextDirectory.map(row=>[`${row.congregationId}:${row.userId}`,row]));
    const ownCongregation=nextCongregations.find(row=>row.isActive);if(!ownCongregation)return snapshot();
    const nextTeams=normalizedTeams.map(team=>{
      const teamMembers=members.filter(member=>member.teamId===team.id).map(member=>{const profile=directoryKey.get(`${team.congregationId}:${member.userId}`);return Object.freeze({...member,displayName:profile?.displayName||'Former member',role:profile?.role||null,roleLabel:profile?.roleLabel||'Membership unavailable',activeCongregationMember:Boolean(profile),isCreator:member.userId===team.createdBy})});
      const memberIds=new Set(teamMembers.map(member=>member.userId));
      const availableMembers=nextDirectory.filter(row=>!memberIds.has(row.userId));
      const canManage=ownCongregation.canManage===true,canArchive=canManage&&(team.createdBy===userId||ownCongregation.role==='admin');
      return Object.freeze({...team,congregationName:ownCongregation.name,congregationRole:ownCongregation.role,congregationRoleLabel:ownCongregation.roleLabel,members:Object.freeze(teamMembers),memberCount:teamMembers.length,availableMembers:Object.freeze(availableMembers),canManage,canArchive});
    }).sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
    if(request!==loadRequest||currentUserId()!==userId||activeCongregationId()!==activeId)return snapshot();
    contextUserId=userId;contextCongregationId=activeId;congregations=nextCongregations;directory=nextDirectory;teams=nextTeams;return snapshot();
  }

  async function create({congregationId,name}={}){
    const userId=identity(),id=requireLoadedCongregation(userId,congregationId);congregation.assert(id,'ministry');const title=cleanText(name,60);if(title.length<2)throw teamError('Enter a team name.','BQ_TEAM_CENTER_NAME');
    await api.create(id,title);if(!contextCurrent(userId,id))throw staleContext();await load();return snapshot();
  }
  async function addMember(teamId,targetUserId){
    const userId=identity(),team=requireManage(findTeam(teamId)),tenantId=team.congregationId,target=team.availableMembers.find(row=>row.userId===String(targetUserId||''));if(!target)throw teamError('Choose an active congregation member who is not already on this team.','BQ_TEAM_CENTER_TARGET');
    await api.add(tenantId,team.id,target.userId);if(!contextCurrent(userId,tenantId))throw staleContext();await load();return snapshot();
  }
  async function removeMember(teamId,targetUserId){
    const userId=identity(),team=requireManage(findTeam(teamId)),tenantId=team.congregationId,member=team.members.find(row=>row.userId===String(targetUserId||''));if(!member)throw teamError('That account is not a member of this team.','BQ_TEAM_CENTER_TARGET');if(member.isCreator)throw teamError('The team creator stays a member while the team is active.','BQ_TEAM_CENTER_CREATOR_MEMBER');
    await api.remove(tenantId,team.id,member.userId);if(!contextCurrent(userId,tenantId))throw staleContext();await load();return snapshot();
  }
  async function rename(teamId,name){
    const userId=identity(),team=requireManage(findTeam(teamId)),tenantId=team.congregationId,title=cleanText(name,60);if(title.length<2)throw teamError('Enter a team name.','BQ_TEAM_CENTER_NAME');await api.rename(tenantId,team.id,title);if(!contextCurrent(userId,tenantId))throw staleContext();await load();return snapshot();
  }
  async function archive(teamId){
    const userId=identity(),team=findTeam(teamId);if(!team||!contextCurrent(userId,team.congregationId))throw staleContext();if(!team.canArchive)throw teamError('Only the team creator or congregation admin can archive this team.','BQ_TEAM_CENTER_PERMISSION');const tenantId=team.congregationId;congregation.assert(tenantId,'ministry');await api.archive(tenantId,team.id);if(!contextCurrent(userId,tenantId))throw staleContext();await load();return snapshot();
  }
  function clear(){loadRequest++;clearContext()}
  return Object.freeze({snapshot,load,create,addMember,removeMember,rename,archive,clear});
}
