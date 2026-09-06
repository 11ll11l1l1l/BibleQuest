const NAV = [
  ['home','Home','⌂'],
  ['learn','Learn','▤'],
  ['play','Play','◆'],
  ['grow','Grow','◌'],
  ['more','More','⋯']
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function mountShell(root, { onNavigate }) {
  if (!root) throw new Error('App root is required.');
  if (root.querySelector('[data-bq-shell="v3"]')) throw new Error('BibleQuest shell is already mounted.');

  root.innerHTML = `
    <div class="bq-shell" data-bq-shell="v3">
      <header class="bq-topbar">
        <a class="bq-brand" href="#/home" aria-label="BibleQuest home">
          <span class="bq-brand-mark">BQ</span>
          <span><strong>BibleQuest</strong><small>Rebuild v3</small></span>
        </a>
        <span class="bq-build-chip">foundation</span>
      </header>
      <main class="bq-main" id="bq-view" tabindex="-1"></main>
      <nav class="bq-nav" aria-label="Primary navigation">
        ${NAV.map(([id,label,icon]) => `<a href="#/${id}" data-route-link="${id}"><span aria-hidden="true">${icon}</span><small>${label}</small></a>`).join('')}
      </nav>
    </div>`;

  root.querySelectorAll('[data-route-link]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      onNavigate(link.dataset.routeLink);
    });
  });

  const view = root.querySelector('#bq-view');
  return Object.freeze({
    render(route, page) {
      root.querySelectorAll('[data-route-link]').forEach(link => link.toggleAttribute('aria-current', link.dataset.routeLink === route));
      view.innerHTML = page.html;
      document.title = page.title ? `${page.title} · BibleQuest` : 'BibleQuest';
      view.focus({ preventScroll: true });
    },
    renderError(message) {
      view.innerHTML = `<section class="bq-panel"><h1>Something went wrong</h1><p>${escapeHtml(message)}</p></section>`;
    }
  });
}
