export type TelemetryActorKind = 'guest' | 'registered';

export type TelemetryEventName =
  | 'app.session.started'
  | 'route.viewed'
  | 'feature.opened'
  | 'feature.completed'
  | 'game.started'
  | 'game.completed'
  | 'assignment.viewed'
  | 'assignment.completed'
  | 'error.classified';

export type TelemetryDimension = string | number | boolean;

export interface TelemetryActor {
  readonly kind: TelemetryActorKind;
  /**
   * Guest session ids are intentionally session-scoped. Registered identity is
   * resolved by the authenticated server boundary and is never copied into the
   * telemetry payload as a raw user id.
   */
  readonly guestSessionId?: string;
}

export interface TelemetryEvent {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly name: TelemetryEventName;
  readonly occurredAt: string;
  readonly buildSha: string;
  readonly actor: TelemetryActor;
  readonly dimensions: Readonly<Record<string, TelemetryDimension>>;
}

export interface TelemetrySink {
  send(event: TelemetryEvent): Promise<void>;
}

export interface TelemetrySendResult {
  readonly sent: boolean;
  readonly event: TelemetryEvent;
  readonly reason?: 'sink-failed';
}
