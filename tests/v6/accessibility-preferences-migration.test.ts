import assert from 'node:assert/strict';
import test from 'node:test';

import { createFeatureCompatibilitySeam } from '../../src/v6/kernel/app-contracts.ts';
import {
  ACCESSIBILITY_PREFERENCES_FEATURE,
  createAccessibilityPreferencesService,
  type AccessibilityPreferencesSnapshot,
  type LegacyAccessibilityPreferencesPort,
} from '../../src/v6/features/accessibility-preferences.ts';

function legacyHarness() {
  const calls: string[] = [];
  const snapshot: AccessibilityPreferencesSnapshot = {
    text: 'normal',
    motion: 'system',
    contrast: 'normal',
    effectiveMotion: 'full',
  };
  const port: LegacyAccessibilityPreferencesPort = {
    subscribe(listener) {
      calls.push('subscribe');
      listener(snapshot);
      return () => calls.push('unsubscribe');
    },
    setText(value) { calls.push(`text:${value}`); },
    setMotion(value) { calls.push(`motion:${value}`); },
    setContrast(value) { calls.push(`contrast:${value}`); },
    reset() { calls.push('reset'); },
  };
  return { calls, port, snapshot };
}

test('migrated service preserves the released page-facing subscribe contract', () => {
  const { calls, port, snapshot } = legacyHarness();
  const service = createAccessibilityPreferencesService(
    port,
    createFeatureCompatibilitySeam({ [ACCESSIBILITY_PREFERENCES_FEATURE]: true }),
  );
  let received: AccessibilityPreferencesSnapshot | undefined;
  const unsubscribe = service.subscribe((value) => { received = value; });
  unsubscribe();
  assert.equal(service.migrated, true);
  assert.deepEqual(received, snapshot);
  assert.deepEqual(calls, ['subscribe', 'unsubscribe']);
});

test('enabled migration delegates all released accessibility mutations through the kernel boundary', async () => {
  const { calls, port } = legacyHarness();
  const service = createAccessibilityPreferencesService(
    port,
    createFeatureCompatibilitySeam({ [ACCESSIBILITY_PREFERENCES_FEATURE]: true }),
  );
  service.setText('xlarge');
  service.setMotion('reduce');
  service.setContrast('strong');
  service.reset();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, ['text:xlarge', 'motion:reduce', 'contrast:strong', 'reset']);
});

test('disabled migration fails closed and leaves legacy persistence untouched', async () => {
  const { calls, port } = legacyHarness();
  const service = createAccessibilityPreferencesService(
    port,
    createFeatureCompatibilitySeam({ [ACCESSIBILITY_PREFERENCES_FEATURE]: false }),
  );
  service.setText('large');
  service.setMotion('full');
  service.setContrast('strong');
  service.reset();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, []);
});
