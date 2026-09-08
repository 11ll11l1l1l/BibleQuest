const GROUP_CODE=/^[A-Z0-9]{8}$/;
const MIN_MEMBERS=2,MAX_MEMBERS=6;
const cleanText=(value,max=240)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const groupError=(message,code)=>{const error=new Error(message);error.code=code;return error};
function normalizeGroup(row){
  const id=String(row?.id||''),congregationId=String(row?.congregation_id||''),ownerId=String(row?.owner_id||''),name=cleanText(row?.name,60),maxMembers=Number(row?.max_members);
  if(!id||!congregationId||!name||!Number.isInteger(maxMembers)||maxMembers<MIN_MEMBERS||maxMembers>MAX_MEMBERS)throw groupError('Journey Groups received malformed group data.','BQ_JOURNEY_GROUPS_MALFORMED');
  return {id,congregationId,ownerId,name,description:cleanText(row?.description,240),scheduleText:cleanText(row?.schedule_text,100),maxMembers,active:row?.active!==false};
}
function normalizeMember(row,allowed){
  const groupId=String(row?.group_id||''),userId=String(row?.user_id||''),role=String(row?.role||'');
  if(!groupId||!allowed.has(groupId)||!userId||!['leader','member'].includes(role))throw groupError('Journey Groups received malformed membership data.','BQ_JOURNEY_GROUPS_MALFORMED');
  return Object.freeze({groupId,userId,role,joinedAt:row?.joined_at||null});
}
const normalizeCode=value=>cleanText(value,24).toUpperCase().replace(/[^A-Z0-9]/g,'');
export function createJourneyGroupsService({api,session,congregation}){
  if(!api||!session||!congregation)throw new Error('Journey Groups requires shared API, session and congregation owners.');
  let groups=[],congregations=[],inviteCode='',inviteGroupId='';
  const sessionState=()=>session.getState?.()||{};
  const identity=()=>{const state=sessionState();if(!state.authenticated||!state.user?.id)throw groupError('Sign in to use Journey Groups.','BQ_JOURNEY_GROUPS_AUTH_REQUIRED');if(state.remoteAvailable===false)throw groupError('Journey Groups are unavailable in local preview.','BQ_JOURNEY_GROUPS_REMOTE_DISABLED');return String(state.user.id)};
  const snapshot=()=>Object.freeze({authenticated:sessionState().authenticated===true,remoteAvailable:sessionState().remoteAvailable!==false,groups:groups.slice(),congregations:congregations.slice(),inviteCode,inviteGroupId});
  async function load(){
    const userId=identity(),memberships=await congregation.load();
    congregations=memberships.map(row=>Object.freeze({id:row.congregationId,name:row.congregation.name,role:row.role,roleLabel:row.roleLabel,canCreate:congregation.can(row.congregationId,'ministry')}));
    const result=await api.list(userId),rawGroups=Array.isArray(result?.groups)?result.groups:[],rawMembers=Array.isArray(result?.members)?result.members:[];
    const normalized=rawGroups.map(normalizeGroup),allowed=new Set(normalized.map(group=>group.id)),members=rawMembers.map(row=>normalizeMember(row,allowed));
    groups=normalized.map(group=>{const groupMembers=members.filter(member=>member.groupId===group.id),mine=groupMembers.find(member=>member.userId===userId);if(!mine)throw groupError('Journey Groups returned a group without this account membership.','BQ_JOURNEY_GROUPS_PERMISSION');return Object.freeze({...group,members:Object.freeze(groupMembers),memberCount:groupMembers.length,role:mine.role,isLeader:mine.role==='leader'||group.ownerId===userId,canLeave:group.ownerId!==userId})}).sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
    if(inviteGroupId&&!groups.some(group=>group.id===inviteGroupId)){inviteCode='';inviteGroupId=''}return snapshot();
  }
  async function create({congregationId,name,description='',scheduleText='',maxMembers=MAX_MEMBERS}={}){
    identity();const id=String(congregationId||'');congregation.assert(id,'ministry');const title=cleanText(name,60),max=Number(maxMembers);
    if(title.length<2)throw groupError('Enter a Journey Group name.','BQ_JOURNEY_GROUPS_NAME');if(!Number.isInteger(max)||max<MIN_MEMBERS||max>MAX_MEMBERS)throw groupError('Journey Groups support 2–6 members.','BQ_JOURNEY_GROUPS_SIZE');
    const result=await api.create({congregation_id:id,name:title,description:cleanText(description,240),schedule_text:cleanText(scheduleText,100),max_members:max}),code=normalizeCode(result?.invite_code);
    if(!GROUP_CODE.test(code))throw groupError('Journey Groups did not return a valid 8-character group code.','BQ_JOURNEY_GROUPS_MALFORMED');inviteCode=code;inviteGroupId=String(result?.group?.id||'');await load();return snapshot();
  }
  async function join(rawCode){identity();const code=normalizeCode(rawCode);if(!GROUP_CODE.test(code))throw groupError('Enter the 8-character Journey Group code.','BQ_JOURNEY_GROUPS_CODE');await api.join(code);inviteCode='';inviteGroupId='';await load();return snapshot()}
  async function rotateCode(groupId){identity();const group=groups.find(row=>row.id===String(groupId||''));if(!group?.isLeader)throw groupError('Only a Journey Group leader can create a new code.','BQ_JOURNEY_GROUPS_PERMISSION');const result=await api.rotateCode(group.id),code=normalizeCode(result?.invite_code);if(!GROUP_CODE.test(code))throw groupError('Journey Groups did not return a valid 8-character group code.','BQ_JOURNEY_GROUPS_MALFORMED');inviteCode=code;inviteGroupId=group.id;return snapshot()}
  async function leave(groupId){const userId=identity(),group=groups.find(row=>row.id===String(groupId||''));if(!group||!group.members.some(member=>member.userId===userId))throw groupError('This account is not an active member of that Journey Group.','BQ_JOURNEY_GROUPS_PERMISSION');if(!group.canLeave)throw groupError('The group owner cannot leave until leadership is transferred or the group is archived.','BQ_JOURNEY_GROUPS_OWNER_LEAVE');await api.leave(group.id);if(inviteGroupId===group.id){inviteCode='';inviteGroupId=''}await load();return snapshot()}
  function clear(){groups=[];congregations=[];inviteCode='';inviteGroupId=''}
  return Object.freeze({snapshot,load,create,join,rotateCode,leave,clear});
}
