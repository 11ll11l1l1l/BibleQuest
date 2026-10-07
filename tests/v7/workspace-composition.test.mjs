import test from 'node:test';
import assert from 'node:assert/strict';
import { v7AuthoringContext, createV7WorkspacePage } from '../../src/app/v7-workspace.js';
const userId='11111111-1111-4111-8111-111111111111', congregationId='22222222-2222-4222-8222-222222222222';
const session={getState:()=>({authenticated:true,user:{id:userId}})};
const membership={getActive:()=>({userId,congregationId,role:'leader'})};
test('workspace derives author capability only from the current owned congregation',()=>{
  assert.equal(v7AuthoringContext(session,membership).canAuthor,true);
  for(const role of ['member','facilitator','unknown'])assert.equal(v7AuthoringContext(session,{getActive:()=>({userId,congregationId,role})}).canAuthor,false);
  assert.equal(v7AuthoringContext(session,{getActive:()=>({userId:congregationId,congregationId,role:'admin'})}).canAuthor,false);
  assert.equal(v7AuthoringContext({getState:()=>({authenticated:false})},membership).canAuthor,false);
});
test('workspace composes existing authoring and assignment pages without eager reads or mutations',()=>{
  const options={session,membership,client:()=>{throw new Error('No eager database operation');},service:{listPairs(){throw new Error("No eager reads");},loadAssignableCurriculum(){throw new Error("No eager reads");}}};
  assert.match(createV7WorkspacePage({...options,view:'authoring'}).html,/data-authoring-publication/);
  assert.match(createV7WorkspacePage({...options,view:'assignment'}).html,/data-assignment-preparation/);
  assert.throws(()=>createV7WorkspacePage({...options,view:'invalid'}),/Unknown/);
});
