import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173/';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });
const buildDir = resolve(process.env.BQ_BUILD_DIR || 'dist-v6');
const manifest = JSON.parse(readFileSync(resolve(buildDir, 'vite-manifest.json'), 'utf8'));
const contentReviewChunk = manifest['src/features/content-review/index.js']?.file;
assert(contentReviewChunk, 'Built artifact manifest is missing the Content Review feature chunk');
const contentReviewModuleUrl = new URL(contentReviewChunk, slashBase(BASE)).href;

function slashBase(value) {
  return String(value).endsWith('/') ? String(value) : `${value}/`;
}

async function mountedLibraryReview() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(slashBase(BASE), { waitUntil: 'networkidle' });
  await page.evaluate(async moduleUrl => {
    document.getElementById('review-test-root')?.remove();
    const root = document.createElement('main');
    root.id = 'review-test-root';
    // Exercise the protected Content Review surface in an isolated mobile viewport.
    // The running app shell uses fixed navigation; without an overlay the app can
    // intercept real Playwright pointer events on review pagination controls.
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;box-sizing:border-box;overflow:auto;padding:8px;background:var(--paper,#fff);color:var(--ink,#172b2b);';
    document.body.append(root);
    const { contentReviewPage } = await import(moduleUrl);

    const baseItem = {
      congregationId: '',
      publicationState: 'published',
      revisionPublicationState: 'published',
      revisionNumber: 1,
      sourceLocale: 'en',
      summary: 'Auditable release content.',
      body: { text: 'English source body.' },
      reviewStatus: 'approved',
      reviewerType: 'automated_policy',
      reviewedAt: '2026-10-07T00:00:00Z',
      policyId: 'biblequest.v7.library-release',
      policyVersion: '1.0.0',
      reviewEvidence: { scriptureRefs: ['Philippians 4:6-7'], visualAssets: [{
        id: 'cover-1', imagePath: '/v7/images/devotional/cover-1.webp',
        sourceUri: 'https://example.com/cover', rightsStatus: 'verified',
        altText: 'A calm sunrise', fallback: 'solid-gradient', sha256: 'a'.repeat(64),
        variants: [
          { kind: 'with_text', locale: 'en', text: 'Audited Devotional',
            imagePath: '/v7/images/devotional/cover-1-with-text-en.webp',
            rights: { status: 'verified' }, altText: 'The title Audited Devotional over a sunrise',
            fallback: 'solid-gradient', sourceRevision: 'r1', sha256: 'b'.repeat(64),
            width: 1024, height: 1280,
            integrity: { sha256Verified: true, dimensionsVerified: true },
            typographyQa: { result: 'pass', observedText: 'Audited Devotional', fontLicense: { status: 'verified' } }
          },
          { kind: 'thumbnail', imagePath: '/v7/images/devotional/cover-1-thumbnail.webp',
            rights: { status: 'verified' }, altText: 'Small sunrise crop',
            fallback: 'solid-gradient', sha256: 'c'.repeat(64), width: 320, height: 400,
            integrity: { sha256Verified: true, dimensionsVerified: true }
          }
        ]
      }] },
      source: {
        kind: 'external',
        title: 'Rights-clear source',
        uri: 'https://example.com/source',
        creator: 'Source Author',
        organization: 'Source Publisher'
      },
      rights: {
        status: 'verified',
        holder: 'Public domain',
        basis: 'Verified public-domain evidence',
        attribution: 'Source attribution',
        allowedUses: ['display']
      },
      translations: [
        { locale: 'tl', title: 'Tagalog title', summary: '', body: { text: 'Tagalog body.' }, translator: 'machine-translation', reviewStatus: 'reviewed', reviewedAt: '2026-10-07T00:00:00Z' },
        { locale: 'ceb', title: 'Cebuano title', summary: '', body: { text: 'Cebuano body.' }, translator: 'machine-translation', reviewStatus: 'reviewed', reviewedAt: '2026-10-07T00:00:00Z' },
        { locale: 'ilo', title: 'Ilocano title', summary: '', body: { text: 'Ilocano body.' }, translator: 'machine-translation', reviewStatus: 'reviewed', reviewedAt: '2026-10-07T00:00:00Z' }
      ],
      taxonomy: [{ id: 'topic.prayer', kind: 'topic', labels: { en: 'Prayer' }, order: 0 }]
    };

    const automated = revisionId => ({
      id: `auto-${revisionId}`,
      itemId: `item-${revisionId}`,
      revisionId,
      contentType: revisionId.includes('devotional') ? 'devotional' : revisionId.includes('teaching') ? 'past_teaching' : 'book',
      reviewerType: 'automated_policy',
      decision: 'auto_approved',
      policyId: 'biblequest.v7.library-release',
      policyVersion: '1.0.0',
      reviewerId: '',
      criteria: [{
        id: 'source_identity',
        result: 'pass',
        hard: true,
        terminal: false,
        evaluator: 'policy-primary',
        evaluatedAt: '2026-10-07T00:00:00Z',
        evidenceRefs: ['evidence:source']
      }],
      secondPass: {
        result: 'pass',
        revision: revisionId,
        evaluator: 'policy-adversarial',
        evaluatedAt: '2026-10-07T00:00:00Z',
        evidenceRefs: ['evidence:second-pass']
      },
      evidenceRefs: ['evidence:source', 'evidence:second-pass'],
      note: '',
      decidedAt: '2026-10-07T00:00:00Z',
      createdAt: '2026-10-07T00:00:00Z'
    });

    const make = (contentType, revisionId, title) => {
      const first = automated(revisionId);
      return Object.freeze({
        ...baseItem,
        itemId: `item-${revisionId}`,
        revisionId,
        contentType,
        title,
        history: Object.freeze([first]),
        latestDecision: first
      });
    };

    let items = Object.freeze([
      make('book', 'revision-book', 'Audited Book'),
      make('devotional', 'revision-devotional', 'Audited Devotional'),
      make('past_teaching', 'revision-teaching', 'Audited Teaching'),
      ...Array.from({ length: 24 }, (_, index) => make('devotional', `revision-extra-${index}`, `Extra Devotional ${index}`))
    ]);
    let state = {
      status: 'ready',
      scopes: Object.freeze([]),
      congregationId: '',
      congregationName: '',
      platformRole: 'admin',
      books: Object.freeze([]),
      selectedBook: '',
      quarantine: Object.freeze([]),
      reports: Object.freeze([]),
      decisionCount: 0,
      libraryItems: items,
      busy: false,
      error: '',
      warning: ''
    };

    const clone = () => Object.freeze({ ...state, libraryItems: items });
    window.__libraryReviewCalls = [];
    const review = {
      async refresh() { return clone(); },
      async selectCongregation() { return clone(); },
      async openQuarantine() { return clone(); },
      reportItems() { return Object.freeze([]); },
      decisionFor() { return null; },
      libraryReviewItems(type = '') { return Object.freeze(items.filter(item => !type || item.contentType === type)); },
      async decideLibrary(input) {
        window.__libraryReviewCalls.push(structuredClone(input));
        const target = items.find(item => item.revisionId === input.revisionId);
        if (!target) throw new Error('Unknown revision');
        const decision = Object.freeze({
          id: `human-${input.revisionId}`,
          itemId: target.itemId,
          revisionId: target.revisionId,
          contentType: target.contentType,
          reviewerType: 'human',
          decision: input.decision,
          reviewerId: 'reviewer-1',
          criteria: Object.freeze([]),
          evidenceRefs: Object.freeze([]),
          note: input.rationale || '',
          decidedAt: '2026-10-07T01:00:00Z',
          createdAt: '2026-10-07T01:00:00Z'
        });
        items = Object.freeze(items.map(item => item.revisionId === target.revisionId
          ? Object.freeze({ ...item, history: Object.freeze([decision, ...item.history]), latestDecision: decision })
          : item));
        state = { ...state, libraryItems: items };
        return { saved: true, decision, state: clone() };
      },
      async decide() { throw new Error('Recall action not expected'); },
      getState() { return clone(); },
      clear() { return clone(); }
    };

    const definition = contentReviewPage({ review, onBack: () => {}, onAccount: () => {}, onCongregation: () => {} });
    root.innerHTML = definition.html;
    window.__libraryReviewCleanup = definition.mount(root);
  }, contentReviewModuleUrl);

  try {
    await page.locator('[data-library-review-item="revision-book"]').waitFor({ timeout: 10000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      html: document.body.innerHTML.slice(0, 12000),
      text: document.body.innerText.slice(0, 6000),
      reviewCalls: window.__libraryReviewCalls || null,
    }));
    throw new Error(`Library Content Review did not render the first audit card: ${error?.message || error}\n${JSON.stringify(diagnostic, null, 2)}`);
  }
  return page;
}

try {
  const page = await mountedLibraryReview();

  for (const [tab, revision, title] of [
    ['books', 'revision-book', 'Audited Book'],
    ['devotionals', 'revision-devotional', 'Audited Devotional'],
    ['teachings', 'revision-teaching', 'Audited Teaching']
  ]) {
    await page.locator(`[data-content-review-tab="${tab}"]`).click();
    const card = page.locator(`[data-library-review-item="${revision}"]`);
    await card.waitFor();
    const text = await card.textContent();
    assert(text?.includes(title), `${tab}: title missing`);
    assert(text?.includes('verified'), `${tab}: verified rights missing`);
    assert(text?.includes('EN / TL / CEB / ILO content'), `${tab}: multilingual audit section missing`);
    assert(text?.includes('Philippians 4:6-7'), `${tab}: Scripture evidence missing`);
    assert(text?.includes('Policy biblequest.v7.library-release @ 1.0.0'), `${tab}: policy identity missing`);
    assert(text?.includes('Independent second pass'), `${tab}: independent QA evidence missing`);
    assert(text?.includes('Visual assets and accessibility'), `${tab}: image evidence section missing`);
    assert(text?.includes('A calm sunrise'), `${tab}: visual alt text missing`);
    assert(text?.includes('CLEAN / TYPE / THUMB variants (2)'), `${tab}: image variants not listed`);
    assert(text?.includes('Observed embedded lettering'), `${tab}: TYPE audit evidence missing`);
    const variants = card.locator('[data-library-visual-variant]');
    assert(await variants.count() === 2, `${tab}: expected TYPE and THUMB previews`);
    const previews = card.locator('img');
    assert(await previews.count() === 3, `${tab}: expected CLEAN, TYPE and THUMB image previews`);
    assert((await previews.first().getAttribute('src'))?.startsWith('/v7/images/'), `${tab}: unsafe preview URL`);
    assert((await previews.first().getAttribute('loading')) === 'lazy', `${tab}: previews must lazy-load`);
  }

  await page.locator('[data-content-review-tab="devotionals"]').click();
  assert(await page.locator('[data-library-review-item]').count() === 12, 'Devotional queue should render at most 12 cards on mobile');
  await page.locator('[data-content-review-page="next"]').click();
  assert(await page.locator('[data-library-review-item]').count() === 12, 'Next audit page should contain 12 items');
  assert(await page.locator('[data-library-review-item="revision-extra-11"]').count() === 1, 'Pagination did not advance to the next review items');
  await page.locator('[data-content-review-page="previous"]').click();
  assert(await page.locator('[data-library-review-item="revision-devotional"]').count() === 1, 'Previous page did not restore the first review item');
  const searchBox=page.locator('[data-content-review-search]');
  await searchBox.fill('');
  await searchBox.pressSequentially('Audited Devotional');
  assert(await page.locator('[data-content-review-search]').inputValue() === 'Audited Devotional', 'Typing into search lost keyboard focus');
  assert(await page.locator('[data-library-review-item]').count() === 1, 'Search should filter Library audit cards');
  await page.locator('[data-content-review-search]').fill('');
  await page.locator('[data-library-review-rationale="revision-devotional"]').fill('Translation wording needs another pass.');
  await page.locator('[data-library-review-decide="request_changes"][data-revision-id="revision-devotional"]').click();
  await page.locator('[data-content-review-message]').waitFor();
  assert((await page.locator('[data-content-review-message]').textContent()) === 'Library audit decision saved.', 'Human audit confirmation missing');

  const calls = await page.evaluate(() => window.__libraryReviewCalls);
  assert(calls.length === 1, 'Expected one human audit write');
  assert(calls[0].revisionId === 'revision-devotional', 'Human audit did not bind exact revision');
  assert(calls[0].decision === 'request_changes', 'Human audit decision changed');
  assert(calls[0].rationale === 'Translation wording needs another pass.', 'Human audit note changed');

  await page.locator('[data-content-review-filter]').selectOption('request_changes');
  const reviewed = page.locator('[data-library-review-item="revision-devotional"]');
  await reviewed.waitFor();
  assert(await reviewed.getAttribute('data-library-review-state') === 'request_changes', 'Human override history did not update visible state');

  const metrics = await page.evaluate(() => {
    const scope = document.querySelector('[data-content-review-view]');
    const controls = [...scope.querySelectorAll('button,input,select,textarea')].filter(node => node.getClientRects().length);
    return {
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      minButtonHeight: Math.min(...[...scope.querySelectorAll('button')].filter(node => node.getClientRects().length).map(node => node.getBoundingClientRect().height)),
      unlabeled: controls.filter(node => !(node.getAttribute('aria-label') || node.labels?.[0]?.textContent?.trim() || node.textContent?.trim())).map(node => node.outerHTML)
    };
  });
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Library Content Review mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px`);
  assert(metrics.minButtonHeight >= 44, `Library Content Review button target below 44px: ${metrics.minButtonHeight}px`);
  assert(metrics.unlabeled.length === 0, `Unlabeled Library audit controls: ${metrics.unlabeled.join(', ')}`);

  await page.evaluate(() => window.__libraryReviewCleanup?.());
  await page.close();
  console.log('BibleQuest V7 Library Content Review browser regression passed.');
} finally {
  await browser.close();
}
