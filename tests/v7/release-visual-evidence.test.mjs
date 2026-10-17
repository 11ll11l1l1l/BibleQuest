import assert from 'node:assert/strict';
import test from 'node:test';
import { assessV7VisualRelease, attestV7ReleaseScreenshots, V7_RELEASE_REQUIRED_NEEDS } from '../../scripts/v7-release-visual-evidence.mjs';
import { LIBRARY_EMOTIONS } from '../../src/features/library/emotion-taxonomy.js';

const sha = 'a'.repeat(40);
const binary = 'b'.repeat(64);
const file = (src) => ({src, sha256:binary});
const asset = (type,i) => ({
  assetId:type+'-'+i, contentType:type,
  canonicalContentId: type === 'emotion' ? LIBRARY_EMOTIONS[i]?.id
    : type === 'need' ? (V7_RELEASE_REQUIRED_NEEDS[i] || 'extra-need-'+i)
      : type === 'hero' ? 'home' : type+'-'+i,
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

test('exact-SHA source plus verified published artwork and Chromium evidence can certify',()=>{
  const report=assessV7VisualRelease({candidateSha:sha,...make()});
  assert.equal(report.releaseReady,true);
  assert.equal(report.status,'PASS');
  assert.equal(report.coverage.emotionComplete,30);
  assert.equal(report.coverage.needComplete,5);
  assert.equal(report.artisticInspectionClaim,false);
  assert.equal(report.draftCandidatesCountedTowardRelease,0);
});

test('development run still needs built browser proof even when missing artwork is allowed',()=>{
  const report=assessV7VisualRelease({candidateSha:sha,...make(29,4,0),browserReport:null});
  assert.equal(report.releaseReady,false);
  assert.equal(report.status,'OPEN');
  assert.equal(report.coverageReady,true);
  assert.equal(report.builtBrowserVerified,false);
});

test('unused launch Need image IDs are reported but do not block text-first release',()=>{
  const fixture=make();
  fixture.audit.manifest.assets.find(a=>a.contentType==='need' && a.canonicalContentId==='strength')
    .canonicalContentId='wisdom';
  const result=assessV7VisualRelease({candidateSha:sha,...fixture});
  assert.equal(result.coverage.needComplete,5);
  assert.equal(result.coverageReady,true);
  assert.deepEqual(result.coverage.missingLaunchNeeds,['strength']);
  assert.equal(result.status,'PASS');
});

test('missing canonical Feeling art is informational when colored selectors are available',()=>{
  const fixture=make();
  fixture.audit.manifest.assets.find(a=>a.contentType==='emotion' && a.canonicalContentId==='connected')
    .canonicalContentId='invented-feeling';
  const result=assessV7VisualRelease({candidateSha:sha,...fixture});
  assert.equal(result.coverage.emotionComplete,30);
  assert.equal(result.coverageReady,true);
  assert.deepEqual(result.coverage.missingLaunchFeelings,['connected']);
  assert.equal(result.status,'PASS');
});

test('missing Home hero art may use the editorial color/text hero',()=>{
  const fixture=make();
  fixture.audit.manifest.assets.find(a=>a.contentType==='hero').canonicalContentId='library-banner';
  const result=assessV7VisualRelease({candidateSha:sha,...fixture});
  assert.equal(result.coverage.heroComplete,0);
  assert.equal(result.coverageReady,true);
  assert.equal(result.status,'PASS');
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

test('missing browser viewport or decode proof blocks any published images',()=>{
  const fixture=make();
  const report=assessV7VisualRelease({candidateSha:sha,...fixture,
    browserReport:{...fixture.browserReport,viewports:[320,390]}});
  assert.equal(report.status,'OPEN');
  assert.equal(report.builtBrowserVerified,false);
  const report2=assessV7VisualRelease({candidateSha:sha,...fixture,
    browserReport:{...fixture.browserReport,technicalChecks:['actual-served-sha256']}});
  assert.equal(report2.status,'OPEN');
});


test('zero published artwork can release with a fully verified text fallback, not fabricated image files', () => {
  const fixture = make(0, 0, 0);
  const report = assessV7VisualRelease({ candidateSha: sha, ...fixture });
  assert.equal(report.releaseReady, true);
  assert.equal(report.coverageReady, true);
  assert.equal(report.auditedAssetCount, 0);
  assert.equal(report.verifiedPublishedFileCount, 0);
  assert.equal(report.presentationPolicy, 'text-first-optional-art');
  assert.equal(report.coverage.missingLaunchFeelings.length, 30);
  assert.equal(report.coverage.missingLaunchNeeds.length, 5);
  assert.deepEqual(report.minimum, { emotions: 0, needs: 0, heroes: 0 });
  const bad = { ...fixture.browserReport, verifiedServedFiles: [{ path: '/v7/images/unknown.webp', sha256: binary, bytes: 1 }] };
  assert.throws(() => assessV7VisualRelease({ candidateSha: sha, audit: fixture.audit, coverage: fixture.coverage, browserReport: bad }),
    /every published release image/);
});

test('CLEAN-only published images remain verifiable instead of forcing generated derivative files', () => {
  const fixture = make(0, 0, 0);
  const clean = { ...asset('emotion',0), bundleStatus:'partial', variants:[] };
  fixture.audit.manifest.assets.push(clean);
  fixture.coverage.summary.auditedAssetCount = 1;
  fixture.browserReport.sourceAuditProductionReady = 1;
  fixture.browserReport.verifiedServedFiles = [{ path: clean.src, sha256: clean.sha256, bytes:1234 }];
  const report = assessV7VisualRelease({ candidateSha: sha, ...fixture });
  assert.equal(report.releaseReady, true);
  assert.equal(report.verifiedPublishedFileCount, 1);
  assert.equal(report.coverage.emotionComplete, 0);
});
const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(32)]);
const withShots = () => {
  const fixture = make(1, 1, 1);
  const screenshots = fixture.audit.manifest.assets.flatMap(asset =>
    ['with_text', 'thumbnail'].flatMap(kind =>
      [320, 390, 430].map(width =>
        `artifacts/v7/visual-browser/release-${asset.assetId}-${kind}-${width}.png`)));
  fixture.browserReport.screenshots = [
    ...screenshots,
    'artifacts/v7/visual-browser/draft-not-published-thumbnail-320.png'
  ];
  return fixture;
};

test('real PNG bytes of every published mobile TYPE/THUMB screenshot receive immutable SHA-256', async () => {
  const fixture = withShots();
  const sealed = await attestV7ReleaseScreenshots(fixture.browserReport, fixture.audit.manifest.assets, {
    loadScreenshot: async () => png
  });
  assert.equal(sealed.count, 18);
  assert.equal(sealed.images.length, 18);
  assert(sealed.images.every(row => /^[0-9a-f]{64}$/.test(row.sha256)));
  assert.equal(sealed.images.some(row => row.path.includes('/draft-')), false);
  assert.match(sealed.sha256, /^[0-9a-f]{64}$/);
});

test('missing, duplicate or altered browser release screenshot evidence fails closed', async () => {
  const fixture = withShots();
  const loadScreenshot = async () => png;
  const screenshots = fixture.browserReport.screenshots;
  await assert.rejects(attestV7ReleaseScreenshots(
    {...fixture.browserReport, screenshots:screenshots.slice(1)}, fixture.audit.manifest.assets,
    { loadScreenshot }), /missing, duplicated, or unexpected/);
  await assert.rejects(attestV7ReleaseScreenshots(
    {...fixture.browserReport, screenshots:[...screenshots, screenshots[0]]}, fixture.audit.manifest.assets,
    { loadScreenshot }), /missing, duplicated, or unexpected/);
  await assert.rejects(attestV7ReleaseScreenshots(
    fixture.browserReport, fixture.audit.manifest.assets,
    { loadScreenshot:async () => Buffer.from('not-a-png') }), /not a PNG/);
  await assert.rejects(attestV7ReleaseScreenshots(
    fixture.browserReport, [...fixture.audit.manifest.assets, {assetId:'../escape',bundleStatus:'complete'}],
    { loadScreenshot }), /Unsafe visual asset ID/);
});
