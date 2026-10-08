import { localization } from '../../app/localization.js';
import { LIBRARY_ROUTE_KEYS, createLibraryContentTypeRegistry, presentLibraryItem } from './contracts.js';
import { libraryTaxonomyLabel, normalizeLibraryTaxonomyId, resolveLibraryDiscoveryTerms } from './discovery.js';
import { renderLibraryDiscoveryEmptyState, renderLibraryEmotionDiscovery } from './emotion-discovery-panel.js';
import { normalizeLibraryDiscoveryQuery, toLibraryDiscoveryRequest, toggleLibraryDiscoverySelection } from './emotion-taxonomy.js';
import { consumeLibraryReturnFocus } from './navigation-focus.js';
import { createV7LibraryDiscoveryDeck } from './visual-decks.js';
import { createV7LibraryVisualContentCard } from './visual-content-card.js';
import { loadV7VisualRegistry } from '../../ui/visual-assets.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function createLibraryPage({
  service, registry = createLibraryContentTypeRegistry(), navigate, discoverySearch,
  isContextReady = () => true, subscribeContext = () => () => {},
  visualRegistryLoader = loadV7VisualRegistry,
  initialQuery = '', initialContentType = '', initialTaxonomyId, initialDiscoveryQuery = {},
} = {}) {
  if (typeof service?.list !== 'function' || typeof service?.getState !== 'function' || typeof service?.subscribe !== 'function') {
    throw new Error('Library page requires a Library service.');
  }
  if (typeof navigate !== 'function') throw new Error('Library page requires the app route integration callback.');
  const t = (key, values) => localization.t(key, { values });
  const filterLabel = ({ en: 'Refine results', tl: 'Salain ang resulta', ceb: 'Pinoha ang resulta', ilo: 'Pasayaaten dagiti resulta' }[localization.getLocale()] || 'Refine results');
  const typeLabel = type => ['book', 'devotional', 'past_teaching'].includes(type.id)
    ? t('v7.library.type.' + type.id) : type.label;
  const typeOptions = () => registry.list().map(type =>
    `<option value="${escapeHtml(type.id)}">${escapeHtml(typeLabel(type))}</option>`).join('');
  const itemCard = item => {
    const view = presentLibraryItem(item, registry);
    const definition = registry.get(item.contentType);
    const supportingText = item.summary || (['book', 'devotional', 'past_teaching'].includes(item.contentType)
      ? t('v7.library.description.' + item.contentType) : view.supportingText);
    const readingTime = view.readingMinutes
      ? `<span>${escapeHtml(t('v7.library.readingTime', { minutes: view.readingMinutes }))}</span>` : '';
    return `<li class="bq-library-card"><button type="button" class="bq-library-card__open" data-library-item="${escapeHtml(view.id)}"><span class="bq-eyebrow">${escapeHtml(typeLabel(definition))}</span><span class="bq-library-card__title">${escapeHtml(view.title)}</span><span>${escapeHtml(supportingText)}</span><span class="bq-library-card__meta"><span lang="${escapeHtml(view.locale || '')}">${escapeHtml(view.locale || t('v7.library.languageUnknown'))}</span> ${readingTime}</span></button></li>`;
  };

  return Object.freeze({
    title: t('v7.library.title'),
    html: `<main class="bq-panel bq-library" data-library-page>
      <header class="bq-library__header">
        <p class="bq-eyebrow">${escapeHtml(t('v7.library.learn'))}</p>
        <h1>${escapeHtml(t('v7.library.title'))}</h1>
        <p>${escapeHtml(t('v7.library.intro'))}</p>
      </header>
      <form data-library-search>
        <div class="bq-library__search-row">
          <label for="bq-library-query">${escapeHtml(t('v7.library.searchLabel'))}</label>
          <div class="bq-library__search-control">
            <input id="bq-library-query" name="query" type="search" maxlength="120" autocomplete="off">
            <button type="submit" class="bq-primary-button">${escapeHtml(t('v7.library.search'))}</button>
          </div>
        </div>
        <div class="bq-library__type-row">
          <label for="bq-library-type">${escapeHtml(t('v7.library.type'))}</label>
          <select id="bq-library-type" name="contentType"><option value="">${escapeHtml(t('v7.library.allTypes'))}</option>${typeOptions()}</select>
        </div>
        <details class="bq-library-filter-panel" data-library-filter-panel>
          <summary>${escapeHtml(filterLabel)}</summary>
          <div class="bq-library-filter-panel__body">
            <label for="bq-library-taxonomy">${escapeHtml(t('v7.library.taxonomy'))}</label>
            <select id="bq-library-taxonomy" name="taxonomyId"><option value="">${escapeHtml(t('v7.library.allTaxonomy'))}</option></select>
            <div class="bq-library-discovery" data-library-discovery aria-label="${escapeHtml(t('v7.library.taxonomy'))}" hidden></div>
            <div data-library-emotion-discovery-host hidden></div>
          </div>
        </details>
        <button type="button" class="bq-library-clear" data-library-clear>${escapeHtml(t('v7.library.clear'))}</button>
      </form>
      <div data-library-visual-decks hidden></div>
      <div class="bq-library__result-status">
        <p data-library-status role="status" aria-live="polite" tabindex="-1">${escapeHtml(t('v7.library.loading'))}</p>
        <button type="button" class="bq-secondary-button" data-library-retry hidden>${escapeHtml(t('v7.library.retry'))}</button>
      </div>
      <ul data-library-results aria-label="${escapeHtml(t('v7.library.items'))}"></ul>
      <div data-library-discovery-empty-host hidden></div>
      <button type="button" class="bq-secondary-button" data-library-more hidden>${escapeHtml(t('v7.library.more'))}</button>
    </main>`,
    mount(root) {
      const page = root.querySelector('[data-library-page]');
      if (!page) throw new Error('Library page host is missing.');
      const status = page.querySelector('[data-library-status]');
      const results = page.querySelector('[data-library-results]');
      const form = page.querySelector('[data-library-search]');
      const queryInput = page.querySelector('[name="query"]');
      const typeInput = page.querySelector('[name="contentType"]');
      const termInput = page.querySelector('[name="taxonomyId"]');
      const discovery = page.querySelector('[data-library-discovery]');
      const emotionDiscovery = page.querySelector('[data-library-emotion-discovery-host]');
      const visualDecks = page.querySelector('[data-library-visual-decks]');
      const deckDomReady = Boolean(visualDecks?.ownerDocument?.createElement && visualDecks?.replaceChildren);
      const discoveryEmpty = page.querySelector('[data-library-discovery-empty-host]');
      const retry = page.querySelector('[data-library-retry]');
      const more = page.querySelector('[data-library-more]');
      queryInput.value = String(initialQuery ?? '').trim().slice(0, 120);
      typeInput.value = registry.has(String(initialContentType ?? '').trim()) ? String(initialContentType).trim() : '';
      let restoredTerm;
      try { restoredTerm = normalizeLibraryTaxonomyId(initialTaxonomyId ?? service.getState().taxonomyId); }
      catch { restoredTerm = ''; }
      const discoveryEnabled = typeof discoverySearch === 'function';
      let discoveryQuery = normalizeLibraryDiscoveryQuery(initialDiscoveryQuery);
      let lastDiscoveryRenderKey = '';
      let visualRegistry = null;
      let visualDeckKey = '';
      let mountedDecks = [];
      const clearVisualDecks = () => {
        for (const deck of mountedDecks) deck.destroy();
        mountedDecks = [];
      };
      const updateVisualDecks = () => {
        if (!deckDomReady) return;
        visualDecks.hidden = !discoveryEnabled;
        if (!discoveryEnabled) { clearVisualDecks(); visualDecks.replaceChildren(); return; }
        const locale = localization.getLocale();
        const key = locale + ':' + JSON.stringify(discoveryQuery) + ':' + (visualRegistry ? 'audited' : 'fallback');
        if (key === visualDeckKey) return;
        visualDeckKey = key;
        clearVisualDecks();
        visualDecks.replaceChildren();
        for (const [kind, selectedIds] of [
          ['emotion', discoveryQuery.emotions],
          ['need', discoveryQuery.needs],
        ]) {
          const host = visualDecks.ownerDocument.createElement('div');
          visualDecks.append(host);
          mountedDecks.push(createV7LibraryDiscoveryDeck({
            root: host, kind, locale, registry: visualRegistry, selectedIds,
            onSelect: ({ kind: chosenKind, id }) => {
              if (disposed) return;
              discoveryQuery = toggleLibraryDiscoverySelection(discoveryQuery, chosenKind, id);
              submit();
            },
          }));
        }
      };
      const hasDiscoverySelection = () => Object.values(discoveryQuery).some(values => values.length > 0);
      const withDiscovery = request => discoveryEnabled
        ? { ...request, ...toLibraryDiscoveryRequest(discoveryQuery, localization.getLocale()) }
        : request;
      const executeList = request => discoveryEnabled ? discoverySearch(withDiscovery(request)) : service.list(request);
      const updateEmotionDiscovery = () => {
        if (!emotionDiscovery) return;
        emotionDiscovery.hidden = !discoveryEnabled;
        if (!discoveryEnabled) { emotionDiscovery.innerHTML = ''; return; }
        const locale = localization.getLocale();
        const key = `${locale}:${JSON.stringify(discoveryQuery)}`;
        if (key === lastDiscoveryRenderKey) return;
        emotionDiscovery.innerHTML = renderLibraryEmotionDiscovery(discoveryQuery, locale);
        lastDiscoveryRenderKey = key;
      };
      let disposed = false;
      const executeWhenReady = request => {
        if (isContextReady()) return executeList(request);
        service.reset?.();
        return Promise.resolve(service.getState());
      };
      let lastRequest = { query: queryInput.value, contentType: typeInput.value, taxonomyId: restoredTerm, includeTaxonomy: true };
      let lastTaxonomy;
      let lastLocale;
      let started = false;
      let moreFocusPending = false;
      let returnFocusId = consumeLibraryReturnFocus();
      const syncDiscoverySelection = selected => {
        if (typeof discovery?.querySelectorAll !== 'function') return;
        for (const button of discovery.querySelectorAll('[data-library-discovery-term]')) {
          button.setAttribute('aria-pressed', String(button.getAttribute('data-library-discovery-term') === selected));
        }
      };
      const updateTerms = current => {
        const locale = localization.getLocale();
        if (lastTaxonomy === current.taxonomy && lastLocale === locale) return;
        const selected = current.status === 'idle' && started ? '' : termInput.value || restoredTerm;
        const terms = current.taxonomy ?? [];
        termInput.innerHTML = `<option value="">${escapeHtml(t('v7.library.allTaxonomy'))}</option>`
          + ['category', 'topic', 'tag'].map(kind => {
            const options = terms.filter(term => term.kind === kind).map(term => {
              const label = libraryTaxonomyLabel(term, locale);
              return `<option value="${escapeHtml(term.id)}" lang="${escapeHtml(label.locale || locale)}">${escapeHtml(label.label)}</option>`;
            }).join('');
            return options ? `<optgroup label="${escapeHtml(t('v7.content.taxonomy.' + kind))}">${options}</optgroup>` : '';
          }).join('');
        // Retain a restored filter until taxonomy arrives, including an unknown/removed term.
        // The backend returns an empty result for unknown IDs rather than broadening the search.
        if (selected && !terms.some(term => term.id === selected)) {
          termInput.innerHTML += `<option value="${escapeHtml(selected)}">${escapeHtml(selected)}</option>`;
        }
        termInput.value = selected;
        if (discovery) {
          const shortcuts = resolveLibraryDiscoveryTerms(terms);
          discovery.hidden = shortcuts.length === 0;
          discovery.innerHTML = shortcuts.map(option => {
            const label = libraryTaxonomyLabel(option.term, locale);
            return `<button type="button" class="bq-library-discovery__chip" data-library-discovery-term="${escapeHtml(option.id)}" data-library-discovery-intent="${escapeHtml(option.intent)}" aria-pressed="${String(option.id === selected)}" lang="${escapeHtml(label.locale || locale)}">${escapeHtml(label.label)}</button>`;
          }).join('');
        }
        lastTaxonomy = current.taxonomy;
        lastLocale = locale;
      };
      const restoreReturnFocus = current => {
        if (!started || !returnFocusId || current.loadingMore || !['ready', 'empty', 'error'].includes(current.status)) return;
        const itemId = returnFocusId;
        returnFocusId = '';
        const candidates = typeof results.querySelectorAll === 'function'
          ? Array.from(results.querySelectorAll('[data-library-item]')) : [];
        const origin = candidates.find(candidate => candidate.getAttribute?.('data-library-item') === itemId);
        (origin || status).focus?.({ preventScroll: true });
      };
      const render = current => {
        if (disposed) return;
        if (started && current.status === 'idle') {
          queryInput.value = ''; typeInput.value = ''; termInput.value = ''; restoredTerm = '';
          discoveryQuery = normalizeLibraryDiscoveryQuery();
          lastDiscoveryRenderKey = '';
          lastRequest = { query: '', contentType: '', taxonomyId: '', includeTaxonomy: true };
        }
        updateTerms(current);
        updateEmotionDiscovery();
        updateVisualDecks();
        syncDiscoverySelection(termInput.value);
        const messages = {
          idle: t('v7.library.intro'), loading: t('v7.library.loading'),
          empty: t('v7.library.empty'), error: globalThis.navigator?.onLine === false
            ? t('v7.library.offline') : t('v7.library.error'),
          ready: t('v7.library.count', { count: current.items.length }),
        };
        const urgent = current.status === 'error' || Boolean(current.moreError);
        status.textContent = current.loadingMore ? t('v7.library.loadingMore')
          : current.moreError ? t('v7.library.moreError') : messages[current.status] || t('v7.library.unavailable');
        if (current.status !== 'ready') results.innerHTML = '';
        else if (results.ownerDocument?.createElement && typeof results.replaceChildren === 'function') {
          const rows = [];
          for (const item of current.items) {
            try {
              const row = results.ownerDocument.createElement('li');
              row.className = 'bq-library-card bq-library-card--visual';
              row.append(createV7LibraryVisualContentCard({
                document: results.ownerDocument, item, registry: visualRegistry,
                locale: localization.getLocale(),
                onOpen: ({ id }) => {
                  const currentState = service.getState();
                  navigate({ routeKey: LIBRARY_ROUTE_KEYS.item, resourceId: id,
                    returnTo: { routeKey: LIBRARY_ROUTE_KEYS.browse, query: currentState.query,
                      contentType: currentState.contentType, taxonomyId: currentState.taxonomyId || '',
                      ...(discoveryEnabled ? { discoveryQuery } : {}) } });
                },
              }));
              rows.push(row);
            } catch {
              // Never fall back to a clickable card for an unapproved revision.
              // The existing repository contract should already reject invalid
              // records before this point.
            }
          }
          results.replaceChildren(...rows);
        } else results.innerHTML = current.items.map(itemCard).join('');
        if (discoveryEmpty) {
          const showDiscoveryEmpty = discoveryEnabled && current.status === 'empty' && hasDiscoverySelection();
          discoveryEmpty.hidden = !showDiscoveryEmpty;
          discoveryEmpty.innerHTML = showDiscoveryEmpty
            ? renderLibraryDiscoveryEmptyState(discoveryQuery, localization.getLocale()) : '';
        }
        status.setAttribute('role', urgent ? 'alert' : 'status');
        status.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
        status.setAttribute('data-library-state', current.status);
        results.setAttribute('aria-busy', String(current.status === 'loading' || Boolean(current.loadingMore)));
        retry.hidden = current.status !== 'error';
        more.hidden = current.status !== 'ready' || !current.nextCursor
          || (!discoveryEnabled && typeof service.loadMore !== 'function');
        more.disabled = Boolean(current.loadingMore);
        if (moreFocusPending && !current.loadingMore) {
          moreFocusPending = false;
          if (more.hidden) status.focus?.({ preventScroll: true });
        }
        restoreReturnFocus(current);
      };
      const submit = () => {
        returnFocusId = '';
        lastRequest = { query: queryInput.value, contentType: typeInput.value, taxonomyId: termInput.value };
        restoredTerm = termInput.value;
        navigate({ routeKey: LIBRARY_ROUTE_KEYS.browse, ...lastRequest,
          ...(discoveryEnabled ? { discoveryQuery } : {}) });
      };
      const onSubmit = event => {
        if (event.target !== form) return;
        event.preventDefault();
        submit();
      };
      const onClick = event => {
        const target = event.target instanceof Element
          ? event.target.closest('[data-library-item], [data-library-retry], [data-library-clear], [data-library-more], [data-library-discovery-term], [data-library-discovery-kind][data-library-discovery-id]') : null;
        if (!target) return;
        if (target.hasAttribute('data-library-retry')) {
          if (!retry.hidden) {
            status.focus({ preventScroll: true });
            void executeWhenReady({ ...lastRequest });
          }
          return;
        }
        if (target.hasAttribute('data-library-more')) {
          if (!more.hidden && !more.disabled) {
            moreFocusPending = true;
            if (discoveryEnabled) {
              const current = service.getState();
              void executeWhenReady({ ...lastRequest, cursor: current.nextCursor, append: true });
            } else void service.loadMore();
          }
          return;
        }
        if (target.hasAttribute('data-library-clear')) {
          queryInput.value = ''; typeInput.value = ''; termInput.value = ''; restoredTerm = '';
          discoveryQuery = normalizeLibraryDiscoveryQuery();
          lastDiscoveryRenderKey = '';
          updateEmotionDiscovery();
          submit();
          return;
        }
        if (target.hasAttribute('data-library-discovery-term')) {
          termInput.value = target.getAttribute('data-library-discovery-term') || '';
          restoredTerm = termInput.value;
          syncDiscoverySelection(termInput.value);
          submit();
          return;
        }
        if (discoveryEnabled && target.hasAttribute('data-library-discovery-kind')
            && target.hasAttribute('data-library-discovery-id')) {
          const kind = target.getAttribute('data-library-discovery-kind');
          const id = target.getAttribute('data-library-discovery-id');
          if (target.hasAttribute('data-library-discovery-suggestion')) {
            const key = kind === 'emotion' ? 'emotions' : 'needs';
            discoveryQuery = normalizeLibraryDiscoveryQuery({ ...discoveryQuery, [key]: [id] });
          } else discoveryQuery = toggleLibraryDiscoverySelection(discoveryQuery, kind, id);
          lastDiscoveryRenderKey = '';
          updateEmotionDiscovery();
          submit();
          return;
        }
        const current = service.getState();
        navigate({ routeKey: LIBRARY_ROUTE_KEYS.item, resourceId: target.getAttribute('data-library-item'),
          returnTo: { routeKey: LIBRARY_ROUTE_KEYS.browse, query: current.query,
            contentType: current.contentType, taxonomyId: current.taxonomyId || '',
            ...(discoveryEnabled ? { discoveryQuery } : {}) } });
      };
      form.addEventListener('submit', onSubmit);
      page.addEventListener('click', onClick);
      const unsubscribe = service.subscribe(render);
      const unsubscribeContext = subscribeContext(() => {
        if (disposed) return;
        if (!isContextReady()) {
          service.reset?.();
          return;
        }
        void executeList({ ...lastRequest });
      });
      render(service.getState());
      started = true;
      if (deckDomReady && discoveryEnabled) {
        Promise.resolve().then(() => visualRegistryLoader()).then(approved => {
          if (disposed) return;
          visualRegistry = approved;
          visualDeckKey = '';
          updateVisualDecks();
          render(service.getState());
        }).catch(() => {
          // Audited imagery is optional: the accessible live-text cards remain.
        });
      }
      void executeWhenReady({ ...lastRequest });
      return () => {
        disposed = true;
        clearVisualDecks();
        form.removeEventListener('submit', onSubmit);
        page.removeEventListener('click', onClick);
        unsubscribe();
        unsubscribeContext?.();
      };
    },
  });
}
