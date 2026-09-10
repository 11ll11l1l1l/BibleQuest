const STORAGE_KEY='workspace-state';
const VIEWS=new Set(['overview','notes']);
const clean=(value,max=120)=>String(value??'').replace(/\r\n?/g,'\n').trim().slice(0,max);
const safeView=value=>VIEWS.has(String(value))?String(value):'overview';

function membershipView(row){
  return Object.freeze({
    congregationId:String(row?.congregationId||''),
    name:clean(row?.congregation?.name||'Congregation',100)||'Congregation',
    role:row?.roleKnown?String(row.role||''):'',
    roleLabel:clean(row?.roleLabel||'Unsupported role',40)||'Unsupported role',
    roleKnown:row?.roleKnown===true
  });
}

function noteView(note){
  return Object.freeze({
    id:String(note?.id||''),
    book:clean(note?.book,80),
    chapter:Number(note?.chapter)||1,
    verseStart:note?.verseStart==null?null:Number(note.verseStart),
    verseEnd:note?.verseEnd==null?null:Number(note.verseEnd),
    title:clean(note?.title,120),
    content:clean(note?.content,12000),
    tags:Object.freeze(Array.isArray(note?.tags)?note.tags.map(tag=>clean(tag,40)).filter(Boolean).slice(0,20):[]),
    noteType:clean(note?.noteType||'general',40)||'general',
    isPinned:note?.isPinned===true,
    updatedAt:note?.updatedAt||null
  });
}

export function createWorkspaceService({session,cloudNotes,congregation,reader,storage}={}){
  if(!session||!cloudNotes||!congregation||!reader||!storage?.read||!storage?.write)throw new Error('Workspace requires session, Cloud Notes, congregation, Reader and storage owners.');
  const persisted=storage.read(STORAGE_KEY,{version:1,view:'overview'});
  let current=Object.freeze({status:'idle',authenticated:false,remoteAvailable:true,view:safeView(persisted?.view),notes:Object.freeze([]),memberships:Object.freeze([]),membershipError:'',readerContext:Object.freeze({...reader.getState()}),error:''});
  const snapshot=()=>current;
  const sessionState=()=>session.getState?.()||{};
  const setState=patch=>{current=Object.freeze({...current,...patch});return current};

  function saveView(view){
    const next=safeView(view);
    storage.write(STORAGE_KEY,{version:1,view:next});
    return setState({view:next});
  }

  async function load(){
    const state=sessionState(),readerContext=Object.freeze({...reader.getState()});
    if(!state.authenticated||!state.user?.id){
      cloudNotes.clear?.();
      congregation.clear?.();
      return setState({status:'signed-out',authenticated:false,remoteAvailable:state.remoteAvailable!==false,notes:Object.freeze([]),memberships:Object.freeze([]),membershipError:'',readerContext,error:''});
    }
    if(state.remoteAvailable===false){
      cloudNotes.clear?.();
      congregation.clear?.();
      return setState({status:'unavailable',authenticated:true,remoteAvailable:false,notes:Object.freeze([]),memberships:Object.freeze([]),membershipError:'',readerContext,error:'Workspace cloud content is unavailable in local preview.'});
    }
    setState({status:'loading',authenticated:true,remoteAvailable:true,readerContext,error:''});
    try{
      const notes=(await cloudNotes.load()).map(noteView);
      let memberships=[],membershipError='';
      try{memberships=(await congregation.load()).map(membershipView)}catch(error){membershipError=clean(error?.message||'Congregation role context is unavailable.',240)||'Congregation role context is unavailable.'}
      return setState({status:'ready',authenticated:true,remoteAvailable:true,notes:Object.freeze(notes),memberships:Object.freeze(memberships),membershipError,readerContext,error:''});
    }catch(error){
      setState({status:'error',authenticated:true,remoteAvailable:true,notes:Object.freeze([]),memberships:Object.freeze([]),membershipError:'',readerContext,error:clean(error?.message||'Workspace could not load.',300)});
      throw error;
    }
  }

  function search(term){
    const query=clean(term,120).toLowerCase();
    if(!query)return Object.freeze([]);
    return Object.freeze(current.notes.filter(note=>[note.title,note.content,note.book,note.noteType,...note.tags].join(' ').toLowerCase().includes(query)));
  }

  function openScripture(noteId){
    const note=current.notes.find(item=>item.id===String(noteId||''));
    if(!note)throw new Error('Choose a note from the current Workspace.');
    reader.setBook(note.book,note.chapter);
    return 'reader';
  }

  function clear(){
    const state=sessionState();
    current=Object.freeze({status:'idle',authenticated:state.authenticated===true,remoteAvailable:state.remoteAvailable!==false,view:safeView(storage.read(STORAGE_KEY,{version:1,view:'overview'})?.view),notes:Object.freeze([]),memberships:Object.freeze([]),membershipError:'',readerContext:Object.freeze({...reader.getState()}),error:''});
  }

  return Object.freeze({snapshot,load,search,saveView,openScripture,clear,cloudNotesRoute:()=> 'cloud-notes',readerRoute:()=> 'reader'});
}

export const workspaceContract=Object.freeze({storageKey:STORAGE_KEY,views:Object.freeze([...VIEWS]),sharedWorkspace:false});
