import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { triageV7ArtworkCandidates } from '../../scripts/v7-visual-candidate-triage.mjs';
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
