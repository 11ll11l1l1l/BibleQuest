/** Lane D: exact-SHA V7 image-first release coverage and built-binary evidence.
 * Counting only production-audited assets; drafts never satisfy release quotas.
 */
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditV7VisualAssets } from './v7-visual-assets-audit.mjs';
import { buildV7VisualCoverageReport } from './v7-visual-coverage-report.mjs';
import { LIBRARY_EMOTIONS } from '../src/features/library/emotion-taxonomy.js';

// A raw count cannot prove the authorized launch concepts are present.
// Do not substitute a later Need (e.g. wisdom) for the five agreed launch cards.
export const V7_RELEASE_REQUIRED_NEEDS = Object.freeze([
  'peace', 'hope', 'comfort', 'courage', 'strength',
]);
const REQUIRED_FEELINGS = Object.freeze(LIBRARY_EMOTIONS.map(item => item.id));

export const V7_RELEASE_ART_MINIMUM = Object.freeze({
  emotions: 30,
  needs: 5, // P0 small complementary deck; remaining Needs continue in Lane A.
  heroes: 1, // P1: Home featured art cannot be a placeholder at release.
});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sorted = values => [...values].sort((a, b) => a.localeCompare(b));

export function assessV7VisualRelease({ candidateSha, audit, coverage, browserReport = null }) {
  if (!/^[a-f0-9]{40}$/i.test(String(candidateSha || '')))
    throw new Error('Visual release evidence requires a full exact candidate SHA.');
  const sha = candidateSha.toLowerCase();
  if (audit?.status !== 'PASS' || coverage?.status !== 'PASS'
    || coverage?.releaseEligible !== true || !Array.isArray(audit?.manifest?.assets))
    throw new Error('V7 release visuals require passing, complete source rights/binary audit evidence.');

  const assets = audit.manifest.assets;
  const complete = assets.filter(asset => asset.bundleStatus === 'complete');
  const emotionIds = new Set(complete.filter(a => a.contentType === 'emotion')
    .map(a => a.canonicalContentId));
  const needIds = new Set(complete.filter(a => a.contentType === 'need')
    .map(a => a.canonicalContentId));
  const homeHeroes = complete.filter(a =>
    a.contentType === 'hero' && a.canonicalContentId === 'home').length;
  const missingLaunchFeelings = REQUIRED_FEELINGS.filter(id => !emotionIds.has(id));
  const missingLaunchNeeds = V7_RELEASE_REQUIRED_NEEDS.filter(id => !needIds.has(id));
  if (coverage.summary?.completeThreeFileBundles !== emotionIds.size
    || coverage.needs?.completeThreeFileBundles !== needIds.size
    || coverage.summary?.auditedAssetCount !== assets.length)
    throw new Error('Visual coverage counts do not match the independently audited release manifest.');
  if (coverage.summary?.emotionTotal !== 30 || coverage.needs?.total !== 19)
    throw new Error('Canonical V7 feeling/need taxonomy coverage has changed without a new release contract.');

  const expectedFiles = new Map();
  for (const asset of assets) {
    for (const file of [{ src:asset.src, sha256:asset.sha256 }, ...(asset.variants || [])]) {
      if (!/^\/v7\/images\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(file.src)
        || !/^[0-9a-f]{64}$/i.test(file.sha256))
        throw new Error('Visual manifest contains unverified binary path/hash.');
      if (expectedFiles.has(file.src)) throw new Error('Duplicate image file in release manifest: ' + file.src);
      expectedFiles.set(file.src, file.sha256.toLowerCase());
    }
  }

  let browserVerified = false;
  if (browserReport) {
    if (String(browserReport.candidateSha).toLowerCase() !== sha
      || browserReport.sourceAuditStatus !== 'PASS'
      || browserReport.sourceAuditProductionReady !== assets.length)
      throw new Error('Built visual browser evidence is stale or mismatched to audited candidate.');
    const expectedBundles = sorted(complete.map(a => a.assetId));
    const observedBundles = sorted((browserReport.completeBundles || []).map(a => a.assetId));
    if (JSON.stringify(expectedBundles) !== JSON.stringify(observedBundles))
      throw new Error('Built browser complete-bundle list disagrees with published release assets.');
    const served = new Map();
    for (const file of browserReport.verifiedServedFiles || []) {
      if (served.has(file.path) || !Number.isSafeInteger(file.bytes) || file.bytes <= 0)
        throw new Error('Built browser file evidence has duplicate/invalid bytes.');
      served.set(file.path, String(file.sha256).toLowerCase());
    }
    if (expectedFiles.size !== served.size
      || [...expectedFiles].some(([path,sha256]) => served.get(path) !== sha256))
      throw new Error('Built browser did not verify every published release image byte/hash.');
    const widths = browserReport.viewports || [];
    const checks = browserReport.technicalChecks || [];
    browserVerified = [320,390,430].every(width => widths.includes(width))
      && ['actual-served-sha256','browser-decode','intrinsic-image-dimensions',
          'mobile-width-no-overflow'].every(check => checks.includes(check));
  }

  // Pass only the canonical 30 Feelings, designated five Needs and Home hero.
  // A passing total from unrelated concepts must never certify this release.
  const coverageReady = missingLaunchFeelings.length === 0
    && missingLaunchNeeds.length === 0
    && homeHeroes >= V7_RELEASE_ART_MINIMUM.heroes;
  const releaseReady = coverageReady && browserVerified;
  return {
    schemaVersion: 1, candidateSha: sha,
    status: releaseReady ? 'PASS' : 'OPEN',
    releaseReady, sourceAuditStatus: audit.status,
    auditedManifestSha256: digest(JSON.stringify(audit.manifest)),
    auditedAssetCount: assets.length,
    verifiedPublishedFileCount: expectedFiles.size,
    coverage: {
      emotionComplete: emotionIds.size, emotionTotal: coverage.summary.emotionTotal,
      needComplete: needIds.size, needTotal: coverage.needs.total,
      heroComplete: homeHeroes,
      missingLaunchFeelings, missingLaunchNeeds,
      otherComplete: Object.fromEntries(['devotional','book','past_teaching']
        .map(type => [type, complete.filter(a => a.contentType === type).length])),
      pendingEmotionDerivatives: coverage.summary.pendingDerivativeBackfills,
      pendingNeedDerivatives: coverage.needs.pendingDerivativeBackfills,
    },
    minimum: V7_RELEASE_ART_MINIMUM, coverageReady,
    builtBrowserVerified: browserVerified,
    builtBrowserEvidenceClass: browserReport ? 'exact-sha-technical-binary-and-layout-only' : 'not-run',
    artisticInspectionClaim: false,
    // Technical browser checks do not fabricate independent aesthetic/scripture visual approval.
    draftCandidatesCountedTowardRelease: 0,
  };
}


/** Seal actual Chromium TYPE/THUMB screenshots, not merely declared browser checks.
 * Draft candidate screenshots remain outside the published release attestation.
 */
export async function attestV7ReleaseScreenshots(browserReport, assets, { loadScreenshot = readFile } = {}) {
  if (!Array.isArray(browserReport?.screenshots) || !Array.isArray(assets))
    throw new Error('Strict visual release requires a browser screenshot manifest.');
  const expected = [];
  for (const asset of assets.filter(item => item.bundleStatus === 'complete')) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(asset.assetId || ''))
      throw new Error('Unsafe visual asset ID for screenshot attestation.');
    for (const kind of ['with_text', 'thumbnail'])
      for (const width of [320, 390, 430])
        expected.push(`artifacts/v7/visual-browser/release-${asset.assetId}-${kind}-${width}.png`);
  }
  const recorded = browserReport.screenshots.filter(path =>
    typeof path === 'string' && path.startsWith('artifacts/v7/visual-browser/release-'));
  if (new Set(recorded).size !== recorded.length
    || JSON.stringify(sorted(recorded)) !== JSON.stringify(sorted(expected)))
    throw new Error('Chromium release screenshots are missing, duplicated, or unexpected.');
  const pngHeader = Buffer.from('89504e470d0a1a0a', 'hex');
  const images = [];
  for (const path of sorted(expected)) {
    const bytes = await loadScreenshot(path);
    if (!Buffer.isBuffer(bytes) || bytes.length < 24 || !bytes.subarray(0, 8).equals(pngHeader))
      throw new Error('Chromium screenshot is absent or not a PNG: ' + path);
    images.push({ path, sha256: digest(bytes), bytes: bytes.length });
  }
  return { count: images.length, sha256: digest(JSON.stringify(images)), images };
}

export async function produceV7VisualReleaseEvidence(candidateSha, { requireBrowser = false } = {}) {
  const [audit, coverage] = await Promise.all([
    auditV7VisualAssets(), buildV7VisualCoverageReport(),
  ]);
  let browserReport = null;
  if (requireBrowser) {
    browserReport = JSON.parse(await readFile('artifacts/v7/visual-browser/report.json','utf8'));
  }
  const result = assessV7VisualRelease({ candidateSha, audit, coverage, browserReport });
  if (!requireBrowser) return { ...result, screenshotEvidenceVerified: false };
  const screenshots = await attestV7ReleaseScreenshots(browserReport, audit.manifest.assets);
  return { ...result, screenshotEvidenceVerified: true, screenshotEvidence: screenshots };
}

const invokedAsScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const evidence = await produceV7VisualReleaseEvidence(process.argv[2], {
    requireBrowser: process.env.BQ_STRICT_RELEASE === 'true',
  });
  await mkdir('artifacts/v7', { recursive:true });
  await writeFile('artifacts/v7/release-visual-evidence.json', JSON.stringify(evidence,null,2)+'\n');
  process.stdout.write(JSON.stringify(evidence,null,2)+'\n');
}
