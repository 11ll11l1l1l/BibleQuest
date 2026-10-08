// Shared Lane D resolver reads only the generated audit-approved artifact.
// B and C may import it directly; do not import raw image-agent sidecars.
const REGISTRY_URL = 'data/v7/visual-assets.json';
const APPROVED_IMAGE = /^\/v7\/images\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|png|jpe?g)$/i;
let pending;

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
    const language = String(locale || 'en').toLowerCase().split('-')[0];
    const typed = asset.variants.find(v =>
      v.kind === 'with_text' && v.locale?.toLowerCase().split('-')[0] === language
        && v.embeddedText === title);
    return Object.freeze({
      src: typed?.src || asset.src,
      alt: typed ? '' : (asset.decorative ? '' : asset.alt),
      focalPoint: asset.focalPoint || { x: 0.5, y: 0.5 },
      assetId: asset.assetId,
    });
  }
  return null;
}

export function loadV7VisualRegistry() {
  // The production registry is generated in the Vite closeBundle audit, not
  // served by the source-mode dev server (publicDir is deliberately disabled).
  if (!import.meta.env?.PROD || typeof fetch !== 'function') return Promise.resolve(null);
  if (!pending) {
    pending = fetch(REGISTRY_URL, { cache: 'force-cache' }).then(async response => {
      if (!response.ok) throw new Error('V7 visual registry is not available.');
      return normalizeV7VisualRegistry(await response.json());
    }).catch(() => null);
  }
  return pending;
}
