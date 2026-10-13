import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { triageV7ArtworkCandidates, triageV7SingleMasters } from '../../scripts/v7-visual-candidate-triage.mjs';
import { candidateQuarantineReason, KNOWN_REJECTED_V7_VARIANTS } from '../../scripts/v7-visual-candidate-policy.mjs';

async function fixture(t, entries) {
  const root = await mkdtemp(join(tmpdir(), 'bq-v7-candidate-triage-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dir = join(root, 'data/v7/visual-assets/records');
  await mkdir(dir, { recursive: true });
  for (const [name, value] of Object.entries(entries))
    await writeFile(join(dir, name + '.json'), JSON.stringify(value));
  return root;
}
const row = (status, variants = ['CLEAN', 'TYPE', 'THUMB']) => ({
  schemaVersion: 2, contentType: 'emotion', status, variants: variants.map(kind => ({ kind }))
});
const makeFiles = () => ['CLEAN', 'TYPE', 'THUMB'].map((kind, i) => ({
  kind, path: '/v7/images/emotion/example-' + i + '.webp',
  sha256: String(i).repeat(64), width: 1024, height: 1024, bytes: 120
}));

test('draft triage verifies complete unapproved files, quarantines failures and excludes published masters', async t => {
  const root = await fixture(t, {
    'bqv7-emotion-good-01': row('candidate_built_app_qa_pending'),
    'bqv7-emotion-bad-01': row('candidate_built_app_qa_pending'),
    'bqv7-emotion-published-01': row('production_ready'),
    'bqv7-emotion-partial-01': row('candidate_awaiting_derivative', ['CLEAN'])
  });
  const visited = [];
  const result = await triageV7ArtworkCandidates(root, async (_, id) => {
    visited.push(id);
    if (id.includes('bad')) throw new Error('SHA mismatch');
    return { assetId: id, technicalIntegrity: 'PASS', files: makeFiles() };
  });
  assert.deepEqual(visited, ['bqv7-emotion-bad-01', 'bqv7-emotion-good-01']);
  assert.deepEqual(result.threeFileCandidates, visited);
  assert.deepEqual(result.technicallyVerified.map(x => x.assetId), ['bqv7-emotion-good-01']);
  assert.deepEqual(result.rejected.map(x => x.reason), ['SHA mismatch']);
  assert.equal(result.publicationApproved, false);
  assert.equal(result.technicallyVerified[0].publicationApproved, false);
});

test('draft triage rejects fake technical PASS, duplicate kinds and mismatched identity', async t => {
  const root = await fixture(t, { 'bqv7-need-shelter-01': {
    schemaVersion: 2, contentType: 'need', status: 'pending', variants: [{}, {}, {}]
  } });
  for (const value of [
    { assetId: 'someone-else', technicalIntegrity: 'PASS', files: makeFiles() },
    { assetId: 'bqv7-need-shelter-01', technicalIntegrity: 'PASS',
      files: [makeFiles()[0], makeFiles()[0], makeFiles()[2]] },
    { assetId: 'bqv7-need-shelter-01', technicalIntegrity: 'not_run', files: makeFiles() }
  ]) {
    const result = await triageV7ArtworkCandidates(root, async () => value);
    assert.equal(result.technicallyVerified.length, 0);
    assert.equal(result.rejected.length, 1);
    assert.equal(result.publicationApproved, false);
  }
});

test('candidate scanner rejects malformed sidecars instead of silently approving them', async t => {
  const root = await fixture(t, {});
  await writeFile(join(root, 'data/v7/visual-assets/records/bqv7-emotion-corrupt-01.json'), '{bad json');
  const result = await triageV7ArtworkCandidates(root, async () => {
    throw new Error('No invalid file should ever be audited as valid');
  });
  assert.equal(result.technicallyVerified.length, 0);
  assert.equal(result.rejected.length, 1);
  assert.match(result.rejected[0].reason, /unreadable candidate sidecar/);
});

test('repair-required, unsafe SVG and failed TYPE safe-area candidates cannot pass mocked technical verification', async t => {
  const badSafeArea = row('candidate_built_app_qa_pending');
  badSafeArea.variants[1].qa = { topSafeAreaAcceptable: false };
  const badSvg = row('candidate_built_app_qa_pending');
  badSvg.qc = { svgDataUriPolicyCompliant: false };
  const root = await fixture(t, {
    'bqv7-emotion-top-edge-01': badSafeArea,
    'bqv7-emotion-svg-unsafe-01': badSvg,
    'bqv7-emotion-repair-01': row('candidate_type_top_safe_area_repair_required'),
    'bqv7-emotion-valid-01': row('candidate_built_app_qa_pending')
  });
  const visited = [];
  const result = await triageV7ArtworkCandidates(root, async (_, assetId) => {
    visited.push(assetId);
    return { assetId, technicalIntegrity: 'PASS', files: makeFiles() };
  });
  assert.deepEqual(visited, ['bqv7-emotion-valid-01']);
  assert.deepEqual(result.technicallyVerified.map(x => x.assetId), visited);
  assert.equal(result.rejected.length, 3);
  assert(result.rejected.every(row => /quarantined/.test(row.reason)));
  assert.equal(result.publicationApproved, false);
});


test('known rejected image digests cannot be relabeled as visually approved candidates', () => {
  assert.equal(Object.keys(KNOWN_REJECTED_V7_VARIANTS).length, 5);
  for (const [assetId, variants] of Object.entries(KNOWN_REJECTED_V7_VARIANTS)) {
    for (const variant of variants) {
      const record = {
        assetId, status: 'candidate_built_app_qa_pending',
        variants: [{ kind: variant.kind, sha256: variant.sha256, qa: {
          topSafeAreaAcceptable: true, spellingCheckedAgainstTaxonomy: true,
          visualInspected: true, subjectReadableAtThumbnail: true
        }}]
      };
      assert.match(candidateQuarantineReason(record), /known-bad visual variant: PR #/);
      record.variants[0].sha256 = '0'.repeat(64);
      assert.equal(candidateQuarantineReason(record), null,
        'new digest needs fresh review but is not on the known-bad list');
    }
  }
});

async function singleFixture(t, change=()=>{}) {
 const root=await fixture(t,{});
 const source=await readFile(new URL('../../src/features/library/emotion-taxonomy.js',import.meta.url));
 const sourceBlob=createHash('sha1').update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
 // Header triage fixture only; actual full decoding is a separate Chromium gate.
 const bytes=Buffer.alloc(30);bytes.write('RIFF',0);bytes.writeUInt32LE(22,4);bytes.write('WEBP',8);
 bytes.write('VP8X',12);bytes.writeUInt32LE(10,16);bytes.writeUIntLE(1023,24,3);bytes.writeUIntLE(1023,27,3);
 const digest=createHash('sha256').update(bytes).digest('hex');
 const row={family:'emotion',contentId:'peaceful',variant:'CLEAN',attemptId:'test-single',producer:'manual-chat',
  sourcePath:'src/features/library/emotion-taxonomy.js',sourceRevision:'taxonomy-'+sourceBlob,
  sourceChecksum:'gitblob:'+sourceBlob,sceneRevision:'test-r1',status:'qa_pending',qa:{},
  candidatePath:'data/v7/visual-assets/qa-candidates/test-single.webp',sha256:digest,
  measured:{width:1024,height:1024,bytes:bytes.length,sha256:digest},reference:'Philippians 4:11-12',
  focalPoint:{x:0,y:1},generation:{provider:'OpenAI image generation',thirdPartyInputs:false,originalSha256:'a'.repeat(64)},
  producerPreflight:{noBakedText:true,singleScene:true}};
 await mkdir(join(root,'src/features/library'),{recursive:true});
 await writeFile(join(root,row.sourcePath),source);
 await mkdir(join(root,'data/v7/visual-assets/qa-candidates'),{recursive:true});
 await writeFile(join(root,row.candidatePath),bytes);
 change(row);
 await writeFile(join(root,'data/v7/visual-assets/production-ledger.json'),JSON.stringify({schemaVersion:1,entries:[row]}));
 return root;
}
test('one CLEAN candidate reaches technical intake without inventing TYPE/THUMB or publication',async t=>{
 const result=await triageV7SingleMasters(await singleFixture(t));
 assert.equal(result.technicallyVerified.length,1);assert.deepEqual(result.rejected,[]);
 assert.equal(result.publicationApproved,false);assert.equal(result.technicallyVerified[0].labels.ilo,'Natalna / kontento');
});
test('single-master intake rejects changed bytes, source revisions, unsafe paths and noncanonical wording',async t=>{
 for(const change of [r=>{r.sha256='0'.repeat(64)},r=>{r.sourceChecksum='gitblob:'+'0'.repeat(40)},
  r=>{r.candidatePath='../../private.webp'},r=>{r.reference='Matthew 1:1'},r=>{r.focalPoint.x=NaN},
  r=>{r.generation.thirdPartyInputs=true}]) {
  const result=await triageV7SingleMasters(await singleFixture(t,change));
  assert.equal(result.technicallyVerified.length,0);assert.equal(result.rejected.length,1);
 }
});
test('rejected ledger attempts never re-enter single-master browser intake',async t=>{
 const root=await singleFixture(t,r=>{r.status='rejected';delete r.candidatePath});
 const result=await triageV7SingleMasters(root);assert.deepEqual(result.technicallyVerified,[]);
});
