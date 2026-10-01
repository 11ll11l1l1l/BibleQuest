import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { validateBsbAlignmentManifest } from '../../scripts/v6-bsb-alignment-manifest.mjs';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from '../../scripts/v6-generate-scripture-manifests.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const checklistPath = new URL('../../V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md', import.meta.url);
const manifestPath = new URL('../../data/v6-audio/bsb-hays-alignment.json', import.meta.url);

const TIMING_ROWS = Object.freeze([
  'Verse timing/alignment manifest exists and is versioned with the matching BSB text/audio revision.',
  'Current verse highlights during playback and tapping a verse seeks to the correct audio position.',
  'Auto-scroll follows spoken verses without preventing manual navigation/accessibility use.',
]);

function checked(checklist, label) {
  return checklist.includes('- [x] ' + label);
}

function currentBsbContentVersion() {
  const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
  assert.ok(bsb, 'Current BSB Scripture source must remain configured.');
  return buildScripturePackageManifest(root, bsb).contentVersion;
}

function readManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

test('BSB timing-dependent checklist rows cannot pass without the exact deployable timing manifest', () => {
  const checklist = readFileSync(checklistPath, 'utf8');
  const promoted = TIMING_ROWS.filter(label => checked(checklist, label));

  for (const label of TIMING_ROWS) {
    assert.ok(
      checklist.includes('- [ ] ' + label) || checklist.includes('- [x] ' + label),
      'BSB timing-dependent acceptance row must remain present: ' + label,
    );
  }

  if (promoted.length === 0) return;

  assert.equal(
    existsSync(manifestPath),
    true,
    'Promoted BSB timing-dependent rows require data/v6-audio/bsb-hays-alignment.json.',
  );

  const manifest = readManifest();
  const scriptureContentVersion = currentBsbContentVersion();
  const validation = validateBsbAlignmentManifest(manifest, {
    requireComplete: true,
    scriptureContentVersion,
  });

  assert.equal(
    validation.valid,
    true,
    'Promoted BSB timing-dependent rows require a valid complete exact-revision manifest: '
      + validation.issues.join('; '),
  );
  assert.match(manifest.audioInventorySha256, /^[a-f0-9]{64}$/i);
  assert.equal(
    manifest.audioContentVersion,
    'sha256-' + manifest.audioInventorySha256,
    'Promoted BSB timing-dependent rows require audioContentVersion to bind the exact Hays inventory checksum.',
  );
  assert.equal(manifest.chapterCount, 1189);
  assert.equal(manifest.chapters.length, 1189);
  assert.match(manifest.alignmentRevision, /^[a-f0-9]{40}$/i);
  assert.equal(manifest.complete, true);
});

test('a present BSB runtime timing manifest is never allowed to drift silently from current Reader BSB text', () => {
  if (!existsSync(manifestPath)) return;

  const manifest = readManifest();
  const scriptureContentVersion = currentBsbContentVersion();
  const validation = validateBsbAlignmentManifest(manifest, {
    requireComplete: true,
    scriptureContentVersion,
  });

  assert.equal(
    validation.valid,
    true,
    'Committed BSB runtime timing manifest is stale or malformed: ' + validation.issues.join('; '),
  );
  assert.equal(manifest.audioContentVersion, 'sha256-' + manifest.audioInventorySha256);
});
