// Shared Lane D resolver reads only the generated audit-approved artifact.
// B and C may import it directly; do not import raw image-agent sidecars.
const REGISTRY_URL = 'data/v7/visual-assets.json';
const APPROVED_IMAGE = /^\/v7\/images\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|png|jpe?g)$/i;

// Zero is a valid edge focal position; missing/invalid metadata defaults to center.
export function v7VisualFocalPoint(value) {
  const coordinate = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.5;
  return Object.freeze({ x: coordinate(value?.x), y: coordinate(value?.y) });
}

export function v7VisualObjectPosition(value) {
  const point = v7VisualFocalPoint(value);
  return `${point.x * 100}% ${point.y * 100}%`;
}

export function normalizeV7VisualRegistry(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.assets)
      || !data.byContent || typeof data.byContent !== 'object') {
    throw new TypeError('Invalid audited V7 visual registry.');
  }
  const assets = new Map();
  for (const asset of data.assets) {
    if (!asset?.assetId || !APPROVED_IMAGE.test(asset.src)
        || !/^[a-f0-9]{64}$/i.test(asset.sha256 || '')
        || (!asset.decorative && !String(asset.alt || '').trim())
        || assets.has(asset.assetId)) {
      throw new TypeError('Invalid or duplicate audited V7 visual asset.');
    }
    const variants = (asset.variants || []).filter(v =>
      APPROVED_IMAGE.test(v.src) && /^[a-f0-9]{64}$/i.test(v.sha256 || ''));
    assets.set(asset.assetId, Object.freeze({ ...asset, variants: Object.freeze(variants) }));
  }
  const byContent = new Map();
  for (const [key, ids] of Object.entries(data.byContent)) {
    if (!Array.isArray(ids) || ids.some(id => !assets.has(id))) {
      throw new TypeError('V7 visual registry references an unknown asset.');
    }
    byContent.set(key, Object.freeze([...ids]));
  }
  return Object.freeze({ assets, byContent });
}

export function findV7Visual(registry, contentKeys = [], locale = 'en', title = '') {
  if (!registry) return null;
  for (const key of contentKeys) {
    const id = registry.byContent.get(key)?.[0];
    const asset = registry.assets.get(id);
    if (!asset) continue;
    // All app consumers render semantic localized text themselves. Retain legacy
    // TYPE files in the audited registry, but never select baked wording here.
    return Object.freeze({
      src: asset.src,
      alt: asset.decorative ? '' : asset.alt,
      focalPoint: v7VisualFocalPoint(asset.focalPoint),
      assetId: asset.assetId,
    });
  }
  return null;
}

// Share one in-flight read, retain verified successful data, but never
// permanently cache a transient offline/HTTP/invalid-manifest failure.
export function createV7VisualRegistryLoader({ production = false, fetcher } = {}) {
  let pending;
  return function loadRegistry() {
    if (!production || typeof fetcher !== 'function') return Promise.resolve(null);
    if (!pending) {
      pending = Promise.resolve().then(() => fetcher(REGISTRY_URL, { cache: 'force-cache' }))
        .then(async response => {
          if (!response?.ok) throw new Error('V7 visual registry is not available.');
          return normalizeV7VisualRegistry(await response.json());
        })
        .catch(() => {
          // A later online/retry interaction must be able to recover the art.
          // Until then, callers receive null and render safe live-text fallback.
          pending = undefined;
          return null;
        });
    }
    return pending;
  };
}

// The production registry is generated in Vite closeBundle; source-mode
// development intentionally does not request a registry.
export const loadV7VisualRegistry = createV7VisualRegistryLoader({
  production: import.meta.env?.PROD,
  fetcher: (...args) => globalThis.fetch?.(...args),
});
