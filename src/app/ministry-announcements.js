const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin']);
const clean=(value,max)=>String(value??'').trim().slice(0,max);

export function createMinistryAnnouncementsService({api,session,congregation}={}){
  if(!api?.list||!api?.publish||!session?.getState||!congregation?.getActive||!congregation?.can)throw new Error('Ministry announcements require the existing API, session and congregation owners.');
  const context=()=>{
    const auth=session.getState();
    const active=congregation.getActive();
    const userId=auth?.authenticated&&auth.user?.id?String(auth.user.id):'';
    const congregationId=String(active?.congregationId||'');
    const role=String(active?.role||'');
    if(!userId)throw new Error('Sign in to publish congregation announcements.');
    if(!congregationId||!congregation.can(congregationId,'ministry')||!MINISTRY_ROLES.has(role))throw new Error('A ministry role in the active congregation is required.');
    return {userId,congregationId,role};
  };
  async function list(){
    const scope=context();
    const rows=await api.list(scope.congregationId);
    const after=context();
    if(after.userId!==scope.userId||after.congregationId!==scope.congregationId)throw new Error('Account or congregation changed while announcements were loading. Reload and try again.');
    return Object.freeze((Array.isArray(rows)?rows:[]).map(row=>Object.freeze({id:String(row.id),title:String(row.title||''),body:String(row.body||''),publishAt:row.publish_at||null,createdBy:String(row.created_by||'')})));
  }
  async function publish(input={}){
    const scope=context(),title=clean(input.title,120),body=clean(input.body,6000);
    if(title.length<2)throw new Error('Announcement title must be at least 2 characters.');
    if(!body)throw new Error('Write an announcement before publishing.');
    if(input.title&&String(input.title).trim().length>120)throw new Error('Announcement title must be 120 characters or fewer.');
    if(input.body&&String(input.body).trim().length>6000)throw new Error('Announcement must be 6,000 characters or fewer.');
    const row=await api.publish(scope.userId,scope.congregationId,{title,body});
    const after=context();
    if(after.userId!==scope.userId||after.congregationId!==scope.congregationId)throw new Error('Congregation changed during publish. Check the announcement list before retrying.');
    return Object.freeze({id:String(row?.id||''),title:String(row?.title||title),publishAt:row?.publish_at||null});
  }
  return Object.freeze({list,publish});
}
