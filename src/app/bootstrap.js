import { createStore } from './store.js';
import { createRouter } from './router.js';
import { createSessionService } from './session.js';
import { createApi } from '../core/api.js';
import { mountShell } from '../ui/shell.js';
import { homePage, pendingPage } from '../features/home/index.js';
import { accountPage } from '../features/account/index.js';

function start() {
  const root = document.getElementById('app');
  const store = createStore({
    route: 'home',
    bootedAt: Date.now(),
    session: Object.freeze({
      status: 'booting',
      authenticated: false,
      remoteAvailable: true,
      user: null,
      expiresAt: null,
      error: ''
    })
  });
  const api = createApi();
  const session = createSessionService({ auth: api.auth, store });
  let router;
  let shell;

  const routes = Object.freeze({
    home: homePage,
    learn: () => pendingPage('Learn'),
    play: () => pendingPage('Play'),
    grow: () => pendingPage('Grow'),
    more: () => pendingPage('More'),
    account: () => accountPage({ session, onHome: () => router.navigate('home') }),
    'not-found': () => ({
      title: 'Not found',
      html: '<section class="bq-panel"><h1>Page not found</h1><p>Use the navigation below to return to BibleQuest.</p></section>'
    })
  });

  router = createRouter({
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

  shell = mountShell(root, {
    onNavigate: route => router.navigate(route),
    onAccountOpen: () => router.navigate('account')
  });

  const unsubscribeStore = store.subscribe(state => shell.updateSession(state.session));
  shell.updateSession(store.getState().session);
  router.start();
  session.boot().catch(error => {
    console.error('Session boot failed', error);
  });

  window.addEventListener('pagehide', () => {
    unsubscribeStore();
    session.dispose();
  }, { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
