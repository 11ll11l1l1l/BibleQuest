import { libraryError } from './contracts.js';

export function createLibraryRepository(adapter) {
  if (typeof adapter?.listPublished !== 'function' || typeof adapter?.getPublishedById !== 'function') {
    throw libraryError('Library repository requires published-list and published-item adapters.', 'BQ_LIBRARY_REPOSITORY');
  }

  return Object.freeze({
    async listPublished(options = {}) {
      const result = await adapter.listPublished(options);
      if (!result || !Array.isArray(result.items)) {
        throw libraryError('Library repository returned an invalid list result.', 'BQ_LIBRARY_REPOSITORY_RESULT');
      }
      return Object.freeze({
        items: Object.freeze([...result.items]),
        nextCursor: result.nextCursor ?? null,
        ...(Array.isArray(result.taxonomy) ? { taxonomy: Object.freeze([...result.taxonomy]) } : {}),
      });
    },

    async getPublishedById(id) {
      const key = String(id ?? '').trim();
      if (!key) throw libraryError('A Library item id is required.', 'BQ_LIBRARY_ITEM_ID');
      return adapter.getPublishedById(key);
    },
  });
}
