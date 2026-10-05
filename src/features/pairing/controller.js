export function createPairingController({ service, pairId = '', getActorId }) {
  let generation = 0, disposed = false;
  const listeners = new Set();
  const initial = () => Object.freeze({ status: 'idle', pair: null, candidates: Object.freeze([]), error: null, actorId: '' });
  let state = initial();
  const publish = patch => { state = Object.freeze({ ...state, ...patch }); for (const listener of listeners) listener(state); return state; };
  async function run(status, operation) {
    if (disposed || ['loading','saving'].includes(state.status)) return null;
    const token = ++generation, actorId = getActorId();
    publish({ status, error: null });
    try {
      const result = await operation();
      if (disposed || token !== generation) return null;
      if (actorId !== getActorId()) { publish(initial()); return null; }
      publish({ ...result, actorId, status: 'ready' });
      return state;
    } catch {
      if (!disposed && token === generation) publish(actorId !== getActorId() ? initial() : { status: 'error', error: 'v7.pairing.error' });
      return null;
    }
  }
  return Object.freeze({
    getState: () => state,
    load: () => run('loading', async () => { const id = state.pair?.id || pairId; return id ? { pair: await service.getPair(id) } : { candidates: await service.listPairCandidates() }; }),
    invite: input => run('saving', async () => ({ pair: await service.invitePair(input), candidates: Object.freeze([]) })),
    act(action, options) {
      if (!state.pair) return Promise.resolve(null);
      const id = state.pair.id;
      return run('saving', async () => ({ pair: await service.transitionPair(id, action, options) }));
    },
    invalidate() { generation++; if (!disposed) { state = initial(); for (const listener of listeners) listener(state); } },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { disposed = true; generation++; listeners.clear(); state = initial(); },
  });
}
