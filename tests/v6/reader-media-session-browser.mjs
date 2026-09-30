import { chromium } from 'playwright';

const BASE = process.env.BQ_V6_DEV_URL || 'http://127.0.0.1:4174';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error?.message || error)));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const { createChapterAudioPlayer } = await import('/src/v6/reader/audio-player.ts');

    class BrowserAudio extends EventTarget {
      src = '';
      currentTime = 0;
      duration = 120;
      playbackRate = 1;
      paused = true;
      async play() {
        this.paused = false;
        this.dispatchEvent(new Event('play'));
      }
      pause() {
        this.paused = true;
        this.dispatchEvent(new Event('pause'));
      }
      load() {
        this.currentTime = 0;
      }
    }

    const manifest = {
      schemaVersion: 1,
      translationId: 'bsb',
      source: {
        translationId: 'bsb',
        source: 'browser fixture',
        license: 'test fixture',
        rights: 'review-required',
        delivery: 'stream',
        textAlignment: 'unverified',
      },
      segments: [{
        id: 'GEN-1',
        book: 'GEN',
        chapter: 1,
        url: 'https://audio.example.test/GEN-1.mp3',
      }],
    };

    const nativeSession = navigator.mediaSession;
    const hasNativeSession = Boolean(nativeSession);
    const hasMetadata = typeof globalThis.MediaMetadata === 'function';
    const actionAttempts = [];
    const actionAccepted = [];
    const positionStates = [];

    let browserSession = null;
    if (nativeSession) {
      browserSession = {
        get metadata() { return nativeSession.metadata; },
        set metadata(value) { nativeSession.metadata = value; },
        setActionHandler(action, handler) {
          actionAttempts.push({ action, enabled: Boolean(handler) });
          nativeSession.setActionHandler(action, handler);
          actionAccepted.push({ action, enabled: Boolean(handler) });
        },
        setPositionState(state) {
          positionStates.push({ ...state });
          nativeSession.setPositionState(state);
        },
      };
    }

    const audio = new BrowserAudio();
    const player = createChapterAudioPlayer({
      translationId: 'bsb',
      manifest,
      createAudio: () => audio,
      mediaSession: browserSession,
      resolveNextChapter: () => null,
    });

    await player.load('GEN', 1);
    audio.currentTime = 18;
    audio.dispatchEvent(new Event('timeupdate'));
    await player.play();
    player.pause();

    const metadataDuring = nativeSession?.metadata
      ? { title: nativeSession.metadata.title, album: nativeSession.metadata.album }
      : null;
    const stateDuring = player.getState();

    player.dispose();
    const metadataAfterDispose = nativeSession?.metadata ?? null;

    const fallbackAudio = new BrowserAudio();
    const fallback = createChapterAudioPlayer({
      translationId: 'bsb',
      manifest,
      createAudio: () => fallbackAudio,
      mediaSession: null,
    });
    await fallback.load('GEN', 1);
    await fallback.play();
    fallback.pause();
    const fallbackState = fallback.getState();
    fallback.dispose();

    return {
      hasNativeSession,
      hasMetadata,
      actionAttempts,
      actionAccepted,
      positionStates,
      metadataDuring,
      metadataAfterDispose,
      stateDuring,
      fallbackState,
    };
  });

  assert(result.hasNativeSession, 'Chromium runner does not expose navigator.mediaSession; lock-screen browser support cannot be certified.');
  assert(result.hasMetadata, 'Chromium runner does not expose MediaMetadata; lock-screen metadata cannot be certified.');
  assert(result.metadataDuring?.title === 'GEN 1', 'Reader audio did not publish chapter title to Media Session.');
  assert(result.metadataDuring?.album === 'BibleQuest Audio Bible', 'Reader audio did not publish the Audio Bible album label.');
  assert(result.stateDuring.currentTime === 18, 'Reader audio position did not follow the browser audio element.');
  assert(result.positionStates.some(row => row.duration === 120 && row.position === 18),
    'Reader audio did not publish a valid Media Session position state.');

  for (const action of ['play', 'pause', 'seekto', 'seekbackward', 'nexttrack']) {
    assert(result.actionAttempts.some(row => row.action === action && row.enabled),
      'Reader audio did not attempt to register Media Session action ' + action + '.');
  }
  assert(result.actionAccepted.some(row => row.action === 'play' && row.enabled),
    'Chromium rejected the Media Session play handler.');
  assert(result.actionAccepted.some(row => row.action === 'pause' && row.enabled),
    'Chromium rejected the Media Session pause handler.');
  assert(result.actionAttempts.some(row => row.action === 'play' && !row.enabled),
    'Reader audio did not remove Media Session play handler on teardown.');
  assert(result.actionAttempts.some(row => row.action === 'nexttrack' && !row.enabled),
    'Reader audio did not remove Media Session next-track handler on teardown.');
  assert(result.metadataAfterDispose === null, 'Reader audio did not clear Media Session metadata on teardown.');

  assert(result.fallbackState.status === 'paused',
    'Reader audio without Media Session support did not preserve ordinary playback controls.');
  assert(errors.length === 0, 'Unexpected Reader Media Session page errors: ' + errors.join(' | '));

  console.log(JSON.stringify({
    pass: true,
    navigatorMediaSession: result.hasNativeSession,
    mediaMetadata: result.hasMetadata,
    acceptedActions: result.actionAccepted.filter(row => row.enabled).map(row => row.action),
    fallbackWithoutMediaSession: result.fallbackState.status,
  }));
  console.log('PASS V6 Reader Media Session browser acceptance.');
  await context.close();
} finally {
  await browser.close();
}
