import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (ok, why) => { if (!ok) throw new Error(why); };
const browser = await chromium.launch({ headless: true });

try {
  for (const width of [320, 390, 430, 800]) {
    const page = await browser.newPage({ viewport: { width, height: 840 }, isMobile: width < 720, hasTouch: width < 720 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const root = document.createElement('main');
      root.id = 'bq-lane-b-deck-browser';
      root.style.cssText = 'position:fixed;z-index:99999;inset:0;overflow:auto;box-sizing:border-box;padding:8px;background:#fff;color:#172b2b;';
      const feeling = document.createElement('div');
      const need = document.createElement('div');
      const content = document.createElement('div');
      root.append(feeling, need, content);
      document.body.append(root);
      const { createV7LibraryDiscoveryDeck } = await import('/src/features/library/visual-decks.js');
      const { createV7LibraryVisualContentCard } = await import('/src/features/library/visual-content-card.js');
      window.__bqLaneBSelections = [];
      const callback = row => window.__bqLaneBSelections.push(row);
      window.__bqLaneBFeeling = createV7LibraryDiscoveryDeck({
        root: feeling, kind: 'emotion', locale: 'tl', selectedIds: ['anxious'], onSelect: callback,
      });
      window.__bqLaneBNeed = createV7LibraryDiscoveryDeck({
        root: need, kind: 'need', locale: 'ceb', selectedIds: ['peace'], onSelect: callback,
      });
      content.append(createV7LibraryVisualContentCard({
        document, item: { id: 'devotional-test', title: 'Courage for Today',
          contentType: 'devotional', publicationState: 'published', summary: 'An accessible reading card',
          rights: { status: 'verified', allowedUses: ['display'] }, source: { creator: 'BibleQuest' } },
        locale: 'en', onOpen: row => { window.__bqLaneBOpened = row; },
      }));
    });
    const track = page.locator('[data-v7-deck="emotion"] [role="group"][aria-roledescription="carousel"]');
    const stats = await track.evaluate(el => ({
      width: el.clientWidth, scrollWidth: el.scrollWidth,
      firstWidth: el.querySelector('button')?.getBoundingClientRect().width,
      documentWidth: document.querySelector('#bq-lane-b-deck-browser').scrollWidth,
      viewportWidth: innerWidth,
    }));
    assert(stats.scrollWidth > stats.width, width + ': deck cannot swipe');
    assert(stats.firstWidth >= (width < 720 ? stats.width * 0.75 : 420), width + ': primary feeling art is too small');
    assert(stats.documentWidth <= stats.viewportWidth + 1, width + ': deck creates document overflow');
    assert(await page.locator('[data-v7-deck="emotion"] [data-v7-deck-id]').count() === 30, '30 feelings missing');
    assert(await page.locator('[data-v7-deck="need"] [data-v7-deck-id]').count() === 19, '19 needs missing');
    const first = page.locator('[data-v7-deck="emotion"] [data-v7-deck-id="anxious"]');
    assert(await first.getAttribute('aria-pressed') === 'true', 'selected feeling lost');
    await page.locator('[data-v7-deck="emotion"] [aria-label="Susunod na card"]').click();
    assert(await page.locator('[data-v7-deck="emotion"] [aria-current="true"]').count() === 1, 'active feeling navigation missing');
    await page.locator('[data-v7-deck="emotion"] [aria-current="true"]').focus();
    await page.keyboard.press('Home');
    assert(await first.getAttribute('aria-current') === 'true', 'Home key did not restore the first feeling');
    await first.click();
    assert(await first.getAttribute('aria-pressed') === 'false', 'feeling selection did not toggle');
    assert(await page.locator('[data-v7-deck="need"] [data-v7-deck-id="peace"]').getAttribute('aria-pressed') === 'true',
      'changing Feeling erased Need selection');
    const call = await page.evaluate(() => window.__bqLaneBSelections.at(-1));
    assert(call.kind === 'emotion' && call.id === 'anxious' && call.selected === false, 'selection callback incorrect');
    await page.locator('.bq-v7-content-card__action').click();
    assert((await page.evaluate(() => window.__bqLaneBOpened?.id)) === 'devotional-test', 'visual card did not call onOpen');
    const empty = await page.locator('.bq-v7-content-card__cover img').count();
    assert(empty === 0, 'no image should create a safe gradient fallback, not a broken image');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-v7-deck="need"] [aria-label="Sunod nga kard"]').click();
    await page.evaluate(() => { window.__bqLaneBFeeling?.destroy(); window.__bqLaneBNeed?.destroy(); });
    await page.close();
  }
  console.log('PASS V7 Lane B visual decks: widths 320/390/430/800, navigation, independent selection, content card and fallback');
} finally {
  await browser.close();
}
