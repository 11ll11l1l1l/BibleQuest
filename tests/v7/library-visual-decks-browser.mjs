import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { auditV7VisualAssets } from '../../scripts/v7-visual-assets-audit.mjs';

const audit = await auditV7VisualAssets();
if (audit.status !== 'PASS') throw new Error(audit.errors.join('; '));
const master = audit.manifest.assets.find(asset => asset.contentType === 'emotion');
if (!master) throw new Error('Focal rendering QA needs an audited raster master');
const masterBytes = await readFile(new URL('../../public' + master.src, import.meta.url));
if (createHash('sha256').update(masterBytes).digest('hex') !== master.sha256)
  throw new Error('Component fixture changed since source audit');

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (ok, why) => { if (!ok) throw new Error(why); };
const browser = await chromium.launch({ headless: true });

try {
  for (const width of [320, 390, 430, 800]) {
    const page = await browser.newPage({ viewport: { width, height: 840 }, isMobile: width < 720, hasTouch: width < 720, serviceWorkers: 'block' });
    // Vite intentionally disables publicDir. Supply audited fixture bytes only
    // to this source-component harness; built HTTP verification stays separate.
    await page.route('**/v7/images/**', route => {
      if(new URL(route.request().url()).pathname !== master.src) return route.continue();
      return route.fulfill({status:200,contentType:'image/webp',body:masterBytes});
    });
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
      const { createV7LibraryDiscoveryDeck, createV7LibraryVisualContentCard } =
        await import('/src/features/library/index.js');
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
        locale: 'en', onOpen: row => { window.__bqLaneBOpened = row; window.__bqLaneBOpenCount = (window.__bqLaneBOpenCount || 0) + 1; },
      }));
    });
    const track = page.locator('[data-v7-deck="emotion"] [role="group"][aria-roledescription="carousel"]');
    const stats = await track.evaluate(el => ({
      width: el.clientWidth, scrollWidth: el.scrollWidth,
      firstWidth: el.querySelector('button')?.getBoundingClientRect().width,
      documentWidth: document.querySelector('#bq-lane-b-deck-browser').scrollWidth,
      viewportWidth: innerWidth, cardStyle: ['width','maxWidth','flexBasis'].map(k=>getComputedStyle(el.querySelector('button'))[k]),padding:[getComputedStyle(el).paddingLeft,getComputedStyle(el).paddingRight],
    }));
    assert(stats.scrollWidth > stats.width, width + ': deck cannot swipe');
    assert(stats.firstWidth >= (width < 720 ? stats.width * 0.75 : 420), width + ': primary feeling art is too small ' + JSON.stringify(stats));
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
    const fullCardHit = await page.locator('.bq-v7-content-card').evaluate(el => {
      const card = el.getBoundingClientRect();
      const action = el.querySelector('.bq-v7-content-card__action');
      const button = action.getBoundingClientRect();
      return {
        widthGap: Math.abs(card.width - button.width),
        heightGap: Math.abs(card.height - button.height),
        accessibleName: action.getAttribute('aria-label'),
        heading: el.querySelector('h3')?.textContent || '',
      };
    });
    assert(fullCardHit.widthGap <= 4 && fullCardHit.heightGap <= 4, 'published image card has a small hit target');
    assert(fullCardHit.accessibleName?.includes('Courage for Today'), 'full-card button lacks accessible title');
    assert((await page.locator('.bq-v7-content-card__action').textContent())?.includes('Courage for Today'),
      'full-card action lost localized title needed by authenticated Library regression');
    assert(fullCardHit.heading === 'Courage for Today', 'semantic card heading disappeared');
    await page.locator('.bq-v7-content-card').scrollIntoViewIfNeeded();
    const coverBounds = await page.locator('.bq-v7-content-card__cover').boundingBox();
    assert(coverBounds, 'card image/gradient is not visible');
    await page.mouse.click(coverBounds.x + coverBounds.width/2, coverBounds.y + coverBounds.height/2);
    assert((await page.evaluate(() => window.__bqLaneBOpenCount)) === 1, 'tapping artwork did not open content exactly once');
    await page.locator('.bq-v7-content-card__action').focus();
    await page.keyboard.press('Enter');
    assert((await page.evaluate(() => window.__bqLaneBOpenCount)) === 2, 'keyboard activation did not open content exactly once');
    assert((await page.evaluate(() => window.__bqLaneBOpened?.id)) === 'devotional-test', 'visual card did not call onOpen');
    const empty = await page.locator('.bq-v7-content-card__cover img').count();
    assert(empty === 0, 'no image should create a safe gradient fallback, not a broken image');
    // Exercise actual Library components using audited raster bytes and an
    // explicit edge focal fixture. This is component QA, not editorial approval.
    for (const locale of ['en', 'tl', 'ceb', 'ilo']) {
      const observed = await page.evaluate(async ({ master, locale }) => {
        const { createV7LibraryDiscoveryDeck, createV7LibraryVisualContentCard } =
          await import('/src/features/library/index.js');
        const { normalizeV7VisualRegistry } = await import('/src/ui/visual-assets.js');
        const fixture = { ...master, contentType: 'emotion', contentId: 'anxiety_worry',
          focalPoint: {x:0,y:0.75}, variants: [{kind:'with_text',locale,
            embeddedText:'Anxious / worried',src:master.src,sha256:master.sha256}] };
        const registry = normalizeV7VisualRegistry({schemaVersion:1,assets:[fixture],
          byContent:{'emotion:anxiety_worry':[fixture.assetId]}});
        const host=document.createElement('div');
        document.querySelector('#bq-lane-b-deck-browser').replaceChildren(host);
        window.__bqLaneBFeeling?.destroy(); window.__bqLaneBNeed?.destroy();
        const deck=createV7LibraryDiscoveryDeck({root:host,kind:'emotion',locale,registry});
        const card=host.querySelector('[data-v7-deck-id="anxious"]');
        const image=card.querySelector('img'); image.loading='eager';
        await image.decode().catch(error => { throw new Error('deck ' + image.src + ': ' + error.message); });
        card.querySelector('.bq-v7-visual-deck__label').style.fontSize='200%';
        const contentRegistry=normalizeV7VisualRegistry({schemaVersion:1,
          assets:[{...fixture,contentType:'devotional',contentId:'devotional-test'}],
          byContent:{'devotional:devotional-test':[fixture.assetId]}});
        const content=createV7LibraryVisualContentCard({document,registry:contentRegistry,locale,
          item:{id:'devotional-test',title:'A long localized title with room to read and reflect',
            contentType:'devotional',publicationState:'published',
            rights:{status:'verified',allowedUses:['display']}},onOpen:()=>{}});
        host.append(content);
        const cover=content.querySelector('img'); cover.loading='eager'; await cover.decode().catch(error => { throw new Error('cover ' + cover.src + ': ' + error.message); });
        const result={position:getComputedStyle(image).objectPosition,
          coverPosition:getComputedStyle(cover).objectPosition,
          src:new URL(image.src).pathname,label:card.querySelector('.bq-v7-visual-deck__label').textContent,
          labelLang:card.getAttribute('lang'),overflow:host.scrollWidth>innerWidth,
          decoded:image.naturalWidth>0&&cover.naturalWidth>0};
        deck.destroy(); content.remove();
        return result;
      }, {master,locale});
      assert(observed.position === '0% 75%' && observed.coverPosition === '0% 75%',
        width + '/' + locale + ': Library ignored edge focal position');
      assert(observed.src === master.src && observed.decoded, 'Library must decode the CLEAN source');
      assert(observed.label && observed.labelLang === locale, 'Live localized title lost');
      assert(!observed.overflow, 'Live text at 200% creates horizontal overflow');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => { window.__bqLaneBFeeling?.destroy(); window.__bqLaneBNeed?.destroy(); });
    await page.close();
  }
  console.log('PASS V7 Lane B visual decks: widths 320/390/430/800, navigation, independent selection, content card and fallback');
} finally {
  await browser.close();
}
