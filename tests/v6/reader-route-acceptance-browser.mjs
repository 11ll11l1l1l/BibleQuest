import { chromium } from 'playwright';
import { deepStrictEqual } from 'node:assert';
import { readFile, readdir } from 'node:fs/promises';
import { buildBsbAlignmentManifest } from '../../scripts/v6-bsb-alignment-manifest.mjs';

const BASE = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const WIDTHS = [320, 360, 390, 412, 430];
const VERIFY_OPENBIBLE_AUDIO = process.env.BQ_VERIFY_OPENBIBLE_AUDIO === '1';
const browser = await chromium.launch({ headless: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function buildBuiltReaderAlignmentFixture() {
  const scripture = JSON.parse(await readFile(new URL('../../dist-v6/data/v6-scripture-manifests/bsb.json', import.meta.url), 'utf8'));
  assert(scripture?.translationId === 'bsb' && typeof scripture.contentVersion === 'string' && scripture.contentVersion,
    'Built Reader alignment fixture requires the exact built BSB Scripture content version.');
  const bibleDirectory = new URL('../../data/packs/bible/', import.meta.url);
  const files = (await readdir(bibleDirectory)).filter(name => /^[1-3]?[A-Z]{2,3}\.json$/.test(name)).sort();
  const revision = 'a'.repeat(40);
  const audioInventorySha256 = 'b'.repeat(64);
  const audioContentVersion = 'sha256-' + audioInventorySha256;
  const source = 'Barry Hays BSB narration (OpenBible direct chapter stream)';
  const license = 'CC0 1.0 public-domain dedication by the BSB Audio Bible project';
  const alignmentRoot = 'BSB-publishing/bsb-align';
  const alignmentSource = alignmentRoot + '@' + revision;
  const alignments = [];
  let audioIndex = 0;
  for (const name of files) {
    const code = name.slice(0, -5);
    const rows = JSON.parse(await readFile(new URL(name, bibleDirectory), 'utf8'));
    const chapters = new Map();
    for (const row of rows) {
      const chapter = Number(row.c), verse = Number(row.v);
      if (!chapters.has(chapter)) chapters.set(chapter, []);
      chapters.get(chapter).push(verse);
    }
    for (const [chapter, verseNumbers] of [...chapters.entries()].sort((a, b) => a[0] - b[0])) {
      const normalizedVerseNumbers = [...new Set(verseNumbers)].sort((a, b) => a - b);
      // Some bundled BSB Psalm chapters omit superscription verse 1 from the text pack.
      // The synthetic full-corpus timing fixture still needs validator-safe verse-1 timing;
      // only Genesis 1 timings are exercised as Reader behavior evidence below.
      if (normalizedVerseNumbers[0] !== 1) normalizedVerseNumbers.unshift(1);
      const verses = normalizedVerseNumbers.map((verse, index) => ({
        verse,
        startSeconds: index * 2,
        endSeconds: index * 2 + 1.5,
      }));
      audioIndex += 1;
      alignments.push({
        schemaVersion: 1,
        translationId: 'bsb',
        contentVersion: audioContentVersion,
        scriptureContentVersion: scripture.contentVersion,
        book: code,
        chapter,
        durationSeconds: Math.max(2, verses.length * 2),
        source,
        license,
        alignmentSource,
        audioSha256: audioIndex.toString(16).padStart(64, '0'),
        audioByteLength: 100000 + audioIndex,
        verses,
      });
    }
  }
  return buildBsbAlignmentManifest({
    alignments,
    metadata: {
      translationId: 'bsb',
      source,
      license,
      alignmentSource: alignmentRoot,
      alignmentRevision: revision,
      contentVersion: audioContentVersion,
    },
    scriptureContentVersion: scripture.contentVersion,
    audioInventorySha256,
    complete: true,
  });
}

async function verifyWidth(width) {
  const page = await browser.newPage({
    viewport: { width, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

  await page.goto(`${BASE}/#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-verse]').first().waitFor();

  assert(await page.getByLabel('Translation', { exact: true }).count() === 1, `${width}px Reader translation control lacks an accessible label.`);
  assert(await page.getByLabel('Book', { exact: true }).count() === 1, `${width}px Reader book control lacks an accessible label.`);
  assert(await page.getByLabel('Chapter', { exact: true }).count() === 1, `${width}px Reader chapter control lacks an accessible label.`);
  assert(await page.getByLabel('Search this translation', { exact: true }).count() === 1, `${width}px Reader search input lacks an accessible label.`);

  const metrics = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() || null;
    const height = (selector) => rect(selector)?.height || 0;
    return {
      innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      layoutRight: rect('.bq-reader-layout')?.right || 0,
      scriptureRight: rect('.bq-scripture-panel')?.right || 0,
      translationHeight: height('[data-reader-translation]'),
      bookHeight: height('[data-reader-book]'),
      chapterHeight: height('[data-reader-chapter]'),
      previousHeight: height('[data-reader-prev]'),
      nextHeight: height('[data-reader-next]'),
      searchHeight: height('[data-reader-search] button[type="submit"]'),
      markReadHeight: height('[data-reader-mark]'),
      firstExternalHeight: height('[data-external-reader]'),
      firstVerseHeight: rect('[data-verse]')?.height || 0,
      contextLabel: document.querySelector('[data-context-dialog]')?.getAttribute('aria-label') || '',
    };
  });

  assert(metrics.htmlScrollWidth <= width + 1 && metrics.bodyScrollWidth <= width + 1,
    `${width}px Reader has horizontal overflow: html=${metrics.htmlScrollWidth}, body=${metrics.bodyScrollWidth}.`);
  assert(metrics.layoutRight <= width + 1 && metrics.scriptureRight <= width + 1,
    `${width}px Reader content exceeds the viewport.`);
  for (const [name, value] of Object.entries({
    translation: metrics.translationHeight,
    book: metrics.bookHeight,
    chapter: metrics.chapterHeight,
    previous: metrics.previousHeight,
    next: metrics.nextHeight,
    search: metrics.searchHeight,
    markRead: metrics.markReadHeight,
    externalReader: metrics.firstExternalHeight,
  })) {
    assert(value >= 44, `${width}px Reader ${name} control is below the 44px practical target: ${value}px.`);
  }
  assert(metrics.firstVerseHeight >= 44, `${width}px Reader verse target is below 44px: ${metrics.firstVerseHeight}px.`);
  assert(metrics.contextLabel === 'Hebrew and Greek Context Lab', `${width}px Context Lab dialog lacks an accessible name.`);

  const verse = page.locator('[data-verse]').first();
  await verse.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('[data-verse-dialog]');
  await dialog.waitFor({ state: 'visible' });
  assert(await dialog.getAttribute('aria-labelledby') === 'bq-verse-peek-title',
    `${width}px Verse Peek dialog is not labelled by its Scripture reference.`);
  const heading = page.locator('#bq-verse-peek-title');
  assert((await heading.textContent())?.trim(), `${width}px Verse Peek accessible heading is blank.`);
  assert(await page.locator('[data-verse-close]').count() === 1, `${width}px Verse Peek close action is missing.`);
  await page.locator('[data-verse-close]').click();
  await dialog.waitFor({ state: 'hidden' });

  if (width === 390) {
    const search = page.getByLabel('Search this translation', { exact: true });
    await search.fill('John 3:16');
    await page.locator('[data-reader-search] button[type="submit"]').click();
    const result = page.locator('[data-search-result="0"]');
    await result.waitFor();
    assert((await result.locator('b').textContent())?.trim() === 'John 3:16',
      'Reader reference search parity failed for John 3:16.');
    assert(await page.locator('[aria-labelledby="bq-reader-search-results-title"]').count() === 1,
      'Reader Search results region lacks its accessible heading relationship.');
    await result.click();
    await page.locator('[data-verse="16"].is-highlighted').waitFor();
    assert(await page.locator('[data-reader-book]').inputValue() === 'JHN'
      && await page.locator('[data-reader-chapter]').inputValue() === '3',
    'Reader Search-result navigation did not preserve existing John 3:16 behavior.');

    const offlineDownload = page.locator('[data-reader-offline-download]');
    await offlineDownload.waitFor({ state: 'visible' });
    assert((await offlineDownload.textContent())?.includes('Download'),
      'Reader did not expose an explicit user-triggered Scripture offline action.');
    await offlineDownload.click();
    await page.waitForFunction(() =>
      document.querySelector('[data-reader-offline-manager]')?.getAttribute('data-managed-installed') === 'true',
    null, { timeout: 15000 });
    assert(await page.locator('[data-reader-offline-remove]').count() === 1,
      'Verified Scripture package did not expose a remove action.');
    await page.locator('[data-reader-offline-remove]').click();
    await page.locator('[data-reader-offline-download]').waitFor({ state: 'visible', timeout: 15000 });
    assert(await page.locator('[data-reader-offline-manager]').getAttribute('data-managed-installed') === 'false',
      'Removed Scripture package remained presented as locally installed.');
  }

  assert(errors.length === 0, `${width}px Reader acceptance produced errors: ${errors.join(' | ')}`);
  await page.close();
}

async function verifyReaderAudioStateRecovery() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => {
    window.__bqFakeAudioInstances = [];
    class FakeAudio extends EventTarget {
      constructor() {
        super();
        this.src = '';
        this.currentSrc = '';
        this.currentTime = 0;
        this.duration = 180;
        this.playbackRate = 1;
        this.paused = true;
        this.readyState = 4;
        this.networkState = 1;
        window.__bqFakeAudioInstances.push(this);
      }
      async play() {
        this.paused = false;
        this.currentSrc = this.src;
        this.dispatchEvent(new Event('play'));
        this.dispatchEvent(new Event('timeupdate'));
      }
      pause() {
        this.paused = true;
        this.dispatchEvent(new Event('pause'));
      }
      finish() {
        this.paused = true;
        this.currentTime = this.duration;
        this.dispatchEvent(new Event('ended'));
      }
      load() {
        this.currentSrc = this.src;
      }
      removeAttribute(name) {
        if (name === 'src') {
          this.src = '';
          this.currentSrc = '';
        }
      }
    }
    Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: FakeAudio });
  });

  await page.goto(`${BASE}/#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  const translation = page.getByLabel('Translation', { exact: true });
  await translation.selectOption('tl');
  assert(await page.locator('[data-reader-audio-player]').count() === 0,
    'Human BSB audio controls leaked into a non-BSB translation.');
  await translation.selectOption('bsb');
  await page.getByLabel('Book', { exact: true }).selectOption('GEN');
  await page.getByLabel('Chapter', { exact: true }).selectOption('1');
  const playButton = page.locator('[data-reader-audio-toggle]');
  await playButton.waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-package]')?.textContent?.includes('Offline download is not approved'));
  assert(await page.locator('[data-reader-audio-download]').count() === 0,
    'Unapproved OpenBible audio exposed an offline download action.');
  assert((await page.locator('[data-reader-audio-package]').textContent())?.includes('Streaming requires an internet connection.'),
    'Reader did not preserve streaming-only guidance while offline-copy permission remains unapproved.');
  await playButton.click();
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-status]')?.textContent?.startsWith('Playing GEN 1'));

  const firstPlayback = await page.evaluate(() => {
    const audio = window.__bqFakeAudioInstances?.find(candidate => candidate.src === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3');
    return audio ? { src: audio.src, currentTime: audio.currentTime, paused: audio.paused } : null;
  });
  assert(firstPlayback?.src === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3' && firstPlayback.paused === false,
    `Built Reader did not bind BSB Genesis 1 to the approved Hays stream: ${JSON.stringify(firstPlayback)}.`);

  const position = page.getByLabel('Audio position', { exact: true });
  await position.waitFor();
  await position.evaluate((range, value) => {
    range.value = String(value);
    range.dispatchEvent(new Event('change', { bubbles: true }));
  }, 37);
  await page.waitForFunction(() => {
    const audio = window.__bqFakeAudioInstances?.find(candidate => candidate.src === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3');
    return audio && Math.abs(audio.currentTime - 37) < 0.01;
  });

  await translation.selectOption('tl');
  assert(await page.locator('[data-reader-audio-player]').count() === 0,
    'Reader retained human BSB audio controls after changing to Tagalog.');
  await translation.selectOption('bsb');
  await page.getByLabel('Book', { exact: true }).selectOption('GEN');
  await page.getByLabel('Chapter', { exact: true }).selectOption('1');
  await page.locator('[data-reader-audio-toggle]').waitFor({ state: 'visible' });

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.getByLabel('Translation', { exact: true }).selectOption('bsb');
  await page.getByLabel('Book', { exact: true }).selectOption('GEN');
  await page.getByLabel('Chapter', { exact: true }).selectOption('1');
  const restoredPlayButton = page.locator('[data-reader-audio-toggle]');
  await restoredPlayButton.waitFor({ state: 'visible' });
  await restoredPlayButton.click();
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-status]')?.textContent?.startsWith('Playing GEN 1'));
  const restored = await page.evaluate(() => {
    const audio = [...(window.__bqFakeAudioInstances || [])].reverse()
      .find(candidate => candidate.src === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3');
    return audio ? { src: audio.src, currentTime: audio.currentTime, paused: audio.paused } : null;
  });
  assert(restored?.src === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3'
    && Math.abs(restored.currentTime - 37) < 0.01 && restored.paused === false,
  `Reader did not recover the saved BSB playback position after reload: ${JSON.stringify(restored)}.`);
  assert(Math.abs(Number(await page.getByLabel('Audio position', { exact: true }).inputValue()) - 37) < 0.01,
    'Recovered BSB playback position is not reflected by the visible Reader control.');

  await page.locator('[data-reader-audio-auto-next]').check();
  await page.evaluate(() => {
    const audio = [...(window.__bqFakeAudioInstances || [])].reverse()
      .find(candidate => candidate.src === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3' && !candidate.paused);
    if (!audio) throw new Error('Active Genesis 1 audio owner was not found for auto-next.');
    audio.finish();
  });
  await page.waitForFunction(() => document.querySelector('[data-reader-chapter]')?.value === '2'
    && document.querySelector('[data-reader-audio-status]')?.textContent?.startsWith('Playing GEN 2'), null, { timeout: 10000 });
  const autoNextPlayback = await page.evaluate(() => {
    const audio = [...(window.__bqFakeAudioInstances || [])].reverse()
      .find(candidate => candidate.src === 'https://openbible.com/audio/hays/BSB_01_Gen_002_H.mp3');
    return audio ? { src: audio.src, paused: audio.paused } : null;
  });
  assert(autoNextPlayback?.src === 'https://openbible.com/audio/hays/BSB_01_Gen_002_H.mp3' && autoNextPlayback.paused === false,
    `Reader audio did not continue with the displayed Genesis 2 passage: ${JSON.stringify(autoNextPlayback)}.`);
  assert(await page.locator('[data-reader-audio-auto-next]').isChecked(),
    'Reader lost the enabled auto-next setting while following audio to the next chapter.');

  await page.close();
}


async function verifyBuiltReaderVerifiedAlignmentSync() {
  const alignmentManifest = await buildBuiltReaderAlignmentFixture();
  assert(alignmentManifest.complete === true && alignmentManifest.chapterCount === 1189,
    'Built Reader verified-alignment fixture is not a complete BSB corpus.');
  const gen1 = alignmentManifest.chapters.find(row => row.book === 'GEN' && row.chapter === 1);
  assert(gen1?.verses?.length >= 3, 'Built Reader alignment fixture lacks Genesis 1 verse timing.');
  const verse2Time = gen1.verses.find(row => row.verse === 2)?.startSeconds;
  const verse3Time = gen1.verses.find(row => row.verse === 3)?.startSeconds;
  assert(Number.isFinite(verse2Time) && Number.isFinite(verse3Time),
    'Built Reader alignment fixture lacks Genesis 1:2-3 timing.');

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/data/v6-audio/bsb-hays-alignment.json', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(alignmentManifest),
  }));
  await page.addInitScript(() => {
    window.__bqBuiltAudioScrolls = [];
    window.__bqBuiltReduceMotion = false;
    window.matchMedia = () => ({
      matches: window.__bqBuiltReduceMotion === true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
      dispatchEvent() { return true; },
    });
    Element.prototype.scrollIntoView = function scrollIntoView(options) {
      window.__bqBuiltAudioScrolls.push({ verse: this.getAttribute?.('data-verse') || null, options: options || null });
    };
    window.__bqFakeAudioInstances = [];
    class FakeAudio extends EventTarget {
      constructor() {
        super();
        this.src = '';
        this.currentSrc = '';
        this.currentTime = 0;
        this.duration = 180;
        this.playbackRate = 1;
        this.paused = true;
        this.readyState = 4;
        this.networkState = 1;
        window.__bqFakeAudioInstances.push(this);
      }
      async play() { this.paused = false; this.currentSrc = this.src; this.dispatchEvent(new Event('play')); this.dispatchEvent(new Event('timeupdate')); }
      pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
      load() { this.currentSrc = this.src; }
      removeAttribute(name) { if (name === 'src') { this.src = ''; this.currentSrc = ''; } }
    }
    Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: FakeAudio });
  });

  try {
    await page.goto(`${BASE}/#/reader`, { waitUntil: 'networkidle' });
    await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
    await page.getByLabel('Translation', { exact: true }).selectOption('bsb');
    await page.getByLabel('Book', { exact: true }).selectOption('GEN');
    await page.getByLabel('Chapter', { exact: true }).selectOption('1');
    const follow = page.locator('[data-reader-audio-follow]');
    await follow.waitFor({ state: 'visible' });
    assert(await follow.isChecked() && !await follow.isDisabled(),
      'Built Reader did not enable spoken-verse follow for complete verified alignment.');

    await page.locator('[data-verse="2"]').click();
    await page.locator('[data-verse-dialog]').waitFor({ state: 'visible' });
    const playFromVerse = page.locator('[data-reader-audio-verse="2"]');
    await playFromVerse.waitFor({ state: 'visible' });
    await playFromVerse.click();
    await page.waitForFunction(() => document.querySelector('[data-verse="2"]')?.classList.contains('is-audio-current'));
    assert(await page.locator('[data-verse="2"]').getAttribute('aria-pressed') === 'true',
      'Built Reader did not expose the current spoken verse through aria-pressed.');
    assert(await page.locator('[data-verse="1"]').getAttribute('aria-pressed') === 'false',
      'Built Reader retained stale spoken-verse accessibility state.');
    const seeked = await page.evaluate(() => [...(window.__bqFakeAudioInstances || [])].reverse().find(audio => audio.src.includes('/hays/BSB_01_Gen_001_H.mp3'))?.currentTime ?? null);
    assert(Math.abs(Number(seeked) - Number(verse2Time)) < 0.001,
      `Built Reader Verse Peek did not seek to verified Genesis 1:2 timing: ${seeked} vs ${verse2Time}.`);
    await page.waitForFunction(() => window.__bqBuiltAudioScrolls.some(row => row.verse === '2'));
    const smoothScroll = await page.evaluate(() => window.__bqBuiltAudioScrolls.find(row => row.verse === '2'));
    assert(smoothScroll?.options?.block === 'nearest' && smoothScroll?.options?.behavior === 'smooth',
      'Built Reader spoken-verse follow did not use nearest smooth scrolling.');

    const verseOne = page.locator('[data-verse="1"]');
    await follow.uncheck();
    await verseOne.focus();
    await page.evaluate((target) => {
      window.__bqBuiltAudioScrolls.length = 0;
      const audio = [...(window.__bqFakeAudioInstances || [])].reverse().find(candidate => candidate.src.includes('/hays/BSB_01_Gen_001_H.mp3'));
      if (!audio) throw new Error('Built Reader active Hays audio instance is missing.');
      audio.currentTime = target;
      audio.dispatchEvent(new Event('timeupdate'));
    }, verse3Time);
    await page.waitForFunction(() => document.querySelector('[data-verse="3"]')?.classList.contains('is-audio-current'));
    assert((await page.evaluate(() => window.__bqBuiltAudioScrolls.length)) === 0,
      'Built Reader moved the viewport after the user disabled spoken-verse follow.');
    assert(await verseOne.evaluate(node => document.activeElement === node),
      'Built Reader audio updates stole keyboard focus while follow-scroll was disabled.');

    await follow.check();
    await page.evaluate(() => { window.__bqBuiltAudioScrolls.length = 0; window.__bqBuiltReduceMotion = true; });
    await page.evaluate(() => {
      const audio = [...(window.__bqFakeAudioInstances || [])].reverse().find(candidate => candidate.src.includes('/hays/BSB_01_Gen_001_H.mp3'));
      if (!audio) throw new Error('Built Reader active Hays audio instance is missing for reduced-motion proof.');
      audio.currentTime = 0;
      audio.dispatchEvent(new Event('timeupdate'));
    });
    await page.waitForFunction(() => window.__bqBuiltAudioScrolls.some(row => row.verse === '1'));
    const reduced = await page.evaluate(() => window.__bqBuiltAudioScrolls.find(row => row.verse === '1'));
    assert(reduced?.options?.behavior === 'auto',
      'Built Reader did not honor reduced-motion for spoken-verse follow scrolling.');
    assert(await page.locator('[data-verse="1"]').getAttribute('aria-pressed') === 'true',
      'Built Reader reduced-motion mode lost current-verse accessibility highlighting.');
    assert(errors.length === 0, 'Built Reader verified-alignment synchronization produced errors: ' + errors.join(' | '));
  } finally {
    await page.close();
  }
}

async function verifyOpenBiblePlayback() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  let expectedInjectedFailureUrl = '';
  let expectedInjectedFailureSeen = false;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', request => {
    if (!request.url().startsWith('https://openbible.com/audio/')) return;
    if (request.url() === expectedInjectedFailureUrl && !expectedInjectedFailureSeen) {
      expectedInjectedFailureSeen = true;
      return;
    }
    errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__bqAudioInstances = [];
    window.__bqAudioEvents = [];
    window.Audio = function (...args) {
      const audio = new NativeAudio(...args);
      for (const type of ['loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'seeked', 'error']) {
        audio.addEventListener(type, () => window.__bqAudioEvents.push({ type, currentSrc: audio.currentSrc,
          readyState: audio.readyState, networkState: audio.networkState, errorCode: audio.error?.code ?? null }));
      }
      window.__bqAudioInstances.push(audio);
      return audio;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  try {
  await page.goto(`${BASE}/#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();

  const translation = page.locator('[data-reader-translation]');
  await translation.selectOption('bsb');
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-reader-chapter]').selectOption('1');
  await page.locator('[data-reader-audio-toggle]').waitFor({ state: 'visible', timeout: 15000 });
  const narratorControl = page.getByLabel('Audio narrator', { exact: true });
  assert(await narratorControl.count() === 1, 'Reader does not expose the available BSB narrators.');
  deepStrictEqual(await narratorControl.locator('option').allTextContents(), ['Barry Hays', 'Bob Souer'],
    'Reader BSB narrator options do not match the approved source catalog.');
  const positionControl = page.getByLabel('Audio position', { exact: true });
  assert(await positionControl.count() === 1, 'Reader audio scrubber lacks an accessible label.');
  assert(await positionControl.evaluate((range) => range.getBoundingClientRect().height >= 44),
    'Reader audio scrubber is below the 44px practical touch target.');
  const selectedBook = await page.locator('[data-reader-book]').inputValue();
  const selectedChapter = await page.locator('[data-reader-chapter]').inputValue();
  assert(selectedBook === 'GEN' && selectedChapter === '1',
    `Audio playback probe expected BSB Genesis 1, got ${selectedBook} ${selectedChapter}.`);

  const chapterUrl = 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3';
  expectedInjectedFailureUrl = chapterUrl;
  let failFirstRequest = true;
  await page.route(chapterUrl, (route) => {
    if (failFirstRequest) {
      failFirstRequest = false;
      return route.abort('failed');
    }
    return route.continue();
  });
  const playButton = page.locator('[data-reader-audio-toggle]');
  await playButton.click();
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-toggle]')?.textContent?.trim() === 'Retry audio', null, { timeout: 15000 }).catch(async error => {
    const diagnostic = await page.evaluate(() => ({ status: document.querySelector('[data-reader-audio-status]')?.textContent,
      media: window.__bqAudioInstances?.map(audio => ({ src: audio.currentSrc, errorCode: audio.error?.code ?? null,
        readyState: audio.readyState, networkState: audio.networkState })), events: window.__bqAudioEvents }));
    throw new Error(`OpenBible failure injection did not reach retry state: ${JSON.stringify(diagnostic)}`, { cause: error });
  });
  assert((await playButton.textContent())?.trim() === 'Retry audio', 'Reader does not offer a retry action after an audio load failure.');
  assert(expectedInjectedFailureSeen, 'OpenBible retry probe did not observe the intentionally failed first chapter request.');
  await playButton.click();
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-status]')?.textContent?.startsWith('Playing GEN 1'), null, { timeout: 15000 }).catch(async error => {
    const diagnostic = await page.evaluate(() => ({ status: document.querySelector('[data-reader-audio-status]')?.textContent,
      media: window.__bqAudioInstances?.map(audio => ({ src: audio.currentSrc, errorCode: audio.error?.code ?? null,
        readyState: audio.readyState, networkState: audio.networkState })), events: window.__bqAudioEvents }));
    throw new Error(`OpenBible retry did not start playback: ${JSON.stringify({ ...diagnostic, errors })}`, { cause: error });
  });
  await page.waitForFunction(() => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.includes('/hays/BSB_01_Gen_001_H.mp3'));
    return audio && (audio.currentTime > 0 || audio.error);
  }, null, { timeout: 20000 }).catch(() => {});
  const media = await page.evaluate(() => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.includes('/hays/BSB_01_Gen_001_H.mp3'));
    return audio ? { currentSrc: audio.currentSrc, readyState: audio.readyState, duration: audio.duration,
      currentTime: audio.currentTime, errorCode: audio.error?.code ?? null, events: window.__bqAudioEvents } : null;
  });
  assert(media?.currentSrc === 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3',
    `Audio manifest did not resolve the expected OpenBible Genesis 1 URL: ${JSON.stringify(media)}.`);
  assert(media.readyState >= 2 && Number.isFinite(media.duration) && media.duration > 0 && media.currentTime > 0,
    `OpenBible Genesis 1 did not provide playable media data (media error code ${media.errorCode ?? 'none'}): ${JSON.stringify(media)}.`);
  const seekTo = Math.min(5, media.duration / 2);
  await page.locator('[data-reader-audio-position]').evaluate((range, value) => {
    range.value = String(value);
    range.dispatchEvent(new Event('change', { bubbles: true }));
  }, seekTo);
  await page.waitForFunction((target) => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.includes('/hays/BSB_01_Gen_001_H.mp3'));
    return audio && !audio.seeking && Math.abs(audio.currentTime - target) < 0.5;
  }, seekTo, { timeout: 10000 }).catch(() => {});
  const seek = await page.evaluate(() => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.includes('/hays/BSB_01_Gen_001_H.mp3'));
    return audio ? { currentTime: audio.currentTime, seeking: audio.seeking, events: window.__bqAudioEvents } : null;
  });
  assert(seek && !seek.seeking && Math.abs(seek.currentTime - seekTo) < 0.5,
    `OpenBible chapter seek failed near ${seekTo.toFixed(1)}s: ${JSON.stringify(seek)}.`);
  const status = await page.locator('[data-reader-audio-status]').textContent();
  assert(errors.length === 0, `Reader audio playback produced page errors: ${errors.join(' | ')}.`);
  await narratorControl.selectOption('souer');
  await page.waitForFunction(() => document.querySelector('[data-reader-audio-narrator]')?.value === 'souer'
    && document.querySelector('[data-reader-audio-status]')?.textContent === 'Ready to play'
    && window.__bqAudioInstances?.some((candidate) => candidate.currentSrc.endsWith('/souer/BSB_01_Gen_001.mp3')),
    null, { timeout: 10000 });
  await playButton.click();
  await page.waitForFunction(() => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.endsWith('/souer/BSB_01_Gen_001.mp3'));
    return audio && audio.currentTime > 0;
  }, null, { timeout: 15000 });
  const souerMedia = await page.evaluate(() => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.endsWith('/souer/BSB_01_Gen_001.mp3'));
    return audio ? { currentSrc: audio.currentSrc, currentTime: audio.currentTime } : null;
  });
  assert(souerMedia?.currentSrc === 'https://openbible.com/audio/souer/BSB_01_Gen_001.mp3',
    `Bob Souer fallback did not resolve to the expected OpenBible chapter: ${JSON.stringify(souerMedia)}.`);
  await page.locator('[data-reader-chapter]').selectOption('2');
  assert(await narratorControl.inputValue() === 'souer', 'Reader lost the selected narrator when navigating to another chapter.');
  await playButton.click();
  await page.waitForFunction(() => {
    const audio = window.__bqAudioInstances?.find((candidate) => candidate.currentSrc.endsWith('/souer/BSB_01_Gen_002.mp3'));
    return audio && audio.currentTime > 0;
  }, null, { timeout: 15000 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-reader-audio-toggle]').waitFor({ state: 'visible', timeout: 15000 });
  assert(await page.getByLabel('Audio narrator', { exact: true }).inputValue() === 'souer',
    'Reader did not restore the selected narrator after a page reload.');
  console.log(`OpenBible retry, playback, seek, narrator switching, chapter navigation and persisted selection passed: Hays ${media.duration.toFixed(1)} seconds; Souer ${souerMedia.currentTime.toFixed(1)} seconds; sought to ${seekTo.toFixed(1)}s; ${status?.trim()}.`);
  await page.evaluate(() => window.__bqAudioInstances?.forEach((audio) => audio.pause()));
  } finally {
    await page.evaluate(() => window.__bqAudioInstances?.forEach((audio) => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    })).catch(() => {});
    await page.close();
  }
}

async function verifyReaderSpeechControls() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => {
    window.__bqSpeechUtterances = [];
    window.__bqSpeechCalls = [];
    class FakeSpeechUtterance {
      constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.onstart = null; this.onend = null; this.onerror = null; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeSpeechUtterance });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speak(utterance) { window.__bqSpeechUtterances.push(utterance); window.__bqSpeechCalls.push('speak'); queueMicrotask(() => utterance.onstart?.()); },
      pause() { window.__bqSpeechCalls.push('pause'); },
      resume() { window.__bqSpeechCalls.push('resume'); },
      cancel() { window.__bqSpeechCalls.push('cancel'); },
    } });
  });
  await page.goto(`${BASE}/#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.getByLabel('Translation', { exact: true }).selectOption('tl');
  const toggle = page.locator('[data-reader-speech-toggle]');
  await toggle.waitFor({ state: 'visible' });
  assert(await page.locator('[data-reader-audio-player]').count() === 0,
    'Browser speech was incorrectly combined with the BSB human-audio player.');
  await page.getByLabel('Speech reading speed', { exact: true }).selectOption('1.5');
  await toggle.click();
  await page.waitForFunction(() => document.querySelector('[data-reader-speech-status]')?.textContent === 'Reading verse 1');
  const first = await page.evaluate(() => ({ text: window.__bqSpeechUtterances[0]?.text, lang: window.__bqSpeechUtterances[0]?.lang,
    rate: window.__bqSpeechUtterances[0]?.rate, highlighted: document.querySelector('[data-verse="1"]')?.classList.contains('is-speech-current') }));
  assert(first?.text === (await page.locator('[data-verse="1"] [data-reader-verse-text]').textContent())?.trim()
    && first.lang === 'fil-PH' && first.rate === 1.5 && first.highlighted,
  `Reader speech did not preserve/tag/highlight Tagalog verse 1: ${JSON.stringify(first)}.`);
  await toggle.click();
  assert((await page.locator('[data-reader-speech-status]').textContent())?.trim() === 'Paused', 'Browser speech pause control failed.');
  await toggle.click();
  assert((await page.evaluate(() => window.__bqSpeechCalls.slice(-1)[0])) === 'resume', 'Browser speech resume control did not call the provider.');
  await page.evaluate(() => window.__bqSpeechUtterances[0]?.onend?.());
  await page.waitForFunction(() => document.querySelector('[data-reader-speech-status]')?.textContent === 'Reading verse 2');
  await page.locator('[data-reader-speech-stop]').evaluate(button => button.scrollIntoView({ block: 'center' }));
  await page.locator('[data-reader-speech-stop]').click();
  assert((await page.locator('[data-reader-speech-status]').textContent())?.trim() === 'Ready', 'Browser speech stop control failed.');
  await page.getByLabel('Translation', { exact: true }).selectOption('bsb');
  await page.locator('[data-reader-audio-toggle]').waitFor({ state: 'visible' });
  assert(await page.locator('[data-reader-speech]').count() === 0,
    'Reader displayed synthetic speech controls alongside the BSB human narration.');
  await page.close();
}

try {
  if (!VERIFY_OPENBIBLE_AUDIO) {
    for (const width of WIDTHS) await verifyWidth(width);
    await verifyReaderAudioStateRecovery();
    await verifyBuiltReaderVerifiedAlignmentSync();
    await verifyReaderSpeechControls();
    console.log(`V6 Reader parity/accessibility/mobile acceptance passed at ${WIDTHS.join('/')} px.`);
  }
  if (VERIFY_OPENBIBLE_AUDIO) await verifyOpenBiblePlayback();
} finally {
  await browser.close();
}
