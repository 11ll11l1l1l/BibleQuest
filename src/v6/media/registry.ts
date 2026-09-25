import type {
  MediaProviderAdapter,
  MediaProviderKind,
  MediaProviderRegistry,
  MediaSource,
} from './contracts.ts';

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function text(value: unknown, label: string, max = 180): string {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > max) throw new Error(`Media source requires valid ${label}.`);
  return normalized;
}

export function normalizeMediaSource(input: MediaSource): MediaSource {
  const id = text(input?.id, 'id', 128);
  if (!ID_PATTERN.test(id)) throw new Error('Media source id is invalid.');
  const externalId = text(input?.externalId, 'external id', 512);
  const title = text(input?.title, 'title', 180);
  const duration = input?.durationSeconds;

  if (duration !== undefined && duration !== null) {
    const value = Number(duration);
    if (!Number.isFinite(value) || value <= 0 || value > 604800) {
      throw new Error('Media source duration is invalid.');
    }
  }

  if (input.provider !== 'youtube' && input.provider !== 'native') {
    throw new Error('Media source provider is invalid.');
  }

  return Object.freeze({
    id,
    provider: input.provider,
    externalId,
    title,
    durationSeconds: duration === undefined || duration === null ? null : Number(duration),
  });
}

export function createMediaProviderRegistry(
  adapters: readonly MediaProviderAdapter[],
): MediaProviderRegistry {
  if (!Array.isArray(adapters) || adapters.length === 0) {
    throw new Error('Media provider registry requires at least one adapter.');
  }

  const byKind = new Map<MediaProviderKind, MediaProviderAdapter>();
  for (const adapter of adapters) {
    if (!adapter || (adapter.kind !== 'youtube' && adapter.kind !== 'native')) {
      throw new Error('Media provider adapter kind is invalid.');
    }
    if (typeof adapter.create !== 'function') throw new Error(`Media provider ${adapter.kind} requires a factory.`);
    if (byKind.has(adapter.kind)) throw new Error(`Duplicate media provider: ${adapter.kind}.`);

    byKind.set(adapter.kind, Object.freeze({
      kind: adapter.kind,
      capabilities: Object.freeze({
        seek: adapter.capabilities?.seek === true,
        pictureInPicture: adapter.capabilities?.pictureInPicture === true,
      }),
      create: adapter.create,
    }));
  }

  const snapshot = Object.freeze([...byKind.values()]);
  return Object.freeze({
    list: () => snapshot,
    get: (kind: MediaProviderKind) => byKind.get(kind) ?? null,
    require: (kind: MediaProviderKind) => {
      const adapter = byKind.get(kind);
      if (!adapter) throw new Error(`Unsupported media provider: ${String(kind)}.`);
      return adapter;
    },
  });
}
