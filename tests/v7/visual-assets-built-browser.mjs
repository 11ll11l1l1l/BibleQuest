import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { auditV7VisualAssets } from '../../scripts/v7-visual-assets-audit.mjs';

const BASE = (process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const output = process.env.BQ_VISUAL_QA_DIR || 'artifacts/v7/visual-browser';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const audit = await auditV7VisualAssets();
assert.equal(audit.status, 'PASS', 'Visual master/variants audit must pass before built-browser QA: ' + audit.errors.join('; '));
const bundles = audit.manifest.assets.filter(asset => asset.bundleStatus === 'complete');
const files = new Map();
for (const asset of audit.manifest.assets) {
  for (const entry of [{ kind: 'clean', src: asset.src, sha256: asset.sha256, width: asset.width, height: asset.height },
    ...(asset.variants || [])]) {
    assert.match(entry.src, /^\/v7\/images\/[a-z0-9/_-]+\.(?:png|webp|jpg|jpeg)$/i, 'Local raster path only');
    assert.match(entry.sha256, /^[a-f0-9]{64}$/i, 'Every included binary needs a measured hash');
    if (files.has(entry.src)) assert.equal(files.get(entry.src).sha256, entry.sha256, 'Conflicting asset ownership');
    files.set(entry.src, entry);
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
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const screenshots = [];
try {
  for (const width of [320, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    for (const asset of bundles) {
      assert(asset.variants?.some(v => v.kind === 'with_text'), 'Complete bundle needs TYPE: ' + asset.assetId);
      assert(asset.variants?.some(v => v.kind === 'thumbnail'), 'Complete bundle needs THUMB: ' + asset.assetId);
      for (const variant of [{ kind: 'clean', src: asset.src, width: asset.width, height: asset.height },
        ...asset.variants]) {
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
          const screenshot = join(output, asset.assetId + '-' + variant.kind + '-' + width + '.png');
          await page.locator('#bq-artwork-browser-qa figure').screenshot({ path: screenshot });
          screenshots.push(screenshot);
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
  completeBundles: bundles.map(asset => ({ assetId: asset.assetId, contentType: asset.contentType })),
  verifiedServedFiles: downloaded, screenshots,
  viewports: [320, 390, 430],
  technicalChecks: ['source-asset-audit', 'actual-served-sha256', 'browser-decode',
    'intrinsic-image-dimensions', 'mobile-width-no-overflow', 'recorded-type-and-thumb-screenshots'],
  visualApproval: 'NOT_AUTOMATIC: artistic legibility, crop intent, and reviewed text in pixels require genuine image inspection'
};
await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('PASS visual binary built-browser QA: ' + downloaded.length + ' image files, '
  + bundles.length + ' complete bundles, ' + screenshots.length + ' TYPE/THUMB screenshots');
