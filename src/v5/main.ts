import './styles.css';
import { createAppShell } from './app/shell';
import { routes } from './app/routes';
import { createRouter } from './platform/router/router';
import { createSessionService, createUnavailableSessionSource } from './platform/session/service';

const root = document.querySelector<HTMLElement>('#v5-app');
if (!root) throw new Error('BibleQuest V5 root element was not found.');

const session = createSessionService(createUnavailableSessionSource());
void session.boot();

let shell: ReturnType<typeof createAppShell> | null = null;
const router = createRouter(routes, (snapshot) => {
  void shell?.renderRoute(snapshot);
});

shell = createAppShell(root, routes, router, { session });
router.start();
