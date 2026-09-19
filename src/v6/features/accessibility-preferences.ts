import type { FeatureCompatibilitySeam } from '../kernel/app-contracts.ts';
import {
  createFeatureCommandBoundary,
  type FeatureCommand,
  type FeatureEvent,
} from '../kernel/feature-boundary.ts';

export const ACCESSIBILITY_PREFERENCES_FEATURE = 'accessibility-preferences';

export type AccessibilityTextSize = 'normal' | 'large' | 'xlarge';
export type AccessibilityMotion = 'system' | 'reduce' | 'full';
export type AccessibilityContrast = 'normal' | 'strong';

export interface AccessibilityPreferencesSnapshot {
  readonly text: AccessibilityTextSize;
  readonly motion: AccessibilityMotion;
  readonly contrast: AccessibilityContrast;
  readonly effectiveMotion: Exclude<AccessibilityMotion, 'system'>;
}

/**
 * Minimal compatibility port for the released V5 accessibility service.
 * It deliberately contains no DOM or storage implementation details.
 */
export interface LegacyAccessibilityPreferencesPort {
  readonly subscribe: (listener: (snapshot: AccessibilityPreferencesSnapshot) => void) => () => void;
  readonly setText: (value: AccessibilityTextSize) => void;
  readonly setMotion: (value: AccessibilityMotion) => void;
  readonly setContrast: (value: AccessibilityContrast) => void;
  readonly reset: () => void;
}

type AccessibilityCommand = FeatureCommand<Readonly<{
  action: 'set-text' | 'set-motion' | 'set-contrast' | 'reset';
  value?: string;
}>>;

type AccessibilityEvent = FeatureEvent<Readonly<{
  action: AccessibilityCommand['payload']['action'];
}>>;

export interface AccessibilityPreferencesService extends LegacyAccessibilityPreferencesPort {
  readonly migrated: true;
}

function assertValue<T extends string>(value: string | undefined, allowed: readonly T[]): T {
  if (!value || !allowed.includes(value as T)) throw new Error('Invalid accessibility preference value.');
  return value as T;
}

/**
 * Migrates the low-risk accessibility-preference slice through the V6 feature
 * command boundary while preserving the exact legacy page-facing contract.
 * The legacy service remains the persistence owner during the compatibility phase.
 */
export function createAccessibilityPreferencesService(
  legacy: LegacyAccessibilityPreferencesPort,
  compatibility: FeatureCompatibilitySeam,
): AccessibilityPreferencesService {
  const boundary = createFeatureCommandBoundary(compatibility);

  const execute = (payload: AccessibilityCommand['payload']): void => {
    void boundary.execute<AccessibilityCommand, AccessibilityEvent>(
      { feature: ACCESSIBILITY_PREFERENCES_FEATURE, type: 'update', payload },
      async (command) => {
        const { action, value } = command.payload;
        if (action === 'set-text') legacy.setText(assertValue(value, ['normal', 'large', 'xlarge']));
        else if (action === 'set-motion') legacy.setMotion(assertValue(value, ['system', 'reduce', 'full']));
        else if (action === 'set-contrast') legacy.setContrast(assertValue(value, ['normal', 'strong']));
        else legacy.reset();
        return [{ feature: command.feature, type: 'updated', payload: { action } }];
      },
    );
  };

  return Object.freeze({
    migrated: true as const,
    subscribe: legacy.subscribe,
    setText: (value) => execute({ action: 'set-text', value }),
    setMotion: (value) => execute({ action: 'set-motion', value }),
    setContrast: (value) => execute({ action: 'set-contrast', value }),
    reset: () => execute({ action: 'reset' }),
  });
}
