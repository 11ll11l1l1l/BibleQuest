import assert from 'node:assert/strict';
import test from 'node:test';

import { createAccessibilityService } from '../../src/app/accessibility.js';

function harness(initial: unknown = undefined) {
  const writes: Array<[string, unknown]> = [];
  const storage = {
    read(_key: string, fallback: unknown) { return initial ?? fallback; },
    write(key: string, value: unknown) { writes.push([key, value]); },
  };
  const mediaListeners = new Set<() => void>();
  const mediaQuery = {
    matches: false,
    addEventListener(_type: string, listener: () => void) { mediaListeners.add(listener); },
    removeEventListener(_type: string, listener: () => void) { mediaListeners.delete(listener); },
  };
  return { storage, mediaQuery, writes, mediaListeners };
}

test('live accessibility service preserves initial snapshot and subscription contract', () => {
  const { storage, mediaQuery } = harness({ text: 'large', motion: 'reduce', contrast: 'strong' });
  const service = createAccessibilityService({ storage, mediaQuery });
  const snapshots: unknown[] = [];
  const unsubscribe = service.subscribe((value: unknown) => snapshots.push(value));

  assert.deepEqual(service.getState(), {
    text: 'large', motion: 'reduce', contrast: 'strong', reducedMotion: true, effectiveMotion: 'reduce',
  });
  assert.deepEqual(snapshots, [service.getState()]);
  unsubscribe();
  service.dispose();
});

test('live cutover routes preference mutations to released storage and subscribers', async () => {
  const { storage, mediaQuery, writes } = harness();
  const service = createAccessibilityService({ storage, mediaQuery });
  const snapshots: Array<{ text: string; motion: string; contrast: string }> = [];
  service.subscribe((value: { text: string; motion: string; contrast: string }) => snapshots.push(value));

  service.setText('xlarge');
  service.setMotion('reduce');
  service.setContrast('strong');
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(writes.length, 3);
  assert.deepEqual(writes.at(-1), ['accessibility-settings', { text: 'xlarge', motion: 'reduce', contrast: 'strong' }]);
  assert.equal(snapshots.at(-1)?.text, 'xlarge');
  assert.equal(snapshots.at(-1)?.motion, 'reduce');
  assert.equal(snapshots.at(-1)?.contrast, 'strong');
});

test('live cutover preserves validation and reset defaults', async () => {
  const { storage, mediaQuery, writes } = harness();
  const service = createAccessibilityService({ storage, mediaQuery });

  service.setText('invalid');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(writes.length, 0);

  service.setText('large');
  service.reset();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(writes.at(-1), ['accessibility-settings', { text: 'normal', motion: 'system', contrast: 'normal' }]);
});
