import type { MediaProviderAdapter, MediaProviderId, MediaSource } from './contracts.ts';

export interface MediaProviderRegistry {
  list(): readonly MediaProviderId[];
  get(id: MediaProviderId): MediaProviderAdapter | null;
  require(id: MediaProviderId): MediaProviderAdapter;
  resolve(source: MediaSource): MediaProviderAdapter;
}

export function createMediaProviderRegistry(
  providers: readonly MediaProviderAdapter[],
): MediaProviderRegistry {
  if (!Array.isArray(providers) || providers.length === 0) {
    throw new Error('Media provider registry requires at least one provider.');
  }

  const byId = new Map<MediaProviderId, MediaProviderAdapter>();
  for (const provider of providers) {
    if (!provider?.id || typeof provider.create !== 'function' || typeof provider.canHandle !== 'function') {
      throw new Error('Media provider is malformed.');
    }
    if (byId.has(provider.id)) throw new Error(`Duplicate media provider: ${provider.id}.`);
    byId.set(provider.id, provider);
  }

  const ids = Object.freeze([...byId.keys()]);
  return Object.freeze({
    list: () => ids,
    get: (id: MediaProviderId) => byId.get(id) ?? null,
    require: (id: MediaProviderId) => {
      const provider = byId.get(id);
      if (!provider) throw new Error(`Unknown media provider: ${id}.`);
      return provider;
    },
    resolve: (source: MediaSource) => {
      const provider = byId.get(source.provider);
      if (!provider || !provider.canHandle(source)) {
        throw new Error(`No media provider can handle ${source.provider}.`);
      }
      return provider;
    },
  });
}
