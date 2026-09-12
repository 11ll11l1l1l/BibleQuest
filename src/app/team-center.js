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
  let teams=[],congregations=[],directory=[],contextUserId='';
  const sessionState=()=>session.getState?.()||{};
  const identity=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw teamError('Sign in to use Team Center.','BQ_TEAM_CENTER_AUTH_REQUIRED');if(state.remoteAvailable===false)throw teamError('Team Center is unavailable in local preview.','BQ_TEAM_CENTER_REMOTE_DISABLED');return String(state.user.id)};
  const snapshot=()=>Object.freeze({authenticated:sessionState().authenticated===true,remoteAvailable:sessionState().remoteAvailable!==false,teams:teams.slice(),congregations:congregations.slice(),directory:directory.slice()});
  const findTeam=id=>teams.find(row=>row.id===String(id||''))||null;
  const requireManage=team=>{if(!team||!team.canManage)throw teamError('Your congregation role does not allow this Team Center action.','BQ_TEAM_CENTER_PERMISSION');congregation.assert(team.congregationId,'ministry');return team};

  async function load(){
    const userId=identity();if(contextUserId!==userId){teams=[];congregations=[];directory=[];contextUserId=userId}const memberships=await congregation.load();
    congregations=memberships.map(row=>Object.freeze({id:row.congregationId,name:row.congregation.name,role:row.role,roleLabel:row.roleLabel,canManage:congregation.can(row.congregationId,'ministry')}));
    const congregationIds=congregations.map(row=>row.id),allowedCongregations=new Set(congregationIds);
    if(!congregationIds.length){teams=[];directory=[];return snapshot()}
    const result=await api.list(congregationIds),rawTeams=Array.isArray(result?.teams)?result.teams:[],rawMembers=Array.isArray(result?.members)?result.members:[],rawDirectory=Array.isArray(result?.directory)?result.directory:[];
    const normalizedTeams=rawTeams.map(row=>normalizeTeam(row,allowedCongregations)),allowedTeams=new Set(normalizedTeams.map(row=>row.id));
    const members=rawMembers.map(row=>normalizeMember(row,allowedTeams));
    directory=rawDirectory.map(row=>normalizeDirectory(row,allowedCongregations));
    const directoryKey=new Map(directory.map(row=>[`${row.congregationId}:${row.userId}`,row]));
    teams=normalizedTeams.map(team=>{
      const ownCongregation=congregations.find(row=>row.id===team.congregationId);if(!ownCongregation)throw teamError('Team Center received a team outside this account congregation scope.','BQ_TEAM_CENTER_SCOPE');
      const teamMembers=members.filter(member=>member.teamId===team.id).map(member=>{const profile=directoryKey.get(`${team.congregationId}:${member.userId}`);return Object.freeze({...member,displayName:profile?.displayName||'Former member',role:profile?.role||null,roleLabel:profile?.roleLabel||'Membership unavailable',activeCongregationMember:Boolean(profile),isCreator:member.userId===team.createdBy})});
      const memberIds=new Set(teamMembers.map(member=>member.userId));
      const availableMembers=directory.filter(row=>row.congregationId===team.congregationId&&!memberIds.has(row.userId));
      const canManage=ownCongregation.canManage===true,canArchive=canManage&&(team.createdBy===userId||ownCongregation.role==='admin');
      return Object.freeze({...team,congregationName:ownCongregation.name,congregationRole:ownCongregation.role,congregationRoleLabel:ownCongregation.roleLabel,members:Object.freeze(teamMembers),memberCount:teamMembers.length,availableMembers:Object.freeze(availableMembers),canManage,canArchive});
    }).sort((a,b)=>a.congregationName.localeCompare(b.congregationName)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
    return snapshot();
  }

  async function create({congregationId,name}={}){
    identity();const id=String(congregationId||'');congregation.assert(id,'ministry');const title=cleanText(name,60);if(title.length<2)throw teamError('Enter a team name.','BQ_TEAM_CENTER_NAME');
    await api.create(id,title);await load();return snapshot();
  }
  async function addMember(teamId,targetUserId){
    identity();const team=requireManage(findTeam(teamId)),target=team.availableMembers.find(row=>row.userId===String(targetUserId||''));if(!target)throw teamError('Choose an active congregation member who is not already on this team.','BQ_TEAM_CENTER_TARGET');
    await api.add(team.congregationId,team.id,target.userId);await load();return snapshot();
  }
  async function removeMember(teamId,targetUserId){
    identity();const team=requireManage(findTeam(teamId)),member=team.members.find(row=>row.userId===String(targetUserId||''));if(!member)throw teamError('That account is not a member of this team.','BQ_TEAM_CENTER_TARGET');if(member.isCreator)throw teamError('The team creator stays a member while the team is active.','BQ_TEAM_CENTER_CREATOR_MEMBER');
    await api.remove(team.congregationId,team.id,member.userId);await load();return snapshot();
  }
  async function rename(teamId,name){
    identity();const team=requireManage(findTeam(teamId)),title=cleanText(name,60);if(title.length<2)throw teamError('Enter a team name.','BQ_TEAM_CENTER_NAME');await api.rename(team.congregationId,team.id,title);await load();return snapshot();
  }
  async function archive(teamId){
    identity();const team=findTeam(teamId);if(!team?.canArchive)throw teamError('Only the team creator or congregation admin can archive this team.','BQ_TEAM_CENTER_PERMISSION');congregation.assert(team.congregationId,'ministry');await api.archive(team.congregationId,team.id);await load();return snapshot();
  }
  function clear(){teams=[];congregations=[];directory=[];contextUserId=''}
  return Object.freeze({snapshot,load,create,addMember,removeMember,rename,archive,clear});
}
