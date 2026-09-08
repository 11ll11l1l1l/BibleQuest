const MAX_TITLE=120,MAX_CONTENT=12000,MAX_TAGS=20,MAX_TAG_LENGTH=40;
const text=(value,max)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const integer=(value,label,{optional=false}={})=>{if((value===null||value===undefined||value==='')&&optional)return null;const n=Number(value);if(!Number.isInteger(n)||n<1||n>999)throw new Error(`${label} must be a positive whole number.`);return n};
const tags=value=>{const source=Array.isArray(value)?value:String(value??'').split(',');return [...new Set(source.map(item=>text(item,MAX_TAG_LENGTH)).filter(Boolean))].slice(0,MAX_TAGS)};
const iso=value=>{const date=value instanceof Date?value:new Date(value);if(!Number.isFinite(date.getTime()))throw new Error('Cloud Notes received an invalid timestamp.');return date.toISOString()};
const sortNotes=items=>items.slice().sort((a,b)=>Number(b.isPinned)-Number(a.isPinned)||Date.parse(b.updatedAt)-Date.parse(a.updatedAt)||a.id.localeCompare(b.id));

function cleanPayload(input={}){
  const book=text(input.book,80);if(!book)throw new Error('Choose a Bible book.');
  const chapter=integer(input.chapter,'Chapter');
  const verseStart=integer(input.verseStart,'Starting verse',{optional:true});
  const verseEnd=integer(input.verseEnd,'Ending verse',{optional:true});
  if(verseEnd!==null&&verseStart===null)throw new Error('Add a starting verse before an ending verse.');
  if(verseStart!==null&&verseEnd!==null&&verseEnd<verseStart)throw new Error('Ending verse cannot come before the starting verse.');
  const title=text(input.title,MAX_TITLE),content=text(input.content,MAX_CONTENT);if(!content)throw new Error('Write a note before saving.');
  return Object.freeze({book,chapter,verseStart,verseEnd,title,content,tags:tags(input.tags),noteType:text(input.noteType||'general',40)||'general',isPinned:input.isPinned===true});
}

function normalize(row){
  if(!row?.id||!row?.user_id)throw new Error('Cloud Notes received a malformed remote note.');
  const payload=cleanPayload({book:row.book,chapter:row.chapter,verseStart:row.verse_start,verseEnd:row.verse_end,title:row.title,content:row.content,tags:row.tags,noteType:row.note_type,isPinned:row.is_pinned});
  return Object.freeze({id:String(row.id),userId:String(row.user_id),...payload,createdAt:iso(row.created_at),updatedAt:iso(row.updated_at)});
}

export function createCloudNotesService({api,session,clock=()=>new Date()}){
  if(!api||!session)throw new Error('Cloud Notes requires the shared API and session boundaries.');
  let cache=[];
  const identity=()=>{const state=session.getState?.()||{};if(!state.authenticated||!state.user?.id){const error=new Error('Sign in to use Cloud Notes.');error.code='BQ_CLOUD_NOTES_AUTH_REQUIRED';throw error}return {userId:String(state.user.id),remoteAvailable:state.remoteAvailable!==false,user:state.user}};
  const status=()=>{const state=session.getState?.()||{};return Object.freeze({authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,user:state.user||null,count:cache.length})};
  const nextVersion=previous=>{const current=iso(clock());const prior=Date.parse(previous);return Date.parse(current)>prior?current:new Date(prior+1).toISOString()};
  const accept=rows=>{cache=sortNotes((rows||[]).map(normalize));return cache.slice()};
  async function load(){const {userId}=identity();return accept(await api.list(userId))}
  function list(){return cache.slice()}
  function get(id){const note=cache.find(item=>item.id===String(id));if(!note)throw new Error('Cloud note not found.');return note}
  async function create(input){const {userId}=identity();const payload=cleanPayload(input);const row=await api.create(userId,{book:payload.book,chapter:payload.chapter,verse_start:payload.verseStart,verse_end:payload.verseEnd,title:payload.title||null,content:payload.content,tags:payload.tags,note_type:payload.noteType,is_pinned:payload.isPinned});const note=normalize(row);if(note.userId!==userId)throw new Error('Cloud Notes received a note owned by another account.');cache=sortNotes([note,...cache.filter(item=>item.id!==note.id)]);return note}
  async function update(id,input){const {userId}=identity();const current=get(id);if(current.userId!==userId)throw new Error('Cloud note ownership changed. Reload Cloud Notes.');const payload=cleanPayload(input),updatedAt=nextVersion(current.updatedAt);const row=await api.update(userId,current.id,current.updatedAt,{book:payload.book,chapter:payload.chapter,verse_start:payload.verseStart,verse_end:payload.verseEnd,title:payload.title||null,content:payload.content,tags:payload.tags,note_type:payload.noteType,is_pinned:payload.isPinned,updated_at:updatedAt});if(!row){const error=new Error('This cloud note changed on another device. Reload before saving again.');error.code='BQ_CLOUD_NOTES_CONFLICT';throw error}const note=normalize(row);cache=sortNotes(cache.map(item=>item.id===note.id?note:item));return note}
  async function remove(id){const {userId}=identity();const current=get(id);const removed=await api.remove(userId,current.id,current.updatedAt);if(!removed){const error=new Error('This cloud note changed on another device. Reload before deleting it.');error.code='BQ_CLOUD_NOTES_CONFLICT';throw error}cache=cache.filter(item=>item.id!==current.id);return current}
  function clear(){cache=[]}
  return Object.freeze({status,load,list,get,create,update,remove,clear});
}
