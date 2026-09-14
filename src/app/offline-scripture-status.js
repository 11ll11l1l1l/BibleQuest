const OFFLINE_PACK_CACHE = 'biblequest-v3-opened-bible-packs-v1';

function cacheKey(path, locationRef = globalThis.location) {
  try { return new URL(path, locationRef?.href || 'http://localhost/').href; }
  catch { return String(path || ''); }
}

export function createOfflineScriptureAvailability({
  bibleService,
  cacheStorage = globalThis.caches,
  locationRef = globalThis.location
} = {}) {
  if (!bibleService?.getTranslation || !bibleService?.getBook) {
    throw new TypeError('bibleService with getTranslation() and getBook() is required.');
  }

  const supported = Boolean(cacheStorage?.open);

  async function getStatus(translationId, bookCode) {
    const translation = bibleService.getTranslation(translationId);
    const book = bibleService.getBook(bookCode);

    if (!translation.bundled || translation.mode !== 'bundled') {
      return Object.freeze({
        available: false,
        supported: false,
        translationId: translation.id,
        bookCode: book.code,
        reason: translation.mode === 'licensed-link'
          ? 'This translation opens in a licensed external reader and is not cached by BibleQuest.'
          : 'This live translation requires a network connection in V5.'
      });
    }

    if (!supported) {
      return Object.freeze({
        available: false,
        supported: false,
        translationId: translation.id,
        bookCode: book.code,
        reason: 'Offline Scripture storage is unavailable in this browser.'
      });
    }

    const path = `data/packs/${translation.folder}/${book.code}.json`;
    try {
      const cache = await cacheStorage.open(OFFLINE_PACK_CACHE);
      const response = await cache.match(cacheKey(path, locationRef));
      return Object.freeze({
        available: Boolean(response),
        supported: true,
        translationId: translation.id,
        bookCode: book.code,
        reason: response ? 'Available offline.' : 'Open this book while online before using it offline.'
      });
    } catch {
      return Object.freeze({
        available: false,
        supported: false,
        translationId: translation.id,
        bookCode: book.code,
        reason: 'Offline Scripture storage could not be checked.'
      });
    }
  }

  return Object.freeze({ supported, getStatus });
}
