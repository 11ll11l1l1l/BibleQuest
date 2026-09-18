export interface RequestHandle {
  readonly key: string;
  readonly sequence: number;
  readonly signal: AbortSignal;
  readonly isCurrent: () => boolean;
  readonly commit: (effect: () => void) => boolean;
  readonly finish: () => void;
  readonly cancel: (reason?: unknown) => void;
}

export interface RequestCoordinator {
  readonly begin: (key: string) => RequestHandle;
  readonly cancel: (key: string, reason?: unknown) => boolean;
  readonly cancelAll: (reason?: unknown) => void;
  readonly activeKeys: () => readonly string[];
}

interface RequestSlot {
  readonly sequence: number;
  readonly controller: AbortController;
}

export function createRequestCoordinator(): RequestCoordinator {
  const slots = new Map<string, RequestSlot>();
  let sequence = 0;

  const normalizeKey = (value: string): string => {
    const key = String(value ?? '').trim();
    if (!key) throw new Error('Request coordinator key is required.');
    return key;
  };

  const cancel = (rawKey: string, reason: unknown = 'Superseded request'): boolean => {
    const key = normalizeKey(rawKey);
    const slot = slots.get(key);
    if (!slot) return false;
    slots.delete(key);
    slot.controller.abort(reason);
    return true;
  };

  const begin = (rawKey: string): RequestHandle => {
    const key = normalizeKey(rawKey);
    cancel(key);

    const controller = new AbortController();
    const slot: RequestSlot = Object.freeze({ sequence: ++sequence, controller });
    slots.set(key, slot);

    const isCurrent = (): boolean => slots.get(key) === slot && !controller.signal.aborted;
    const commit = (effect: () => void): boolean => {
      if (!isCurrent()) return false;
      effect();
      return true;
    };
    const finish = (): void => {
      if (slots.get(key) === slot) slots.delete(key);
    };
    const cancelHandle = (reason: unknown = 'Cancelled request'): void => {
      if (slots.get(key) === slot) slots.delete(key);
      if (!controller.signal.aborted) controller.abort(reason);
    };

    return Object.freeze({
      key,
      sequence: slot.sequence,
      signal: controller.signal,
      isCurrent,
      commit,
      finish,
      cancel: cancelHandle,
    });
  };

  const cancelAll = (reason: unknown = 'Request scope reset'): void => {
    const active = [...slots.entries()];
    slots.clear();
    for (const [, slot] of active) slot.controller.abort(reason);
  };

  const activeKeys = (): readonly string[] => Object.freeze([...slots.keys()]);

  return Object.freeze({ begin, cancel, cancelAll, activeKeys });
}
