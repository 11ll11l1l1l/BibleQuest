import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { verifyManualChatArtworkIntake, intakePathForSha } from '../../scripts/v7-manual-chat-artwork-gate.mjs';

const path = 'public/v7/images/emotion/bqv7-emotion-tested-01.webp';
const bytes = Buffer.from('unit-test-image-bytes-not-a-real-webp');
const sha = createHash('sha256').update(bytes).digest('hex');
const attestationPath = intakePathForSha(sha);
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'bq-chat-artwork-'));
  await mkdir(dirname(join(root, path)), { recursive: true });
  await mkdir(dirname(join(root, attestationPath)), { recursive: true });
  await writeFile(join(root, path), bytes);
  const record = {
    schemaVersion: 1, origin: 'interactive_chatgpt_manual',
    submittedBy: 'interactive_chatgpt_session', userInvoked: true,
    mediaPath: path, sha256: sha,
    assetId: 'bqv7-emotion-tested-01', chatArtifactReference: 'chat-generated-asset-ref-0001',
    sourceContentId: 'tested', guideSceneId: 'G2-tested',
    qaStatus: 'pending', userVisualApproval: false
  };
  await writeFile(join(root, attestationPath), JSON.stringify(record));
  return {root, record};
}
test('image diff without matching new manual-chat record fails closed', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(verifyManualChatArtworkIntake(f.root, [path]), /NEW matching/);
});
test('manual-chat attestation and measured image SHA pass intake, not approval', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  const r = await verifyManualChatArtworkIntake(f.root, [path, attestationPath]);
  assert.equal(r.newlyChangedImageCount, 1);
  assert.equal(r.approval, 'PENDING_INDEPENDENT_QA_AND_USER');
  assert.equal(r.consistentAttestations[0].sha256, sha);
});
test('scheduled agent cannot claim generation in intake', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.record.origin = 'scheduled_visual_agent';
  await writeFile(join(f.root, attestationPath), JSON.stringify(f.record));
  await assert.rejects(verifyManualChatArtworkIntake(f.root, [path, attestationPath]), /Autonomous/);
});
test('false QA approval is rejected even when bytes match', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.record.qaStatus = 'approved';
  await writeFile(join(f.root, attestationPath), JSON.stringify(f.record));
  await assert.rejects(verifyManualChatArtworkIntake(f.root, [path, attestationPath]), /self-approve/);
});
test('false SHA or missing chat reference is rejected', async t => {
  const f = await fixture(); t.after(() => rm(f.root, { recursive: true, force: true }));
  f.record.sha256 = '0'.repeat(64);
  await writeFile(join(f.root, attestationPath), JSON.stringify(f.record));
  await assert.rejects(verifyManualChatArtworkIntake(f.root, [path, attestationPath]), /does not match/);
  f.record.sha256 = sha;
  f.record.chatArtifactReference = 'x';
  await writeFile(join(f.root, attestationPath), JSON.stringify(f.record));
  await assert.rejects(verifyManualChatArtworkIntake(f.root, [path, attestationPath]), /Missing manual chat/);
});
test('QA-only PR with no changed binaries requires no intake records', async () => {
  const r = await verifyManualChatArtworkIntake('/does-not-need-to-exist', []);
  assert.equal(r.newlyChangedImageCount, 0);
});
