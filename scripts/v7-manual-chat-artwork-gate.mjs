/**
 * Fail-closed intake for NEW or MODIFIED V7 image binaries.
 * This proves only binary + attestation consistency; it cannot prove that
 * the declared interactive ChatGPT session genuinely took place.
 * Independent image QA and the user's visual approval remain mandatory.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const imagePathPattern = /^public\/v7\/images\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)+\.(?:webp|png|jpe?g)$/i;
const hexDigest = /^[a-f0-9]{64}$/;

export function intakePathForSha(sha256) {
  assert(hexDigest.test(sha256), 'Invalid SHA-256 intake identifier');
  return 'data/v7/visual-assets/manual-chat-intake/' + sha256 + '.json';
}

export async function verifyManualChatArtworkIntake(root, changedPaths) {
  assert(Array.isArray(changedPaths), 'Changed paths must be provided');
  const changedSet = new Set(changedPaths);
  const assets = changedPaths.filter(path => path.startsWith('public/v7/images/'));
  const validated = [];
  for (const mediaPath of assets) {
    assert(imagePathPattern.test(mediaPath), 'V7 artwork must be actual PNG/JPEG/WebP raster: ' + mediaPath);
    const bytes = await readFile(join(root, mediaPath));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const intakePath = intakePathForSha(sha256);
    assert(changedSet.has(intakePath), 'New or modified V7 raster requires a NEW matching manual chat intake record in the same change: ' + mediaPath);
    const record = JSON.parse(await readFile(join(root, intakePath), 'utf8'));
    assert.equal(record.schemaVersion, 1, 'Unsupported manual chat intake schema: ' + mediaPath);
    assert.equal(record.mediaPath, mediaPath, 'Manual chat intake media path mismatch');
    assert.equal(record.sha256, sha256, 'Manual chat intake does not match actual image bytes');
    assert.equal(record.origin, 'interactive_chatgpt_manual', 'Autonomous/agent visual generation not permitted');
    assert.equal(record.submittedBy, 'interactive_chatgpt_session', 'Manual interactive-chat submission required');
    assert.equal(record.userInvoked, true, 'Explicit interactive user invocation required');
    assert.equal(record.qaStatus, 'pending', 'Candidate intake cannot self-approve');
    assert.equal(record.userVisualApproval, false, 'No self-approval in image intake');
    for (const field of ['assetId', 'chatArtifactReference', 'sourceContentId', 'guideSceneId']) {
      assert(typeof record[field] === 'string' && record[field].trim().length >= 3,
        'Missing manual chat artwork attestation field ' + field + ': ' + mediaPath);
    }
    assert(record.chatArtifactReference.trim().length >= 12,
      'Require a specific non-secret manual-chat output reference; do not invent one');
    validated.push({ mediaPath, sha256, intakePath, assetId: record.assetId });
  }
  return { policy: 'manual_interactive_chat_only', newlyChangedImageCount: assets.length,
    consistentAttestations: validated, approval: 'PENDING_INDEPENDENT_QA_AND_USER' };
}

function gitChangedPaths(root, baseSha, headSha) {
  assert(/^[0-9a-f]{40}$/i.test(baseSha) && /^[0-9a-f]{40}$/i.test(headSha),
    'Exact base/head Git commit SHAs are mandatory');
  const output = execFileSync('git', [
    'diff', '--name-only', '--diff-filter=ACMR',
    baseSha, headSha, '--',
    'public/v7/images/', 'data/v7/visual-assets/manual-chat-intake/'
  ], { cwd: root, encoding: 'utf8' });
  return output.trim() ? output.trim().split(/\r?\n/) : [];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const base = args[args.indexOf('--base') + 1];
    const head = args[args.indexOf('--head') + 1];
    const result = await verifyManualChatArtworkIntake(DEFAULT_ROOT,
      gitChangedPaths(DEFAULT_ROOT, base, head));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('V7 manual interactive chat artwork gate FAILED:', error.message);
    process.exitCode = 1;
  }
}
