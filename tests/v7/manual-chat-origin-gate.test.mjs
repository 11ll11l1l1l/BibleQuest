import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { intakePathForImage, validateManualChatReceipt } from '../../scripts/v7-manual-chat-origin-gate.mjs';

const imagePath = 'public/v7/images/emotion/bqv7-emotion-test-01.webp';
const bytes = Buffer.from('sample file bytes used solely for receipt validation');
const sha256 = createHash('sha256').update(bytes).digest('hex');
const good = {
  policyVersion: '2026-10-11',
  assetId: 'bqv7-emotion-test-01',
  imagePath,
  origin: 'explicit_user_invoked_chatgpt_chat',
  reviewStatus: 'pending_qa',
  sha256,
  chatEvidence: {
    origin: 'explicit_user_invoked_chatgpt_chat',
    reference: 'user-provided-session-ref-001',
    userConfirmationStatus: 'pending_private_user_confirmation'
  }
};
test('manual chat candidate image bytes and receipt agree but do not approve', () => {
  const result = validateManualChatReceipt(imagePath, bytes, good);
  assert.equal(result.sha256, sha256);
  assert.match(result.receiptPath, /^data\/v7\/visual-assets\/manual-chat-intake\/[a-f0-9]{20}\.json$/);
  assert.equal(good.reviewStatus, 'pending_qa');
});
test('refuses agent-created art', () => {
  assert.throws(() => validateManualChatReceipt(imagePath, bytes, {
    ...good, origin: 'scheduled_agent'
  }), /Artwork generation by an agent is prohibited/);
});
test('refuses fake verified/user approval', () => {
  assert.throws(() => validateManualChatReceipt(imagePath, bytes, {
    ...good, reviewStatus: 'approved'
  }), /no self-approval/);
});
test('refuses absent session receipt and missing user-confirmation state', () => {
  assert.throws(() => validateManualChatReceipt(imagePath, bytes, {
    ...good, chatEvidence: { ...good.chatEvidence, reference: 'TODO' }
  }), /manual chat reference required/);
  assert.throws(() => validateManualChatReceipt(imagePath, bytes, {
    ...good, chatEvidence: { ...good.chatEvidence, userConfirmationStatus: undefined }
  }), /pending and user-confirmed/);
});
test('refuses tampered binary or alias pathname', () => {
  assert.throws(() => validateManualChatReceipt(imagePath, Buffer.from('tampered'), good),
    /does not match actual image bytes/);
  assert.throws(() => validateManualChatReceipt(imagePath, bytes, { ...good, imagePath: 'public/v7/images/need/foo.webp' }),
    /another image path/);
});
test('refuses SVG art even with metadata', () => {
  const vector = 'public/v7/images/emotion/bqv7-emotion-test-01.svg';
  assert.throws(() => validateManualChatReceipt(vector, bytes, { ...good, imagePath: vector }),
    /real raster/);
});
