import { createPrivateNotesService } from '../src/app/private-notes.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>value===undefined?undefined:structuredClone(value);
const memory=new Map();
const storage={read(key,fallback=null){return memory.has(key)?clone(memory.get(key)):clone(fallback)},write(key,value){memory.set(key,clone(value));return value},remove(key){memory.delete(key)}};
let now=new Date('2026-09-08T00:00:00.000Z');
const notes=createPrivateNotesService({storage,clock:()=>new Date(now)});

assert(notes.list().length===0,'Fresh Private Notes must start empty.');
let blankError='';try{notes.create({title:'  ',body:' \n '})}catch(error){blankError=error.message}assert(/title or note/i.test(blankError),'Private Notes must reject an empty note.');

const first=notes.create({title:'  Genesis   observation  ',body:'In the beginning\r\nGod creates.'});
assert(first.id==='note-1'&&first.title==='Genesis observation'&&first.body==='In the beginning\nGod creates.','Private Notes did not normalize and create the first note correctly.');
assert(first.createdAt==='2026-09-08T00:00:00.000Z'&&first.updatedAt===first.createdAt,'Private Notes timestamps are incorrect.');
assert(memory.has('private-notes')&&memory.size===1,'Private Notes must persist only through its owned storage key.');

now=new Date('2026-09-08T01:00:00.000Z');
const second=notes.create({body:'Prayer point'});
assert(second.id==='note-2'&&notes.list()[0].id==='note-2','Private Notes must allocate deterministic IDs and list most recently updated first.');

now=new Date('2026-09-08T02:00:00.000Z');
const updated=notes.update(first.id,{title:'Genesis 1',body:'Creation observation updated.'});
assert(updated.createdAt===first.createdAt&&updated.updatedAt==='2026-09-08T02:00:00.000Z','Editing a private note must preserve createdAt and update updatedAt.');
assert(notes.list()[0].id===first.id,'Edited note must move to the top of the updated list.');

const reloaded=createPrivateNotesService({storage,clock:()=>new Date(now)});
assert(reloaded.list().length===2&&reloaded.get(first.id).body==='Creation observation updated.','Private Notes did not survive service recreation/reload.');
const exported=JSON.parse(reloaded.exportJson());
assert(exported.schema==='biblequest.private-notes'&&exported.version===1&&exported.notes.length===2,'Private Notes JSON export contract is incomplete.');
assert(exported.notes[0].id===first.id&&exported.notes[1].id===second.id,'Private Notes export must preserve the current visible note ordering.');

const removed=reloaded.remove(second.id);
assert(removed.id===second.id&&reloaded.list().length===1,'Private Notes delete did not remove exactly one note.');
let missingError='';try{reloaded.get(second.id)}catch(error){missingError=error.message}assert(/not found/i.test(missingError),'Deleted Private Notes must no longer be readable.');

const malformedMemory=new Map([['private-notes',{version:99,noteSeq:-5,notes:[null,{id:'bad',title:'x',body:'x',createdAt:'bad',updatedAt:'bad'},{id:'note-4',title:'Valid retained',body:'Body',createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-02T00:00:00.000Z'},{id:'note-4',title:'Duplicate',body:'Duplicate',createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-03T00:00:00.000Z'}]}]]);
const malformedStorage={read(key,fallback=null){return malformedMemory.has(key)?clone(malformedMemory.get(key)):clone(fallback)},write(key,value){malformedMemory.set(key,clone(value));return value}};
const normalized=createPrivateNotesService({storage:malformedStorage,clock:()=>new Date('2026-09-08T03:00:00.000Z')});
assert(normalized.list().length===1&&normalized.list()[0].id==='note-4','Malformed Private Notes persistence must retain only valid unique notes.');
assert(normalized.create({body:'After normalization'}).id==='note-5','Private Notes sequence must recover from the highest retained deterministic ID.');

let clockError='';try{createPrivateNotesService({storage,clock:()=>new Date('invalid')}).exportData()}catch(error){clockError=error.message}assert(/invalid time/i.test(clockError),'Private Notes must reject an invalid clock explicitly.');
let boundaryError='';try{createPrivateNotesService({storage:{read(){return null}}})}catch(error){boundaryError=error.message}assert(/shared storage boundary/i.test(boundaryError),'Private Notes must require the shared storage boundary.');

console.log('BibleQuest v3 Private Notes edge regression passed.');
