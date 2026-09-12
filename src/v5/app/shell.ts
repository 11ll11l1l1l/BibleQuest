import type { RouteDefinition, RouteSnapshot, RouteView } from '../platform/router/contracts';
import type { Router } from '../platform/router/router';
import { loadNotFound } from './routes';

export interface AppShell {
  renderRoute(snapshot: RouteSnapshot): Promise<void>;
  destroy(): void;
}

export function createAppShell(root: HTMLElement, routes: readonly RouteDefinition[], router: Router): AppShell {
  const shell = document.createElement('div');
  shell.className = 'v5-shell';

  const header = document.createElement('header');
  header.className = 'v5-header';
  const brand = document.createElement('div');
  brand.className = 'v5-brand';
  brand.innerHTML = '<strong>BibleQuest</strong><span>V5 greenfield lab</span>';

  const nav = document.createElement('nav');
  nav.className = 'v5-nav';
  nav.setAttribute('aria-label', 'Primary');
  for (const route of routes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.route = route.key;
    button.textContent = route.label;
    button.addEventListener('click', () => router.navigate(route.key));
    nav.append(button);
  }

  const main = document.createElement('main');
  main.id = 'v5-main';
  main.tabIndex = -1;

  header.append(brand, nav);
  shell.append(header, main);
  root.replaceChildren(shell);

  let cleanup: void | (() => void);
  let renderVersion = 0;

  return {
    async renderRoute(snapshot) {
      const version = ++renderVersion;
      cleanup?.();
      cleanup = undefined;
      main.setAttribute('aria-busy', 'true');

      try {
        const definition = routes.find((candidate) => candidate.key === snapshot.key);
        const module = await (definition?.load() ?? loadNotFound());
        if (version !== renderVersion) return;
        const view: RouteView = module.createView();
        cleanup = view.mount(main, snapshot);
        main.querySelectorAll('[data-route]').forEach((element) => element.removeAttribute('aria-current'));
        const active = nav.querySelector(`[data-route="${snapshot.key}"]`);
        active?.setAttribute('aria-current', 'page');
        main.focus({ preventScroll: true });
      } catch (error) {
        if (version !== renderVersion) return;
        console.error('V5 route render failed', error);
        const section = document.createElement('section');
        section.className = 'v5-card';
        const heading = document.createElement('h2');
        heading.textContent = 'BibleQuest could not open this page';
        const body = document.createElement('p');
        body.textContent = 'Try this page again. No data was changed.';
        section.append(heading, body);
        main.replaceChildren(section);
      } finally {
        if (version === renderVersion) main.removeAttribute('aria-busy');
      }
    },
    destroy() {
      cleanup?.();
      root.replaceChildren();
    }
  };
}
