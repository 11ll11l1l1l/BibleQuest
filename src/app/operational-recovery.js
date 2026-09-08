const routeName = value => {
  const route = String(value || 'feature').trim().slice(0, 80) || 'feature';
  const label = route.replace(/[-_]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
  return Object.freeze({ route, label });
};

const asError = value => value instanceof Error ? value : new Error(String(value || 'Unknown feature failure.'));

export function createOperationalRecoveryService({ report = (error, context) => console.error('BibleQuest route recovery', context, error) } = {}) {
  if (typeof report !== 'function') throw new Error('Operational recovery requires a reporting callback.');
  let active = null;
  let sequence = 0;

  const capture = ({ route, error, retry, home } = {}) => {
    if (typeof retry !== 'function' || typeof home !== 'function') throw new Error('Operational recovery requires Retry and Home actions.');
    const identity = routeName(route);
    const view = Object.freeze({
      id: `recovery-${++sequence}`,
      route: identity.route,
      title: `${identity.label} could not open`,
      message: 'This feature did not finish loading. The BibleQuest shell is still available.'
    });
    active = { view, retry, home };
    try { const result=report(asError(error), Object.freeze({ id: view.id, route: view.route }));result?.catch?.(()=>{}); } catch {}
    return view;
  };

  const dismiss = id => {
    if (!active || (id && active.view.id !== id)) return false;
    active = null;
    return true;
  };

  const act = async kind => {
    const current = active;
    if (!current) return Object.freeze({ ok: false, failure: null });
    active = null;
    try {
      await current[kind]();
      return Object.freeze({ ok: !active, failure: active?.view || null });
    } catch (error) {
      const failure = capture({ route: current.view.route, error, retry: current.retry, home: current.home });
      return Object.freeze({ ok: false, failure });
    }
  };

  const run = ({ route, operation, retry, home } = {}) => {
    if (typeof operation !== 'function') throw new Error('Operational recovery requires a route operation.');
    try {
      const value = operation();
      active = null;
      return Object.freeze({ ok: true, value, failure: null });
    } catch (error) {
      return Object.freeze({ ok: false, value: undefined, failure: capture({ route, error, retry, home }) });
    }
  };

  return Object.freeze({
    run,
    capture,
    retry: () => act('retry'),
    home: () => act('home'),
    dismiss,
    getState: () => active?.view || null
  });
}
