import assert from 'node:assert/strict';
import test from 'node:test';

import { createChapterAudioPlayer } from '../../src/v6/reader/audio-player.ts';
import type { ScriptureChapterAlignment } from '../../src/v6/reader/audio-alignment.ts';
import type { ScriptureAudioManifest } from '../../src/v6/reader/audio-policy.ts';

const manifest: ScriptureAudioManifest = {
  schemaVersion: 1,
  translationId: 'bsb',
  source: { translationId: 'bsb', source: 'fixture', license: 'test', rights: 'review-required',
    delivery: 'stream', textAlignment: 'unverified' },
  segments: [
    { id: 'GEN-1', book: 'GEN', chapter: 1, byteLength: 10, sha256: 'a'.repeat(64), url: 'https://audio.example/GEN-1.mp3' },
    { id: 'GEN-2', book: 'GEN', chapter: 2, byteLength: 10, sha256: 'b'.repeat(64), url: 'https://audio.example/GEN-2.mp3' },
  ],
};

function fixtureAudio() {
  const handlers = new Map<string, Set<EventListener>>();
  const audio = {
    src: '', currentTime: 0, duration: 120, playbackRate: 1, paused: true,
    async play() { this.paused = false; for (const fn of handlers.get('play') ?? []) fn(new Event('play')); },
    pause() { this.paused = true; for (const fn of handlers.get('pause') ?? []) fn(new Event('pause')); },
    load() { this.currentTime = 0; },
    addEventListener(type: string, listener: EventListener) { const row = handlers.get(type) ?? new Set(); row.add(listener); handlers.set(type, row); },
    removeEventListener(type: string, listener: EventListener) { handlers.get(type)?.delete(listener); },
    emit(type: string) { for (const fn of handlers.get(type) ?? []) fn(new Event(type)); },
    handlerCount() { return [...handlers.values()].reduce((sum, row) => sum + row.size, 0); },
  };
  return audio;
}

test('chapter audio maps exactly one book/chapter, seeks, changes speed and saves resume state', async () => {
  const audio = fixtureAudio();
  const saved: Array<[string, number]> = [];
  const player = createChapterAudioPlayer({ translationId: 'bsb', manifest, createAudio: () => audio,
    getResume: key => key === 'bsb:GEN:2' ? 12 : null,
    saveResume: (key, value) => saved.push([key, value]) });

  await player.load('GEN', 2);
  assert.equal(audio.src, 'https://audio.example/GEN-2.mp3');
  assert.equal(player.getState().currentTime, 12);
  await player.play();
  player.seek(45);
  player.setPlaybackRate(1.25);
  assert.equal(player.getState().status, 'playing');
  assert.equal(player.getState().currentTime, 45);
  assert.equal(player.getState().playbackRate, 1.25);
  assert.deepEqual(saved.at(-1), ['bsb:GEN:2', 45]);
});

test('saved chapter position survives player teardown and a new Reader audio owner', async () => {
  const resume = new Map<string, number>();
  const firstAudio = fixtureAudio();
  const firstPlayer = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => firstAudio,
    getResume: key => resume.get(key), saveResume: (key, value) => resume.set(key, value),
  });
  await firstPlayer.load('GEN', 2);
  firstPlayer.seek(33);
  firstPlayer.dispose();
  assert.equal(resume.get('bsb:GEN:2'), 33);

  const nextAudio = fixtureAudio();
  const nextPlayer = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => nextAudio,
    getResume: key => resume.get(key), saveResume: (key, value) => resume.set(key, value),
  });
  await nextPlayer.load('GEN', 2);
  assert.equal(nextAudio.currentTime, 33);
  assert.equal(nextPlayer.getState().currentTime, 33);
  nextPlayer.dispose();
});

test('failed chapter audio returns to a playable state when retried', async () => {
  const audio = fixtureAudio();
  const player = createChapterAudioPlayer({ translationId: 'bsb', manifest, createAudio: () => audio });
  await player.load('GEN', 1);
  audio.emit('error');
  assert.equal(player.getState().status, 'error');
  await player.load('GEN', 1);
  assert.equal(player.getState().status, 'ready');
  await player.play();
  assert.equal(player.getState().status, 'playing');
  player.dispose();
});

test('chapter audio awaits and validates an installed source resolver before loading', async () => {
  const audio = fixtureAudio();
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => audio,
    resolveAudioUrl: async segment => `blob:https://app.example/${segment.id}`,
  });
  await player.load('GEN', 1);
  assert.equal(audio.src, 'blob:https://app.example/GEN-1');
  player.dispose();
  const unsafe = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: fixtureAudio,
    resolveAudioUrl: () => 'javascript:alert(1)',
  });
  await assert.rejects(unsafe.load('GEN', 1), /safe HTTPS or temporary blob/i);
});

test('audio fails closed for translation mismatch, missing chapters, and unsafe source URLs', async () => {
  assert.throws(() => createChapterAudioPlayer({ translationId: 'tl', manifest, createAudio: fixtureAudio }), /does not match/i);
  const player = createChapterAudioPlayer({ translationId: 'bsb', manifest, createAudio: fixtureAudio });
  await assert.rejects(player.load('JHN', 3), /No unique audio segment/i);
  const unsafe = { ...manifest, segments: [{ ...manifest.segments[0], url: 'http://audio.example/file.mp3' }] };
  const unsafePlayer = createChapterAudioPlayer({ translationId: 'bsb', manifest: unsafe, createAudio: fixtureAudio });
  await assert.rejects(unsafePlayer.load('GEN', 1), /safe HTTPS/i);
});

test('chapter audio enforces speed bounds and removes listeners/source on teardown', async () => {
  const audio = fixtureAudio();
  const player = createChapterAudioPlayer({ translationId: 'bsb', manifest, createAudio: () => audio });
  await player.load('GEN', 1);
  assert.throws(() => player.setPlaybackRate(3), /between 0.75× and 2×/);
  assert.ok(audio.handlerCount() > 0);
  player.dispose();
  assert.equal(audio.src, '');
  assert.equal(audio.handlerCount(), 0);
});

test('audio auto-next advances only through the caller-approved chapter resolver', async () => {
  const audio = fixtureAudio();
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => audio,
    resolveNextChapter: (book, chapter) => book === 'GEN' && chapter === 1 ? { bookCode: 'GEN', chapter: 2 } : null,
  });
  await player.load('GEN', 1);
  player.setAutoNext(true);
  audio.emit('ended');
  for (let attempt = 0; attempt < 10 && (player.getState().chapter !== 2 || player.getState().status !== 'playing'); attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  assert.equal(player.getState().chapter, 2);
  assert.equal(player.getState().status, 'playing');
  player.dispose();
});

test('manual chapter selection supersedes a pending auto-next load without an error or unintended playback', async () => {
  const audio = fixtureAudio();
  let releaseAutoNext!: (url: string) => void;
  const deferred = new Promise<string>(resolve => { releaseAutoNext = resolve; });
  let delayNext = false;
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => audio,
    resolveNextChapter: (book, chapter) => book === 'GEN' && chapter === 1 ? { bookCode: 'GEN', chapter: 2 } : null,
    resolveAudioUrl: segment => delayNext && segment.chapter === 2 ? deferred : segment.url,
  });
  await player.load('GEN', 1);
  player.setAutoNext(true);
  delayNext = true;
  audio.emit('ended');
  await player.load('GEN', 1);
  releaseAutoNext('https://audio.example/GEN-2.mp3');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(player.getState().chapter, 1);
  assert.equal(player.getState().status, 'ready');
  assert.equal(player.getState().error, '');
  assert.equal(audio.src, 'https://audio.example/GEN-1.mp3');
  assert.equal(audio.paused, true);
  player.dispose();
});

test('pausing cancels a pending auto-next load before passage navigation', async () => {
  const audio = fixtureAudio();
  let releaseAutoNext!: (url: string) => void;
  const deferred = new Promise<string>(resolve => { releaseAutoNext = resolve; });
  let delayNext = false;
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => audio,
    resolveNextChapter: (book, chapter) => book === 'GEN' && chapter === 1 ? { bookCode: 'GEN', chapter: 2 } : null,
    resolveAudioUrl: segment => delayNext && segment.chapter === 2 ? deferred : segment.url,
  });
  await player.load('GEN', 1);
  player.setAutoNext(true);
  delayNext = true;
  audio.emit('ended');
  player.pause();
  releaseAutoNext('https://audio.example/GEN-2.mp3');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(player.getState().chapter, 1);
  assert.equal(player.getState().status, 'ended');
  assert.equal(audio.src, 'https://audio.example/GEN-1.mp3');
  assert.equal(audio.paused, true);
  player.dispose();
});

test('audio sleep timer pauses playback, can be replaced, and is cleared on dispose', async () => {
  const audio = fixtureAudio();
  const timers = new Map<number, { callback: () => void; milliseconds: number }>();
  let nextTimer = 0;
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => audio,
    setTimeout: (callback, milliseconds) => {
      const id = ++nextTimer;
      timers.set(id, { callback: () => { timers.delete(id); callback(); }, milliseconds });
      return id;
    },
    clearTimeout: handle => { timers.delete(Number(handle)); },
  });
  await player.load('GEN', 1);
  await player.play();
  player.setSleepTimer(30);
  player.setSleepTimer(15);
  assert.equal(timers.size, 1);
  const timer = [...timers.values()][0];
  assert.equal(timer.milliseconds, 900_000);
  timer.callback();
  assert.equal(player.getState().status, 'paused');
  assert.equal(player.getState().sleepTimerMinutes, null);
  player.setSleepTimer(5);
  assert.equal(timers.size, 1);
  player.dispose();
  assert.equal(timers.size, 0);
});

test('Media Session seek and next actions degrade safely and are removed on teardown', async () => {
  const audio = fixtureAudio();
  const handlers = new Map<string, ((details?: { seekTime?: number; seekOffset?: number }) => void) | null>();
  const session = {
    metadata: null,
    setActionHandler(action: string, handler: ((details?: { seekTime?: number; seekOffset?: number }) => void) | null) {
      if (action === 'seekforward') throw new Error('Unsupported action');
      handlers.set(action, handler);
    },
    setPositionState() {},
  } as unknown as MediaSession;
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, createAudio: () => audio, mediaSession: session,
    resolveNextChapter: () => ({ bookCode: 'GEN', chapter: 2 }),
  });
  await player.load('GEN', 1);
  player.seek(20);
  handlers.get('seekbackward')?.({ seekOffset: 5 });
  assert.equal(player.getState().currentTime, 15);
  handlers.get('nexttrack')?.();
  for (let attempt = 0; attempt < 10 && (player.getState().chapter !== 2 || player.getState().status !== 'playing'); attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  assert.equal(player.getState().chapter, 2);
  player.dispose();
  assert.equal(handlers.get('play'), null);
  assert.equal(handlers.get('seekbackward'), null);
  assert.equal(handlers.get('nexttrack'), null);
});

test('chapter audio synchronizes verse identity and seeks only from validated timing', async () => {
  const audio = fixtureAudio();
  const verses: Array<number | null> = [];
  const alignment: ScriptureChapterAlignment = {
    schemaVersion: 1, translationId: 'bsb', contentVersion: 'fixture-1', scriptureContentVersion: 'bsb-fixture-1', book: 'GEN', chapter: 1, durationSeconds: 120,
    source: 'licensed fixture', license: 'fixture permission', alignmentSource: 'fixture word timings',
    verses: [
      { verse: 1, startSeconds: 0, endSeconds: 20 },
      { verse: 2, startSeconds: 20, endSeconds: 60 },
      { verse: 3, startSeconds: 60, endSeconds: 120 },
    ],
  };
  const player = createChapterAudioPlayer({
    translationId: 'bsb', manifest, alignments: [alignment], createAudio: () => audio,
    onVerse: verse => verses.push(verse),
  });
  await player.load('GEN', 1);
  assert.equal(player.getState().currentVerse, 1);
  player.seekVerse(2);
  assert.equal(audio.currentTime, 20);
  assert.equal(player.getState().currentVerse, 2);
  audio.currentTime = 85;
  audio.emit('timeupdate');
  assert.equal(player.getState().currentVerse, 3);
  assert.deepEqual(verses, [1, 2, 3]);
  assert.throws(() => player.seekVerse(4), /not present/);
  player.dispose();
  assert.equal(verses.at(-1), null);
});

test('chapter player rejects malformed supplied alignment and requires timing for verse seeking', async () => {
  const alignment: ScriptureChapterAlignment = {
    schemaVersion: 1, translationId: 'bsb', contentVersion: 'fixture-1', scriptureContentVersion: 'bsb-fixture-1', book: 'GEN', chapter: 1, durationSeconds: 120,
    source: 'source', license: 'license', alignmentSource: 'alignment',
    verses: [{ verse: 2, startSeconds: 0, endSeconds: 10 }],
  };
  const withBadTiming = createChapterAudioPlayer({
    translationId: 'bsb', manifest, alignments: [alignment], createAudio: fixtureAudio,
  });
  await assert.rejects(withBadTiming.load('GEN', 1), /verse alignment is invalid/i);
  const withoutTiming = createChapterAudioPlayer({ translationId: 'bsb', manifest, createAudio: fixtureAudio });
  await withoutTiming.load('GEN', 1);
  assert.throws(() => withoutTiming.seekVerse(1), /requires verified chapter timing/);
});
