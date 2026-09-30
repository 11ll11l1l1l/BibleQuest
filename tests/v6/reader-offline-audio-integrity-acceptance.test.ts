import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { ScriptureAudioPackageManager } from '../../src/v6/reader/audio-packages.ts';
import { createFetchScriptureAudioPackageTransport } from '../../src/v6/reader/audio-package-storage.ts';

const bytes = new TextEncoder().encode('reviewed exact source bytes').buffer;
const sha256 = createHash('sha256').update(new Uint8Array(bytes)).digest('hex');

function approvedManifest() {
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    contentVersion: 'audio-reviewed-v1',
    source: {
      translationId: 'bsb',
      source: 'deterministic acceptance source',
      sourceUrl: 'https://audio.example.test/',
      license: 'test fixture only',
      rights: 'verified',
      delivery: 'downloadable',
      textAlignment: 'exact',
      rightsEvidence: 'deterministic test fixture',
      reviewedBy: 'automated acceptance fixture',
      reviewedAt: '2026-10-01T00:00:00.000Z',
      scriptureContentVersion: 'bsb-scripture-reviewed-v1',
      permissions: { stream: 'allowed', offlineCopy: 'allowed' },
    },
    segments: [{
      id: 'bsb:JHN:3', book: 'JHN', chapter: 3,
      url: 'https://audio.example.test/JHN-003.mp3',
      byteLength: bytes.byteLength, sha256,
    }],
  } as const;
}

function repositoryHarness() {
  let installed: any = null;
  let payload: ArrayBuffer | null = null;
  return {
    repository: {
      async readInstalled() { return installed; },
      async listInstalled() { return installed ? [installed] : []; },
      async readPayload() { return payload; },
      async replaceInstalled(record: any, next: ArrayBuffer) { installed = record; payload = next; },
      async removeInstalled() { installed = null; payload = null; },
      async usage() { return { bytes: installed?.bytes ?? 0, packages: installed ? 1 : 0 }; },
    },
    current: () => installed,
  };
}

test('offline audio accepts only the manifest-pinned source revision, byte length and SHA-256', async () => {
  const h = repositoryHarness();
  const manager = new ScriptureAudioPackageManager({
    repository: h.repository as any,
    transport: { async download() { return bytes.slice(0); } },
  });
  const manifest = approvedManifest();
  const result = await manager.install(manifest as any, manifest.segments[0] as any);
  assert.equal(result.status, 'installed');
  assert.equal(h.current().audioContentVersion, manifest.contentVersion);
  assert.equal(h.current().scriptureContentVersion, manifest.source.scriptureContentVersion);
  assert.equal(h.current().sha256, sha256);

  const corrupt = new TextEncoder().encode('reviewed exact source bytez').buffer;
  const badManager = new ScriptureAudioPackageManager({
    repository: repositoryHarness().repository as any,
    transport: { async download() { return corrupt; } },
  });
  await assert.rejects(
    badManager.install(manifest as any, manifest.segments[0] as any),
    /checksum does not match/i,
  );
});

test('CORS/fetch failure is an unavailable-download state and does not reinterpret direct streaming permission', async () => {
  const manifest = approvedManifest();
  const transport = createFetchScriptureAudioPackageTransport({
    fetcher: async () => { throw new TypeError('Failed to fetch'); },
  });
  await assert.rejects(
    transport.download(manifest.segments[0].url, { signal: new AbortController().signal }),
    /Offline audio download is unavailable.*Direct streaming remains usable/i,
  );
  assert.equal(manifest.source.permissions.stream, 'allowed');
  assert.equal(manifest.source.permissions.offlineCopy, 'allowed');
});
