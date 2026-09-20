const STORAGE_KEY='bible-quest-state';
const VERSION=1;
const ALLOWED_PACES=Object.freeze([1,2,3,4]);

function iso(value){
  const date=value instanceof Date?new Date(value.getTime()):new Date(value);
  if(!Number.isFinite(date.getTime()))throw new Error('Bible Quest time is invalid.');
  return date.toISOString();
}
function keyOf(code,chapter){return `${String(code||'').toUpperCase()}:${Number(chapter)}`}

export function createBibleQuestService({storage,books,progress=null,clock=()=>new Date()}={}){
  if(!storage?.read||!storage?.write)throw new Error('Bible Quest requires the shared storage boundary.');
  if(!Array.isArray(books)||!books.length)throw new Error('Bible Quest requires the canonical Bible book list.');

  const canonical=Object.freeze(books.flatMap(book=>Array.from({length:Number(book.chapters)||0},(_,index)=>Object.freeze({
    key:keyOf(book.code,index+1),code:book.code,book:book.name,bookIndex:book.index,chapter:index+1
  }))));
  const canonicalByKey=new Map(canonical.map(item=>[item.key,item]));
  const totalChapters=canonical.length;
  if(totalChapters!==1189)throw new Error(`Bible Quest canonical chapter count mismatch: expected 1189, got ${totalChapters}.`);

  function empty(){return {version:VERSION,pace:1,startedAt:'',completedAt:'',activeKey:'',completed:{}}}
  function normalize(input){
    const raw=input&&typeof input==='object'&&!Array.isArray(input)&&Number(input.version)===VERSION?input:empty();
    const pace=ALLOWED_PACES.includes(Number(raw.pace))?Number(raw.pace):1;
    const completed={};
    for(const item of canonical){
      const row=raw.completed?.[item.key];
      if(!row||typeof row!=='object'||Array.isArray(row))break;
      completed[item.key]={
        completedAt:typeof row.completedAt==='string'?row.completedAt:'',
        translation:typeof row.translation==='string'?row.translation:'',
        source:typeof row.source==='string'?row.source:'quest'
      };
    }
    const completedCount=Object.keys(completed).length;
    const complete=completedCount===totalChapters;
    const activeKey=!complete&&canonicalByKey.has(raw.activeKey)&&raw.activeKey===canonical[completedCount]?.key?raw.activeKey:'';
    return {
      version:VERSION,
      pace,
      startedAt:typeof raw.startedAt==='string'?raw.startedAt:'',
      completedAt:complete&&typeof raw.completedAt==='string'?raw.completedAt:'',
      activeKey,
      completed
    };
  }

  let state=normalize(storage.read(STORAGE_KEY,empty()));
  const persist=next=>{storage.write(STORAGE_KEY,next);state=next;return next};

  function currentIndex(){return Object.keys(state.completed).length}
  function nextRequired(){return canonical[currentIndex()]||null}
  function bookSummaries(){
    const count=currentIndex();
    let consumed=0;
    return Object.freeze(books.map(book=>{
      const chapters=Number(book.chapters)||0;
      const completed=Math.max(0,Math.min(chapters,count-consumed));
      consumed+=chapters;
      return Object.freeze({
        code:book.code,name:book.name,chapters,completed,
        complete:completed===chapters,
        percent:chapters?Math.round((completed/chapters)*100):0
      });
    }));
  }
  function upcoming(limit=state.pace){
    const amount=Math.max(1,Math.min(12,Number(limit)||1));
    return Object.freeze(canonical.slice(currentIndex(),currentIndex()+amount));
  }
  function snapshot(){
    const completedChapters=currentIndex(),next=nextRequired(),booksState=bookSummaries();
    const completedBooks=booksState.filter(book=>book.complete).length;
    return Object.freeze({
      version:VERSION,
      totalChapters,
      completedChapters,
      remainingChapters:totalChapters-completedChapters,
      totalBooks:books.length,
      completedBooks,
      percent:Number(((completedChapters/totalChapters)*100).toFixed(1)),
      pace:state.pace,
      startedAt:state.startedAt,
      completedAt:state.completedAt,
      active:Boolean(state.activeKey),
      activeKey:state.activeKey,
      next,
      today:upcoming(),
      books:booksState,
      complete:completedChapters===totalChapters
    });
  }
  function setPace(value){
    const pace=Number(value);
    if(!ALLOWED_PACES.includes(pace))throw new Error('Bible Quest pace must be 1, 2, 3, or 4 chapters per day.');
    if(state.pace===pace)return snapshot();
    persist({...state,pace});
    return snapshot();
  }
  function activateNext(){
    const next=nextRequired();
    if(!next)return snapshot();
    const now=iso(clock());
    persist({...state,activeKey:next.key,startedAt:state.startedAt||now});
    return snapshot();
  }
  function deactivate(){
    if(!state.activeKey)return snapshot();
    persist({...state,activeKey:''});
    return snapshot();
  }
  function completeActive({code,chapter,translation='',source='reader'}={}){
    const next=nextRequired();
    if(!next) return Object.freeze({applied:false,duplicate:true,state:snapshot(),completed:null});
    const key=keyOf(code,chapter);
    if(!state.activeKey)throw new Error('Open the next Bible Quest chapter before completing it.');
    if(key!==state.activeKey||key!==next.key)throw new Error(`Bible Quest must continue in order. Next required chapter is ${next.book} ${next.chapter}.`);
    const at=iso(clock());
    const completed={...state.completed,[key]:{completedAt:at,translation:String(translation||''),source:String(source||'reader')}};
    const isFinal=Object.keys(completed).length===totalChapters;
    const updated={...state,completed,activeKey:'',completedAt:isFinal?at:''};
    persist(updated);
    progress?.record?.({id:`bible-quest:${key}`,type:'bible.quest.chapter.complete',xp:0,meaningful:true});
    return Object.freeze({applied:true,duplicate:false,state:snapshot(),completed:next});
  }
  function reference(code,chapter){
    const item=canonicalByKey.get(keyOf(code,chapter));
    if(!item)throw new Error('Bible Quest reference is outside the canonical Bible.');
    return Object.freeze({...item});
  }

  return Object.freeze({
    snapshot,setPace,activateNext,deactivate,completeActive,reference,
    isActiveTarget(code,chapter){return state.activeKey===keyOf(code,chapter)},
    isQuestComplete(code,chapter){return Boolean(state.completed[keyOf(code,chapter)])},
    nextRequired,
    canonical,
    allowedPaces:ALLOWED_PACES
  });
}
