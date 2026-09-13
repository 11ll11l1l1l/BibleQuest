import './styles.css';
import { createAppShell } from './app/shell';
import { routes } from './app/routes';
import { createUnavailableAssignmentsRepository } from './data/assignments/repository';
import { createUnavailableCongregationContext } from './platform/congregation/service';
import { createRouter } from './platform/router/router';
import { createSessionService, createUnavailableSessionSource } from './platform/session/service';

const root = document.querySelector<HTMLElement>('#v5-app');
if (!root) throw new Error('BibleQuest V5 root element was not found.');

const session = createSessionService(createUnavailableSessionSource());
const congregation = createUnavailableCongregationContext();
const assignments = createUnavailableAssignmentsRepository();
void session.boot();

let shell: ReturnType<typeof createAppShell> | null = null;
const router = createRouter(routes, (snapshot) => {
  void shell?.renderRoute(snapshot);
});

shell = createAppShell(root, routes, router, { session, congregation, assignments });
router.start();
