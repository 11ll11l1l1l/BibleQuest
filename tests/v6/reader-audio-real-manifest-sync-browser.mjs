import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BQ_V6_DEV_URL || 'http://127.0.0.1:4174';
const manifestPath = process.env.BQ_BSB_ALIGNMENT_MANIFEST;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifestPath, 'BQ_BSB_ALIGNMENT_MANIFEST must point to the generated complete BSB timing manifest.');
const manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'));
assert(manifest.translationId === 'bsb' && manifest.complete === true && manifest.chapterCount === 1189,
  'Generated BSB timing manifest is not complete.');
const alignment = manifest.chapters.find(row => row.book === '1CH' && row.chapter === 1);
assert(alignment, 'Generated manifest has no 1 Chronicles 1 alignment.');
const targetVerse = 32;
const nextVerse = 33;
const targetTiming = alignment.verses.find(row => row.verse === targetVerse);
const nextTiming = alignment.verses.find(row => row.verse === nextVerse);
assert(targetTiming && nextTiming, 'Generated 1 Chronicles 1 timing is missing verses 32/33.');

const pack = JSON.parse(readFileSync(new URL('../../data/packs/bible/1CH.json', import.meta.url), 'utf8'));
const chapterVerses = pack
  .filter(row => row.c === 1)
  .map(row => ({ chapter: 1, verse: row.v, text: row.t }));
assert(chapterVerses.some(row => row.verse === targetVerse), 'Current BSB pack has no 1 Chronicles 1:32.');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  await page.evaluate(async ({ alignment, chapterVerses, targetVerse, nextVerse }) => {
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

    const location = { translation: 'bsb', book: '1CH', chapter: 1 };
    const book = { code: '1CH', name: '1 Chronicles', chapters: 29 };
    const chapter = {
      translationId: 'bsb',
      translation: {
        id: 'bsb',
        label: 'Berean Standard Bible',
        mode: 'bundled',
        source: 'Current BibleQuest BSB pack with generated exact Hays timing',
        license: 'BibleQuest BSB source',
        attribution: 'BibleQuest V6 real-manifest acceptance',
      },
      book,
      chapter: 1,
      verses: chapterVerses,
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
        if (!row) throw new Error('Real-manifest fixture verse missing.');
        return {
          verse,
          reference: '1 Chronicles 1:' + verse,
          text: row.text,
          links: [{ label: 'Fixture external reader', href: 'https://example.test/bible' }],
        };
      },
      setTranslation(value) { location.translation = value; },
      setBook(code, nextChapter = 1) { location.book = code; location.chapter = nextChapter; },
      setChapter(value) { location.chapter = Number(value); },
    };

    const byVerse = new Map(alignment.verses.map(row => [row.verse, row]));
    const verseAt = seconds => {
      const row = alignment.verses.find(candidate =>
        seconds >= candidate.startSeconds && seconds < candidate.endSeconds);
      return row?.verse ?? null;
    };
    let subscriber = null;
    const seekCalls = [];
    const playback = {
      status: 'ready',
      translationId: 'bsb',
      bookCode: '1CH',
      chapter: 1,
      currentVerse: null,
      currentTime: 0,
      duration: alignment.durationSeconds,
      playbackRate: 1,
      autoNext: false,
      sleepTimerMinutes: null,
      error: '',
    };
    const emit = () => subscriber?.();
    const audio = {
      isAvailable: () => true,
      hasVerseAlignment: (code, number) => code === '1CH' && number === 1,
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
        playback.currentVerse = alignment.verses[0].verse;
        playback.currentTime = alignment.verses[0].startSeconds;
        emit();
        return { ...playback };
      },
      async play() { playback.status = 'playing'; emit(); return { ...playback }; },
      pause() { playback.status = 'paused'; emit(); return { ...playback }; },
      seek(seconds) {
        playback.currentTime = Number(seconds);
        playback.currentVerse = verseAt(playback.currentTime);
        emit();
        return { ...playback };
      },
      seekVerse(verse) {
        const row = byVerse.get(Number(verse));
        if (!row) throw new Error('Real manifest has no timing for requested verse.');
        seekCalls.push({ verse: Number(verse), startSeconds: row.startSeconds });
        playback.currentVerse = Number(verse);
        playback.currentTime = row.startSeconds;
        emit();
        return { ...playback };
      },
      setPlaybackRate(rate) { playback.playbackRate = Number(rate); emit(); },
      setAutoNext(enabled) { playback.autoNext = Boolean(enabled); emit(); },
      setSleepTimer(minutes) { playback.sleepTimerMinutes = minutes; emit(); },
    };

    const pageModel = readerPage({ reader, audio });
    root.innerHTML = pageModel.html;
    pageModel.mount(root);

    window.__bqRealManifestHarness = {
      seekCalls,
      setTime(seconds) {
        playback.currentTime = Number(seconds);
        playback.currentVerse = verseAt(playback.currentTime);
        playback.status = 'playing';
        emit();
      },
      clearScrolls() { window.__bqAudioScrolls.length = 0; },
      setReduceMotion(value) { window.__bqReduceMotion = Boolean(value); },
      targetVerse,
      nextVerse,
    };
  }, { alignment, chapterVerses, targetVerse, nextVerse });

  const target = page.locator(`[data-verse="${targetVerse}"]`);
  await target.waitFor({ state: 'visible' });
  const follow = page.locator('[data-reader-audio-follow]');
  assert(await follow.count() === 1 && await follow.isChecked() && !await follow.isDisabled(),
    'Generated real alignment did not enable spoken-verse follow.');

  await target.click();
  await page.locator('[data-verse-dialog]').waitFor({ state: 'visible' });
  const playFromVerse = page.locator(`[data-reader-audio-verse="${targetVerse}"]`);
  assert(await playFromVerse.count() === 1, 'Real manifest did not expose Verse Peek seek/play.');
  await playFromVerse.click();
  await page.waitForFunction(verse =>
    document.querySelector(`[data-verse="${verse}"]`)?.classList.contains('is-audio-current'), targetVerse);
  assert(await target.getAttribute('aria-pressed') === 'true',
    'Real manifest current spoken verse was not exposed through accessibility state.');

  const seekCalls = await page.evaluate(() => window.__bqRealManifestHarness.seekCalls.slice());
  assert(seekCalls.length === 1 && seekCalls[0].verse === targetVerse,
    'Verse Peek did not invoke a real-manifest verse seek.');
  assert(Math.abs(seekCalls[0].startSeconds - targetTiming.startSeconds) < 1e-9,
    'Verse Peek seek time does not match generated real-manifest timing.');
  await page.waitForFunction(verse => window.__bqAudioScrolls.some(row => row.verse === String(verse)), targetVerse);
  const firstScroll = await page.evaluate(verse =>
    window.__bqAudioScrolls.find(row => row.verse === String(verse)), targetVerse);
  assert(firstScroll?.options?.block === 'nearest' && firstScroll?.options?.behavior === 'smooth',
    'Real-manifest spoken-verse follow did not use nearest smooth scrolling.');

  await follow.uncheck();
  const verseOne = page.locator('[data-verse="1"]');
  await verseOne.focus();
  await page.evaluate(seconds => {
    window.__bqRealManifestHarness.clearScrolls();
    window.__bqRealManifestHarness.setTime(seconds);
  }, (nextTiming.startSeconds + nextTiming.endSeconds) / 2);
  await page.waitForFunction(verse =>
    document.querySelector(`[data-verse="${verse}"]`)?.classList.contains('is-audio-current'), nextVerse);
  assert(await page.locator(`[data-verse="${nextVerse}"]`).getAttribute('aria-pressed') === 'true',
    'Real-manifest highlight stopped when follow-scroll was disabled.');
  assert((await page.evaluate(() => window.__bqAudioScrolls.slice())).length === 0,
    'Manual follow-scroll override was ignored for real-manifest playback.');
  assert(await verseOne.evaluate(node => document.activeElement === node),
    'Real-manifest verse updates stole keyboard focus while follow-scroll was disabled.');

  await follow.check();
  await page.evaluate(seconds => {
    window.__bqRealManifestHarness.clearScrolls();
    window.__bqRealManifestHarness.setReduceMotion(true);
    window.__bqRealManifestHarness.setTime(seconds);
  }, (targetTiming.startSeconds + targetTiming.endSeconds) / 2);
  await page.waitForFunction(verse => window.__bqAudioScrolls.some(row => row.verse === String(verse)), targetVerse);
  const reducedMotionScroll = await page.evaluate(verse =>
    window.__bqAudioScrolls.find(row => row.verse === String(verse)), targetVerse);
  assert(reducedMotionScroll?.options?.behavior === 'auto',
    'Reduced-motion preference did not disable smooth real-manifest follow scrolling.');

  assert(errors.length === 0, 'Real-manifest Reader synchronization produced errors: ' + errors.join(' | '));
  console.log(JSON.stringify({
    pass: true,
    manifestChapterCount: manifest.chapterCount,
    alignmentRevision: manifest.alignmentRevision,
    audioInventorySha256: manifest.audioInventorySha256,
    scriptureContentVersion: manifest.scriptureContentVersion,
    target: '1CH-1:32',
    targetStartSeconds: targetTiming.startSeconds,
    targetEndSeconds: targetTiming.endSeconds,
    versePeekSeekStartSeconds: seekCalls[0].startSeconds,
    currentVerseHighlight: true,
    followScroll: firstScroll.options,
    manualFocusPreserved: true,
    reducedMotionScroll: reducedMotionScroll.options,
  }));
} finally {
  await browser.close();
}
