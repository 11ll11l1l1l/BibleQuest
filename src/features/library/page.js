import {
  LIBRARY_ROUTE_KEYS,
  createLibraryContentTypeRegistry,
  presentLibraryItem,
} from './contracts.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const itemCard = (item, registry) => {
  const view = presentLibraryItem(item, registry);
  const readingTime = view.readingMinutes ? `<span>${view.readingMinutes} min read</span>` : '';
  return `<li class="bq-library-card"><button type="button" class="bq-library-card__open" data-library-item="${escapeHtml(view.id)}"><span class="bq-eyebrow">${escapeHtml(view.contentTypeLabel)}</span><span class="bq-library-card__title">${escapeHtml(view.title)}</span><span>${escapeHtml(view.supportingText)}</span><span class="bq-library-card__meta">${escapeHtml(view.locale || 'Language not specified')} ${readingTime}</span></button></li>`;
};

export function createLibraryPage({
  service,
  registry = createLibraryContentTypeRegistry(),
  navigate,
  initialQuery = '',
  initialContentType = '',
} = {}) {
  if (typeof service?.list !== 'function' || typeof service?.getState !== 'function' || typeof service?.subscribe !== 'function') {
    throw new Error('Library page requires a Library service.');
  }
  if (typeof navigate !== 'function') {
    throw new Error('Library page requires the app route integration callback.');
  }

  const typeOptions = registry.list().map(type =>
    `<option value="${escapeHtml(type.id)}">${escapeHtml(type.label)}</option>`).join('');

  return Object.freeze({
    title: 'Library',
    html: `<main class="bq-panel bq-library" data-library-page>
      <p class="bq-eyebrow">LEARN</p>
      <h1>Library</h1>
      <p>Browse trusted Books, Devotionals, and Past Teachings.</p>
      <form data-library-search>
        <label for="bq-library-query">Search Library</label>
        <input id="bq-library-query" name="query" type="search" maxlength="120" autocomplete="off">
        <label for="bq-library-type">Content type</label>
        <select id="bq-library-type" name="contentType"><option value="">All content</option>${typeOptions}</select>
        <button type="submit" class="bq-primary-button">Search</button>
      </form>
      <p data-library-status role="status" aria-live="polite">Loading Library…</p>
      <button type="button" data-library-retry hidden>Retry</button>
      <ul data-library-results aria-label="Library items"></ul>
    </main>`,
    mount(root) {
      const page = root.querySelector('[data-library-page]');
      if (!page) throw new Error('Library page host is missing.');
      const status = page.querySelector('[data-library-status]');
      const results = page.querySelector('[data-library-results]');
      const form = page.querySelector('[data-library-search]');
      const queryInput = page.querySelector('[name="query"]');
      const typeInput = page.querySelector('[name="contentType"]');
      const retry = page.querySelector('[data-library-retry]');
      const restoredQuery = String(initialQuery ?? '').trim().slice(0, 120);
      const initialType = String(initialContentType ?? '').trim();
      queryInput.value = restoredQuery;
      typeInput.value = registry.has(initialType) ? initialType : '';
      let lastRequest = { query: queryInput.value, contentType: typeInput.value };
      let disposed = false;
      let unsubscribe = null;

      const render = current => {
        if (disposed) return;
        const messages = {
          idle: 'Browse Books, Devotionals, and Past Teachings.',
          loading: 'Loading Library…',
          empty: 'No published items match this search.',
          error: current.error || 'Library could not load. Try again.',
          ready: `${current.items.length} Library item${current.items.length === 1 ? '' : 's'}`,
        };
        status.textContent = messages[current.status] || 'Library is unavailable.';
        results.innerHTML = current.status === 'ready'
          ? current.items.map(item => itemCard(item, registry)).join('')
          : '';
        status.setAttribute('data-library-state', current.status);
        results.setAttribute('aria-busy', String(current.status === 'loading'));
        retry.hidden = current.status !== 'error';
      };

      const onSubmit = event => {
        if (event.target !== form) return;
        event.preventDefault();
        lastRequest = { query: queryInput.value, contentType: typeInput.value };
        void service.list({ ...lastRequest });
      };
      const onClick = event => {
        const target = event.target instanceof Element
          ? event.target.closest('[data-library-item], [data-library-retry]') : null;
        if (!target) return;
        if (target.hasAttribute('data-library-retry')) {
          if (!retry.hidden) void service.list({ ...lastRequest });
          return;
        }
        const current = service.getState();
        navigate({
          routeKey: LIBRARY_ROUTE_KEYS.item,
          resourceId: target.getAttribute('data-library-item'),
          returnTo: {
            routeKey: LIBRARY_ROUTE_KEYS.browse,
            query: current.query,
            contentType: current.contentType,
          },
        });
      };

      form.addEventListener('submit', onSubmit);
      page.addEventListener('click', onClick);
      unsubscribe = service.subscribe(render);
      render(service.getState());
      void service.list({ ...lastRequest });
      return () => {
        disposed = true;
        form.removeEventListener('submit', onSubmit);
        page.removeEventListener('click', onClick);
        unsubscribe?.();
      };
    },
  });
}
