import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || process.env.BQ_BASE_URL || 'http://127.0.0.1:4173';
const candidateSha = String(process.env.BQ_EXACT_SHA || '').trim().toLowerCase();
assert.match(candidateSha, /^[a-f0-9]{40}$/);

const viewports = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

function contrastRatio(rgbA, rgbB) {
  const luminance = ([r, g, b]) => {
    const linear = [r, g, b].map(value => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const [lighter, darker] = [luminance(rgbA), luminance(rgbB)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(value) {
  const match = String(value || '').match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+([\d.]+))?\)/i);
  if (!match) return null;
  return {
    rgb: [Number(match[1]), Number(match[2]), Number(match[3])],
    alpha: match[4] === undefined ? 1 : Number(match[4]),
  };
}

const browser = await chromium.launch({ headless: true });
const observations = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`${baseUrl}/#/accessibility`, { waitUntil: 'networkidle' });
    await page.locator('[data-accessibility-page]').waitFor({ state: 'visible', timeout: 10000 });

    const before = await page.evaluate(() => ({
      viewport: window.innerWidth,
      widest: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
    }));
    assert.ok(before.widest <= before.viewport + 1, `${viewport.width}px: baseline horizontal overflow ${before.widest}/${before.viewport}`);

    const unlabeled = await page.evaluate(() => [...document.querySelectorAll('button,a[href],input,select,textarea')]
      .filter(element => element.getClientRects().length && !element.closest('[hidden]'))
      .filter(element => {
        const label = element.getAttribute('aria-label')
          || element.labels?.[0]?.textContent?.trim()
          || element.textContent?.trim()
          || element.getAttribute('title');
        return !label;
      })
      .map(element => element.outerHTML));
    assert.deepEqual(unlabeled, [], `${viewport.width}px: visible controls must have accessible labels`);

    await page.locator('[data-accessibility-setting="text"]').selectOption('xlarge');
    await page.locator('[data-accessibility-setting="motion"]').selectOption('reduce');
    await page.locator('[data-accessibility-setting="contrast"]').selectOption('strong');
    await page.waitForFunction(() => (
      document.documentElement.dataset.bqText === 'xlarge'
      && document.documentElement.dataset.bqEffectiveMotion === 'reduce'
      && document.documentElement.dataset.bqContrast === 'strong'
    ));

    const presentation = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const textElement = document.querySelector('[data-accessibility-page] h1');
      if (!textElement) throw new Error('Accessibility heading was not rendered.');
      const textStyle = getComputedStyle(textElement);
      let backgroundElement = textElement.parentElement;
      let background = backgroundElement ? getComputedStyle(backgroundElement).backgroundColor : '';
      while (
        backgroundElement?.parentElement
        && (background === 'transparent' || background === 'rgba(0, 0, 0, 0)')
      ) {
        backgroundElement = backgroundElement.parentElement;
        background = getComputedStyle(backgroundElement).backgroundColor;
      }
      return {
        rootFontSize: parseFloat(rootStyle.fontSize),
        color: textStyle.color,
        background,
      };
    });
    assert.ok(presentation.rootFontSize >= 18.9, `${viewport.width}px: xlarge preference did not increase root font size`);

    const foreground = parseRgb(presentation.color);
    const background = parseRgb(presentation.background);
    assert.ok(foreground && background && foreground.alpha >= 0.99 && background.alpha >= 0.99,
      `${viewport.width}px: accessibility heading did not resolve to opaque RGB colors`);
    const ratio = contrastRatio(foreground.rgb, background.rgb);
    assert.ok(ratio >= 4.5,
      `${viewport.width}px: accessibility heading contrast ${ratio.toFixed(2)} is below 4.5:1`);

    await page.locator('#bq-view').focus();
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      const style = getComputedStyle(element);
      return {
        interactive: Boolean(element?.matches('a,button,input,select,textarea')),
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth) || 0,
      };
    });
    assert.equal(focus.interactive, true, `${viewport.width}px: Tab did not move to an interactive control`);
    assert.notEqual(focus.outlineStyle, 'none', `${viewport.width}px: keyboard focus outline is disabled`);
    assert.ok(focus.outlineWidth >= 3, `${viewport.width}px: keyboard focus outline is thinner than 3px`);

    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.waitForTimeout(50);
    const scaled = await page.evaluate(() => ({
      viewport: window.innerWidth,
      widest: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
      rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
    }));
    assert.ok(scaled.rootFontSize >= 31, `${viewport.width}px: 200% text-resize probe did not apply`);
    assert.ok(scaled.widest <= scaled.viewport + 1,
      `${viewport.width}px: 200% text resize caused horizontal overflow ${scaled.widest}/${scaled.viewport}`);

    assert.deepEqual(errors, [], `${viewport.width}px: unexpected console/page errors: ${errors.join(' | ')}`);
    observations.push({
      width: viewport.width,
      height: viewport.height,
      strongContrastRatio: Number(ratio.toFixed(2)),
      xlargeRootFontPx: presentation.rootFontSize,
      resizedRootFontPx: scaled.rootFontSize,
      focusOutlinePx: focus.outlineWidth,
      horizontalOverflow: false,
      labeledControls: true,
    });
    await context.close();
  }

  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/release-responsive-accessibility.json', `${JSON.stringify({
    schemaVersion: 1,
    candidateSha,
    result: 'PASS',
    observedAt: new Date().toISOString(),
    checks: [
      'responsive-320-390-430',
      'accessible-control-labels',
      'xlarge-text-preference',
      'strong-contrast-primary-text',
      'visible-keyboard-focus',
      'reduced-motion-state',
      '200-percent-text-resize-without-horizontal-overflow',
      'no-console-or-page-errors',
    ],
    observations,
  }, null, 2)}\n`, 'utf8');
} finally {
  await browser.close();
}

console.log(`PASS V7 release responsive/accessibility browser gate (${viewports.map(item => item.width).join('/') }px)`);
