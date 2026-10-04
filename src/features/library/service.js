import {
  createLibraryContentTypeRegistry,
  createLibraryViewState,
  libraryError,
  normalizeLibraryItem,
} from './contracts.js';

const cleanQuery = value => String(value ?? '').trim().slice(0, 120);

export function createLibraryService({ repository, registry = createLibraryContentTypeRegistry() } = {}) {
  if (typeof repository?.listPublished !== 'function' || typeof repository?.getPublishedById !== 'function') {
    throw libraryError('Library service requires a Library repository.', 'BQ_LIBRARY_REPOSITORY');
  }

  let state = createLibraryViewState();
  let requestId = 0;
  const listeners = new Set();
  const snapshot = () => state;
  const publish = patch => {
    state = createLibraryViewState({ ...state, ...patch });
    for (const listener of listeners) listener(state);
    return state;
  };

  return Object.freeze({
    getState: snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Library subscriber must be a function.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async list({ query = '', contentType = '', limit = 24, cursor = null } = {}) {
      const normalizedQuery = cleanQuery(query);
      const typeId = String(contentType ?? '').trim();
      if (typeId && !registry.has(typeId)) {
        throw libraryError('Choose a supported Library content type.', 'BQ_LIBRARY_CONTENT_TYPE');
      }
      const boundedLimit = Math.max(1, Math.min(60, Math.floor(Number(limit) || 24)));
      const operation = ++requestId;
      publish({
        status: 'loading',
        error: null,
        selectedItem: null,
        query: normalizedQuery,
        contentType: typeId,
        nextCursor: null,
      });

      try {
        const result = await repository.listPublished({
          query: normalizedQuery,
          contentType: typeId || null,
          limit: boundedLimit,
          cursor: cursor ?? null,
        });
        const items = result.items.map(item => normalizeLibraryItem(item, registry));
        if (operation !== requestId) return state;
        return publish({
          status: items.length ? 'ready' : 'empty',
          items,
          nextCursor: result.nextCursor ?? null,
          error: null,
        });
      } catch (error) {
        if (operation !== requestId) return state;
        publish({
          status: 'error',
          items: [],
          selectedItem: null,
          nextCursor: null,
          error: error?.message || 'Library could not load. Try again.',
        });
        return state;
      }
    },

    async getItem(id) {
      const key = String(id ?? '').trim();
      if (!key) throw libraryError('A Library item id is required.', 'BQ_LIBRARY_ITEM_ID');
      const operation = ++requestId;
      publish({ status: 'loading', error: null, selectedItem: null });
      try {
        const record = await repository.getPublishedById(key);
        if (operation !== requestId) return state;
        if (!record) {
          return publish({
            status: 'not-found',
            items: [],
            selectedItem: null,
            nextCursor: null,
            error: null,
          });
        }
        return publish({
          status: 'ready',
          items: [],
          selectedItem: normalizeLibraryItem(record, registry),
          nextCursor: null,
          error: null,
        });
      } catch (error) {
        if (operation !== requestId) return state;
        publish({
          status: 'error',
          items: [],
          selectedItem: null,
          nextCursor: null,
          error: error?.message || 'Library item could not load. Try again.',
        });
        return state;
      }
    },
  });
}
