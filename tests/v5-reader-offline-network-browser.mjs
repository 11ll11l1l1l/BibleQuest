import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  await page.goto(ORIGIN, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const { createBibleDataService } = await import('/src/core/bible.js');
    const bible = createBibleDataService();
    const opened = await bible.loadChapter('bsb', 'JHN', 3);
    if (!opened?.verses?.length) throw new Error('Online preload did not return John 3.');
  });

  const cacheEntries = await page.evaluate(async () => {
    const cache = await caches.open('biblequest-v3-opened-bible-packs-v1');
    return (await cache.keys()).map(request => request.url);
  });
  assert.ok(cacheEntries.some(url => url.endsWith('/data/packs/bible/JHN.json')), 'Opening John online must persist its Bible pack.');
  assert.ok(!cacheEntries.some(url => url.endsWith('/data/packs/bible/ACT.json')), 'Acts must remain never-opened for the negative case.');

  await context.setOffline(true);

  const offline = await page.evaluate(async () => {
    const [{ createBibleDataService }, { createReaderService }] = await Promise.all([
      import('/src/core/bible.js'),
      import('/src/app/reader.js')
    ]);
    const storageState = { translation: 'bsb', book: 'JHN', chapter: 3, read: {} };
    const storage = {
      read(key, fallback) { return key === 'reader-state' ? storageState : fallback; },
      write() {}
    };
    const progress = { record() { throw new Error('Progress must not be touched by offline reopen verification.'); } };
    const reader = createReaderService({ bible: createBibleDataService(), storage, progress });
    const status = await reader.getOfflineStatus();
    const reopened = await reader.load();

    reader.setBook('ACT', 1);
    const unavailableStatus = await reader.getOfflineStatus();
    let unavailableMessage = '';
    try { await reader.load(); }
    catch (error) { unavailableMessage = String(error?.message || error); }

    return {
      status,
      reopened: {
        translation: reopened.translation.id,
        book: reopened.book.code,
        chapter: reopened.chapter,
        verseCount: reopened.verses.length
      },
      unavailableStatus,
      unavailableMessage
    };
  });

  assert.equal(offline.status.available, true, 'Previously-opened John must report available offline.');
  assert.equal(offline.status.supported, true);
  assert.equal(offline.reopened.translation, 'bsb');
  assert.equal(offline.reopened.book, 'JHN');
  assert.equal(offline.reopened.chapter, 3);
  assert.ok(offline.reopened.verseCount > 0, 'Previously-opened John 3 must reopen with network disabled.');

  assert.equal(offline.unavailableStatus.available, false, 'Never-opened Acts must not be reported available offline.');
  assert.equal(offline.unavailableStatus.supported, true);
  assert.match(offline.unavailableStatus.reason, /open this book while online/i);
  assert.match(offline.unavailableMessage, /unavailable/i, 'Never-opened Scripture must fail clearly rather than blank/broken.');

  console.log('V5 Phase 5 browser no-network Scripture reopening verification passed.');
} finally {
  await context.setOffline(false).catch(() => {});
  await browser.close();
}
