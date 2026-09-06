import { createStore } from './store.js';
import { createRouter } from './router.js';
import { createSessionService } from './session.js';
import { createAccountService } from './account.js';
import { createReaderService } from './reader.js';
import { createApi } from '../core/api.js';
import { createBibleDataService } from '../core/bible.js';
import { createProgressService } from '../core/progress.js';
import { storage } from '../core/storage.js';
import { mountShell } from '../ui/shell.js';
import { homePage, pendingPage } from '../features/home/index.js';
import { accountPage } from '../features/account/index.js';
import { learnPage } from '../features/learn/index.js';
import { readerPage } from '../features/reader/index.js';
import { progressPage } from '../features/progress/index.js';

function start() {
  const root = document.getElementById('app');
  const store = createStore({
    route: 'home',
    bootedAt: Date.now(),
    session: Object.freeze({ status: 'booting', authenticated: false, remoteAvailable: true, user: null, expiresAt: null, error: '' })
  });
  const api = createApi();
  const bible = createBibleDataService();
  const progress = createProgressService({ storage, store });
  const session = createSessionService({ auth: api.auth, store });
  const account = createAccountService({ api, session, storage });
  const reader = createReaderService({ bible, storage, progress });
  let router;
  let shell;

  const routes = Object.freeze({
    home: () => homePage({ progress }),
    learn: () => learnPage({ onReader: () => router.navigate('reader') }),
    reader: () => readerPage({ reader }),
    play: () => pendingPage('Play'),
    grow: () => progressPage({ progress }),
    more: () => pendingPage('More'),
    account: () => accountPage({ account, session, onHome: () => router.navigate('home') }),
    'not-found': () => ({ title: 'Not found', html: '<section class="bq-panel"><h1>Page not found</h1><p>Use the navigation below to return to BibleQuest.</p></section>' })
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

  shell = mountShell(root, { onNavigate: route => router.navigate(route), onAccountOpen: () => router.navigate('account') });
  const syncShell = state => { shell.updateSession(state.session); shell.updateProgress(state.progress); };
  const unsubscribeStore = store.subscribe(syncShell);
  syncShell(store.getState());
  router.start();
  session.boot().then(() => {
    if (session.isAuthenticated()) account.ensureCurrentDevice().catch(error => console.warn('Device registration failed', error));
  }).catch(error => console.error('Session boot failed', error));

  window.addEventListener('pagehide', () => {
    unsubscribeStore();
    session.dispose();
  }, { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
