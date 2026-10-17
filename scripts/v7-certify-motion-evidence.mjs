/** Lane D exact-SHA screenshot, accessibility and motion proof gate.
 * This validates observable browser evidence; it does not pretend that headless
 * Chromium provides physical-device frame-rate guarantees.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_MOTION_WIDTHS = Object.freeze([320, 390, 430, 800]);
export const REQUIRED_MOTION_PREFERENCES = Object.freeze(['no-preference', 'reduce']);
export const REQUIRED_MOTION_LOCALES = Object.freeze(['en', 'tl', 'ceb']);
export const REQUIRED_LIBRARY_DECK_KINDS = Object.freeze(['emotion', 'need']);
export const REQUIRED_SCREENSHOTS = Object.freeze(
  REQUIRED_MOTION_PREFERENCES.flatMap(preference =>
    ['rest', 'interacting', 'settled'].map(state =>
      `artifacts/v7/motion-${state}-tl-${preference}-390.png`))
);

export function validateV7MotionEvidence(evidence, candidateSha) {
  assert.match(candidateSha, /^[0-9a-f]{40}$/i, 'exact candidate SHA required');
  assert.equal(evidence?.schemaVersion, 1, 'V7 motion evidence schema');
  assert.equal(evidence.result, 'PASS', 'built-browser motion gate must pass');
  assert.equal(String(evidence.candidateSha).toLowerCase(), candidateSha.toLowerCase(),
    'motion evidence must bind to exact candidate');
  for (const width of REQUIRED_MOTION_WIDTHS)
    assert.ok(evidence.testedWidths?.includes(width), `missing motion viewport ${width}`);
  for (const preference of REQUIRED_MOTION_PREFERENCES)
    assert.ok(evidence.testedMotion?.includes(preference), `missing motion setting ${preference}`);
  for (const locale of REQUIRED_MOTION_LOCALES)
    assert.ok(evidence.testedLocales?.includes(locale), `missing motion locale ${locale}`);
  for (const state of ['rest', 'interacting', 'settled', 'reduced-motion'])
    assert.ok(evidence.capturedStates?.includes(state), `missing motion state ${state}`);

  const requiredCombos = REQUIRED_MOTION_WIDTHS.flatMap(width =>
    REQUIRED_MOTION_PREFERENCES.map(reducedMotion => `${width}/${reducedMotion}`));
  const checks = Array.isArray(evidence.checks) ? evidence.checks : [];
  const results = Array.isArray(evidence.observations) ? evidence.observations : [];
  for (const combo of requiredCombos) {
    const [width, reducedMotion] = combo.split('/');
    const actual = results.filter(row => row.width === Number(width) && row.reducedMotion === reducedMotion);
    assert.equal(actual.length, 1, `one measured motion viewport must exist for ${combo}`);
    assert.ok(checks.some(check => String(check).startsWith(combo + '/')),
      `missing functional motion check for ${combo}`);
    const { layout } = actual[0];
    assert.equal(layout.viewport, Number(width), `incorrect measured viewport for ${combo}`);
    assert.ok(Number.isFinite(layout.widest) && layout.widest <= Number(width) + 1,
      `motion causes horizontal overflow at ${combo}`);
    assert.ok(Number.isFinite(layout.navTarget) && layout.navTarget >= 40,
      `motion navigation has clipped targets at ${combo}`);
    for (const key of ['layoutShiftScore', 'longTasks', 'maxLongTaskMs']) {
      assert.ok(Number.isFinite(layout[key]) && layout[key] >= 0,
        `missing motion performance measurement ${key} at ${combo}`);
    }
    assert.ok(layout.layoutShiftScore <= 0.25,
      `material non-input layout instability at ${combo}`);
  }

  // Independently verify real built-app Lane B deck navigation under both
  // animation settings; existence of a carousel is not functional evidence.
  const deckRows = Array.isArray(evidence.deckObservations) ? evidence.deckObservations : [];
  for (const preference of REQUIRED_MOTION_PREFERENCES) {
    for (const kind of REQUIRED_LIBRARY_DECK_KINDS) {
      const rows = deckRows.filter(row => row.width === 390
        && row.reducedMotion === preference && row.kind === kind && row.locale === 'en');
      assert.equal(rows.length, 1, 'missing exact built Library deck motion check: ' + kind + '/' + preference);
      const row = rows[0];
      assert.ok(row.firstId && row.secondId && row.firstId !== row.secondId,
        kind + ': invalid observed card identity');
      assert.equal(row.activeAfterNext, row.secondId, kind + ': Next did not settle');
      assert.equal(row.activeAfterHome, row.firstId, kind + ': keyboard Home did not settle');
      for (const field of ['selectedUnchanged','keyboardFocusRestored','scrollable','noOverflow'])
        assert.equal(row[field], true, kind + ': missing deck interaction evidence ' + field);
      assert.ok(Number.isFinite(row.transitionMs) && row.transitionMs >= 0,
        kind + ': missing computed transition duration');
      if (preference === 'reduce') assert.equal(row.transitionMs, 0,
        kind + ': reduced-motion animation remains enabled');
      else assert.ok(row.transitionMs > 0 && row.transitionMs <= 400,
        kind + ': normal deck transition outside motion budget');
      assert.ok(checks.includes('390/' + preference + '/en:built-library-' + kind + '-deck-motion-and-focus'),
        kind + ': missing exact browser interaction proof');
    }
  }
  assert.equal(deckRows.length, REQUIRED_MOTION_PREFERENCES.length * REQUIRED_LIBRARY_DECK_KINDS.length,
    'unexpected or duplicated built Library deck motion evidence');
  assert.ok(Array.isArray(evidence.screenshots), 'screenshot list must exist');
  assert.equal(new Set(evidence.screenshots).size, evidence.screenshots.length,
    'motion screenshot names must be unique');
  for (const screenshot of REQUIRED_SCREENSHOTS)
    assert.ok(evidence.screenshots.includes(screenshot), `missing motion screenshot ${screenshot}`);
  assert.ok(evidence.screenshots.every(path =>
    /^artifacts\/v7\/motion-(?:rest|interacting|settled)-(?:en|tl|ceb)-(?:no-preference|reduce)-390\.png$/.test(path)),
  'screenshots must stay inside the exact V7 evidence namespace');

  return Object.freeze({
    schemaVersion: 1, result: 'PASS',
    candidateSha: candidateSha.toLowerCase(),
    coveredWidths: [...REQUIRED_MOTION_WIDTHS],
    coveredMotion: [...REQUIRED_MOTION_PREFERENCES],
    coveredLocales: [...REQUIRED_MOTION_LOCALES],
    verifiedCombinations: requiredCombos.length,
    verifiedLibraryDeckCombinations: deckRows.length,
    screenshotCount: REQUIRED_SCREENSHOTS.length,
    measuredMaxCls: Math.max(...results.map(row => row.layout.layoutShiftScore)),
    measuredMaxLongTaskMs: Math.max(...results.map(row => row.layout.maxLongTaskMs)),
    evidenceClass: 'exact-sha-built-browser-normal-and-reduced-motion',
    limitations: ['No physical-device FPS guarantee', 'Ilocano is not yet a selectable shell locale'],
  });
}

const direct = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const candidateSha = String(process.env.BQ_EXACT_SHA || '').toLowerCase();
  const evidence = JSON.parse(await readFile('artifacts/v7/motion-built-artifact.json', 'utf8'));
  const certified = validateV7MotionEvidence(evidence, candidateSha);
  const artifacts = [];
  for (const path of REQUIRED_SCREENSHOTS) {
    const content = await readFile(path);
    assert.ok(content.byteLength > 1000, `empty/invalid image screenshot ${path}`);
    assert.equal(content.subarray(0, 8).toString('hex'), '89504e470d0a1a0a',
      `screenshot is not PNG ${path}`);
    artifacts.push({
      path,
      bytes: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    });
  }
  const report = { ...certified, screenshots: artifacts };
  await writeFile('artifacts/v7/motion-certification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS Lane D motion proof: ${report.verifiedCombinations} viewport/motion runs, ${report.screenshotCount} SHA-256-verified PNG states`);
}
