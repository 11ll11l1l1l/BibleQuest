import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateTypeWording, auditV7LaneZWording } from '../../scripts/v7-lane-z-wording-qa.mjs';

const master = { assetId: 'bqv7-emotion-temptation-01', contentType: 'emotion', contentId: 'temptation', status: 'production_ready' };
const variant = { kind: 'TYPE', locale: 'en', includedWording: 'Tempted',
  includedReference: '1 Corinthians 10:13', qa: { typeReadableAt320px: true } };

test('accepts canonical TYPE label and source-approved reference', () => {
  const result = validateTypeWording(master, {}, variant, 'example');
  assert.deepEqual(result.failures, []);
  assert.ok(result.pending.includes('no revision-pinned structured wording proof'));
});

test('finds label mismatch and unrelated Scripture reference', () => {
  const result = validateTypeWording(master, {}, { ...variant, includedWording: 'Temptation', includedReference: 'Psalm 34:4' }, 'example');
  assert.match(result.failures.join('\n'), /TYPE label.*Temptation/);
  assert.match(result.failures.join('\n'), /unapproved taxonomy reference/);
});

test('rejects locale mismatch and mismatched proof', () => {
  const result = validateTypeWording(master, { wordingEvidence: {
    sourcePath: 'src/features/library/emotion-taxonomy.js', sourceBlobSha: 'example',
    canonicalEmotionId: 'afraid', exactLabel: 'Afraid', reference: 'Psalm 34:4'
  } }, variant, 'example');
  assert.match(result.failures.join('\n'), /different taxonomy concept/);
  assert.match(result.failures.join('\n'), /disagrees with wording proof/);
  assert.ok(validateTypeWording(master, {}, { ...variant, locale: 'jp' }, 'example').failures.some(x => x.includes('locale')));
});

test('flags quoted Bible wording without treating it as independently checked', () => {
  const result = validateTypeWording(master, {}, { ...variant, scriptureText: 'unverified quote' }, 'example');
  assert.ok(result.pending.some(x => x.includes('exact-edition')));
});

test('counts candidate mismatch without failing the published CLEAN master', async t => {
  const root = await mkdtemp(join(tmpdir(), 'bq-lanez-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const recordDir = join(root, 'data/v7/visual-assets/records');
  const sourceDir = join(root, 'src/features/library');
  await Promise.all([mkdir(recordDir, { recursive: true }), mkdir(sourceDir, { recursive: true })]);
  const source = await readFile(new URL('../../src/features/library/emotion-taxonomy.js', import.meta.url));
  await writeFile(join(sourceDir, 'emotion-taxonomy.js'), source);
  await writeFile(join(recordDir, master.assetId + '.json'), JSON.stringify(master));
  await writeFile(join(recordDir, master.assetId + '-derivatives.json'), JSON.stringify({
    sourceMasterAssetId: master.assetId, variants: [{ ...variant, includedWording: 'Temptation' }]
  }));
  const report = await auditV7LaneZWording(root);
  assert.equal(report.status, 'NEEDS_REVIEW');
  assert.equal(report.errors.length, 0);
  assert.equal(report.counts.candidateFailures, 1);
  assert.equal(report.counts.published, 0);
});
