import {
  LIBRARY_EMOTIONS, LIBRARY_NEEDS, libraryDiscoveryLabel,
  libraryDiscoveryShellLabel, normalizeLibraryDiscoveryLocale,
} from './emotion-taxonomy.js';

// The image workers' P0 concepts differ from some legacy UI discovery IDs.
// Map only equivalent concepts: never substitute an unrelated emotion image.
export const V7_EMOTION_VISUAL_IDS = Object.freeze({
  anxious: 'anxiety_worry', afraid: 'fear', sad: 'sadness',
  grieving: 'grief_loss', lonely: 'loneliness', angry: 'anger',
  hurt: 'hurt_betrayal', rejected: 'rejection', guilty: 'guilt',
  ashamed: 'shame', insecure: 'insecurity_unworthiness', doubtful: 'doubt',
  confused: 'confusion_uncertainty', discouraged: 'discouragement',
  hopeless: 'hopelessness', overwhelmed: 'overwhelm', stressed: 'stress',
  tired: 'tiredness_weariness', spiritually_dry: 'spiritual_dryness_distance',
  tempted: 'temptation', impatient: 'impatience_waiting',
  jealous: 'jealousy_envy', frustrated: 'frustration', numb: 'numbness_emptiness',
  joyful: 'joy', grateful: 'gratitude', peaceful: 'peace_contentment',
  hopeful: 'hope', excited: 'excitement', connected: 'love_connection',
});
const SHA = /^[a-f0-9]{64}$/i;
const LOCAL_IMAGE = /^\/v7\/images\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i;
const clean = value => String(value ?? '').trim();

export const safeV7VisualPath = value =>
  typeof value === 'string' && LOCAL_IMAGE.test(value) && !value.includes('..') ? value : '';

export function normalizeV7DeckLocale(value) {
  return normalizeLibraryDiscoveryLocale(clean(value).toLowerCase() === 'fil' ? 'tl' : value);
}

// Input MUST be a registry from the passing Lane A binary audit, never a
// user-supplied per-card URL or an unverified asset-record directory.
export function resolveV7LibraryVisual(registry, kind, contentId, { thumbnail = false } = {}) {
  const fallback = Object.freeze({ src: '', alt: '', fallback: kind || 'library', type: 'fallback', assetId: '' });
  // Lane D's production loader returns validated Maps, while the Lane A
  // audit and fixture tools provide the equivalent versioned JSON schema.
  // Accept only those two shapes; never resolve arbitrary item-provided URLs.
  const mapped = registry?.assets instanceof Map && registry?.byContent instanceof Map;
  const raw = registry?.schemaVersion === 1 && Array.isArray(registry.assets)
    && registry.byContent && typeof registry.byContent === 'object';
  if (!mapped && !raw) return fallback;
  const keys = kind === 'emotion'
    ? [...new Set(['emotion:' + clean(V7_EMOTION_VISUAL_IDS[contentId] || contentId), 'emotion:' + clean(contentId)])]
    : [kind + ':' + clean(contentId)];
  const ids = keys.flatMap(key => {
    const row = mapped ? registry.byContent.get(key) : registry.byContent[key];
    return Array.isArray(row) ? row : [];
  });
  const lookup = mapped ? registry.assets : new Map(registry.assets.map(row => [row?.assetId, row]));
  for (const id of ids) {
    const asset = lookup.get(id);
    if (!asset || !keys.includes(asset.contentType + ':' + asset.contentId)
      || !SHA.test(clean(asset.sha256))) continue;
    const master = safeV7VisualPath(asset.src);
    if (!master) continue;
    const thumb = thumbnail && Array.isArray(asset.variants)
      ? asset.variants.find(row => row.kind === 'thumbnail'
        && SHA.test(clean(row.sha256)) && safeV7VisualPath(row.src))
      : null;
    return Object.freeze({
      src: thumb ? thumb.src : master, alt: clean(asset.alt),
      fallback: clean(asset.fallbackKey) || kind || 'library',
      type: thumb ? 'thumbnail' : 'clean', assetId: clean(asset.assetId),
    });
  }
  return fallback;
}

export function assertV7PublishedVisualCardItem(item) {
  if (!item || !['book','devotional','past_teaching'].includes(item.contentType)
    || item.publicationState !== 'published'
    || item.rights?.status !== 'verified'
    || !Array.isArray(item.rights.allowedUses)
    || item.rights.allowedUses.length === 0
    || !clean(item.id) || !clean(item.title))
    throw new TypeError('visual Library cards require a rights-verified published item');
  return item;
}

export function buildV7LibraryDeckModel({ kind, locale = 'en', registry, selectedIds = [] } = {}) {
  if (kind !== 'emotion' && kind !== 'need') throw new TypeError('deck kind must be emotion or need');
  const resolvedLocale = normalizeV7DeckLocale(locale);
  const selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  const entries = kind === 'emotion' ? LIBRARY_EMOTIONS : LIBRARY_NEEDS;
  return Object.freeze({
    kind, locale: resolvedLocale,
    question: libraryDiscoveryShellLabel(kind === 'emotion' ? 'feelingQuestion' : 'needQuestion', resolvedLocale),
    selectedLabel: libraryDiscoveryShellLabel('selected', resolvedLocale),
    entries: Object.freeze(entries.map(row => {
      const label = libraryDiscoveryLabel(row, resolvedLocale);
      return Object.freeze({
        id: row.id, kind, label: label.label, labelLocale: label.locale,
        scripture: Object.freeze([...row.scripture]), selected: selected.has(row.id),
        visual: resolveV7LibraryVisual(registry, kind, row.id),
      });
    })),
  });
}
