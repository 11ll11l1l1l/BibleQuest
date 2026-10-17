import test from 'node:test';
import assert from 'node:assert/strict';
import { planV7DevotionalArtwork } from '../../scripts/v7-devotional-visual-queue.mjs';

const item = (i, overrides = {}) => ({
  id: 'devotional.biblequest.sample.' + String(i).padStart(2, '0'),
  type: 'devotional', revision: 'r1', publicationState: 'pending_review',
  source: { kind: 'first_party' }, sourceContent: { title: 'Sample ' + i },
  rights: { status: 'verified', allowedUses: ['display', 'modify'] },
  taxonomyLinks: [{ kind: 'emotion', id: 'emotion.hope' }],
  ...overrides
});
const docs = items => [{ path: 'content/v7/devotionals/sample.json', items }];

test('stable, disjoint five-agent assignments independent of completion order', () => {
  const items = Array.from({ length: 12 }, (_, i) => item(i));
  const initial = planV7DevotionalArtwork(docs(items));
  assert.equal(initial.summary.eligibleForOriginalArtPlanning, 12);
  assert.deepEqual(initial.agents.map(a => a.tasks.length), [3, 3, 2, 2, 2]);
  const done = { assetId: 'cover-1', contentId: items[0].id, contentType: 'devotional',
    visualRole: 'devotional_cover', bundleStatus: 'complete' };
  const after = planV7DevotionalArtwork(docs(items), [done]);
  assert.equal(after.summary.completeBundles, 1);
  assert.equal(after.summary.remainingArtAssignments, 11);
  assert.deepEqual(after.agents.map(a => a.tasks.map(t => t.id)),
    initial.agents.map(a => a.tasks.map(t => t.id)));
  assert.equal(after.agents[0].nextWork.id, items[5].id);
});

test('unverified rights are excluded, and planning cannot authorize publication', () => {
  const work = planV7DevotionalArtwork(docs([item(1), item(2, {
    rights: { status: 'pending', allowedUses: ['display', 'modify'] }
  }), item(3, { source: { kind: 'external' } })]));
  assert.equal(work.summary.withheldForRights, 2);
  assert.equal(work.agents[0].tasks.length, 1);
  assert.equal(work.agents[0].tasks[0].publishEligibleFromThisReport, false);
  assert.equal(work.agents[0].tasks[0].liveTextRequired, true);
});

test('a clean master is counted but not misreported as a complete bundle', () => {
  const input = item(2);
  const art = { assetId: 'cover-2', contentId: input.id, contentType: 'devotional',
    visualRole: 'devotional_cover', bundleStatus: 'partial' };
  const report = planV7DevotionalArtwork(docs([input]), [art]);
  assert.equal(report.summary.auditedMasters, 1);
  assert.equal(report.summary.completeBundles, 0);
  assert.equal(report.agents[0].nextWork.nextAction, 'complete_qa_and_derivatives');
});

test('reject duplicate IDs and unknown audited-content references', () => {
  assert.throws(() => planV7DevotionalArtwork(docs([item(1), item(1)])), /duplicate/);
  assert.throws(() => planV7DevotionalArtwork(docs([item(1)]), [{
    assetId: 'orphan', contentId: item(2).id, contentType: 'devotional',
    visualRole: 'devotional_cover'
  }]), /unknown devotional/);
});
