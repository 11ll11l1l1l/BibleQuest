import { createStore } from './store.js';
import { createRouter } from './router.js';
import { mountShell } from '../ui/shell.js';
import { homePage, pendingPage } from '../features/home/index.js';

const routes = Object.freeze({
  home: homePage,
  learn: () => pendingPage('Learn'),
  play: () => pendingPage('Play'),
  grow: () => pendingPage('Grow'),
  more: () => pendingPage('More'),
  'not-found': () => ({ title: 'Not found', html: '<section class="bq-panel"><h1>Page not found</h1><p>Use the navigation below to return to BibleQuest.</p></section>' })
});

function start() {
  const root = document.getElementById('app');
  const store = createStore({ route: 'home', bootedAt: Date.now() });
  let shell;

  const router = createRouter({
    routes,
    onRoute(route, renderPage) {
      try {
        store.setState(current => ({ ...current, route }));
        shell.render(route, renderPage());
      } catch (error) {
        console.error(error);
        shell.renderError(error?.message || 'Unknown application error.');
      }
    }
  });

  shell = mountShell(root, { onNavigate: route => router.navigate(route) });
  router.start();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
