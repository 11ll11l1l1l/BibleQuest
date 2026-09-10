const CONTENT_TYPES=Object.freeze(['question','statement','answer','explanation','story','reader','other']);
const CONTENT_TYPE_SET=new Set(CONTENT_TYPES);
const REASONS=Object.freeze(['doctrinal','accuracy','wording','inappropriate','duplicate','source','other']);
const REASON_SET=new Set(REASONS);

function codedError(message,code){const error=new Error(message);error.code=code;return error}
function text(value){return String(value??'').trim()}
function bounded(value,max,field,{required=false,min=0}={}){
  const valueText=text(value);
  if(required&&valueText.length<Math.max(1,min))throw codedError(`${field} is required.`,'BQ_CONTENT_REPORT_INVALID');
  if(valueText.length<min)throw codedError(`${field} is too short.`,'BQ_CONTENT_REPORT_INVALID');
  if(valueText.length>max)throw codedError(`${field} is too long.`,'BQ_CONTENT_REPORT_INVALID');
  return valueText;
}
function plainPayload(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return Object.freeze({});
  try{return Object.freeze(JSON.parse(JSON.stringify(value)))}catch{return Object.freeze({})}
}
function normalizeContext(value){
  const contentKey=bounded(value?.contentKey,180,'Content key',{required:true,min:3});
  const contentType=text(value?.contentType||'other').toLowerCase();
  if(!CONTENT_TYPE_SET.has(contentType))throw codedError('Unsupported content type.','BQ_CONTENT_REPORT_INVALID');
  const contentSource=bounded(value?.contentSource||'v3-screen',120,'Content source',{required:true,min:1});
  const contentRef=bounded(value?.contentRef||'',160,'Content reference');
  const contentText=bounded(value?.contentText,4000,'Content text',{required:true,min:1});
  return Object.freeze({contentKey,contentType,contentSource,contentRef,contentText,contentPayload:plainPayload(value?.contentPayload)});
}

export function createContentReportingService({api,session,congregation}={}){
  if(!api?.submit||!session?.getState||!congregation?.load||!congregation?.get)throw new Error('Content reporting requires shared API, session, and congregation owners.');

  const requireUser=()=>{
    const state=session.getState();
    if(!state?.authenticated||!state.user?.id)throw codedError('Sign in to BibleQuest before submitting a report.','BQ_CONTENT_REPORT_AUTH_REQUIRED');
    return state.user;
  };

  async function memberships(){
    requireUser();
    const rows=await congregation.load();
    return Object.freeze(rows.map(row=>Object.freeze({
      id:String(row.congregationId),
      name:String(row.congregation?.name||'Congregation'),
      role:String(row.role||''),
      roleLabel:String(row.roleLabel||row.role||'Member')
    })));
  }

  async function prepare(){return Object.freeze({congregations:await memberships(),reasons:REASONS.slice()})}

  async function submit({congregationId,context,reason='other',note=''}={}){
    const user=requireUser();
    const id=bounded(congregationId,80,'Congregation',{required:true,min:1});
    await congregation.load();
    const membership=congregation.get(id);
    if(!membership||String(membership.userId)!==String(user.id))throw codedError('Join or select a current congregation before submitting a report.','BQ_CONTENT_REPORT_MEMBERSHIP_REQUIRED');
    const normalized=normalizeContext(context);
    const normalizedReason=text(reason||'other').toLowerCase();
    if(!REASON_SET.has(normalizedReason))throw codedError('Choose a valid report reason.','BQ_CONTENT_REPORT_REASON_INVALID');
    const normalizedNote=bounded(note,1200,'Report note');
    const row={
      congregation_id:id,
      reporter_id:String(user.id),
      content_key:normalized.contentKey,
      content_type:normalized.contentType,
      content_source:normalized.contentSource,
      content_ref:normalized.contentRef||null,
      content_text:normalized.contentText,
      content_payload:normalized.contentPayload,
      reason:normalizedReason,
      note:normalizedNote||null
    };
    const saved=await api.submit(row);
    if(!saved?.id)throw codedError('Report submission did not return a report ID.','BQ_CONTENT_REPORT_WRITE_FAILED');
    return Object.freeze({id:String(saved.id),congregationId:id,reason:normalizedReason});
  }

  return Object.freeze({prepare,submit,reasons:()=>REASONS.slice(),contentTypes:()=>CONTENT_TYPES.slice()});
}
