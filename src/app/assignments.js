const ASSIGNMENT_TYPES=Object.freeze(['reading','guided-study','mission','quiz','reflection','couples','group','custom']);
const TARGET_SCOPES=Object.freeze(['all','member','team','group']);
const PROGRESS_STATES=Object.freeze(['assigned','started','completed']);
const EVIDENCE_TYPES=Object.freeze(['none','text','confirmation']);
const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin']);

function fail(code,message){const error=new Error(message);error.code=code;throw error}
const text=(value,max=4000)=>String(value??'').trim().slice(0,max);
const validIso=value=>{if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};
const emptyTargets=()=>Object.freeze({members:Object.freeze([]),teams:Object.freeze([]),groups:Object.freeze([])});
const emptyReview=(assignmentId='')=>Object.freeze({assignmentId:String(assignmentId||''),status:'idle',responders:Object.freeze([]),responses:Object.freeze([]),error:''});

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
  const dueAt=validIso(row?.due_at),scheduleAt=validIso(row?.schedule_at),reminderAt=validIso(row?.reminder_at);
  if(row?.due_at&&!dueAt)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an invalid deadline.');
  if(row?.schedule_at&&!scheduleAt)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an invalid scheduled opening.');
  if(row?.reminder_at&&!reminderAt)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an invalid reminder time.');
  const recurrenceRule=text(row?.recurrence_rule,120)||null;
  const evidenceType=String(row?.evidence_type||'none');
  if(!EVIDENCE_TYPES.includes(evidenceType))fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an unsupported evidence requirement.');
  let minQuizScore=null;
  if(row?.min_quiz_score!==null&&row?.min_quiz_score!==undefined&&row?.min_quiz_score!==''){
    minQuizScore=Number(row.min_quiz_score);
    if(!Number.isFinite(minQuizScore)||minQuizScore<0||minQuizScore>100)fail('BQ_ASSIGNMENT_RESPONSE','Assignment data returned an invalid minimum quiz score.');
    minQuizScore=Math.round(minQuizScore);
  }
  const scriptureRefs=(Array.isArray(row?.scripture_refs)?row.scripture_refs:[]).map(value=>text(value,80)).filter(Boolean).slice(0,20);
  return Object.freeze({
    id,congregationId:String(congregationId),createdBy:String(row?.created_by||''),title,
    instructions:text(row?.instructions,4000),type,scriptureRefs,targetScope,targetId,
    dueAt,scheduleAt,reminderAt,recurrenceRule,requiredReflection:Boolean(row?.required_reflection),minQuizScore,evidenceType,
    points:Math.round(points),createdAt:validIso(row?.created_at),updatedAt:validIso(row?.updated_at)
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

function normalizeTargets(payload){
  const normalize=(rows,kind)=>Object.freeze((Array.isArray(rows)?rows:[]).map(row=>{const id=String(row?.id||''),label=text(row?.label,120);if(!id||!label)fail('BQ_ASSIGNMENT_TARGET_RESPONSE',`Assignment ${kind} directory returned invalid data.`);return Object.freeze({id,label,...(kind==='member'?{role:text(row?.role,40)}:{}),...(kind==='team'?{type:text(row?.type,40)}:{})})}));
  return Object.freeze({members:normalize(payload?.members,'member'),teams:normalize(payload?.teams,'team'),groups:normalize(payload?.groups,'group')});
}

function normalizeResponder(row,assignmentId,congregationId){
  if(String(row?.assignment_id||'')!==String(assignmentId)||String(row?.congregation_id||'')!==String(congregationId))fail('BQ_ASSIGNMENT_REVIEW_SCOPE','Assignment responder data was outside the active task.');
  const userId=String(row?.user_id||''),displayName=text(row?.display_name,120)||'Member',completedAt=validIso(row?.completed_at);
  if(!userId||!completedAt)fail('BQ_ASSIGNMENT_REVIEW_RESPONSE','Assignment responder data was incomplete.');
  return Object.freeze({userId,displayName,completedAt});
}

function normalizePrivateResponse(row,assignmentId,names){
  if(String(row?.assignment_id||'')!==String(assignmentId))fail('BQ_ASSIGNMENT_REVIEW_SCOPE','Private assignment response was outside the active task.');
  const userId=String(row?.user_id||''),status=String(row?.status||'');
  if(!userId||status!=='completed')fail('BQ_ASSIGNMENT_REVIEW_RESPONSE','Private assignment response was invalid.');
  return Object.freeze({userId,displayName:names.get(userId)||'Member',submission:text(row?.submission,4000)||'',leaderFeedback:text(row?.leader_feedback,2000)||'',completedAt:validIso(row?.completed_at),updatedAt:validIso(row?.updated_at)});
}

function normalizePublish(input={}){
  const title=text(input.title,120),instructions=text(input.instructions,4000),assignmentType=String(input.assignmentType||'custom'),targetScope=String(input.targetScope||'all'),targetId=input.targetId?String(input.targetId):null;
  if(title.length<2||!ASSIGNMENT_TYPES.includes(assignmentType))fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Provide a valid assignment title and type.');
  if(!TARGET_SCOPES.includes(targetScope))fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Choose a valid assignment audience.');
  if(targetScope!=='all'&&!targetId)fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Choose a member, team, or Journey Group.');
  const scriptureRefs=(Array.isArray(input.scriptureRefs)?input.scriptureRefs:String(input.scriptureRefs||'').split(/[,\n]/)).map(value=>text(value,80)).filter(Boolean).slice(0,20);
  const points=Math.min(25,Math.max(0,Math.round(Number(input.points)||5)));
  const dueAt=validIso(input.dueAt),scheduleAt=validIso(input.scheduleAt),reminderAt=validIso(input.reminderAt);
  if(input.dueAt&&!dueAt)fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Enter a valid assignment deadline.');
  if(input.scheduleAt&&!scheduleAt)fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Enter a valid scheduled opening.');
  if(input.reminderAt&&!reminderAt)fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Enter a valid reminder time.');
  const recurrenceRule=text(input.recurrenceRule,120)||null,evidenceType=String(input.evidenceType||'none');
  if(!EVIDENCE_TYPES.includes(evidenceType))fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Choose a valid evidence requirement.');
  let minQuizScore=null;if(input.minQuizScore!==null&&input.minQuizScore!==undefined&&input.minQuizScore!==''){minQuizScore=Number(input.minQuizScore);if(!Number.isFinite(minQuizScore)||minQuizScore<0||minQuizScore>100)fail('BQ_ASSIGNMENT_PUBLISH_INPUT','Enter a quiz score from 0 to 100.');minQuizScore=Math.round(minQuizScore)}
  return Object.freeze({title,instructions,assignmentType,scriptureRefs,targetScope,targetId:targetScope==='all'?null:targetId,dueAt,points,scheduleAt,reminderAt,recurrenceRule,requiredReflection:Boolean(input.requiredReflection),minQuizScore,evidenceType});
}

function dueState(assignment,progress,nowMs){
  if(progress.status==='completed')return'completed';
  if(assignment.scheduleAt&&new Date(assignment.scheduleAt).getTime()>nowMs)return'scheduled';
  if(assignment.dueAt&&new Date(assignment.dueAt).getTime()<nowMs)return'overdue';
  return'open';
}

export const assignmentsContract=Object.freeze({types:ASSIGNMENT_TYPES.slice(),targetScopes:TARGET_SCOPES.slice(),progressStates:PROGRESS_STATES.slice(),evidenceTypes:EVIDENCE_TYPES.slice(),ministryRoles:[...MINISTRY_ROLES],submissionMax:4000,recurrenceGeneration:false,linkedPublishing:false,responsePrivacy:'peer-presence-only'});

export function createAssignmentsService({api,session,congregation,now=()=>new Date()}){
  if(!api?.load||!api?.start||!api?.complete||!api?.subscribe||!session||!congregation)throw new Error('Assignments require API, Session and Congregation owners.');
  let state=Object.freeze({status:'idle',authenticated:false,remoteAvailable:true,congregations:[],congregationId:'',congregationName:'',role:'',assignments:[],activeId:'',publishTargets:emptyTargets(),activeReview:emptyReview()});
  let stopRemote=null,targetRequest=0,reviewRequest=0;
  const snapshot=()=>state;
  const stopSync=()=>{const stop=stopRemote;stopRemote=null;if(stop){try{stop()}catch{}}};
  const sessionState=()=>session.getState();
  const assertMemberResponse=()=>{if(MINISTRY_ROLES.has(state.role))fail('BQ_ASSIGNMENT_ROLE_READ_ONLY','Ministry-role assignment management belongs to the leader workflow.');};
  const assertPublisher=()=>{if(state.status!=='ready'||!MINISTRY_ROLES.has(state.role))fail('BQ_ASSIGNMENT_PUBLISH_FORBIDDEN','An active ministry role is required to publish assignments.');congregation.assert(state.congregationId,'ministry');};

  async function load({congregationId,activeId}={}){
    const current=sessionState();
    if(!current?.remoteAvailable){stopSync();targetRequest++;reviewRequest++;state=Object.freeze({...state,status:'local-preview',authenticated:Boolean(current?.authenticated),remoteAvailable:false,assignments:[],activeId:'',publishTargets:emptyTargets(),activeReview:emptyReview()});return state}
    if(!current?.authenticated||!current?.user?.id){stopSync();targetRequest++;reviewRequest++;state=Object.freeze({...state,status:'signed-out',authenticated:false,remoteAvailable:true,congregations:[],assignments:[],activeId:'',publishTargets:emptyTargets(),activeReview:emptyReview()});return state}
    const memberships=await congregation.load();
    if(!memberships.length){stopSync();targetRequest++;reviewRequest++;state=Object.freeze({status:'no-congregation',authenticated:true,remoteAvailable:true,congregations:[],congregationId:'',congregationName:'',role:'',assignments:[],activeId:'',publishTargets:emptyTargets(),activeReview:emptyReview()});return state}
    const selected=memberships.find(row=>row.congregationId===String(congregationId||state.congregationId))||memberships[0];
    congregation.assert(selected.congregationId,'read');
    const payload=await api.load(selected.congregationId,current.user.id);
    const assignments=(Array.isArray(payload?.assignments)?payload.assignments:[]).map(row=>normalizeAssignment(row,selected.congregationId));
    const visibleIds=new Set(assignments.map(row=>row.id)),progressMap=new Map();
    for(const raw of Array.isArray(payload?.progress)?payload.progress:[]){const progress=normalizeProgress(raw,current.user.id,visibleIds);if(progress&&!progressMap.has(progress.assignmentId))progressMap.set(progress.assignmentId,progress)}
    const nowValue=now(),nowMs=nowValue instanceof Date?nowValue.getTime():new Date(nowValue).getTime();
    const rows=assignments.map(assignment=>{const progress=progressMap.get(assignment.id)||Object.freeze({assignmentId:assignment.id,userId:String(current.user.id),status:'assigned',submission:'',leaderFeedback:'',completedAt:null,updatedAt:null});return Object.freeze({...assignment,progress,dueState:dueState(assignment,progress,nowMs)})});
    const wanted=String(activeId||state.activeId||''),nextActive=rows.some(row=>row.id===wanted)?wanted:'',sameCongregation=state.congregationId===selected.congregationId;
    if(!sameCongregation){targetRequest++;reviewRequest++}
    const keepReview=sameCongregation&&nextActive&&state.activeReview?.assignmentId===nextActive?state.activeReview:emptyReview(nextActive);
    state=Object.freeze({status:'ready',authenticated:true,remoteAvailable:true,userId:String(current.user.id),congregations:memberships.map(row=>Object.freeze({id:row.congregationId,name:row.congregation.name,role:row.role,roleLabel:row.roleLabel})),congregationId:selected.congregationId,congregationName:selected.congregation.name,role:selected.role,assignments:rows,activeId:nextActive,publishTargets:sameCongregation?state.publishTargets:emptyTargets(),activeReview:keepReview});
    return state;
  }

  async function loadPublishTargets(){
    assertPublisher();if(typeof api.targets!=='function')fail('BQ_ASSIGNMENT_PUBLISH_UNAVAILABLE','Assignment publishing is not available yet.');
    const request=++targetRequest,cid=state.congregationId,userId=String(sessionState()?.user?.id||'');
    const targets=normalizeTargets(await api.targets(cid));
    const current=sessionState();
    if(request!==targetRequest||state.congregationId!==cid||!current?.authenticated||String(current?.user?.id||'')!==userId||!MINISTRY_ROLES.has(state.role))fail('BQ_ASSIGNMENT_TARGET_STALE','The congregation or account changed while publish targets were loading.');
    state=Object.freeze({...state,publishTargets:targets});return state;
  }

  async function publish(input){
    assertPublisher();if(typeof api.create!=='function')fail('BQ_ASSIGNMENT_PUBLISH_UNAVAILABLE','Assignment publishing is not available yet.');
    const cid=state.congregationId,userId=String(sessionState()?.user?.id||''),payload=normalizePublish(input),targetList=payload.targetScope==='member'?state.publishTargets.members:payload.targetScope==='team'?state.publishTargets.teams:payload.targetScope==='group'?state.publishTargets.groups:null;
    if(targetList&&!targetList.some(row=>row.id===payload.targetId))fail('BQ_ASSIGNMENT_TARGET_INVALID','Choose an active target from this congregation.');
    const result=await api.create(cid,payload);
    if(!result?.assignment?.id||String(result.assignment.congregation_id||'')!==cid)fail('BQ_ASSIGNMENT_PUBLISH_RESPONSE','Assignment publishing returned an invalid server record.');
    const current=sessionState();
    if(!current?.authenticated||String(current?.user?.id||'')!==userId||state.congregationId!==cid)fail('BQ_ASSIGNMENT_PUBLISH_CONTEXT_CHANGED','The assignment was created, but the account or congregation changed. Reload Assignments before publishing again.');
    try{return await load({congregationId:cid})}catch(error){const refreshError=new Error(`Assignment was created, but the assignment list could not refresh. Reload before publishing again. ${error?.message||''}`.trim());refreshError.code='BQ_ASSIGNMENT_CREATED_REFRESH_FAILED';throw refreshError}
  }

  function open(assignmentId){
    if(state.status!=='ready')fail('BQ_ASSIGNMENT_NOT_READY','Assignments are not ready yet.');
    const id=String(assignmentId||'');
    if(!state.assignments.some(row=>row.id===id))fail('BQ_ASSIGNMENT_NOT_FOUND','This assignment is no longer available.');
    reviewRequest++;
    state=Object.freeze({...state,activeId:id,activeReview:emptyReview(id)});
    return state;
  }

  async function loadReview(assignmentId=state.activeId){
    const assignment=currentAssignment(assignmentId),request=++reviewRequest,cid=state.congregationId,userId=String(sessionState()?.user?.id||''),role=state.role;
    state=Object.freeze({...state,activeReview:Object.freeze({...emptyReview(assignment.id),status:'loading'})});
    try{
      if(typeof api.loadResponsePresence!=='function')fail('BQ_ASSIGNMENT_REVIEW_UNAVAILABLE','Assignment response status is not available yet.');
      const presenceRows=await api.loadResponsePresence(cid,assignment.id);
      const responders=Object.freeze((Array.isArray(presenceRows)?presenceRows:[]).map(row=>normalizeResponder(row,assignment.id,cid)));
      const names=new Map(responders.map(row=>[row.userId,row.displayName]));
      let responses=Object.freeze([]);
      if(MINISTRY_ROLES.has(role)){
        congregation.assert(cid,'ministry');
        if(typeof api.loadPrivateResponses!=='function')fail('BQ_ASSIGNMENT_REVIEW_UNAVAILABLE','Private assignment response review is not available yet.');
        const privateRows=await api.loadPrivateResponses(assignment.id);
        responses=Object.freeze((Array.isArray(privateRows)?privateRows:[]).map(row=>normalizePrivateResponse(row,assignment.id,names)));
      }
      const current=sessionState();
      if(request!==reviewRequest||state.activeId!==assignment.id||state.congregationId!==cid||!current?.authenticated||String(current?.user?.id||'')!==userId)return state;
      state=Object.freeze({...state,activeReview:Object.freeze({assignmentId:assignment.id,status:'ready',responders,responses,error:''})});
      return state;
    }catch(error){
      if(request===reviewRequest&&state.activeId===assignment.id&&state.congregationId===cid){state=Object.freeze({...state,activeReview:Object.freeze({...emptyReview(assignment.id),status:'error',error:error?.message||'Response status could not load.'})})}
      return state;
    }
  }

  function close(){if(state.activeId){reviewRequest++;state=Object.freeze({...state,activeId:'',activeReview:emptyReview()})}return state}
  const currentAssignment=id=>{if(state.status!=='ready')fail('BQ_ASSIGNMENT_NOT_READY','Assignments are not ready yet.');const assignment=state.assignments.find(row=>row.id===String(id||state.activeId));if(!assignment)fail('BQ_ASSIGNMENT_NOT_FOUND','This assignment is no longer available.');return assignment};
  const assertOpen=assignment=>{if(assignment.dueState==='scheduled')fail('BQ_ASSIGNMENT_NOT_OPEN','This assignment has not opened yet.');};

  async function start(assignmentId){
    assertMemberResponse();
    const assignment=currentAssignment(assignmentId);assertOpen(assignment);
    const user=sessionState()?.user,result=normalizeMutation(await api.start(state.congregationId,assignment.id),assignment.id,user?.id);
    if(result.status!=='started'&&result.status!=='completed')fail('BQ_ASSIGNMENT_RESPONSE','Starting the assignment did not return a started state.');
    return load({congregationId:state.congregationId,activeId:assignment.id});
  }

  async function complete(assignmentId,submission='',requirements={}){
    assertMemberResponse();
    const assignment=currentAssignment(assignmentId);assertOpen(assignment);
    const user=sessionState()?.user,body=text(submission,assignmentsContract.submissionMax);
    if((assignment.requiredReflection||assignment.evidenceType==='text')&&!body)fail('BQ_ASSIGNMENT_REFLECTION_REQUIRED','This assignment requires a written reflection or evidence before completion.');
    if(assignment.evidenceType==='confirmation'&&!requirements?.confirmed)fail('BQ_ASSIGNMENT_CONFIRMATION_REQUIRED','Confirm completion before submitting this assignment.');
    let quizScore=null;
    const rawQuiz=requirements?.quizScore;
    if(rawQuiz!==null&&rawQuiz!==undefined&&rawQuiz!==''){
      quizScore=Number(rawQuiz);
      if(!Number.isFinite(quizScore)||quizScore<0||quizScore>100)fail('BQ_ASSIGNMENT_QUIZ_SCORE_INVALID','Enter a quiz score from 0 to 100.');
    }
    if(assignment.minQuizScore!==null&&(quizScore===null||quizScore<assignment.minQuizScore))fail('BQ_ASSIGNMENT_QUIZ_SCORE_REQUIRED',`A quiz score of at least ${assignment.minQuizScore}% is required.`);
    const result=normalizeMutation(await api.complete(state.congregationId,assignment.id,body,quizScore),assignment.id,user?.id);
    if(result.status!=='completed')fail('BQ_ASSIGNMENT_RESPONSE','Completing the assignment did not return a completed state.');
    await load({congregationId:state.congregationId,activeId:assignment.id});
    await loadReview(assignment.id);
    return Object.freeze({state:snapshot(),awarded:result.awarded,alreadyCompleted:result.alreadyCompleted});
  }

  async function watch(listener){
    if(typeof listener!=='function')throw new Error('Assignments sync requires a listener.');
    if(state.status!=='ready')return()=>{};
    stopSync();
    const cid=state.congregationId,userId=state.userId;
    let disposed=false,busy=false,pending=false,stopped=false;
    const refresh=async()=>{if(disposed)return;if(busy){pending=true;return}busy=true;try{const activeId=state.activeId,next=await load({congregationId:cid,activeId});if(activeId)await loadReview(activeId);if(!disposed)listener(snapshot())}catch(error){if(!disposed)listener(null,error)}finally{busy=false;if(pending&&!disposed){pending=false;void refresh()}}};
    const cleanup=await api.subscribe(cid,userId,()=>{void refresh()});
    const stop=()=>{if(stopped)return;stopped=true;disposed=true;if(stopRemote===stop)stopRemote=null;if(typeof cleanup==='function')cleanup()};
    stopRemote=stop;
    return stop;
  }

  function clear(){stopSync();targetRequest++;reviewRequest++;state=Object.freeze({status:'idle',authenticated:false,remoteAvailable:true,congregations:[],congregationId:'',congregationName:'',role:'',assignments:[],activeId:'',publishTargets:emptyTargets(),activeReview:emptyReview()})}
  return Object.freeze({load,loadPublishTargets,publish,open,loadReview,close,start,complete,watch,stopSync,snapshot,clear,contract:assignmentsContract});
}
