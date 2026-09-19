import type { FeatureCompatibilitySeam } from './app-contracts.ts';

export interface FeatureCommand<TPayload = unknown> {
  readonly feature: string;
  readonly type: string;
  readonly payload: TPayload;
}

export interface FeatureEvent<TPayload = unknown> {
  readonly feature: string;
  readonly type: string;
  readonly payload: TPayload;
}

export type FeatureCommandHandler<TCommand extends FeatureCommand, TEvent extends FeatureEvent> = (
  command: TCommand,
  signal: AbortSignal,
) => Promise<readonly TEvent[]>;

export interface FeatureCommandBoundary {
  readonly execute: <TCommand extends FeatureCommand, TEvent extends FeatureEvent>(
    command: TCommand,
    handler: FeatureCommandHandler<TCommand, TEvent>,
    signal?: AbortSignal,
  ) => Promise<readonly TEvent[]>;
}

export function createFeatureCommandBoundary(compatibility: FeatureCompatibilitySeam): FeatureCommandBoundary {
  return Object.freeze({
    async execute<TCommand extends FeatureCommand, TEvent extends FeatureEvent>(
      command: TCommand,
      handler: FeatureCommandHandler<TCommand, TEvent>,
      signal: AbortSignal = new AbortController().signal,
    ): Promise<readonly TEvent[]> {
      const feature = String(command.feature ?? '').trim();
      if (!feature || !compatibility.enabled(feature)) return Object.freeze([]);
      if (signal.aborted) return Object.freeze([]);

      const events = await handler(Object.freeze({ ...command, feature }) as TCommand, signal);
      if (signal.aborted) return Object.freeze([]);

      return Object.freeze(
        events
          .filter((event) => event.feature === feature)
          .map((event) => Object.freeze({ ...event } as TEvent)),
      );
    },
  });
}
