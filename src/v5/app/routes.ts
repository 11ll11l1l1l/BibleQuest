import type { RouteDefinition, RouteLoader } from '../platform/router/contracts';

const placeholder = (title: string): RouteLoader => async () => ({
  createView: () => ({
    mount(container) {
      const section = document.createElement('section');
      section.className = 'v5-card';
      const heading = document.createElement('h2');
      heading.textContent = title;
      const body = document.createElement('p');
      body.textContent = 'This route is tracked for parity but has not been migrated into the greenfield runtime yet.';
      section.append(heading, body);
      container.replaceChildren(section);
    }
  })
});

export const routes: readonly RouteDefinition[] = Object.freeze([
  { key: 'home', label: 'Home', load: () => import('../features/home/view') },
  { key: 'reader', label: 'Read', load: placeholder('Reader') },
  { key: 'games', label: 'Play', load: placeholder('Games') },
  { key: 'community', label: 'Community', load: placeholder('Community') },
  { key: 'more', label: 'More', load: placeholder('More') },
  { key: 'account', label: 'Account', load: () => import('../features/account/view') }
]);

export const loadNotFound: RouteLoader = () => import('../features/not-found/view');
