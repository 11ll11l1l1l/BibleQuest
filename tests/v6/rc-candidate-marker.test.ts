import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  RC_MARKER_INTENT,
  buildRcCandidateMarker,
  normalizeRcBaseSha,
  validateRcCandidateMarker,
  writeRcCandidateMarker,
} from '../../scripts/v6-rc-candidate-marker.mjs';

const baseSha = 'a'.repeat(40);

test('RC marker is deterministic and intentionally does not self-reference its own commit SHA', () => {
  const marker = buildRcCandidateMarker(baseSha);
  assert.deepEqual(marker, {
    schemaVersion: 1,
    intent: RC_MARKER_INTENT,
    baseIntegrationSha: baseSha,
    candidateIdentity: 'commit-containing-this-marker',
    automatedGateProfile: 'full',
  });
  assert.equal(JSON.stringify(marker).includes('candidateSha'), false);
});

test('RC marker validates only against the exact integration base SHA', () => {
  const marker = buildRcCandidateMarker(baseSha);
  assert.equal(validateRcCandidateMarker(marker, baseSha).baseIntegrationSha, baseSha);
  assert.throws(
    () => validateRcCandidateMarker(marker, 'b'.repeat(40)),
    /marker base mismatch/i,
  );
  assert.throws(() => normalizeRcBaseSha('abc1234'), /exact 40-character/i);
});

test('RC marker refuses weakened gate profiles or ambiguous candidate identity', () => {
  const marker = buildRcCandidateMarker(baseSha);
  assert.throws(
    () => validateRcCandidateMarker({ ...marker, automatedGateProfile: 'predeploy' }, baseSha),
    /full automated gate profile/i,
  );
  assert.throws(
    () => validateRcCandidateMarker({ ...marker, candidateIdentity: 'branch-head' }, baseSha),
    /commit containing the marker/i,
  );
});

test('RC marker writer produces the canonical JSON contract', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bq-v6-rc-marker-'));
  try {
    const output = join(dir, 'RC_CANDIDATE.json');
    await writeRcCandidateMarker({ baseIntegrationSha: baseSha, outputPath: output });
    const parsed = JSON.parse(await readFile(output, 'utf8'));
    assert.deepEqual(parsed, buildRcCandidateMarker(baseSha));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
