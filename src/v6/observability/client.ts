import type {
  TelemetryActor,
  TelemetryEvent,
  TelemetryEventName,
  TelemetrySendResult,
  TelemetrySink,
} from './contracts.ts';
import { sanitizeTelemetryDimensions } from './policy.ts';

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{5,99}$/;
const SHA_PATTERN = /^[0-9a-f]{7,64}$/i;

export interface TelemetryClientOptions {
  readonly sink: TelemetrySink;
  readonly buildSha: string;
  readonly actor: () => TelemetryActor;
  readonly clock?: () => Date;
  readonly eventId?: () => string;
}

function normalizeActor(actor: TelemetryActor): TelemetryActor {
  if (actor?.kind === 'registered') return Object.freeze({ kind: 'registered' });
  if (actor?.kind !== 'guest') throw new Error('Telemetry actor must be guest or registered.');
  const guestSessionId = String(actor.guestSessionId ?? '').trim();
  if (!ID_PATTERN.test(guestSessionId)) throw new Error('Guest telemetry requires a valid session-scoped id.');
  return Object.freeze({ kind: 'guest', guestSessionId });
}

function normalizeBuildSha(value: string): string {
  const buildSha = String(value ?? '').trim();
  if (!SHA_PATTERN.test(buildSha)) throw new Error('Telemetry requires a valid build SHA.');
  return buildSha;
}

export function createTelemetryClient(options: TelemetryClientOptions) {
  if (!options?.sink?.send || typeof options.actor !== 'function') {
    throw new Error('Telemetry requires sink and actor boundaries.');
  }
  const buildSha = normalizeBuildSha(options.buildSha);
  const clock = options.clock ?? (() => new Date());
  let sequence = 0;
  const eventId = options.eventId ?? (() => `telemetry-${Date.now().toString(36)}-${++sequence}`);

  async function track(
    name: TelemetryEventName,
    dimensions: Readonly<Record<string, unknown>> = Object.freeze({}),
  ): Promise<TelemetrySendResult> {
    const id = String(eventId() ?? '').trim();
    if (!ID_PATTERN.test(id)) throw new Error('Telemetry event id is invalid.');
    const occurred = clock();
    if (!(occurred instanceof Date) || !Number.isFinite(occurred.getTime())) {
      throw new Error('Telemetry clock returned an invalid time.');
    }
    const event: TelemetryEvent = Object.freeze({
      schemaVersion: 1,
      id,
      name,
      occurredAt: occurred.toISOString(),
      buildSha,
      actor: normalizeActor(options.actor()),
      dimensions: sanitizeTelemetryDimensions(name, dimensions),
    });

    try {
      await options.sink.send(event);
      return Object.freeze({ sent: true, event });
    } catch {
      // Telemetry must never break the product path it is observing.
      return Object.freeze({ sent: false, event, reason: 'sink-failed' as const });
    }
  }

  return Object.freeze({ track });
}
