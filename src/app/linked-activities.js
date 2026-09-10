const KNOWN_KINDS=Object.freeze(['reader','reading','guided-study','mission','wisdom','journey','live','couples','group','reflection','quiz']);
const ROUTES=Object.freeze({reader:'reader',reading:'reader','guided-study':'study',mission:'mission',wisdom:'wisdom-situations',journey:'mission',couples:'couples-cloud',group:'journey-groups',reflection:'cloud-notes',quiz:'open-review'});
const FALLBACK=Object.freeze({reading:'reading','guided-study':'guided-study',mission:'mission',quiz:'quiz',reflection:'reflection',couples:'couples',group:'group'});

function fail(code,message){const error=new Error(message);error.code=code;throw error}
const text=(value,max=80)=>String(value??'').trim().slice(0,max);

export function normalizeLinkedActivity(value){
  if(value===null||value===undefined)return null;
  if(typeof value!=='object'||Array.isArray(value))fail('BQ_LINKED_ACTIVITY_RESPONSE','Linked activity data was malformed.');
  const rawKind=text(value.kind,40).toLowerCase();
  if(!rawKind)return null;
  if(!KNOWN_KINDS.includes(rawKind))fail('BQ_LINKED_ACTIVITY_KIND','Linked activity used an unsupported destination.');
  const ref=text(value.ref??value.activity_ref??'',160)||'';
  return Object.freeze({kind:rawKind,ref});
}

export const linkedActivitiesContract=Object.freeze({
  kinds:KNOWN_KINDS.slice(),
  routes:Object.freeze({...ROUTES}),
  fallback:Object.freeze({...FALLBACK}),
  liveRoomsAvailable:false,
  completionOwner:'assignments'
});

export function createLinkedActivitiesService({assignments}){
  if(!assignments?.snapshot||!assignments?.start||!assignments?.complete)throw new Error('Linked Activities requires the verified Assignments owner.');

  const assignment=id=>{
    const state=assignments.snapshot();
    if(state.status!=='ready')fail('BQ_LINKED_ACTIVITY_NOT_READY','Assignments are not ready yet.');
    const row=state.assignments.find(item=>item.id===String(id||state.activeId||''));
    if(!row)fail('BQ_LINKED_ACTIVITY_NOT_FOUND','This linked assignment is no longer available.');
    return row;
  };

  function describe(input){
    const row=typeof input==='string'?assignment(input):input;
    if(!row?.id)fail('BQ_LINKED_ACTIVITY_NOT_FOUND','This linked assignment is no longer available.');
    const explicit=normalizeLinkedActivity(row.linkedActivity)?.kind||'';
    const kind=explicit||FALLBACK[row.type]||'';
    if(!kind)return Object.freeze({present:false,available:false,kind:'',route:'',reason:'instruction-only'});
    if(!KNOWN_KINDS.includes(kind))fail('BQ_LINKED_ACTIVITY_KIND','Linked activity used an unsupported destination.');
    if(kind==='live')return Object.freeze({present:true,available:false,kind,route:'',reason:'live-rooms-deferred'});
    const route=ROUTES[kind];
    if(!route)fail('BQ_LINKED_ACTIVITY_ROUTE','Linked activity has no verified v3 destination.');
    return Object.freeze({present:true,available:true,kind,route,reason:''});
  }

  async function launch(assignmentId){
    const target=describe(assignmentId);
    if(!target.present)fail('BQ_LINKED_ACTIVITY_UNLINKED','This assignment has instructions but no linked BibleQuest activity.');
    if(!target.available)fail('BQ_LINKED_ACTIVITY_UNAVAILABLE','This linked activity is not available in the verified v3 rebuild yet.');
    const state=await assignments.start(assignmentId);
    return Object.freeze({assignmentId:String(assignmentId),kind:target.kind,route:target.route,state});
  }

  async function complete(assignmentId,submission='',requirements={}){
    describe(assignmentId);
    return assignments.complete(assignmentId,submission,requirements);
  }

  return Object.freeze({describe,launch,complete,contract:linkedActivitiesContract});
}
