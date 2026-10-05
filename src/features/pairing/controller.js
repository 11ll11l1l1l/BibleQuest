export function createPairingController({ service, pairId = '', getActorId, createInvitationId = () => globalThis.crypto.randomUUID() }) {
  let generation = 0, disposed = false, invitationAttempt = null;
  const listeners = new Set();
  const initial = () => Object.freeze({ status: 'idle', pair: null, candidates: Object.freeze([]), error: null, actorId: '', invitationDraft: null });
  let state = initial();
  const publish = patch => { state = Object.freeze({ ...state, ...patch }); for (const listener of listeners) listener(state); return state; };
  async function run(status, operation) {
    if (disposed || ['loading','saving'].includes(state.status)) return null;
    const token = ++generation, actorId = getActorId();
    publish({ status, error: null });
    try {
      const result = await operation();
      if (disposed || token !== generation) return null;
      if (actorId !== getActorId()) { invitationAttempt = null; publish(initial()); return null; }
      publish({ ...result, actorId, status: 'ready' });
      return state;
    } catch {
      if (!disposed && token === generation) {
        if (actorId !== getActorId()) invitationAttempt = null;
        publish(actorId !== getActorId() ? initial() : { status: 'error', error: 'v7.pairing.error' });
      }
      return null;
    }
  }
  return Object.freeze({
    getState: () => state,
    load: () => run('loading', async () => { const id = state.pair?.id || pairId; return id ? { pair: await service.getPair(id) } : { candidates: await service.listPairCandidates() }; }),
    invite(input) {
      if (disposed || ['loading','saving'].includes(state.status)) return Promise.resolve(null);
      const draft = Object.freeze({ otherUserId: String(input?.otherUserId || ''), role: String(input?.role || '') });
      publish({ invitationDraft: draft });
      return run('saving', async () => {
        const key = JSON.stringify([getActorId(),draft.otherUserId,draft.role]);
        if (invitationAttempt?.key !== key) invitationAttempt = { key, id: createInvitationId() };
        const pair = await service.invitePair({ ...draft, invitationId: invitationAttempt.id });
        return { pair, candidates: Object.freeze([]), invitationDraft: null };
      });
    },
    act(action, options) {
      if (!state.pair) return Promise.resolve(null);
      const id = state.pair.id;
      return run('saving', async () => ({ pair: await service.transitionPair(id, action, options) }));
    },
    invalidate() { generation++; invitationAttempt = null; if (!disposed) { state = initial(); for (const listener of listeners) listener(state); } },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { disposed = true; generation++; invitationAttempt = null; listeners.clear(); state = initial(); },
  });
}
