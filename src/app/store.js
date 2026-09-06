const freeze = value => Object.freeze(value);

export function createStore(initialState = {}) {
  let state = freeze({ ...initialState });
  const listeners = new Set();

  return freeze({
    getState() { return state; },
    setState(patch) {
      const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
      state = freeze({ ...next });
      listeners.forEach(listener => listener(state));
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
}
