export const SCRIPTURE_PACKAGE_PAYLOAD_CACHE_NAME = 'biblequest-v3-opened-bible-packs-v1';
export const SCRIPTURE_PACKAGE_METADATA_CACHE_NAME = 'biblequest-v6-scripture-package-metadata-v1';

const TRANSLATION_BY_FOLDER = Object.freeze({
  bible: 'bsb',
  tagalog: 'tl',
  cebuano: 'cebocb',
});

export function scripturePackageMetadataUrl(
  translationId: string,
  bookCode: string,
  locationHref: string,
): string {
  const origin = new URL(locationHref).origin;
  return new URL(
    `/__bq_v6_scripture_packages__/${encodeURIComponent(translationId)}/${encodeURIComponent(bookCode.trim().toUpperCase())}.json`,
    origin,
  ).href;
}

export function scripturePackageIdentityForPath(
  path: string,
): Readonly<{ translationId: string; bookCode: string }> | null {
  const match = /^data\/packs\/(bible|tagalog|cebuano)\/((?:[1-3])?[A-Za-z]{2,3})\.json$/.exec(String(path ?? '').replace(/^\.\//, ''));
  if (!match) return null;
  const translationId = TRANSLATION_BY_FOLDER[match[1] as keyof typeof TRANSLATION_BY_FOLDER];
  if (!translationId) return null;
  return Object.freeze({ translationId, bookCode: match[2].toUpperCase() });
}
