import { createCloudNotesService } from '../src/app/cloud-notes.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const clone=value=>value===undefined?undefined:structuredClone(value);
const USER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const sessionState={authenticated:true,remoteAvailable:true,user:{id:USER,email:'mark@example.com'}};
const session={getState:()=>sessionState};
const remote=new Map();let seq=0;
const api={
  async list(userId){return [...remote.values()].filter(row=>row.user_id===userId).map(clone)},
  async create(userId,payload){const id=`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`,stamp='2026-09-08T00:00:00.000Z',row={id,user_id:userId,...clone(payload),created_at:stamp,updated_at:stamp};remote.set(id,row);return clone(row)},
  async update(userId,id,expected,payload){const row=remote.get(id);if(!row||row.user_id!==userId||row.updated_at!==expected)return null;const next={...row,...clone(payload)};remote.set(id,next);return clone(next)},
  async remove(userId,id,expected){const row=remote.get(id);if(!row||row.user_id!==userId||row.updated_at!==expected)return null;remote.delete(id);return {id}}
};
let now=new Date('2026-09-08T01:00:00.000Z');
const notes=createCloudNotesService({api,session,clock:()=>new Date(now)});

assert((await notes.load()).length===0,'Fresh Cloud Notes must load an empty remote list.');
let blank='';try{await notes.create({book:'Romans',chapter:8,content:'  '})}catch(error){blank=error.message}assert(/write a note/i.test(blank),'Cloud Notes must reject blank content.');
let badReference='';try{await notes.create({book:'Romans',chapter:8,verseEnd:39,content:'x'})}catch(error){badReference=error.message}assert(/starting verse/i.test(badReference),'Cloud Notes must reject an ending verse without a starting verse.');

const created=await notes.create({book:' Romans ',chapter:'8',verseStart:'38',verseEnd:'39',title:'  No separation  ',content:' Nothing can separate us.\r\n ',tags:'hope, study, hope',isPinned:true});
assert(created.userId===USER&&created.book==='Romans'&&created.chapter===8&&created.verseStart===38&&created.verseEnd===39,'Cloud Notes did not normalize the Scripture reference.');
assert(created.title==='No separation'&&created.content==='Nothing can separate us.'&&created.tags.join(',')==='hope,study'&&created.isPinned===true,'Cloud Notes did not normalize note metadata.');
assert(created.noteType==='study','Cloud Notes must default to deployed study note_type.');
assert(notes.list().length===1&&notes.get(created.id).id===created.id,'Cloud Notes cache did not accept the created remote row.');
assert(![...remote.values()].some(row=>row.user_id===OTHER),'Cloud Notes fake backend unexpectedly crossed account ownership.');

now=new Date('2026-09-08T02:00:00.000Z');
const updated=await notes.update(created.id,{book:'Romans',chapter:8,verseStart:38,verseEnd:39,title:'Updated',content:'Updated on this device.',tags:['hope'],isPinned:false});
assert(updated.title==='Updated'&&updated.updatedAt==='2026-09-08T02:00:00.000Z','Cloud Notes update did not issue an explicit newer concurrency token.');

const serverRow=remote.get(created.id);remote.set(created.id,{...serverRow,title:'Changed elsewhere',content:'Changed on another device.',updated_at:'2026-09-08T03:00:00.000Z'});
now=new Date('2026-09-08T04:00:00.000Z');
let conflict='';try{await notes.update(created.id,{book:'Romans',chapter:8,content:'Stale overwrite attempt.'})}catch(error){conflict=`${error.code}:${error.message}`}assert(/BQ_CLOUD_NOTES_CONFLICT/.test(conflict)&&/another device/i.test(conflict),'Cloud Notes must reject a stale edit instead of overwriting it.');
assert(remote.get(created.id).content==='Changed on another device.','Stale Cloud Notes edit overwrote the newer remote row.');
const refreshed=await notes.load();assert(refreshed[0].title==='Changed elsewhere'&&refreshed[0].updatedAt==='2026-09-08T03:00:00.000Z','Cloud Notes reload did not adopt the remote winner after conflict.');

now=new Date('2026-09-08T05:00:00.000Z');
const afterReload=await notes.update(created.id,{book:'Romans',chapter:8,verseStart:38,verseEnd:39,title:'Resolved',content:'Resolved after reload.',tags:'resolved',isPinned:false});assert(afterReload.updatedAt==='2026-09-08T05:00:00.000Z','Cloud Notes did not resume editing after reload.');
remote.set(created.id,{...remote.get(created.id),updated_at:'2026-09-08T06:00:00.000Z'});
let deleteConflict='';try{await notes.remove(created.id)}catch(error){deleteConflict=error.code}assert(deleteConflict==='BQ_CLOUD_NOTES_CONFLICT'&&remote.has(created.id),'Cloud Notes must reject a stale delete.');
await notes.load();const removed=await notes.remove(created.id);assert(removed.id===created.id&&!remote.has(created.id)&&notes.list().length===0,'Cloud Notes delete failed after reloading the current version.');

sessionState.authenticated=false;sessionState.user=null;
let authError='';try{await notes.load()}catch(error){authError=error.code}assert(authError==='BQ_CLOUD_NOTES_AUTH_REQUIRED','Guests must not be allowed to load Cloud Notes.');
notes.clear();assert(notes.list().length===0,'Cloud Notes clear must discard only the in-memory remote cache.');
let boundary='';try{createCloudNotesService({api:null,session})}catch(error){boundary=error.message}assert(/shared API and session/i.test(boundary),'Cloud Notes must require centralized API/session boundaries.');

console.log('BibleQuest v3 Cloud Notes edge regression passed.');
