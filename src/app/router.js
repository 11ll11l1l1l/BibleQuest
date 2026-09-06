const normalize = raw => {
  const value = String(raw || '#/home').replace(/^#\/?/, '').split('?')[0].split('/')[0].trim();
  return value || 'home';
};

export function createRouter({ routes, onRoute }) {
  if (!routes || typeof routes !== 'object') throw new Error('Router requires a route table.');
  let started = false;

  const resolve = () => {
    const requested = normalize(location.hash);
    const route = Object.prototype.hasOwnProperty.call(routes, requested) ? requested : 'not-found';
    onRoute(route, routes[route], requested);
  };

  return Object.freeze({
    start() {
      if (started) return;
      started = true;
      window.addEventListener('hashchange', resolve);
      if (!location.hash) history.replaceState(null, '', '#/home');
      resolve();
    },
    navigate(route) {
      const target = normalize(route);
      const next = `#/${target}`;
      if (location.hash === next) return resolve();
      location.hash = next;
    },
    current() { return normalize(location.hash); }
  });
}
