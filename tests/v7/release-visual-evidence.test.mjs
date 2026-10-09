import assert from 'node:assert/strict';
import test from 'node:test';
import { assessV7VisualRelease } from '../../scripts/v7-release-visual-evidence.mjs';

const sha = 'a'.repeat(40);
const binary = 'b'.repeat(64);
const file = (src) => ({src, sha256:binary});
const asset = (type,i) => ({
  assetId:type+'-'+i, contentType:type, canonicalContentId:type+'-'+i,
  bundleStatus:'complete', ...file('/v7/images/'+type+'/'+i+'-clean.webp'),
  variants:[{kind:'with_text',...file('/v7/images/'+type+'/'+i+'-type.webp')},
    {kind:'thumbnail',...file('/v7/images/'+type+'/'+i+'-thumb.webp')}],
});
const make = (feelings=30, needs=5, heroes=1) => {
  const assets = [
    ...Array.from({length:feelings},(_,i)=>asset('emotion',i)),
    ...Array.from({length:needs},(_,i)=>asset('need',i)),
    ...Array.from({length:heroes},(_,i)=>asset('hero',i)),
  ];
  const audit={status:'PASS',manifest:{schemaVersion:1,assets}};
  const coverage={status:'PASS',releaseEligible:true,
    summary:{emotionTotal:30,completeThreeFileBundles:feelings,
      auditedAssetCount:assets.length,pendingDerivativeBackfills:30-feelings},
    needs:{total:19,completeThreeFileBundles:needs,pendingDerivativeBackfills:19-needs}};
  const browserReport={
    candidateSha:sha,sourceAuditStatus:'PASS',sourceAuditProductionReady:assets.length,
    completeBundles:assets.map(x=>({assetId:x.assetId,contentType:x.contentType})),
    verifiedServedFiles:assets.flatMap(x=>[x,...x.variants].map(z=>({
      path:z.src,sha256:z.sha256,bytes:1234}))),
    viewports:[320,390,430],
    technicalChecks:['source-asset-audit','actual-served-sha256','browser-decode',
      'intrinsic-image-dimensions','mobile-width-no-overflow']
  };
  return {audit,coverage,browserReport};
};

test('exact-SHA source plus full P0 art and Chromium evidence can certify',()=>{
  const report=assessV7VisualRelease({candidateSha:sha,...make()});
  assert.equal(report.releaseReady,true);
  assert.equal(report.status,'PASS');
  assert.equal(report.coverage.emotionComplete,30);
  assert.equal(report.coverage.needComplete,5);
  assert.equal(report.artisticInspectionClaim,false);
  assert.equal(report.draftCandidatesCountedTowardRelease,0);
});

test('development run records incomplete artwork instead of calling it a release pass',()=>{
  const report=assessV7VisualRelease({candidateSha:sha,...make(29,4,0),browserReport:null});
  assert.equal(report.releaseReady,false);
  assert.equal(report.status,'OPEN');
  assert.equal(report.coverageReady,false);
  assert.equal(report.builtBrowserVerified,false);
});

test('a passing source audit without built visual evidence is not release proof',()=>{
  const {audit,coverage}=make();
  const result=assessV7VisualRelease({candidateSha:sha,audit,coverage});
  assert.equal(result.status,'OPEN');
  assert.equal(result.coverageReady,true);
});

test('stale candidate/browser report, omitted files and falsified coverage fail closed',()=>{
  const fixture=make();
  assert.throws(()=>assessV7VisualRelease({candidateSha:'short',...fixture}),/exact candidate SHA/);
  assert.throws(()=>assessV7VisualRelease({candidateSha:sha,...fixture,
    browserReport:{...fixture.browserReport,candidateSha:'c'.repeat(40)}}),/stale or mismatched/);
  assert.throws(()=>assessV7VisualRelease({candidateSha:sha,...fixture,
    browserReport:{...fixture.browserReport,verifiedServedFiles:[]}}),/every published release image/);
  assert.throws(()=>assessV7VisualRelease({candidateSha:sha,...fixture,
    coverage:{...fixture.coverage,summary:{...fixture.coverage.summary,completeThreeFileBundles:99}}}),/do not match/);
});

test('missing one viewport or missing decode proof prevents an image-first release',()=>{
  const fixture=make();
  const report=assessV7VisualRelease({candidateSha:sha,...fixture,
    browserReport:{...fixture.browserReport,viewports:[320,390]}});
  assert.equal(report.status,'OPEN');
  assert.equal(report.builtBrowserVerified,false);
  const report2=assessV7VisualRelease({candidateSha:sha,...fixture,
    browserReport:{...fixture.browserReport,technicalChecks:['actual-served-sha256']}});
  assert.equal(report2.status,'OPEN');
});
