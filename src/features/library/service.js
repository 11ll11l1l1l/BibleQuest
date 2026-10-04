import {
  createLibraryContentTypeRegistry,
  createLibraryViewState,
  libraryError,
  normalizeLibraryItem,
} from './contracts.js';

import { normalizeLibraryTaxonomy, normalizeLibraryTaxonomyId } from './discovery.js';

const cleanQuery = value => String(value ?? '').trim().slice(0, 120);

export function createLibraryService({ repository, registry = createLibraryContentTypeRegistry() } = {}) {
  if (typeof repository?.listPublished !== 'function' || typeof repository?.getPublishedById !== 'function') {
    throw libraryError('Library service requires a Library repository.', 'BQ_LIBRARY_REPOSITORY');
  }

  const emptyDiscovery = () => ({ taxonomy: Object.freeze([]), taxonomyId: '', loadingMore: false, moreError: null });
  let state = createLibraryViewState(emptyDiscovery());
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
    reset() {
      requestId += 1;
      return publish(createLibraryViewState(emptyDiscovery()));
    },
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Library subscriber must be a function.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async list({ query = '', contentType = '', taxonomyId = '', includeTaxonomy = false, limit = 24, cursor = null, append = false } = {}) {
      const normalizedQuery = cleanQuery(query);
      const typeId = String(contentType ?? '').trim();
      if (typeId && !registry.has(typeId)) {
        throw libraryError('Choose a supported Library content type.', 'BQ_LIBRARY_CONTENT_TYPE');
      }
      const termId = normalizeLibraryTaxonomyId(taxonomyId);
      if (append && (state.loadingMore || state.status !== 'ready' || !state.nextCursor
          || normalizedQuery !== state.query || typeId !== state.contentType || termId !== state.taxonomyId
          || cursor !== state.nextCursor)) return state;
      const previousItems = append ? state.items : [];
      const boundedLimit = Math.max(1, Math.min(60, Math.floor(Number(limit) || 24)));
      const operation = ++requestId;
      publish(append ? { loadingMore: true, moreError: null } : {
        status: 'loading',
        items: [],
        error: null,
        selectedItem: null,
        query: normalizedQuery,
        contentType: typeId,
        taxonomyId: termId,
        loadingMore: false,
        moreError: null,
        nextCursor: null,
      });

      try {
        const result = await repository.listPublished({
          query: normalizedQuery,
          contentType: typeId || null,
          limit: boundedLimit,
          cursor: cursor ?? null,
          ...(termId ? { taxonomyId: termId } : {}),
          ...(includeTaxonomy ? { includeTaxonomy: true } : {}),
        });
        if (operation !== requestId) return state;
        const incoming = result.items.map(item => normalizeLibraryItem(item, registry));
        const items = append ? [...new Map([...previousItems, ...incoming].map(item => [item.id, item])).values()] : incoming;
        const taxonomy = result.taxonomy ? normalizeLibraryTaxonomy(result.taxonomy) : state.taxonomy;
        return publish({
          status: items.length ? 'ready' : 'empty',
          items,
          taxonomy,
          loadingMore: false,
          moreError: null,
          nextCursor: result.nextCursor ?? null,
          error: null,
        });
      } catch (error) {
        if (operation !== requestId) return state;
        if (append) return publish({ loadingMore: false, moreError: error?.message || 'Library could not load more items. Try again.' });
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

    async loadMore() {
      return this.list({ query: state.query, contentType: state.contentType, taxonomyId: state.taxonomyId,
        cursor: state.nextCursor, append: true });
    },

    async getItem(id) {
      const key = String(id ?? '').trim();
      if (!key) throw libraryError('A Library item id is required.', 'BQ_LIBRARY_ITEM_ID');
      const operation = ++requestId;
      publish({ status: 'loading', items: [], error: null, selectedItem: null, nextCursor: null, loadingMore: false, moreError: null });
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
        const selectedItem = normalizeLibraryItem(record, registry);
        if (selectedItem.id !== key) {
          throw libraryError('Library returned a different item than requested.', 'BQ_LIBRARY_ITEM_ID');
        }
        return publish({
          status: 'ready',
          items: [],
          selectedItem,
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
