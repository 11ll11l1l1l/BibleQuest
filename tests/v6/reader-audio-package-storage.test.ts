import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  AudioPackageDownloadUnavailableError,
  createBrowserScriptureAudioPackageRepository,
  createFetchScriptureAudioPackageTransport,
  SCRIPTURE_AUDIO_METADATA_CACHE,
  SCRIPTURE_AUDIO_PAYLOAD_CACHE,
} from '../../src/v6/reader/audio-package-storage.ts';
import type { InstalledScriptureAudioPackage } from '../../src/v6/reader/audio-packages.ts';

function cacheHarness() {
  const stores = new Map<string, Map<string, Response>>();
  let failMetadataPut = false;
  const cacheStorage = {
    async open(name: string) {
      const entries = stores.get(name) ?? new Map<string, Response>();
      stores.set(name, entries);
      return {
        async match(key: string | Request) { return entries.get(typeof key === 'string' ? key : key.url)?.clone(); },
        async put(key: string, response: Response) {
          if (name === SCRIPTURE_AUDIO_METADATA_CACHE && failMetadataPut) {
            failMetadataPut = false;
            throw new Error('metadata storage failed');
          }
          entries.set(key, response.clone());
        },
        async delete(key: string | Request) { return entries.delete(typeof key === 'string' ? key : key.url); },
        async keys() { return [...entries.keys()].map(key => new Request(key)); },
      };
    },
  } as unknown as CacheStorage;
  const repository = createBrowserScriptureAudioPackageRepository({
    cacheStorage,
    locationRef: { href: 'https://biblequest.example.test/' } as Location,
  });
  return { repository, stores, failMetadataPut: () => { failMetadataPut = true; } };
}

function record(version = 'audio-v1', bytes = new TextEncoder().encode('audio payload').buffer): InstalledScriptureAudioPackage {
  return {
    translationId: 'bsb', audioContentVersion: version, scriptureContentVersion: 'bsb-v1',
    segmentId: 'bsb:JHN:3', book: 'JHN', chapter: 3,
    sha256: createHash('sha256').update(new Uint8Array(bytes)).digest('hex'),
    bytes: bytes.byteLength, installedAt: '2026-09-28T00:00:00.000Z',
  };
}

test('browser audio storage persists exact bytes, verifies reads, lists installed chapters and totals usage', async () => {
  const h = cacheHarness();
  const bytes = new TextEncoder().encode('audio payload').buffer;
  await h.repository.replaceInstalled(record('audio-v1', bytes), bytes);

  assert.equal((await h.repository.readInstalled('bsb', 'bsb:JHN:3'))?.audioContentVersion, 'audio-v1');
  assert.deepEqual(new Uint8Array((await h.repository.readPayload('bsb', 'bsb:JHN:3'))!), new Uint8Array(bytes));
  assert.equal((await h.repository.listInstalled()).length, 1);
  assert.deepEqual(await h.repository.usage(), { bytes: bytes.byteLength, packages: 1 });
});

test('browser audio storage evicts corrupt payload and matching metadata on read', async () => {
  const h = cacheHarness();
  const bytes = new TextEncoder().encode('audio payload').buffer;
  await h.repository.replaceInstalled(record('audio-v1', bytes), bytes);
  const payloadCache = h.stores.get(SCRIPTURE_AUDIO_PAYLOAD_CACHE)!;
  const payloadKey = 'https://biblequest.example.test/__bq_v6_scripture_audio__/bsb/bsb%3AJHN%3A3.bin';
  payloadCache.set(payloadKey, new Response('tampered payload'));

  assert.equal(await h.repository.readInstalled('bsb', 'bsb:JHN:3'), null);
  assert.equal((await h.repository.listInstalled()).length, 0);
  assert.deepEqual(await h.repository.usage(), { bytes: 0, packages: 0 });
});

test('failed CacheStorage replacement restores the previous audio metadata and payload', async () => {
  const h = cacheHarness();
  const oldBytes = new TextEncoder().encode('old audio').buffer;
  const oldRecord = record('audio-v1', oldBytes);
  await h.repository.replaceInstalled(oldRecord, oldBytes);
  const nextBytes = new TextEncoder().encode('new audio').buffer;
  h.failMetadataPut();

  await assert.rejects(h.repository.replaceInstalled(record('audio-v2', nextBytes), nextBytes), /metadata storage failed/);
  assert.equal((await h.repository.readInstalled('bsb', 'bsb:JHN:3'))?.audioContentVersion, 'audio-v1');
  assert.deepEqual(new Uint8Array((await h.repository.readPayload('bsb', 'bsb:JHN:3'))!), new Uint8Array(oldBytes));
});

test('audio package transport streams progress and omits cookies from asset requests', async () => {
  const bytes = new TextEncoder().encode('audio payload').buffer;
  let options: RequestInit | null = null;
  const progress: number[] = [];
  const transport = createFetchScriptureAudioPackageTransport({
    fetcher: async (_url, init) => {
      options = init ?? null;
      return new Response(bytes, { headers: { 'content-type': 'audio/mpeg', 'content-length': String(bytes.byteLength) } });
    },
  });
  const result = await transport.download('https://audio.example.test/chapter.mp3', {
    signal: new AbortController().signal,
    onProgress: received => progress.push(received),
  });

  assert.deepEqual(new Uint8Array(result), new Uint8Array(bytes));
  assert.equal(options?.credentials, 'omit');
  assert.equal(options?.redirect, 'error');
  assert.ok(progress.at(-1) === bytes.byteLength);
});

test('audio transport rejects non-HTTPS URLs and oversized declared responses before buffering', async () => {
  let requests = 0;
  const transport = createFetchScriptureAudioPackageTransport({
    maxBytes: 8,
    fetcher: async () => {
      requests += 1;
      return new Response('too many bytes', { headers: { 'content-length': '14' } });
    },
  });
  const options = { signal: new AbortController().signal };
  await assert.rejects(transport.download('http://audio.example.test/chapter.mp3', options), /HTTPS/);
  await assert.rejects(transport.download('https://audio.example.test/chapter.mp3', options), /size limit/);
  assert.equal(requests, 1, 'the insecure URL must be rejected before fetch');
});


test('audio transport turns browser fetch or CORS failure into an explicit streaming-safe unavailable state', async () => {
  const transport = createFetchScriptureAudioPackageTransport({
    fetcher: async () => { throw new TypeError('Failed to fetch'); },
  });
  await assert.rejects(
    transport.download('https://audio.example.test/chapter.mp3', { signal: new AbortController().signal }),
    error => error instanceof AudioPackageDownloadUnavailableError
      && error.code === 'audio-download-unavailable'
      && /Offline audio download is unavailable.*Direct streaming remains usable/i.test(error.message),
  );
});

test('audio transport classifies HTTP download failures without conflating them with stream playback', async () => {
  const transport = createFetchScriptureAudioPackageTransport({
    fetcher: async () => new Response('blocked', { status: 403 }),
  });
  await assert.rejects(
    transport.download('https://audio.example.test/chapter.mp3', { signal: new AbortController().signal }),
    error => error instanceof AudioPackageDownloadUnavailableError
      && error.code === 'audio-download-unavailable'
      && /HTTP 403.*Direct streaming remains usable/i.test(error.message),
  );
});
