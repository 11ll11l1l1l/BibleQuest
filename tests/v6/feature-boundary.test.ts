import assert from 'node:assert/strict';
import test from 'node:test';

import { createFeatureCompatibilitySeam } from '../../src/v6/kernel/app-contracts.ts';
import {
  createFeatureCommandBoundary,
  type FeatureCommand,
  type FeatureEvent,
} from '../../src/v6/kernel/feature-boundary.ts';

type Command = FeatureCommand<Readonly<{ value: number }>>;
type Event = FeatureEvent<Readonly<{ value: number }>>;

test('disabled feature fails closed without invoking legacy-compatible handler', async () => {
  const boundary = createFeatureCommandBoundary(createFeatureCompatibilitySeam({ migrated: false }));
  let invoked = false;
  const events = await boundary.execute<Command, Event>(
    { feature: 'migrated', type: 'read', payload: { value: 1 } },
    async () => {
      invoked = true;
      return [];
    },
  );
  assert.equal(invoked, false);
  assert.deepEqual(events, []);
});

test('enabled feature emits only events owned by the same feature', async () => {
  const boundary = createFeatureCommandBoundary(createFeatureCompatibilitySeam({ migrated: true }));
  const events = await boundary.execute<Command, Event>(
    { feature: 'migrated', type: 'read', payload: { value: 2 } },
    async (command) => [
      { feature: command.feature, type: 'loaded', payload: command.payload },
      { feature: 'other', type: 'leak', payload: { value: 99 } },
    ],
  );
  assert.deepEqual(events, [{ feature: 'migrated', type: 'loaded', payload: { value: 2 } }]);
  assert.equal(Object.isFrozen(events), true);
  assert.equal(Object.isFrozen(events[0]), true);
});

test('aborted command cannot invoke or publish stale feature work', async () => {
  const boundary = createFeatureCommandBoundary(createFeatureCompatibilitySeam({ migrated: true }));
  const controller = new AbortController();
  controller.abort();
  let invoked = false;
  const events = await boundary.execute<Command, Event>(
    { feature: 'migrated', type: 'read', payload: { value: 3 } },
    async () => {
      invoked = true;
      return [{ feature: 'migrated', type: 'loaded', payload: { value: 3 } }];
    },
    controller.signal,
  );
  assert.equal(invoked, false);
  assert.deepEqual(events, []);
});
