import assert from 'node:assert/strict';
import test from 'node:test';

import { createReaderAudioProvider, createReaderAudioSourceRouter } from '../../src/v6/reader/audio-provider.ts';
import type { ScriptureAudioManifest } from '../../src/v6/reader/audio-policy.ts';
import type { ScriptureChapterAlignment } from '../../src/v6/reader/audio-alignment.ts';

const manifest: ScriptureAudioManifest = {
  schemaVersion: 1, translationId: 'bsb', contentVersion: 'bsb-audio-1', alignmentSource: 'timing export 1',
  source: {
    translationId: 'bsb', source: 'approved recording', sourceUrl: 'https://source.example/license',
    license: 'CC0 with evidence', rights: 'verified', delivery: 'downloadable', textAlignment: 'exact',
    attribution: 'Narrator attribution', rightsEvidence: 'https://source.example/license',
    permissions: { stream: 'allowed', offlineCopy: 'allowed' },
    reviewedBy: 'V6 content reviewer', reviewedAt: '2026-09-28T00:00:00Z',
    scriptureContentVersion: 'bsb-fixture-1',
  },
  segments: [{
    id: 'JHN-1', book: 'JHN', chapter: 1, byteLength: 4, sha256: 'a'.repeat(64),
    url: 'https://audio.example/bsb-audio-1/JHN-1.mp3',
  }],
};

const alignment: ScriptureChapterAlignment = {
  schemaVersion: 1, translationId: 'bsb', contentVersion: 'bsb-audio-1', scriptureContentVersion: 'bsb-fixture-1', book: 'JHN', chapter: 1,
  durationSeconds: 20, source: 'approved recording', license: 'CC0 with evidence', alignmentSource: 'timing export 1',
  verses: [{ verse: 1, startSeconds: 0, endSeconds: 10 }, { verse: 2, startSeconds: 10, endSeconds: 20 }],
};

function fixtureAudio() {
  const handlers = new Map<string, Set<EventListener>>();
  return {
    src: '', currentTime: 0, duration: 20, playbackRate: 1, paused: true,
    async play() { this.paused = false; for (const callback of handlers.get('play') ?? []) callback(new Event('play')); },
    pause() { this.paused = true; for (const callback of handlers.get('pause') ?? []) callback(new Event('pause')); },
    load() {},
    addEventListener(type: string, callback: EventListener) { const rows = handlers.get(type) ?? new Set(); rows.add(callback); handlers.set(type, rows); },
    removeEventListener(type: string, callback: EventListener) { handlers.get(type)?.delete(callback); },
  } as unknown as HTMLAudioElement;
}

function storeFixture() {
  const values = new Map<string, unknown>();
  return {
    read<T>(key: string, fallback: T): T { return (values.get(key) as T | undefined) ?? fallback; },
    write<T>(key: string, value: T) { values.set(key, value); },
  };
}

test('Reader audio provider remains unavailable without reviewed assets and never constructs audio', () => {
  let constructed = 0;
  const provider = createReaderAudioProvider({ store: storeFixture(), createAudio: () => { constructed += 1; return fixtureAudio(); } });
  assert.equal(provider.isAvailable(), false);
  assert.equal(provider.getState().playback, null);
  assert.match(provider.getState().reason, /no approved manifest/i);
  assert.equal(constructed, 0);
  assert.throws(() => provider.load('bsb', 'JHN', 1), /unavailable/i);
});

test('Reader audio provider enables only complete matching revisions and persists playback controls', async () => {
  const store = storeFixture();
  let audio: HTMLAudioElement | null = null;
  const provider = createReaderAudioProvider({
    manifest, alignments: [alignment], scriptureContentVersion: 'bsb-fixture-1', store,
    createAudio: () => { audio = fixtureAudio(); return audio; },
  });
  assert.equal(provider.isAvailable(), true);
  let publications = 0;
  const unsubscribe = provider.subscribe(() => { publications += 1; });
  await provider.load('bsb', 'JHN', 1);
  provider.seek(5);
  assert.equal(audio?.currentTime, 5);
  provider.seekVerse(2);
  await provider.play();
  assert.equal(audio?.currentTime, 10);
  assert.equal(provider.getState().playback?.currentVerse, 2);
  provider.setPlaybackRate(1.25);
  provider.setAutoNext(true);
  provider.setSleepTimer(15);
  assert.equal(provider.getState().playback?.playbackRate, 1.25);
  assert.equal(provider.getState().playback?.autoNext, true);
  assert.ok(publications >= 3);
  unsubscribe();
  provider.dispose();
});

test('Reader can stream the approved OpenBible source while offline copying remains blocked', async () => {
  const streamOnlyManifest: ScriptureAudioManifest = {
    ...manifest,
    source: {
      ...manifest.source,
      source: 'Barry Hays BSB narration (OpenBible direct stream)',
      sourceUrl: 'https://openbible.com/audio/hays/',
      rights: 'review-required',
      permissions: { stream: 'allowed', offlineCopy: 'review-required' },
    },
    segments: [{ id: 'JHN-1', book: 'JHN', chapter: 1, url: 'https://openbible.com/audio/hays/BSB_43_Jhn_001_H.mp3' }],
  };
  const streamAlignment = { ...alignment, source: streamOnlyManifest.source.source };
  const audio = fixtureAudio();
  const provider = createReaderAudioProvider({
    manifest: streamOnlyManifest, scriptureContentVersion: 'bsb-fixture-1',
    store: storeFixture(), createAudio: () => audio,
  });
  assert.equal(provider.isAvailable(), true);
  assert.equal(provider.canDownloadOffline(), false);
  assert.equal(provider.hasVerseAlignment('JHN', 1), false);
  await provider.load('bsb', 'JHN', 1);
  assert.equal(audio.src, 'https://openbible.com/audio/hays/BSB_43_Jhn_001_H.mp3');
  assert.throws(() => provider.installChapter('JHN', 1), /Offline audio downloads are unavailable/i);
  provider.dispose();
});

test('Reader can switch and persist an explicit BSB narrator choice', async () => {
  const preferenceValues = new Map<string, unknown>();
  const sourceStore = {
    read<T>(key: string, fallback: T): T { return (preferenceValues.get(key) as T | undefined) ?? fallback; },
    write<T>(key: string, value: T) { preferenceValues.set(key, value); },
  };
  const haysAudio = fixtureAudio(), souerAudio = fixtureAudio();
  const haysManifest: ScriptureAudioManifest = {
    ...manifest, contentVersion: 'hays-v1',
    source: { ...manifest.source, source: 'Barry Hays BSB narration' },
    segments: [{ id: 'JHN-1', book: 'JHN', chapter: 1, url: 'https://openbible.com/audio/hays/BSB_43_Jhn_001_H.mp3' }],
  };
  const souerManifest: ScriptureAudioManifest = {
    ...manifest, contentVersion: 'souer-v1',
    source: { ...manifest.source, source: 'Bob Souer BSB narration' },
    segments: [{ id: 'JHN-1', book: 'JHN', chapter: 1, url: 'https://openbible.com/audio/souer/BSB_43_Jhn_001.mp3' }],
  };
  const router = createReaderAudioSourceRouter({
    defaultSourceId: 'hays', store: sourceStore,
    sources: [
      { id: 'hays', label: 'Barry Hays', provider: createReaderAudioProvider({ manifest: haysManifest, scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(), createAudio: () => haysAudio }) },
      { id: 'souer', label: 'Bob Souer', provider: createReaderAudioProvider({ manifest: souerManifest, scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(), createAudio: () => souerAudio }) },
    ],
  });
  assert.deepEqual(router.getNarrators(), [{ id: 'hays', label: 'Barry Hays' }, { id: 'souer', label: 'Bob Souer' }]);
  await router.load('bsb', 'JHN', 1);
  await router.play();
  assert.equal(haysAudio.paused, false);
  assert.equal(await router.selectNarrator('souer'), true);
  assert.equal(haysAudio.paused, true);
  assert.equal(router.getNarrator(), 'souer');
  await router.load('bsb', 'JHN', 1);
  assert.equal(souerAudio.src, 'https://openbible.com/audio/souer/BSB_43_Jhn_001.mp3');
  assert.equal(await router.selectNarrator('unknown'), false);
  router.dispose();

  const restored = createReaderAudioSourceRouter({
    defaultSourceId: 'hays', store: sourceStore,
    sources: [
      { id: 'hays', label: 'Barry Hays', provider: createReaderAudioProvider({ manifest: haysManifest, scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(), createAudio: fixtureAudio }) },
      { id: 'souer', label: 'Bob Souer', provider: createReaderAudioProvider({ manifest: souerManifest, scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(), createAudio: fixtureAudio }) },
    ],
  });
  assert.equal(restored.getNarrator(), 'souer');
  restored.dispose();
});

test('Reader audio prefers an exact verified installed package offline and revokes its object URL', async () => {
  const bytes = new TextEncoder().encode('test').buffer;
  const record = {
    translationId: 'bsb', audioContentVersion: 'bsb-audio-1', scriptureContentVersion: 'bsb-fixture-1',
    segmentId: 'JHN-1', book: 'JHN', chapter: 1,
    sha256: 'a'.repeat(64),
    bytes: bytes.byteLength, installedAt: '2026-09-28T00:00:00Z',
  };
  const revoked: string[] = [];
  let audio: HTMLAudioElement | null = null;
  const repository = {
    async readInstalled() { return record; },
    async readPayload() { return bytes.slice(0); },
    async listInstalled() { return [record]; },
    async replaceInstalled() {}, async removeInstalled() {}, async usage() { return { bytes: 4, packages: 1 }; },
  };
  const provider = createReaderAudioProvider({
    manifest, alignments: [alignment], scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(),
    createAudio: () => { audio = fixtureAudio(); return audio; }, offlinePackages: repository,
    createObjectURL: () => 'blob:https://app.example/installed-chapter',
    revokeObjectURL: url => revoked.push(url), isOffline: () => true,
  });
  await provider.load('bsb', 'JHN', 1);
  assert.equal(audio?.src, 'blob:https://app.example/installed-chapter');
  assert.equal(provider.getState().playback?.status, 'ready');
  provider.dispose();
  assert.deepEqual(revoked, ['blob:https://app.example/installed-chapter']);
});

test('Reader audio revokes the prior package URL when switching to a non-installed online chapter', async () => {
  const bytes = new TextEncoder().encode('test').buffer;
  const record = {
    translationId: 'bsb', audioContentVersion: 'bsb-audio-1', scriptureContentVersion: 'bsb-fixture-1',
    segmentId: 'JHN-1', book: 'JHN', chapter: 1, sha256: 'a'.repeat(64), bytes: 4, installedAt: '2026-09-28T00:00:00Z',
  };
  const revoked: string[] = [];
  const repository = {
    async readInstalled(_translation: string, segment: string) { return segment === 'JHN-1' ? record : null; },
    async readPayload() { return bytes.slice(0); },
    async listInstalled() { return [record]; },
    async replaceInstalled() {}, async removeInstalled() {}, async usage() { return { bytes: 4, packages: 1 }; },
  };
  const manifestWithTwo = { ...manifest, segments: [...manifest.segments, {
    id: 'JHN-2', book: 'JHN', chapter: 2, byteLength: 4, sha256: 'b'.repeat(64), url: 'https://audio.example/bsb-audio-1/JHN-2.mp3',
  }] };
  const alignmentTwo = { ...alignment, chapter: 2, verses: alignment.verses.map(row => ({ ...row })) };
  const audio = fixtureAudio();
  const provider = createReaderAudioProvider({
    manifest: manifestWithTwo, alignments: [alignment, alignmentTwo], scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(),
    createAudio: () => audio, offlinePackages: repository,
    createObjectURL: () => 'blob:https://app.example/installed-one', revokeObjectURL: url => revoked.push(url), isOffline: () => false,
  });
  await provider.load('bsb', 'JHN', 1);
  assert.equal(audio.src, 'blob:https://app.example/installed-one');
  await provider.load('bsb', 'JHN', 2);
  assert.equal(audio.src, 'https://audio.example/bsb-audio-1/JHN-2.mp3');
  assert.deepEqual(revoked, ['blob:https://app.example/installed-one']);
  provider.dispose();
});

test('Reader audio exposes selective installs only for approved chapter and matching timing', async () => {
  const calls: string[] = [];
  const installed = {
    translationId: 'bsb', audioContentVersion: 'bsb-audio-1', scriptureContentVersion: 'bsb-fixture-1',
    segmentId: 'JHN-1', book: 'JHN', chapter: 1, sha256: 'a'.repeat(64), bytes: 4, installedAt: '2026-09-28T00:00:00Z',
  };
  const packageManager = {
    async readInstalled() { return installed; },
    async listInstalled() { return [installed]; },
    async install(_manifest: unknown, segment: { id: string }, options: { onProgress?: (progress: unknown) => void }) {
      calls.push(`install:${segment.id}`); void options; return { status: 'installed', package: installed };
    },
    cancel(translation: string, segment: string) { calls.push(`cancel:${translation}:${segment}`); return true; },
    async remove(translation: string, segment: string) { calls.push(`remove:${translation}:${segment}`); },
  };
  const provider = createReaderAudioProvider({
    manifest, alignments: [alignment], scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(),
    createAudio: fixtureAudio, packageManager: packageManager as never,
  });
  assert.equal((await provider.getInstalledPackage('JHN', 1))?.segmentId, 'JHN-1');
  assert.equal(await provider.getInstalledPackage('JHN', 2), null);
  await provider.installChapter('JHN', 1);
  assert.equal(provider.cancelChapter('JHN', 1), true);
  await provider.removeChapter('JHN', 1);
  assert.deepEqual(calls, ['install:JHN-1', 'cancel:bsb:JHN-1', 'remove:bsb:JHN-1']);
  provider.dispose();
});

test('Reader audio provider refuses unaligned coverage and wrong translation requests', () => {
  const wrongRevision = { ...alignment, contentVersion: 'other-audio-version' };
  const provider = createReaderAudioProvider({ manifest, alignments: [wrongRevision], scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(), createAudio: fixtureAudio });
  assert.equal(provider.isAvailable(), false);
  assert.match(provider.getState().reason, /revision mismatch/i);
  const wrongTextProvider = createReaderAudioProvider({
    manifest, alignments: [alignment], scriptureContentVersion: 'stale-current-bsb-version',
    store: storeFixture(), createAudio: fixtureAudio,
  });
  assert.equal(wrongTextProvider.isAvailable(), false);
  assert.match(wrongTextProvider.getState().reason, /different Scripture content revision/i);
  const ready = createReaderAudioProvider({ manifest, alignments: [alignment], scriptureContentVersion: 'bsb-fixture-1', store: storeFixture(), createAudio: fixtureAudio });
  assert.throws(() => ready.load('tl', 'JHN', 1), /exact Scripture translation/i);
});


test('offline audio fetch failure leaves the verified direct stream usable', async () => {
  const audio = fixtureAudio();
  const packageManager = {
    async readInstalled() { return null; },
    async listInstalled() { return []; },
    async install() { throw new TypeError('Failed to fetch'); },
    cancel() { return false; },
    async remove() {},
  };
  const provider = createReaderAudioProvider({
    manifest,
    alignments: [alignment],
    scriptureContentVersion: 'bsb-fixture-1',
    store: storeFixture(),
    createAudio: () => audio,
    packageManager: packageManager as never,
  });

  assert.equal(provider.isAvailable(), true);
  assert.equal(provider.canDownloadOffline(), true);
  await assert.rejects(provider.installChapter('JHN', 1), /Failed to fetch/);
  assert.equal(provider.isAvailable(), true, 'offline transport failure must not disable direct streaming');
  await provider.load('bsb', 'JHN', 1);
  await provider.play();
  assert.equal(audio.src, 'https://audio.example/bsb-audio-1/JHN-1.mp3');
  assert.equal(audio.paused, false);
  provider.dispose();
});
