import test from 'node:test';
import assert from 'node:assert/strict';
import { minimumSize, verifyGeometry, selectNext, validateLedger } from '../../scripts/v7-image-work-ledger.mjs';

function webpHeader(width,height) {
  const b=Buffer.alloc(30);
  b.write('RIFF',0); b.writeUInt32LE(22,4); b.write('WEBP',8); b.write('VP8X',12);
  b.writeUInt32LE(10,16);
  b.writeUIntLE(width-1,24,3); b.writeUIntLE(height-1,27,3);
  return b;
}
function row(id,status='qa_pending') {
  return {family:'devotional',contentId:'devotional.biblequest.anger.01',
    variant:'CLEAN',attemptId:'try-'+id,producer:'manual-chat-z',
    sourceRevision:'r1',sceneRevision:'scene-'+id,status,qa:{}};
}
test('realistic release raster minimums for all visual families', () => {
  assert.deepEqual(minimumSize('emotion','CLEAN'),{width:1024,height:1024,aspect:1});
  assert.deepEqual(minimumSize('devotional','CLEAN'),{width:768,height:960,aspect:0.8});
  assert.deepEqual(minimumSize('hero','CLEAN'),{width:1536,height:864,aspect:16/9});
  assert.deepEqual(minimumSize('devotional','THUMB'),{width:384,height:480,aspect:0.8});
});
test('size + aspect are checked on source bytes, not file naming', () => {
  assert.equal(verifyGeometry(webpHeader(768,960),'devotional','CLEAN').width,768);
  assert.equal(verifyGeometry(webpHeader(1122,1402),'devotional','CLEAN').height,1402);
  assert.throws(()=>verifyGeometry(webpHeader(640,800),'devotional','CLEAN'),/too small/);
  assert.throws(()=>verifyGeometry(webpHeader(1024,1024),'devotional','CLEAN'),/wrong aspect/);
  assert.throws(()=>verifyGeometry(webpHeader(1280,720),'hero','CLEAN'),/too small/);
  assert.throws(()=>verifyGeometry(Buffer.from('<svg/>'),'emotion','CLEAN'),/Truncated|Unrecognized/);
});
test('one active slot; rejected attempt can be followed only by a new scene', () => {
  const a=row('a');
  assert.equal(validateLedger({schemaVersion:1,entries:[a]}),true);
  assert.throws(()=>validateLedger({schemaVersion:1,entries:[a,row('b')]}),/duplicate in-flight/);
  const dead={...row('b','rejected'),candidatePath:null};
  assert.equal(validateLedger({schemaVersion:1,entries:[a,dead]}),true);
  assert.throws(()=>validateLedger({schemaVersion:1,entries:[{...dead,candidatePath:'public/bad.png'}]}),/failed candidate path retained/);
  assert.throws(()=>validateLedger({schemaVersion:1,entries:[a,{...row('c'),sceneRevision:a.sceneRevision}]}),/reused scene revision/);
});
test('QA passes need five distinct roles and GitHub evidence', () => {
  const approved={...row('ok','qa_passed')};
  assert.throws(()=>validateLedger({schemaVersion:1,entries:[approved]}),/unproved/);
  approved.qa=Object.fromEntries(['scene','rights','technical','uniqueness','coordinator']
    .map(k=>[k,{verdict:'PASS',evidence:'https://github.com/11ll11l1l1l/BibleQuest/pull/1476'}]));
  assert.equal(validateLedger({schemaVersion:1,entries:[approved]}),true);
});
test('failed, held and already-reviewed slots do not block the next item',()=>{
  const first=row('a','rejected'), second=row('b'), third=row('c');
  second.qa.scene={verdict:'HOLD',evidence:'no actual pixels'};
  assert.equal(selectNext([first,second,third],'scene').attemptId,'try-c');
  assert.equal(selectNext([first,second,third],'rights').attemptId,'try-b');
  assert.equal(selectNext([first,second,third],'coordinator').attemptId,'try-b');
});
