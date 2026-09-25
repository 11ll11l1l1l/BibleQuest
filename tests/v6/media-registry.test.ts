import assert from 'node:assert/strict';
import test from 'node:test';
import type { MediaProviderAdapter } from '../../src/v6/media/contracts.ts';
import { createMediaProviderRegistry, normalizeMediaSource } from '../../src/v6/media/registry.ts';

function adapter(kind: 'youtube' | 'native'): MediaProviderAdapter {
  return {
    kind,
    capabilities: { seek: true, pictureInPicture: kind === 'native' },
    create: () => ({
      load() {},
      play() {},
      pause() {},
      stop() {},
      seek() {},
      unload() {},
      requestPictureInPicture() {},
    }),
  };
}

test('media provider registry is deterministic and rejects duplicate providers', () => {
  const youtube = adapter('youtube');
  const native = adapter('native');
  const registry = createMediaProviderRegistry([youtube, native]);

  assert.deepEqual(registry.list().map((entry) => entry.kind), ['youtube', 'native']);
  assert.equal(registry.require('youtube').capabilities.seek, true);
  assert.equal(registry.require('native').capabilities.pictureInPicture, true);
  assert.equal(registry.get('youtube')?.kind, 'youtube');

  assert.throws(() => createMediaProviderRegistry([youtube, youtube]), /Duplicate media provider/);
});

test('media source normalization fails closed for malformed identity/provider/duration', () => {
  const source = normalizeMediaSource({
    id: 'sermon-1',
    provider: 'youtube',
    externalId: 'abcdefghijk',
    title: 'Sunday Service',
    durationSeconds: 3600,
  });

  assert.deepEqual(source, {
    id: 'sermon-1',
    provider: 'youtube',
    externalId: 'abcdefghijk',
    title: 'Sunday Service',
    durationSeconds: 3600,
  });

  assert.throws(
    () => normalizeMediaSource({ ...source, id: 'bad id' }),
    /id is invalid/,
  );
  assert.throws(
    () => normalizeMediaSource({ ...source, durationSeconds: -1 }),
    /duration is invalid/,
  );
  assert.throws(
    () => normalizeMediaSource({ ...source, provider: 'other' as never }),
    /provider is invalid/,
  );
});
