import type { TelemetryDimension, TelemetryEventName } from './contracts.ts';

const EVENT_DIMENSIONS: Readonly<Record<TelemetryEventName, readonly string[]>> = Object.freeze({
  'app.session.started': Object.freeze(['installMode', 'online', 'language']),
  'route.viewed': Object.freeze(['routeId']),
  'feature.opened': Object.freeze(['featureId']),
  'feature.completed': Object.freeze(['featureId']),
  'game.started': Object.freeze(['gameId', 'mode']),
  'game.completed': Object.freeze(['gameId', 'mode', 'completed']),
  'assignment.viewed': Object.freeze(['source']),
  'assignment.completed': Object.freeze(['source']),
  'error.classified': Object.freeze(['code', 'category', 'routeId']),
});

const FORBIDDEN_KEY = /(token|authorization|password|secret|email|name|note|content|answer|query|reflection|prayer|scripture|verse|chapter|book|user.?id|account.?id|congregation.?id|submission)/i;
const SAFE_KEY = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
const SAFE_STRING = /^[\p{L}\p{N} ._:/-]{0,120}$/u;

function sanitizeValue(value: unknown): TelemetryDimension | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().slice(0, 120);
  return SAFE_STRING.test(normalized) ? normalized : null;
}

export function sanitizeTelemetryDimensions(
  name: TelemetryEventName,
  input: Readonly<Record<string, unknown>> = Object.freeze({}),
): Readonly<Record<string, TelemetryDimension>> {
  const allow = new Set(EVENT_DIMENSIONS[name]);
  const output: Record<string, TelemetryDimension> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (!allow.has(key) || !SAFE_KEY.test(key) || FORBIDDEN_KEY.test(key)) continue;
    const value = sanitizeValue(raw);
    if (value !== null) output[key] = value;
  }
  return Object.freeze(output);
}

export function telemetryDimensionAllowlist(name: TelemetryEventName): readonly string[] {
  return EVENT_DIMENSIONS[name];
}
