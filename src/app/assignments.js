const ASSIGNMENT_TYPES=Object.freeze(['reading','guided-study','mission','quiz','reflection','couples','group','custom']);
const TARGET_SCOPES=Object.freeze(['all','member','team','group']);
const PROGRESS_STATES=Object.freeze(['assigned','started','completed']);
const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin']);

function fail(code,message){const error=new Error(message);error.code=code;throw error}
const text=(value,max=4000)=>String(value??'').trim().slice(0,max);
const validIso=value=>{if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};

function normalizeAssignment(row,congregationId){
  const id=String(row?.id||'');
  if(!id||String(row?.congregation_id||'')!==String(congregationId))fail('BQ_ASSIGNMENT_SCOPE','Assignment data was outside the selected congregation.');
  const type=String(row?.assignment_type||'');
  if(!ASSIGNMENT_TYPES.includes(type))fail('BQ_ASSIGNMENT_RESPONSE','Assignment data used an unsupported type.');
  const targetScope=String(row?.target_scope||'');
  if(!TARGET_SCOPES.includes(targetScope))fail('BQ_ASSIGNMENT_RESPONSE','Assignment data used an unsupported audience.');
  const targetId=row?.target_id?String(row.target_id):null;
  if((targetScope==='all'&&targetId)||(targetScope!=='all'&&!targetId))fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an invalid audience target.');
  if(row?.active===false)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an inactive task.');
  const title=text(row?.title,120);
  if(title.length<2)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data was missing a valid title.');
  const points=Number(row?.points);
  if(!Number.isFinite(points)||points<0||points>25)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned invalid completion points.');
  const dueAt=validIso(row?.due_at);
  if(row?.due_at&&!dueAt)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an invalid deadline.');
  const scriptureRefs=(Array.isArray(row?.scripture_refs)?row.scripture_refs:[]).map(value=>text(value,80)).filter(Boolean).slice(0,20);
  return Object.freeze({
    id,congregationId:String(congregationId),createdBy:String(row?.created_by||''),title,
    instructions:text(row?.instructions,4000),type,scriptureRefs,targetScope,targetId,
    dueAt,points:Math.round(points),createdAt:validIso(row?.created_at),updatedAt:validIso(row?.updated_at)
  });
}

function normalizeProgress(row,userId,visibleIds){
  const assignmentId=String(row?.assignment_id||''),rowUser=String(row?.user_id||'');
  if(rowUser!==String(userId)||!visibleIds.has(assignmentId))return null;
  const status=String(row?.status||'assigned');
  if(!PROGRESS_STATES.includes(status))fail('BQ_ASSIGNMENT_RESPONSE','Assignment progress returned an unsupported status.');
  return Object.freeze({assignmentId,userId:rowUser,status,submission:text(row?.submission,4000)||'',leaderFeedback:text(row?.leader_feedback,2000)||'',completedAt:validIso(row?.completed_at),updatedAt:validIso(row?.updated_at)});
}

function normalizeMutation(payload,assignmentId,userId){
  const row=payload?.progress;
  if(!row||String(row.assignment_id||'')!==String(assignmentId)||String(row.user_id||'')!==String(userId))fail('BQ_ASSIGNMENT_RESPONSE','Assignment update returned an invalid progress record.');
  const status=String(row.status||'');
  if(!PROGRESS_STATES.includes(status))fail('BQ_ASSIGNMENT_RESPONSE','Assignment update returned an invalid status.');
  const awarded=Number(payload?.awarded||0);
  if(!Number.isFinite(awarded)||awarded<0||awarded>25)fail('BQ_ASSIGNMENT_RESPONSE','Assignment update returned invalid awarded points.');
  return Object.freeze({status,awarded,alreadyCompleted:Boolean(payload?.alreadyCompleted)});
}

export const assignmentsContract=Object.freeze({types:ASSIGNMENT_TYPES.slice(),targetScopes:TARGET_SCOPES.slice(),progressStates:PROGRESS_STATES.slice(),submissionMax:4000});

export function createAssignmentsService({api,session,congregation}){
  if(!api?.load||!api?.start||!api?.complete||!api?.subscribe||!session||!congregation)throw new Error('Assignments require API, Session and Congregation owners.');
  let state=Object.freeze({status:'idle',authenticated:false,remoteAvailable:true,congregations:[],congregationId:'',congregationName:'',role:'',assignments:[],activeId:''});
  let stopRemote=null;
  const snapshot=()=>state;
  const stopSync=()=>{const stop=stopRemote;stopRemote=null;if(stop){try{stop()}catch{}}};
  const sessionState=()=>session.getState();
  const assertMemberResponse=()=>{if(MINISTRY_ROLES.has(state.role))fail('BQ_ASSIGNMENT_ROLE_READ_ONLY','Ministry-role assignment management belongs to the leader workflow.');};

  async function load({congregationId,activeId}={}){
    const current=sessionState();
    if(!current?.remoteAvailable){stopSync();state=Object.freeze({...state,status:'local-preview',authenticated:Boolean(current?.authenticated),remoteAvailable:false,assignments:[],activeId:''});return state}
    if(!current?.authenticated||!current?.user?.id){stopSync();state=Object.freeze({...state,status:'signed-out',authenticated:false,remoteAvailable:true,congregations:[],assignments:[],activeId:''});return state}
    const memberships=await congregation.load();
    if(!memberships.length){stopSync();state=Object.freeze({status:'no-congregation',authenticated:true,remoteAvailable:true,congregations:[],congregationId:'',congregationName:'',role:'',assignments:[],activeId:''});return state}
    const selected=memberships.find(row=>row.congregationId===String(congregationId||state.congregationId))||memberships[0];
    congregation.assert(selected.congregationId,'read');
    const payload=await api.load(selected.congregationId,current.user.id);
    const assignments=(Array.isArray(payload?.assignments)?payload.assignments:[]).map(row=>normalizeAssignment(row,selected.congregationId));
    const visibleIds=new Set(assignments.map(row=>row.id)),progressMap=new Map();
    for(const raw of Array.isArray(payload?.progress)?payload.progress:[]){const progress=normalizeProgress(raw,current.user.id,visibleIds);if(progress&&!progressMap.has(progress.assignmentId))progressMap.set(progress.assignmentId,progress)}
    const rows=assignments.map(assignment=>Object.freeze({...assignment,progress:progressMap.get(assignment.id)||Object.freeze({assignmentId:assignment.id,userId:String(current.user.id),status:'assigned',submission:'',leaderFeedback:'',completedAt:null,updatedAt:null})}));
    const wanted=String(activeId||state.activeId||''),nextActive=rows.some(row=>row.id===wanted)?wanted:'';
    state=Object.freeze({status:'ready',authenticated:true,remoteAvailable:true,userId:String(current.user.id),congregations:memberships.map(row=>Object.freeze({id:row.congregationId,name:row.congregation.name,role:row.role,roleLabel:row.roleLabel})),congregationId:selected.congregationId,congregationName:selected.congregation.name,role:selected.role,assignments:rows,activeId:nextActive});
    return state;
  }

  function open(assignmentId){
    if(state.status!=='ready')fail('BQ_ASSIGNMENT_NOT_READY','Assignments are not ready yet.');
    const id=String(assignmentId||'');
    if(!state.assignments.some(row=>row.id===id))fail('BQ_ASSIGNMENT_NOT_FOUND','This assignment is no longer available.');
    state=Object.freeze({...state,activeId:id});
    return state;
  }
  function close(){if(state.activeId)state=Object.freeze({...state,activeId:''});return state}
  const currentAssignment=id=>{if(state.status!=='ready')fail('BQ_ASSIGNMENT_NOT_READY','Assignments are not ready yet.');const assignment=state.assignments.find(row=>row.id===String(id||state.activeId));if(!assignment)fail('BQ_ASSIGNMENT_NOT_FOUND','This assignment is no longer available.');return assignment};

  async function start(assignmentId){
    assertMemberResponse();
    const assignment=currentAssignment(assignmentId),user=sessionState()?.user;
    const result=normalizeMutation(await api.start(state.congregationId,assignment.id),assignment.id,user?.id);
    if(result.status!=='started'&&result.status!=='completed')fail('BQ_ASSIGNMENT_RESPONSE','Starting the assignment did not return a started state.');
    return load({congregationId:state.congregationId,activeId:assignment.id});
  }

  async function complete(assignmentId,submission=''){
    assertMemberResponse();
    const assignment=currentAssignment(assignmentId),user=sessionState()?.user,body=text(submission,assignmentsContract.submissionMax);
    const result=normalizeMutation(await api.complete(state.congregationId,assignment.id,body),assignment.id,user?.id);
    if(result.status!=='completed')fail('BQ_ASSIGNMENT_RESPONSE','Completing the assignment did not return a completed state.');
    const refreshed=await load({congregationId:state.congregationId,activeId:assignment.id});
    return Object.freeze({state:refreshed,awarded:result.awarded,alreadyCompleted:result.alreadyCompleted});
  }

  async function watch(listener){
    if(typeof listener!=='function')throw new Error('Assignments sync requires a listener.');
    if(state.status!=='ready')return()=>{};
    stopSync();
    const cid=state.congregationId,userId=state.userId;
    let disposed=false,busy=false,pending=false,stopped=false;
    const refresh=async()=>{if(disposed)return;if(busy){pending=true;return}busy=true;try{const next=await load({congregationId:cid,activeId:state.activeId});if(!disposed)listener(next)}catch(error){if(!disposed)listener(null,error)}finally{busy=false;if(pending&&!disposed){pending=false;void refresh()}}};
    const cleanup=await api.subscribe(cid,userId,()=>{void refresh()});
    const stop=()=>{if(stopped)return;stopped=true;disposed=true;if(stopRemote===stop)stopRemote=null;if(typeof cleanup==='function')cleanup()};
    stopRemote=stop;
    return stop;
  }

  function clear(){stopSync();state=Object.freeze({status:'idle',authenticated:false,remoteAvailable:true,congregations:[],congregationId:'',congregationName:'',role:'',assignments:[],activeId:''})}
  return Object.freeze({load,open,close,start,complete,watch,stopSync,snapshot,clear,contract:assignmentsContract});
}
