import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  ScriptureAudioPackageManager,
  type InstalledScriptureAudioPackage,
  type ScriptureAudioPackageRepository,
} from '../../src/v6/reader/audio-packages.ts';
import { audioStreamingEligibility, type ScriptureAudioManifest, type ScriptureAudioSegment } from '../../src/v6/reader/audio-policy.ts';

const payload = new TextEncoder().encode('audio bytes').buffer;
const sha256 = createHash('sha256').update(new Uint8Array(payload)).digest('hex');

function manifest(overrides: Partial<ScriptureAudioManifest> = {}): ScriptureAudioManifest {
  const segment: ScriptureAudioSegment = {
    id: 'bsb:JHN:3', book: 'JHN', chapter: 3, byteLength: payload.byteLength, sha256,
    url: 'https://audio.example.test/bsb/JHN/3.mp3',
  };
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    contentVersion: 'audio-v1',
    source: {
      translationId: 'bsb', source: 'Reviewed BSB audio', sourceUrl: 'https://audio.example.test/',
      scriptureContentVersion: 'bsb-content-v1', license: 'CC0 1.0', rights: 'verified',
      permissions: { stream: 'allowed', offlineCopy: 'allowed' },
      delivery: 'downloadable', textAlignment: 'exact', attribution: 'Narrator',
      rightsEvidence: 'reviewed file evidence', reviewedBy: 'reviewer', reviewedAt: '2026-09-28T00:00:00.000Z',
    },
    segments: [segment],
    ...overrides,
  };
}

function repository() {
  const records = new Map<string, InstalledScriptureAudioPackage>();
  const payloads = new Map<string, ArrayBuffer>();
  let failReplace = false;
  const key = (translationId: string, segmentId: string) => `${translationId}:${segmentId}`;
  const value: ScriptureAudioPackageRepository = {
    async readInstalled(translationId, segmentId) { return records.get(key(translationId, segmentId)) ?? null; },
    async listInstalled() { return [...records.values()]; },
    async readPayload(translationId, segmentId) { return payloads.get(key(translationId, segmentId))?.slice(0) ?? null; },
    async replaceInstalled(record, bytes) {
      if (failReplace) throw new Error('storage unavailable');
      records.set(key(record.translationId, record.segmentId), record);
      payloads.set(key(record.translationId, record.segmentId), bytes.slice(0));
    },
    async removeInstalled(translationId, segmentId) {
      records.delete(key(translationId, segmentId)); payloads.delete(key(translationId, segmentId));
    },
    async usage() {
      return { bytes: [...records.values()].reduce((sum, record) => sum + record.bytes, 0), packages: records.size };
    },
  };
  return { value, records, payloads, setFailReplace: (value: boolean) => { failReplace = value; } };
}

test('audio package manager selectively downloads, verifies and pins chapter audio to exact Scripture revision', async () => {
  const repo = repository();
  const phases: string[] = [];
  let downloads = 0;
  const manager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: { async download(_url, options) { downloads += 1; options.onProgress?.(payload.byteLength); return payload.slice(0); } },
    now: () => '2026-09-28T12:00:00.000Z',
  });

  const currentManifest = manifest();
  const segment = currentManifest.segments[0]!;
  const installed = await manager.install(currentManifest, segment, { onProgress: row => phases.push(row.phase) });
  assert.equal(installed.status, 'installed');
  assert.equal(installed.package.scriptureContentVersion, 'bsb-content-v1');
  assert.deepEqual(phases, ['downloading', 'downloading', 'verifying', 'storing', 'complete']);
  assert.equal(downloads, 1);
  assert.deepEqual(await manager.usage(), { bytes: payload.byteLength, packages: 1 });

  const reused = await manager.install(currentManifest, segment);
  assert.equal(reused.status, 'current');
  assert.equal(downloads, 1);
});

test('unreviewed rights, mismatched alignment and stale Scripture revisions fail before transport', async () => {
  const repo = repository();
  let downloads = 0;
  const manager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: { async download() { downloads += 1; return payload.slice(0); } },
  });
  const segment = manifest().segments[0]!;
  for (const source of [
    { ...manifest().source, rights: 'review-required' as const },
    { ...manifest().source, textAlignment: 'mismatch' as const },
    { ...manifest().source, scriptureContentVersion: undefined },
  ]) {
    const candidate = { ...manifest(), source } as ScriptureAudioManifest;
    await assert.rejects(manager.install(candidate, candidate.segments[0]!), /cannot be downloaded|revision/i);
  }
  assert.equal(downloads, 0);
  assert.equal(repo.records.size, 0);
});

test('chapter download rejects caller-substituted segment identity and URL', async () => {
  const repo = repository();
  let downloads = 0;
  const manager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: { async download() { downloads += 1; return payload.slice(0); } },
  });
  const candidate = manifest();
  await assert.rejects(manager.install(candidate, { ...candidate.segments[0]!, url: 'https://evil.example/test.mp3' }), /identity|revision/i);
  assert.equal(downloads, 0);
  assert.equal(repo.records.size, 0);
});

test('bad replacement bytes leave a previously verified audio chapter intact', async () => {
  const repo = repository();
  const firstManifest = manifest();
  const manager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: { async download() { return payload.slice(0); } },
  });
  const segment = firstManifest.segments[0]!;
  await manager.install(firstManifest, segment);
  const oldRecord = repo.records.get('bsb:bsb:JHN:3');
  assert.ok(oldRecord);

  const newerBytes = new TextEncoder().encode('new audio').buffer;
  const newerSha = createHash('sha256').update(new Uint8Array(newerBytes)).digest('hex');
  const next = manifest({
    contentVersion: 'audio-v2',
    segments: [{ ...segment, byteLength: newerBytes.byteLength, sha256: newerSha }],
  });
  const corruptManager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: { async download() { return new TextEncoder().encode('corrupt').buffer; } },
  });
  await assert.rejects(corruptManager.install(next, next.segments[0]!), /size does not match/);
  assert.equal(repo.records.get('bsb:bsb:JHN:3'), oldRecord);
  assert.deepEqual(new Uint8Array((await repo.value.readPayload('bsb', 'bsb:JHN:3'))!), new Uint8Array(payload));
});

test('storage limit is checked before writing and active chapter downloads can be cancelled', async () => {
  const repo = repository();
  const limitManager = new ScriptureAudioPackageManager({
    repository: repo.value,
    ceilingBytes: payload.byteLength,
    transport: { async download() { return payload.slice(0); } },
  });
  const candidate = manifest();
  await assert.rejects(limitManager.install(candidate, candidate.segments[0]!), /storage-ceiling-exceeded/i);
  assert.equal(repo.records.size, 0);

  let started!: () => void;
  const began = new Promise<void>(resolve => { started = resolve; });
  const cancelManager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: {
      download(_url, { signal }) {
        return new Promise<ArrayBuffer>((_resolve, reject) => {
          started();
          signal.addEventListener('abort', () => { const error = new Error('aborted'); error.name = 'AbortError'; reject(error); }, { once: true });
        });
      },
    },
  });
  const pending = cancelManager.install(candidate, candidate.segments[0]!);
  await began;
  assert.equal(cancelManager.cancel('bsb', 'bsb:JHN:3'), true);
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(repo.records.size, 0);
});

test('storage replacement failures leave the previous installed segment untouched', async () => {
  const repo = repository();
  const original = manifest();
  const manager = new ScriptureAudioPackageManager({ repository: repo.value, transport: { async download() { return payload.slice(0); } } });
  await manager.install(original, original.segments[0]!);
  const previous = repo.records.get('bsb:bsb:JHN:3');
  repo.setFailReplace(true);
  await assert.rejects(manager.install(manifest({ contentVersion: 'audio-v2' }), original.segments[0]!), /storage unavailable/);
  assert.equal(repo.records.get('bsb:bsb:JHN:3'), previous);
});


test('offline audio network failure does not change streaming eligibility', async () => {
  const repo = repository();
  const candidate = manifest();
  const segment = candidate.segments[0]!;
  let attempts = 0;
  const manager = new ScriptureAudioPackageManager({
    repository: repo.value,
    transport: { async download() { attempts += 1; throw new TypeError('Network request unavailable'); } },
  });

  assert.deepEqual(audioStreamingEligibility(candidate), { eligible: true, reason: 'eligible' });
  await assert.rejects(manager.install(candidate, segment), /Network request unavailable/);
  assert.equal(attempts, 1);
  assert.equal(repo.records.size, 0);
  assert.equal(repo.payloads.size, 0);
  assert.deepEqual(await manager.usage(), { bytes: 0, packages: 0 });
  assert.deepEqual(audioStreamingEligibility(candidate), { eligible: true, reason: 'eligible' });
});
