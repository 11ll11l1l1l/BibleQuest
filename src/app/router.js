const normalize = raw => {
  const value = String(raw || '#/home').replace(/^#\/?/, '').split('?')[0].split('/')[0].trim();
  return value || 'home';
};

export function createRouter({ routes, onRoute }) {
  if (!routes || typeof routes !== 'object') throw new Error('Router requires a route table.');
  let started = false;
  let lastResolvedUrl = null;

  const resolve = (force = false) => {
    const signature = location.href;
    if (!force && signature === lastResolvedUrl) return;
    lastResolvedUrl = signature;
    const requested = normalize(location.hash);
    const route = Object.prototype.hasOwnProperty.call(routes, requested) ? requested : 'not-found';
    onRoute(route, routes[route], requested);
  };

  return Object.freeze({
    start() {
      if (started) return;
      started = true;
      window.addEventListener('popstate', resolve);
      window.addEventListener('hashchange', resolve);
      if (!location.hash) history.replaceState(null, '', '#/home');
      resolve(true);
    },
    navigate(route) {
      const target = normalize(route);
      const next = `#/${target}`;
      if (location.hash === next) return resolve(true);
      history.pushState(null, '', next);
      resolve(true);
    },
    current() { return normalize(location.hash); }
  });
}
