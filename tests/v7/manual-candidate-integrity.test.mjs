import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyV7ManualCandidate } from '../../scripts/v7-manual-candidate-integrity.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ASSET = 'bqv7-emotion-jealousy-envy-01';
const RELATIVE = 'data/v7/visual-assets/records/' + ASSET + '.json';

async function isolatedCandidate(t) {
  const root = await mkdtemp(join(tmpdir(), 'bq-v7-candidate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const original = JSON.parse(await readFile(join(ROOT, RELATIVE), 'utf8'));
  await mkdir(join(root, 'data/v7/visual-assets/records'), { recursive: true });
  await mkdir(join(root, 'src/features/library'), { recursive: true });
  await mkdir(join(root, 'public/v7/images/emotion'), { recursive: true });
  await copyFile(join(ROOT, 'src/features/library/emotion-taxonomy.js'),
    join(root, 'src/features/library/emotion-taxonomy.js'));
  for (const variant of original.variants) {
    await copyFile(join(ROOT, 'public', variant.imagePath.slice(1)),
      join(root, 'public', variant.imagePath.slice(1)));
  }
  const save = metadata => writeFile(join(root, RELATIVE), JSON.stringify(metadata));
  await save(original);
  return { root, record: original, save };
}

test('manual Jealousy image: three independent measured binaries and exact reviewed wording', async () => {
  const result = await verifyV7ManualCandidate(ROOT, ASSET);
  assert.equal(result.technicalIntegrity, 'PASS');
  assert.deepEqual(result.files.map(v => v.kind), ['CLEAN', 'TYPE', 'THUMB']);
  assert.equal(new Set(result.files.map(v => v.sha256)).size, 3);
  assert.match(result.publicationApproval, /NOT APPROVED|release-registry audit/);
  assert.notEqual(result.builtAppBrowserQA, true, 'Do not invent browser acceptance');
});

test('manual image audit fails on changed binary without corresponding exact hash', async t => {
  const f = await isolatedCandidate(t);
  const path = join(f.root, 'public', f.record.variants[2].imagePath.slice(1));
  const bytes = await readFile(path);
  await writeFile(path, Buffer.concat([bytes, Buffer.from([0])]));
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /Measured file size disagrees/);
});

test('manual image audit rejects an altered title or a stale taxonomy revision', async t => {
  const f = await isolatedCandidate(t);
  f.record.variants[1].embeddedWording.label = 'Envy only';
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /Jealous \/ envious/);
  f.record.variants[1].embeddedWording.label = 'Jealous / envious';
  f.record.wordingEvidence.sourceBlobSha = '0'.repeat(40);
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /Stale taxonomy source revision/);
});

test('manual image audit rejects aliases and unverified third-party artwork', async t => {
  const f = await isolatedCandidate(t);
  f.record.variants[2].imagePath = f.record.variants[0].imagePath;
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /File reused for multiple variants/);
  f.record.variants[2].imagePath = '/v7/images/emotion/' + ASSET + '-thumbnail.webp';
  f.record.rights.thirdPartyAsset = true;
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /Unverified third-party art/);
});

test('manual candidate verification rejects known TYPE safe-area defect despite unchanged real image hashes', async t => {
  const f = await isolatedCandidate(t);
  f.record.variants.find(v => v.kind === 'TYPE').qa.topSafeAreaAcceptable = false;
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /TYPE failed the text safe-area/);
});

test('manual candidate verification rejects explicit repair status and SVG policy violations', async t => {
  const f = await isolatedCandidate(t);
  f.record.status = 'candidate_type_top_safe_area_repair_required';
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /status explicitly requires repair/);
  f.record.status = 'candidate_built_app_qa_pending';
  f.record.qc.svgDataUriPolicyCompliant = false;
  await f.save(f.record);
  await assert.rejects(verifyV7ManualCandidate(f.root, ASSET), /failed static SVG safety/);
});


test('Wisdom Need candidate has three measured independent binaries but remains unapproved', async () => {
  const result = await verifyV7ManualCandidate(ROOT, 'bqv7-need-wisdom-01');
  assert.equal(result.status, 'candidate_built_app_qa_pending');
  assert.equal(result.technicalIntegrity, 'PASS');
  assert.deepEqual(result.files.map(v => v.kind), ['CLEAN', 'TYPE', 'THUMB']);
  assert.deepEqual(result.files.map(v => v.sha256), [
    'ec43fda9c132b475214ebe55e24096b651e7926aeaef65d9db13d3684898ec1e',
    '29bedc484e83ba06b165733d1f47f6ed25ffc87cee903052853fedc4dc59c055',
    '098f157bb0241abae11650d7a7422e06f1420e2aeab75db1a746ab872e9a7bd4'
  ]);
  assert.match(result.publicationApproval, /NOT APPROVED/);
  assert.notEqual(result.builtAppBrowserQA, true);
});
