const EMPTY=Object.freeze([]);

const MEMBER_TOOLS=Object.freeze([
  Object.freeze({id:'assignments',label:'Assignments',description:'Open, receive and complete congregation assignments.',route:'assignments',available:true}),
  Object.freeze({id:'calendar',label:'Calendar',description:'Open the verified Calendar for personal events, assignment due dates and congregation-shared events.',route:'calendar',available:true}),
  Object.freeze({id:'journey-groups',label:'Journey Groups',description:'Open your verified small-group workspace.',route:'journey-groups',available:true}),
  Object.freeze({id:'live-room',label:'Live Room',description:'Live Rooms remain a separate unfinished rebuild milestone (#43).',route:null,available:false})
]);

const MINISTRY_TOOLS=Object.freeze([
  Object.freeze({id:'assignment-publishing',label:'Assignment publishing',description:'Authorized ministry roles can publish from the existing Assignments owner; the server authorizes again.',route:'assignments',available:true}),
  Object.freeze({id:'leader-dashboard',label:'Leader Dashboard',description:'The retained leader dashboard is not migrated by milestone #76.',route:null,available:false})
]);

const exposeTools=tools=>tools.map(tool=>tool);

export function createMinistryHubService({congregation}={}){
  if(!congregation?.load||!congregation?.can||!congregation?.isAuthenticated)throw new Error('Ministry Hub requires the existing congregation membership owner.');

  async function load(){
    if(!congregation.isAuthenticated())return Object.freeze({status:'signed-out',congregations:EMPTY,hasReadableMembership:false,canMinistry:false,memberTools:EMPTY,ministryTools:EMPTY});
    const memberships=await congregation.load();
    const rows=(Array.isArray(memberships)?memberships:[]).map(row=>{
      const congregationId=String(row?.congregationId||'');
      const canRead=Boolean(congregationId&&congregation.can(congregationId,'read'));
      const canMinistry=Boolean(congregationId&&congregation.can(congregationId,'ministry'));
      return Object.freeze({
        congregationId,
        name:String(row?.congregation?.name||'Congregation').trim()||'Congregation',
        role:row?.role||null,
        roleKnown:Boolean(row?.roleKnown),
        roleLabel:String(row?.roleLabel||'Unsupported role'),
        canRead,
        canMinistry
      });
    }).filter(row=>row.congregationId);
    const hasReadableMembership=rows.some(row=>row.canRead);
    const canMinistry=rows.some(row=>row.canMinistry);
    return Object.freeze({
      status:'ready',
      congregations:Object.freeze(rows),
      hasReadableMembership,
      canMinistry,
      memberTools:hasReadableMembership?Object.freeze(exposeTools(MEMBER_TOOLS)):EMPTY,
      ministryTools:canMinistry?Object.freeze(exposeTools(MINISTRY_TOOLS)):EMPTY
    });
  }

  return Object.freeze({load});
}
