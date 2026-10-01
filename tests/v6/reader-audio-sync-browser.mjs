import { chromium } from 'playwright';

const BASE = process.env.BQ_V6_DEV_URL || 'http://127.0.0.1:4174';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  const mounted = await page.evaluate(async () => {
    window.__bqAudioScrolls = [];
    window.__bqReduceMotion = false;
    window.matchMedia = () => ({
      matches: window.__bqReduceMotion === true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true; },
    });
    Element.prototype.scrollIntoView = function scrollIntoView(options) {
      window.__bqAudioScrolls.push({
        verse: this.getAttribute?.('data-verse') || null,
        options: options || null,
      });
    };

    const { readerPage } = await import('/src/features/reader/index.js');
    const root = document.createElement('main');
    root.innerHTML = '<section data-reader-page><div class="bq-panel"><p>Loading Bible Reader…</p></div></section>';
    document.body.replaceChildren(root);

    const location = { translation: 'bsb', book: 'GEN', chapter: 1 };
    const book = { code: 'GEN', name: 'Genesis', chapters: 50 };
    const chapter = {
      translationId: 'bsb',
      translation: {
        id: 'bsb',
        label: 'Berean Standard Bible',
        mode: 'bundled',
        source: 'Synthetic exact-alignment browser fixture',
        license: 'test fixture',
        attribution: 'BibleQuest V6 test',
      },
      book,
      chapter: 1,
      verses: [
        { chapter: 1, verse: 1, text: 'In the beginning fixture.' },
        { chapter: 1, verse: 2, text: 'Second exact-alignment fixture verse.' },
        { chapter: 1, verse: 3, text: 'Third exact-alignment fixture verse.' },
      ],
    };

    const reader = {
      translations: [{ id: 'bsb', label: 'Berean Standard Bible' }],
      books: [book],
      getState: () => ({ ...location }),
      async load() { return chapter; },
      externalLinks() { return []; },
      isRead() { return false; },
      questSnapshot() { return null; },
      markRead() { return { newlyRead: false, progress: null }; },
      async peek(verse) {
        const row = chapter.verses.find(candidate => candidate.verse === verse);
        if (!row) throw new Error('Fixture verse missing.');
        return {
          verse,
          reference: 'Genesis 1:' + verse,
          text: row.text,
          links: [{ label: 'Fixture external reader', href: 'https://example.test/bible' }],
        };
      },
      setTranslation(value) { location.translation = value; },
      setBook(code, nextChapter = 1) { location.book = code; location.chapter = nextChapter; },
      setChapter(value) { location.chapter = Number(value); },
    };

    let subscriber = null;
    const seekCalls = [];
    const playback = {
      status: 'ready',
      translationId: 'bsb',
      bookCode: 'GEN',
      chapter: 1,
      currentVerse: null,
      currentTime: 0,
      duration: 90,
      playbackRate: 1,
      autoNext: false,
      sleepTimerMinutes: null,
      error: '',
    };
    const emit = () => subscriber?.();
    const audio = {
      isAvailable: () => true,
      hasVerseAlignment: (code, number) => code === 'GEN' && number === 1,
      canDownloadOffline: () => false,
      getState: () => ({ playback: { ...playback } }),
      getNarrators: () => [{ id: 'hays', label: 'Barry Hays' }],
      getNarrator: () => 'hays',
      subscribe(callback) { subscriber = callback; return () => { if (subscriber === callback) subscriber = null; }; },
      async load(translationId, code, number) {
        playback.translationId = translationId;
        playback.bookCode = code;
        playback.chapter = number;
        playback.status = 'ready';
        playback.currentVerse = 1;
        playback.currentTime = 0;
        emit();
        return { ...playback };
      },
      async play() { playback.status = 'playing'; emit(); return { ...playback }; },
      pause() { playback.status = 'paused'; emit(); return { ...playback }; },
      seek(seconds) { playback.currentTime = Number(seconds); emit(); return { ...playback }; },
      seekVerse(verse) {
        const positions = { 1: 0, 2: 30, 3: 60 };
        if (!(verse in positions)) throw new Error('Fixture verse timing missing.');
        seekCalls.push(verse);
        playback.currentVerse = verse;
        playback.currentTime = positions[verse];
        emit();
        return { ...playback };
      },
      setPlaybackRate(rate) { playback.playbackRate = Number(rate); emit(); },
      setAutoNext(enabled) { playback.autoNext = Boolean(enabled); emit(); },
      setSleepTimer(minutes) { playback.sleepTimerMinutes = minutes; emit(); },
    };

    const pageModel = readerPage({ reader, audio });
    root.innerHTML = pageModel.html;
    const cleanup = pageModel.mount(root);

    window.__bqAudioHarness = {
      seekCalls,
      setVerse(verse) {
        const positions = { 1: 0, 2: 30, 3: 60 };
        playback.currentVerse = verse;
        playback.currentTime = positions[verse];
        playback.status = 'playing';
        emit();
      },
      clearScrolls() { window.__bqAudioScrolls.length = 0; },
      setReduceMotion(value) { window.__bqReduceMotion = Boolean(value); },
      cleanup,
    };
    return true;
  });
  assert(mounted, 'Synthetic Reader audio synchronization harness did not mount.');

  await page.locator('[data-verse="1"]').waitFor({ state: 'visible' });
  const follow = page.locator('[data-reader-audio-follow]');
  assert(await follow.count() === 1 && await follow.isChecked() && !await follow.isDisabled(),
    'Verified-alignment Reader did not expose enabled spoken-verse follow control.');

  await page.locator('[data-verse="2"]').click();
  const dialog = page.locator('[data-verse-dialog]');
  await dialog.waitFor({ state: 'visible' });
  const playFromVerse = page.locator('[data-reader-audio-verse="2"]');
  assert(await playFromVerse.count() === 1,
    'Verified alignment did not expose Verse Peek seek/play action.');
  await playFromVerse.click();
  await page.waitForFunction(() => document.querySelector('[data-verse="2"]')?.classList.contains('is-audio-current'));
  assert(await page.locator('[data-verse="2"]').getAttribute('aria-pressed') === 'true',
    'Current spoken verse was not exposed through the Reader accessibility state.');
  assert(await page.locator('[data-verse="1"]').getAttribute('aria-pressed') === 'false',
    'Previous verse retained current-spoken accessibility state.');
  const peekSeekCalls = await page.evaluate(() => window.__bqAudioHarness.seekCalls.slice());
  assert(JSON.stringify(peekSeekCalls) === JSON.stringify([2]),
    'Verse Peek did not seek through the verified verse timing boundary: ' + JSON.stringify(peekSeekCalls) + '.');
  await page.waitForFunction(() => window.__bqAudioScrolls.some(row => row.verse === '2'));
  const firstScroll = await page.evaluate(() => window.__bqAudioScrolls.find(row => row.verse === '2'));
  assert(firstScroll?.options?.block === 'nearest' && firstScroll?.options?.behavior === 'smooth',
    'Spoken-verse follow did not use nearest smooth scrolling: ' + JSON.stringify(firstScroll) + '.');

  await page.locator('[data-verse="3"]').click();
  await page.waitForFunction(() => window.__bqAudioHarness.seekCalls.length === 2);
  const directSeekCalls = await page.evaluate(() => window.__bqAudioHarness.seekCalls.slice());
  assert(JSON.stringify(directSeekCalls) === JSON.stringify([2, 3]),
    'Active verified BSB playback did not seek directly from a verse tap: ' + JSON.stringify(directSeekCalls) + '.');
  await page.waitForFunction(() => document.querySelector('[data-verse="3"]')?.classList.contains('is-audio-current'));
  assert(await dialog.evaluate(node => node.open === false),
    'Direct verse-tap seek reopened Verse Peek while BSB audio was already active.');

  const verseOne = page.locator('[data-verse="1"]');
  await verseOne.focus();
  await page.locator('.bq-verse-list').dispatchEvent('wheel', { deltaY: 120 });
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-follow]')?.checked === false);
  await page.evaluate(() => {
    window.__bqAudioHarness.clearScrolls();
    window.__bqAudioHarness.setVerse(1);
  });
  await page.waitForFunction(() => document.querySelector('[data-verse="1"]')?.classList.contains('is-audio-current'));
  assert(await page.locator('[data-verse="1"]').getAttribute('aria-pressed') === 'true',
    'Verse highlighting stopped after manual navigation suspended follow-scroll.');
  const disabledFollowScrolls = await page.evaluate(() => window.__bqAudioScrolls.slice());
  assert(disabledFollowScrolls.length === 0,
    'Manual navigation suspended follow but the Reader still moved the viewport: ' + JSON.stringify(disabledFollowScrolls) + '.');
  assert(await verseOne.evaluate(node => document.activeElement === node),
    'Audio verse updates stole keyboard focus after manual navigation suspended follow-scroll.');

  await follow.check();
  await page.evaluate(() => {
    window.__bqAudioHarness.clearScrolls();
    window.__bqAudioHarness.setReduceMotion(true);
    window.__bqAudioHarness.setVerse(2);
  });
  await page.waitForFunction(() => window.__bqAudioScrolls.some(row => row.verse === '2'));
  const reducedMotionScroll = await page.evaluate(() => window.__bqAudioScrolls.find(row => row.verse === '2'));
  assert(reducedMotionScroll?.options?.behavior === 'auto',
    'Reduced-motion preference did not disable smooth audio-follow scrolling: ' + JSON.stringify(reducedMotionScroll) + '.');
  assert(await page.locator('[data-verse="2"]').getAttribute('aria-pressed') === 'true',
    'Reduced-motion mode stopped current-verse accessibility highlighting.');

  assert(errors.length === 0, 'Reader audio synchronization browser acceptance produced errors: ' + errors.join(' | '));
  console.log(JSON.stringify({
    pass: true,
    versePeekSeek: peekSeekCalls,
    directVerseTapSeek: directSeekCalls,
    currentVerseAria: true,
    followScroll: firstScroll.options,
    manualNavigationSuspendsFollow: true,
    manualFocusPreserved: true,
    reducedMotionScroll: reducedMotionScroll.options,
  }));
  console.log('PASS V6 Reader synthetic verified-alignment synchronization UX.');
} finally {
  await browser.close();
}
