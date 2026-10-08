import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { auditV7VisualAssets } from '../../scripts/v7-visual-assets-audit.mjs';
import { triageV7ArtworkCandidates } from '../../scripts/v7-visual-candidate-triage.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BASE = (process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const output = process.env.BQ_VISUAL_QA_DIR || 'artifacts/v7/visual-browser';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const audit = await auditV7VisualAssets();
assert.equal(audit.status, 'PASS', 'Visual master/variants audit must pass before built-browser QA: ' + audit.errors.join('; '));
const publishedBundles = audit.manifest.assets.filter(asset => asset.bundleStatus === 'complete');
// Draft imagery must be technically checked from three independent local files.
// It is never inserted into the audited release manifest or published registry.
const candidateTriage = await triageV7ArtworkCandidates();
const candidateBundles = candidateTriage.technicallyVerified.map(row => {
  const kind = key => row.files.find(file => file.kind === key);
  const clean = kind('CLEAN'), type = kind('TYPE'), thumb = kind('THUMB');
  return {
    assetId: row.assetId, contentType: row.contentType, candidate: true,
    src: clean.path, sha256: clean.sha256, width: clean.width, height: clean.height,
    variants: [
      { kind: 'with_text', src: type.path, sha256: type.sha256, width: type.width, height: type.height },
      { kind: 'thumbnail', src: thumb.path, sha256: thumb.sha256, width: thumb.width, height: thumb.height },
    ],
  };
});
const bundles = [...publishedBundles, ...candidateBundles];
const files = new Map();
// Deployed output must contain ONLY the published audited files.
for (const asset of audit.manifest.assets) {
  for (const entry of [{ kind: 'clean', src: asset.src, sha256: asset.sha256, width: asset.width, height: asset.height },
    ...(asset.variants || [])]) {
    assert.match(entry.src, /^\/v7\/images\/[a-z0-9/_-]+\.(?:png|webp|jpg|jpeg)$/i, 'Local raster path only');
    assert.match(entry.sha256, /^[a-f0-9]{64}$/i, 'Every included binary needs a measured hash');
    if (files.has(entry.src)) {
      assert.equal(files.get(entry.src).sha256, entry.sha256, 'Conflicting asset ownership');
      assert.equal(files.get(entry.src).assetId, asset.assetId, 'Cross-asset image path reuse');
    }
    files.set(entry.src, { ...entry, assetId: asset.assetId });
  }
}
const downloaded = [];
for (const file of files.values()) {
  const response = await fetch(BASE + file.src, { redirect: 'error' });
  assert.equal(response.status, 200, 'Built preview failed to serve ' + file.src);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(sha(bytes), file.sha256, 'Built preview bytes differ from audited source: ' + file.src);
  assert.match(response.headers.get('content-type') || '', /^image\//, 'Image path returns non-image: ' + file.src);
  downloaded.push({ path: file.src, sha256: file.sha256, bytes: bytes.length });
}
// Candidate bytes are intentionally NOT present in the built production output.
// Verify their exact working-tree bytes independently, then supply them only
// to a disposable Playwright browser via request interception. Never copy them
// into dist-v6 or the published release registry.
const candidateResponses = new Map();
for (const row of candidateTriage.technicallyVerified) {
  for (const file of row.files) {
    assert(!files.has(file.path), 'Unpublished candidate collides with published image');
    assert(!candidateResponses.has(file.path), 'Two candidate assets reuse an image path');
    const bytes = await readFile(join(ROOT, 'public', file.path.slice(1)));
    assert.equal(sha(bytes), file.sha256, 'Candidate source bytes changed after verification');
    const type = file.path.toLowerCase().split('.').pop();
    const contentType = { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml' }[type];
    assert(contentType, 'Unsupported browser candidate format');
    candidateResponses.set(file.path, { bytes, contentType });
  }
}
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const screenshots = [];
const candidateBrowserFailures = new Map();
try {
  for (const width of [320, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await page.route('**/v7/images/**', route => {
      const path = new URL(route.request().url()).pathname;
      const candidate = candidateResponses.get(path);
      // All released images continue through the immutable built HTTP preview.
      if (!candidate) return route.continue();
      return route.fulfill({ status: 200, contentType: candidate.contentType, body: candidate.bytes });
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    for (const asset of bundles) {
      assert(asset.variants?.some(v => v.kind === 'with_text'), 'Complete bundle needs TYPE: ' + asset.assetId);
      assert(asset.variants?.some(v => v.kind === 'thumbnail'), 'Complete bundle needs THUMB: ' + asset.assetId);
      for (const variant of [{ kind: 'clean', src: asset.src, width: asset.width, height: asset.height },
        ...asset.variants]) {
        try {
          const geometry = await page.evaluate(async ({ src, kind, label }) => {
          document.getElementById('bq-artwork-browser-qa')?.remove();
          const stage = document.createElement('main');
          stage.id = 'bq-artwork-browser-qa';
          stage.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#f6f4f0;overflow:auto;box-sizing:border-box;padding:14px;font-family:Arial,sans-serif;color:#172b2b;';
          const frame = document.createElement('figure');
          frame.style.cssText = 'width:100%;max-width:420px;margin:0 auto;box-sizing:border-box;overflow:hidden;';
          const image = document.createElement('img');
          image.alt = label + ', ' + kind;
          image.src = src;
          image.style.cssText = 'display:block;width:100%;max-width:100%;height:auto;object-fit:contain;border-radius:16px;';
          const caption = document.createElement('figcaption');
          caption.textContent = label + ' — ' + kind + ' (browser decode; artistic QA remains separate)';
          caption.style.cssText = 'font-size:12px;line-height:1.5;margin-top:10px;overflow-wrap:anywhere;';
          frame.append(image, caption);
          stage.append(frame);
          document.body.append(stage);
          await image.decode();
          const rect = image.getBoundingClientRect();
          return {
            naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
            renderedWidth: rect.width, renderedHeight: rect.height,
            stageScrollWidth: stage.scrollWidth, stageClientWidth: stage.clientWidth,
            viewportWidth: window.innerWidth
          };
        }, { src: variant.src, kind: variant.kind, label: asset.assetId });
        assert.equal(geometry.naturalWidth, variant.width, 'Chromium width mismatch: ' + variant.src);
        assert.equal(geometry.naturalHeight, variant.height, 'Chromium height mismatch: ' + variant.src);
        assert(geometry.renderedWidth >= width * 0.70, 'Image too small for phone card: ' + variant.src);
        assert(geometry.renderedWidth <= width - 20, 'Image exceeds safe mobile width: ' + variant.src);
        assert(geometry.stageScrollWidth <= geometry.stageClientWidth + 1, 'Horizontal overflow: ' + variant.src);
        assert(geometry.renderedHeight > 0, 'Zero-height image: ' + variant.src);
        if (variant.kind !== 'clean') {
          const screenshot = join(output, (asset.candidate ? 'draft-' : 'release-') + asset.assetId + '-' + variant.kind + '-' + width + '.png');
          await page.locator('#bq-artwork-browser-qa figure').screenshot({ path: screenshot });
          screenshots.push(screenshot);
        }
        } catch (error) {
          if (!asset.candidate) {
            throw new Error('Audited release image failed Chromium QA: ' + asset.assetId
              + ' ' + variant.src + ' at ' + width + 'px: ' + error.message, { cause: error });
          }
          // A broken draft never becomes a release failure or an approved
          // screenshot claim. Capture enough information for the image agent
          // to repair its own source and rerun the exact-commit QA.
          const prior = candidateBrowserFailures.get(asset.assetId) || [];
          prior.push({ path: variant.src, viewportWidth: width, reason: error.message });
          candidateBrowserFailures.set(asset.assetId, prior);
        }
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
const report = {
  schemaVersion: 1, candidateSha: process.env.BQ_EXACT_SHA || null,
  sourceAuditStatus: audit.status, sourceAuditProductionReady: audit.counts.productionReady,
  completeBundles: publishedBundles.map(asset => ({ assetId: asset.assetId, contentType: asset.contentType })),
  draftCandidateTriage: {
    technicallyVerified: candidateBundles.filter(asset => !candidateBrowserFailures.has(asset.assetId))
      .map(asset => ({ assetId: asset.assetId, contentType: asset.contentType,
        status: 'technical_browser_pass_only', publicationApproved: false })),
    locallyVerifiedButBrowserFailed: [...candidateBrowserFailures.entries()]
      .map(([assetId, failures]) => ({ assetId, failures })),
    rejected: [...candidateTriage.rejected, ...[...candidateBrowserFailures.entries()]
      .map(([assetId, failures]) => ({ assetId,
        reason: 'Chromium decode, geometry or screenshot failed', failures }))],
    threeFileCandidates: candidateTriage.threeFileCandidates,
    publicationApproved: false,
    browserDelivery: 'QA-only Playwright fulfillment from independently verified source bytes; excluded from deployable build',
    verifiedCandidateFilePaths: [...candidateResponses.keys()].sort(),
  },
  verifiedServedFiles: downloaded, screenshots,
  viewports: [320, 390, 430],
  technicalChecks: ['source-asset-audit', 'actual-served-sha256', 'browser-decode',
    'intrinsic-image-dimensions', 'mobile-width-no-overflow', 'recorded-type-and-thumb-screenshots'],
  visualApproval: 'NOT_AUTOMATIC: artistic legibility, crop intent, and reviewed text in pixels require genuine image inspection'
};
await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('PASS visual binary built-browser QA: ' + downloaded.length + ' image files, '
  + publishedBundles.length + ' release bundles, '
  + (candidateBundles.length - candidateBrowserFailures.size) + ' draft bundles passed browser QA, '
  + (candidateTriage.rejected.length + candidateBrowserFailures.size) + ' drafts requiring repair, '
  + screenshots.length + ' TYPE/THUMB screenshots; draft publication remains blocked');
