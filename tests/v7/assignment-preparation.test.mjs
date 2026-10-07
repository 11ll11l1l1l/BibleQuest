import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-preparation.js';

const mentor='mentor-1';
const activePair={id:'pair-1',mentorId:mentor,menteeId:'mentee-1',state:'active'};
const curriculum=[{
  id:'track-1',revisionId:'track-r1',title:'Foundations',position:0,
  modules:[{
    id:'module-1',revisionId:'module-r1',trackId:'track-1',title:'Start',position:0,
    lessons:[{id:'lesson-1',revisionId:'lesson-r1',moduleId:'module-1',title:'Assurance',position:0}],
  }],
}];

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject};}
function fixture(overrides={}){
  let actorId=mentor;
  const calls=[];
  const discipleship={
    async listPairs(){calls.push(['listPairs']);return [activePair,{id:'pair-2',mentorId:'mentor-2',menteeId:mentor,state:'active'},{id:'pair-3',mentorId:mentor,menteeId:'mentee-3',state:'ended'}];},
    async loadAssignableCurriculum(pairId){calls.push(['loadAssignableCurriculum',pairId]);return curriculum;},
    ...overrides.discipleship,
  };
  const preparation=createAssignmentPreparation({discipleship,getActorId:()=>actorId});
  return {calls,preparation,setActor(value){actorId=value;}};
}

async function selectPath(preparation){
  await preparation.loadPairs();
  await preparation.selectPair('pair-1');
  preparation.selectTrack('track-1');
  preparation.selectModule('module-1');
  preparation.selectLesson('lesson-1');
}

test('loads only active pairs where the current actor is the mentor',async()=>{
  const f=fixture();await f.preparation.loadPairs();
  assert.deepEqual(f.preparation.getState().pairs,[activePair]);
  assert.equal(f.preparation.getState().status,'ready');
});

test('drills through published curriculum and builds an immutable backend request',async()=>{
  const f=fixture();await selectPath(f.preparation);
  const request=f.preparation.buildRequest();
  assert.deepEqual(request,{pairId:'pair-1',trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'lesson-r1'});
  assert.ok(Object.isFrozen(request));
  assert.deepEqual(f.calls,[['listPairs'],['loadAssignableCurriculum','pair-1']]);
});

test('rejects hierarchy selections that are outside the loaded parent path',async()=>{
  const f=fixture();await f.preparation.loadPairs();await f.preparation.selectPair('pair-1');
  assert.throws(()=>f.preparation.selectTrack('other-track'),{code:'BQ_ASSIGNMENT_CURRICULUM'});
  f.preparation.selectTrack('track-1');
  assert.throws(()=>f.preparation.selectModule('other-module'),{code:'BQ_ASSIGNMENT_CURRICULUM'});
  f.preparation.selectModule('module-1');
  assert.throws(()=>f.preparation.selectLesson('other-lesson'),{code:'BQ_ASSIGNMENT_CURRICULUM'});
});

test('does not expose a mutation and invalidates preparation on actor changes',async()=>{
  const f=fixture();await selectPath(f.preparation);
  assert.equal('createAssignment' in f.preparation,false);
  f.setActor('other-user');
  assert.throws(()=>f.preparation.buildRequest(),{code:'BQ_ASSIGNMENT_CONTEXT_STALE'});
  f.preparation.invalidate();
  assert.equal(f.preparation.getState().pairs.length,0);
  assert.equal(f.preparation.getState().selected.pairId,null);
});

test('fails closed when actor changes during an async pair load',async()=>{
  const late=deferred();const f=fixture({discipleship:{async listPairs(){return late.promise;}}});
  const loading=f.preparation.loadPairs();f.setActor('other-user');late.resolve([activePair]);await loading;
  assert.equal(f.preparation.getState().status,'error');
  assert.match(f.preparation.getState().error,/Account changed/);
  assert.equal(f.preparation.getState().pairs.length,0);
});

test('dispose clears state and suppresses late curriculum results',async()=>{
  const late=deferred();const f=fixture({discipleship:{async loadAssignableCurriculum(){return late.promise;}}});
  await f.preparation.loadPairs();const loading=f.preparation.selectPair('pair-1');f.preparation.dispose();late.resolve(curriculum);await loading;
  assert.equal(f.preparation.getState().status,'disposed');
  assert.equal(f.preparation.getState().curriculum.length,0);
});
