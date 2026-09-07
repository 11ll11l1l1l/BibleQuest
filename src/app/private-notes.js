const STORAGE_KEY='private-notes';
const VERSION=1;
const TITLE_LIMIT=120;
const BODY_LIMIT=12000;

const freezeNote=note=>Object.freeze({...note});
const cleanTitle=value=>String(value??'').replace(/\s+/g,' ').trim().slice(0,TITLE_LIMIT);
const cleanBody=value=>String(value??'').replace(/\r\n?/g,'\n').slice(0,BODY_LIMIT);
const validStamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

function normalizeNote(value){
  if(!value||typeof value!=='object'||!/^note-\d+$/.test(String(value.id||'')))return null;
  const title=cleanTitle(value.title),body=cleanBody(value.body);
  if(!title&&!body.trim())return null;
  if(!validStamp(value.createdAt)||!validStamp(value.updatedAt))return null;
  return Object.freeze({id:String(value.id),title,body,createdAt:value.createdAt,updatedAt:value.updatedAt});
}

function normalizeState(value){
  const input=value&&typeof value==='object'?value:{};
  const seen=new Set(),notes=[];
  for(const candidate of Array.isArray(input.notes)?input.notes:[]){
    const note=normalizeNote(candidate);
    if(!note||seen.has(note.id))continue;
    seen.add(note.id);notes.push(note);
  }
  const maxId=notes.reduce((max,note)=>Math.max(max,Number(note.id.slice(5))||0),0);
  const noteSeq=Number.isSafeInteger(input.noteSeq)&&input.noteSeq>=0?Math.max(input.noteSeq,maxId):maxId;
  return {version:VERSION,noteSeq,notes};
}

export function createPrivateNotesService({storage,clock=()=>new Date()}){
  if(!storage?.read||!storage?.write)throw new Error('Private Notes requires the shared storage boundary.');
  let state=normalizeState(storage.read(STORAGE_KEY,null));

  const stamp=()=>{
    const value=clock(),date=value instanceof Date?new Date(value.getTime()):new Date(value);
    if(!Number.isFinite(date.getTime()))throw new Error('Private Notes clock returned an invalid time.');
    return date.toISOString();
  };
  const save=()=>{state=normalizeState(storage.write(STORAGE_KEY,state));return snapshot()};
  const snapshot=()=>Object.freeze({version:VERSION,notes:Object.freeze([...state.notes].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(freezeNote))});
  const findIndex=id=>state.notes.findIndex(note=>note.id===String(id));
  const payload=(title,body)=>{
    const next={title:cleanTitle(title),body:cleanBody(body)};
    if(!next.title&&!next.body.trim())throw new Error('Write a title or note before saving.');
    return next;
  };

  function list(){return snapshot().notes}
  function get(id){const note=state.notes.find(item=>item.id===String(id));if(!note)throw new Error('Private note not found.');return freezeNote(note)}
  function create({title='',body=''}={}){
    const content=payload(title,body),time=stamp(),id=`note-${state.noteSeq+1}`;
    state={version:VERSION,noteSeq:state.noteSeq+1,notes:[...state.notes,{id,...content,createdAt:time,updatedAt:time}]};
    save();return get(id);
  }
  function update(id,{title,body}={}){
    const index=findIndex(id);if(index<0)throw new Error('Private note not found.');
    const current=state.notes[index],content=payload(title===undefined?current.title:title,body===undefined?current.body:body),time=stamp();
    const notes=[...state.notes];notes[index]={...current,...content,updatedAt:time};state={...state,notes};save();return get(id);
  }
  function remove(id){
    const index=findIndex(id);if(index<0)throw new Error('Private note not found.');
    const [removed]=state.notes.splice(index,1);state={...state,notes:[...state.notes]};save();return freezeNote(removed);
  }
  function exportData(){return Object.freeze({schema:'biblequest.private-notes',version:VERSION,exportedAt:stamp(),notes:Object.freeze(list().map(freezeNote))})}
  function exportJson(){return JSON.stringify(exportData(),null,2)}

  return Object.freeze({list,get,create,update,remove,exportData,exportJson});
}
