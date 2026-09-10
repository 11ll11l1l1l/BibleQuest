import assert from 'node:assert/strict';
import {createWorkspaceService} from '../src/app/workspace.js';

let sessionState={authenticated:false,remoteAvailable:true,user:null},noteLoads=0,memberLoads=0,clears=0,readerSets=[],stored={version:1,view:'notes'};
const session={getState:()=>sessionState};
const cloudNotes={
  load:async()=>{noteLoads++;return [{id:'n1',userId:'u1',book:'JHN',chapter:3,verseStart:16,verseEnd:null,title:'Grace',content:'God loved the world',tags:['love'],noteType:'study',isPinned:true,updatedAt:'2026-09-10T08:00:00.000Z'}]},
  clear:()=>{clears++}
};
let memberships=[{congregationId:'c1',role:'pastor',roleKnown:true,roleLabel:'Pastor',congregation:{name:'Grace Church'}},{congregationId:'c2',role:null,roleKnown:false,roleLabel:'Unsupported role',congregation:{name:'Unknown Church'}}];
const congregation={load:async()=>{memberLoads++;return memberships},clear:()=>{clears++}};
const reader={getState:()=>({translation:'bsb',book:'JHN',chapter:1,read:{}}),setBook:(book,chapter)=>readerSets.push({book,chapter})};
const storage={read:(_key,fallback)=>stored??fallback,write:(_key,value)=>{stored=value;return value}};
const workspace=createWorkspaceService({session,cloudNotes,congregation,reader,storage});

assert.equal(workspace.snapshot().view,'notes','Workspace must restore only its bounded persisted view state.');
let state=await workspace.load();assert.equal(state.status,'signed-out');assert.equal(noteLoads,0);assert.equal(memberLoads,0);assert.equal(state.notes.length,0,'Signed-out Workspace must not retain private cloud rows.');

sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};state=await workspace.load();assert.equal(state.status,'unavailable');assert.equal(noteLoads,0,'Local preview must not load Cloud Notes.');assert.equal(memberLoads,0,'Local preview must not load congregation roles.');

sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};state=await workspace.load();assert.equal(state.status,'ready');assert.equal(noteLoads,1);assert.equal(memberLoads,1);assert.equal(state.notes.length,1);assert.equal(state.memberships.length,2);assert.equal(state.memberships[0].role,'pastor');assert.equal(state.memberships[1].roleKnown,false,'Unsupported roles must remain unsupported.');
assert.equal(workspace.search('LOVE').length,1);assert.equal(workspace.search('missing').length,0);assert.equal(workspace.search('').length,0);
assert.equal(workspace.openScripture('n1'),'reader');assert.deepEqual(readerSets,[{book:'JHN',chapter:3}]);assert.throws(()=>workspace.openScripture('wrong'),/current Workspace/);

state=workspace.saveView('overview');assert.equal(state.view,'overview');assert.deepEqual(stored,{version:1,view:'overview'});workspace.saveView('arbitrary');assert.deepEqual(stored,{version:1,view:'overview'},'Unknown Workspace views must normalize instead of persisting arbitrary state.');
const restored=createWorkspaceService({session,cloudNotes,congregation,reader,storage});assert.equal(restored.snapshot().view,'overview','Saved Workspace view must survive service reconstruction.');
assert.equal(workspace.cloudNotesRoute(),'cloud-notes');assert.equal(workspace.readerRoute(),'reader');
assert.equal('sharedWorkspace' in (await import('../src/app/workspace.js')).workspaceContract,true);assert.equal((await import('../src/app/workspace.js')).workspaceContract.sharedWorkspace,false,'No congregation role may unlock shared Workspace authority.');

memberships=[];state=await workspace.load();assert.equal(state.status,'ready');assert.equal(state.memberships.length,0,'Private Workspace must remain usable without congregation membership.');
console.log('BibleQuest v3 Workspace edge/session regression passed.');
