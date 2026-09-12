import type { RouteDefinition, RouteKey, RouteSnapshot } from './contracts';

const normalize = (raw: string): string => {
  const value = String(raw || '#/home').replace(/^#\/?/, '').split('?')[0]?.split('/')[0]?.trim();
  return value || 'home';
};

export interface Router {
  start(): void;
  navigate(route: RouteKey): void;
  current(): RouteSnapshot;
  stop(): void;
}

export function createRouter(
  definitions: readonly RouteDefinition[],
  onRoute: (snapshot: RouteSnapshot) => void
): Router {
  const known = new Set(definitions.map(({ key }) => key));
  let started = false;
  let lastHref = '';

  const snapshot = (): RouteSnapshot => {
    const requested = normalize(location.hash);
    const key: RouteKey = known.has(requested as RouteDefinition['key'])
      ? (requested as RouteDefinition['key'])
      : 'not-found';
    return Object.freeze({ key, requested, href: location.href });
  };

  const resolve = (force = false) => {
    if (!force && location.href === lastHref) return;
    lastHref = location.href;
    onRoute(snapshot());
  };

  const onLocationChange = () => resolve(false);

  return Object.freeze({
    start() {
      if (started) return;
      started = true;
      window.addEventListener('popstate', onLocationChange);
      window.addEventListener('hashchange', onLocationChange);
      if (!location.hash) history.replaceState(null, '', '#/home');
      resolve(true);
    },
    navigate(route) {
      const next = `#/${route}`;
      if (location.hash === next) return resolve(true);
      history.pushState(null, '', next);
      resolve(true);
    },
    current: snapshot,
    stop() {
      if (!started) return;
      started = false;
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    }
  });
}
