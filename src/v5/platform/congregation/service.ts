import type { CongregationContextService, CongregationContextSnapshot } from './contracts';

const unavailableSnapshot: CongregationContextSnapshot = Object.freeze({
  status: 'unavailable',
  active: null,
  error: 'Congregation context is not connected in the greenfield lab yet.'
});

export function createUnavailableCongregationContext(): CongregationContextService {
  return Object.freeze({
    getSnapshot: () => unavailableSnapshot,
    subscribe(listener) {
      listener(unavailableSnapshot);
      return () => {};
    }
  });
}
