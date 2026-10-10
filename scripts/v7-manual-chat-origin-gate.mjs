/**
 * Candidate PR intake guard: any new/modified artwork pixels must carry
 * a manual-chat production receipt matching the actual committed bytes.
 *
 * A receipt is a declarative intake gate, NOT cryptographic evidence that a
 * particular person/chat produced pixels, independent visual QA, or user
 * approval. Those remain explicit separate human checks.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const IMAGE_ROOT = /^public\/v7\/images\/[a-z0-9/_-]+\.(?:png|webp|jpe?g|svg)$/i;
const CHAT_SOURCE = 'explicit_user_invoked_chatgpt_chat';

export function intakePathForImage(imagePath) {
  assert.equal(typeof imagePath, 'string');
  assert(IMAGE_ROOT.test(imagePath), 'Unrecognized V7 artwork path: ' + imagePath);
  const key = createHash('sha256').update(imagePath).digest('hex').slice(0, 20);
  return 'data/v7/visual-assets/manual-chat-intake/' + key + '.json';
}

export function validateManualChatReceipt(imagePath, bytes, receipt) {
  assert(imagePath.endsWith('.webp') || imagePath.endsWith('.png') ||
    imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg'),
  'V7 image artwork must be real raster (SVG is prohibited)');
  assert(receipt && typeof receipt === 'object' && !Array.isArray(receipt),
    'Missing manual ChatGPT image receipt');
  assert.equal(receipt.policyVersion, '2026-10-11', 'Stale manual-chat origin policy');
  assert.equal(receipt.imagePath, imagePath, 'Receipt is for another image path');
  assert.equal(receipt.origin, CHAT_SOURCE, 'Artwork generation by an agent is prohibited');
  assert(typeof receipt.assetId === 'string' && /^bqv7-[a-z0-9-]+$/.test(receipt.assetId),
    'Missing or malformed assetId in manual-chat receipt');
  assert.equal(receipt.reviewStatus, 'pending_qa',
    'Manual intake is a candidate only; no self-approval');
  assert(typeof receipt.chatEvidence?.reference === 'string' &&
    receipt.chatEvidence.reference.trim().length >= 8 &&
    !/^(unknown|none|n\/a|todo|tbd|placeholder)$/i.test(receipt.chatEvidence.reference.trim()),
  'Actual user-supplied manual chat reference required; do not invent one');
  assert.equal(receipt.chatEvidence?.origin, CHAT_SOURCE,
    'Chat evidence must identify the interactive manual source');
  assert(['pending_private_user_confirmation', 'user_confirmed'].includes(
    receipt.chatEvidence?.userConfirmationStatus),
    'Missing explicit distinction between pending and user-confirmed chat evidence');
  const sha = createHash('sha256').update(bytes).digest('hex');
  assert.equal(receipt.sha256, sha, 'Manual chat receipt does not match actual image bytes');
  return { imagePath, sha256: sha, receiptPath: intakePathForImage(imagePath) };
}

export function verifyManualChatPixelChanges({ root = ROOT, base, head } = {}) {
  assert(/^[0-9a-f]{40}$/i.test(base || ''), 'Exact base SHA required');
  assert(/^[0-9a-f]{40}$/i.test(head || ''), 'Exact candidate SHA required');
  const diff = execFileSync('git', [
    'diff', '--name-only', '--diff-filter=ACMR', base, head, '--', 'public/v7/images/'
  ], { cwd: root, encoding: 'utf8' }).trim();
  const changed = diff ? diff.split('\n').filter(Boolean) : [];
  const results = [];
  for (const imagePath of changed) {
    assert(IMAGE_ROOT.test(imagePath), 'Unsupported changed V7 artwork path: ' + imagePath);
    const intakePath = intakePathForImage(imagePath);
    assert(existsSync(join(root, intakePath)), 'Missing manual-chat intake receipt: ' + intakePath);
    const receipt = JSON.parse(readFileSync(join(root, intakePath), 'utf8'));
    results.push(validateManualChatReceipt(
      imagePath, readFileSync(join(root, imagePath)), receipt
    ));
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const get = (flag) => args[args.indexOf(flag) + 1];
  const base = get('--base') || process.env.BQ_BASE_SHA;
  const head = get('--head') || process.env.BQ_EXACT_SHA;
  try {
    const receipts = verifyManualChatPixelChanges({ base, head });
    process.stdout.write(JSON.stringify({
      status: 'PASS', changedArtwork: receipts.length,
      // Means receipt integrity only; NOT artist provenance proof or approval.
      meaning: 'manual intake declarations present; independent/user QA still required'
    }) + '\n');
  } catch (error) {
    process.stderr.write('V7 MANUAL CHAT IMAGE INTAKE FAIL: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
