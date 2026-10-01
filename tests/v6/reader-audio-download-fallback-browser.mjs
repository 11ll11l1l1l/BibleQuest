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

  await page.evaluate(async () => {
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
        source: 'Synthetic exact-source fixture',
        license: 'test fixture',
        attribution: 'BibleQuest V6 test',
      },
      book,
      chapter: 1,
      verses: [
        { chapter: 1, verse: 1, text: 'In the beginning fixture.' },
        { chapter: 1, verse: 2, text: 'Second fixture verse.' },
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
      setTranslation(value) { location.translation = value; },
      setBook(code, nextChapter = 1) { location.book = code; location.chapter = nextChapter; },
      setChapter(value) { location.chapter = Number(value); },
    };

    let subscriber = null;
    let installAttempts = 0;
    let installed = null;
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
      canDownloadOffline: () => true,
      hasVerseAlignment: () => true,
      getNarrator: () => 'hays',
      getNarrators: () => [{ id: 'hays', label: 'Barry Hays' }],
      getState: () => ({ playback: { ...playback } }),
      subscribe(callback) { subscriber = callback; return () => { if (subscriber === callback) subscriber = null; }; },
      async getInstalledPackage() { return installed; },
      async installChapter() {
        installAttempts += 1;
        if (installAttempts === 1) {
          const error = new Error('Offline audio download is unavailable from this source in this browser. Direct streaming remains usable.');
          error.name = 'AudioPackageDownloadUnavailableError';
          error.code = 'audio-download-unavailable';
          throw error;
        }
        installed = { bytes: 4096, segmentId: 'GEN-1' };
        return { status: 'installed', package: installed };
      },
      cancelChapter() { return false; },
      async removeChapter() { installed = null; },
      async load(translationId, code, number) {
        playback.translationId = translationId;
        playback.bookCode = code;
        playback.chapter = number;
        playback.status = 'ready';
        emit();
        return { ...playback };
      },
      async play() { playback.status = 'playing'; emit(); return { ...playback }; },
      pause() { playback.status = 'paused'; emit(); return { ...playback }; },
      seek(seconds) { playback.currentTime = Number(seconds); emit(); return { ...playback }; },
      seekVerse() { return { ...playback }; },
      setPlaybackRate(rate) { playback.playbackRate = Number(rate); emit(); },
      setAutoNext(enabled) { playback.autoNext = Boolean(enabled); emit(); },
      setSleepTimer(minutes) { playback.sleepTimerMinutes = minutes; emit(); },
    };

    const model = readerPage({ reader, audio });
    root.innerHTML = model.html;
    model.mount(root);
    window.__bqOfflineAudioHarness = {
      get installAttempts() { return installAttempts; },
      get playbackStatus() { return playback.status; },
    };
  });

  const download = page.locator('[data-reader-audio-download]');
  await download.waitFor({ state: 'visible' });
  assert((await download.textContent())?.includes('Download chapter audio'),
    'Offline-approved audio did not expose an explicit chapter download action.');

  await download.click();
  const unavailable = page.locator('[data-reader-audio-download-unavailable]');
  await unavailable.waitFor({ state: 'visible' });
  assert((await unavailable.textContent())?.includes('Direct streaming remains usable'),
    'Fetch/CORS failure did not produce a streaming-safe unavailable-download state.');
  assert((await page.locator('[data-reader-audio-download]').textContent())?.includes('Retry download'),
    'Unavailable-download state did not expose an explicit retry action.');

  await page.locator('[data-reader-audio-toggle]').click();
  await page.waitForFunction(() => window.__bqOfflineAudioHarness.playbackStatus === 'playing');
  assert((await page.locator('[data-reader-audio-status]').textContent())?.startsWith('Playing GEN 1'),
    'Direct chapter streaming stopped working after the offline fetch failure.');

  await page.locator('[data-reader-audio-download]').click();
  await page.waitForFunction(() => window.__bqOfflineAudioHarness.installAttempts === 2);
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-package]')?.textContent?.includes('Offline audio installed'));
  assert(await page.locator('[data-reader-audio-download-unavailable]').count() === 0,
    'Successful retry did not clear the unavailable-download state.');
  assert((await page.locator('[data-reader-audio-package]').textContent())?.includes('4.0 KB'),
    'Successful retry did not surface the verified installed chapter.');

  assert(errors.length === 0, 'Reader offline-audio fallback browser acceptance produced errors: ' + errors.join(' | '));
  console.log(JSON.stringify({
    pass: true,
    firstDownloadState: 'unavailable',
    streamAfterFailure: 'playing',
    retryRecovered: true,
  }));
  console.log('PASS V6 Reader offline-audio unavailable-state fallback.');
} finally {
  await browser.close();
}
