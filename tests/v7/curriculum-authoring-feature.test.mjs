import test from 'node:test';
import assert from 'node:assert/strict';
import { createCurriculumAuthoringFeature } from '../../src/features/curriculum-authoring/feature.js';

const context = () => ({
  userId: '11111111-1111-4111-8111-111111111111',
  congregationId: '22222222-2222-4222-8222-222222222222',
  canAuthor: true,
});

function assertFeatureShape(feature) {
  assert.ok(Object.isFrozen(feature));
  assert.ok(Object.isFrozen(feature.repositories));
  assert.ok(Object.isFrozen(feature.publication));
  assert.equal(typeof feature.controller.load, 'function');
  assert.equal(typeof feature.controller.dispose, 'function');
  assert.equal(typeof feature.repositories.tracks.listTracks, 'function');
  assert.equal(typeof feature.repositories.hierarchy.listModules, 'function');
  assert.equal(typeof feature.repositories.revisions.listRevisions, 'function');
  assert.equal(typeof feature.repositories.readiness.inspect, 'function');
  assert.equal(typeof feature.preparePublication, 'function');
  assert.equal(typeof feature.publication.publish, 'function');
  assert.equal(typeof feature.publication.withdraw, 'function');
}

test('composes the complete curriculum-authoring boundary without owning shared lifecycle', () => {
  const feature = createCurriculumAuthoringFeature({
    client: { from() { throw new Error('database should not be touched during composition'); } },
    getContext: context,
  });
  assertFeatureShape(feature);
});

test('accepts the existing async client-provider boundary', () => {
  const provider = async () => ({ from() { throw new Error('database should not be touched during composition'); } });
  assertFeatureShape(createCurriculumAuthoringFeature({ client: provider, getContext: context }));
});

test('fails closed when shared client or context ownership is missing', () => {
  assert.throws(() => createCurriculumAuthoringFeature({ getContext: context }), /authenticated database client/);
  assert.throws(() => createCurriculumAuthoringFeature({ client: {} }), /account\/congregation context owner/);
});
