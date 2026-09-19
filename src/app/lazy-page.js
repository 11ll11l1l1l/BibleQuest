const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const humanize = value => String(value || 'feature')
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, character => character.toUpperCase());

export function createLazyPage({ key, load, create }) {
  if (typeof load !== 'function') throw new Error(`Lazy page loader is missing for ${key || 'feature'}.`);
  if (typeof create !== 'function') throw new Error(`Lazy page factory is missing for ${key || 'feature'}.`);

  const routeKey = String(key || 'feature').trim() || 'feature';
  const loadingTitle = humanize(routeKey);

  return Object.freeze({
    title: loadingTitle,
    html: `<section class="bq-panel" data-lazy-route="${escapeHtml(routeKey)}" role="status"><p class="bq-eyebrow">BIBLEQUEST</p><h1>Opening ${escapeHtml(loadingTitle)}…</h1><p>Loading only the code this page needs.</p></section>`,
    mount(root) {
      const host = root.querySelector('[data-lazy-route]');
      if (!host) throw new Error(`Lazy page host is missing for ${routeKey}.`);

      let disposed = false;
      let pageCleanup = null;
      let operation = 0;

      const renderFailure = error => {
        if (disposed) return;
        host.innerHTML = `<section role="alert"><p class="bq-eyebrow">LOAD ERROR</p><h1>${escapeHtml(loadingTitle)} could not open</h1><p>${escapeHtml(error?.message || 'The page module did not finish loading.')}</p><button type="button" class="bq-secondary-button" data-lazy-retry>Retry</button></section>`;
      };

      const loadPage = async () => {
        const id = ++operation;
        host.setAttribute('aria-busy', 'true');
        try {
          const module = await load();
          if (disposed || id !== operation) return;
          const page = create(module);
          if (!page || typeof page !== 'object' || typeof page.html !== 'string') {
            throw new Error(`Lazy page factory returned an invalid page for ${routeKey}.`);
          }

          pageCleanup?.();
          pageCleanup = null;
          host.innerHTML = page.html;
          host.removeAttribute('aria-busy');
          host.removeAttribute('role');
          document.title = page.title ? `${page.title} · BibleQuest` : 'BibleQuest';

          const cleanup = page.mount?.(host);
          if (cleanup && typeof cleanup.then === 'function') {
            const resolved = await cleanup;
            if (disposed || id !== operation) {
              if (typeof resolved === 'function') resolved();
              return;
            }
            if (typeof resolved === 'function') pageCleanup = resolved;
          } else if (typeof cleanup === 'function') {
            pageCleanup = cleanup;
          }
        } catch (error) {
          if (disposed || id !== operation) return;
          host.removeAttribute('aria-busy');
          renderFailure(error);
        }
      };

      const onClick = event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target?.closest('[data-lazy-retry]')) return;
        host.innerHTML = `<p role="status">Retrying ${escapeHtml(loadingTitle)}…</p>`;
        void loadPage();
      };

      host.addEventListener('click', onClick);
      void loadPage();

      return () => {
        disposed = true;
        operation += 1;
        host.removeEventListener('click', onClick);
        pageCleanup?.();
        pageCleanup = null;
      };
    },
  });
}
