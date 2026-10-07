import assert from 'node:assert/strict';
import test from 'node:test';
import { createContentReviewService } from '../../src/app/content-review.js';

function fixture({ libraryCongregationId = 'congregation-1', platformRole = null } = {}) {
  let saved = null;
  const api = {
    async platformAccess() { return platformRole ? { role: platformRole, active: true } : null; },
    async listPlatformCongregations() { return []; },
    async loadQueue() { return { decisions: [], reports: [], members: [] }; },
    async saveDecision() { throw new Error('not used'); },
    async markReportsReviewed() { return []; },
    async loadLibraryQueue() {
      return {
        items: [{
          id: 'item-1',
          content_type: 'devotional',
          congregation_id: libraryCongregationId,
          publication_state: 'published',
          current_revision_id: 'revision-1',
          updated_at: '2026-10-07T00:00:00Z'
        }],
        revisions: [{
          id: 'revision-1',
          item_id: 'item-1',
          revision_number: 1,
          source_locale: 'en',
          title: 'Prayer and Hope',
          summary: 'A reviewed devotional.',
          body: { text: 'Body' },
          source_kind: 'external',
          source_title: 'Source title',
          source_uri: 'https://example.com/source',
          creator: 'Author',
          originating_organization: 'Publisher',
          rights_status: 'verified',
          rights_holder: 'Holder',
          rights_basis: 'Public-domain evidence',
          attribution: 'Attribution',
          allowed_uses: ['display'],
          publication_state: 'published',
          review_status: 'approved',
          reviewer_type: 'automated_policy',
          review_policy_id: 'biblequest.v7.library-release',
          review_policy_version: '1.0.0',
          review_evidence: { scriptureRefs: ['Philippians 4:6-7'] },
          reviewed_at: '2026-10-07T00:00:00Z'
        }],
        translations: [{
          id: 'translation-1',
          revision_id: 'revision-1',
          locale: 'tl',
          title: 'Panalangin at Pag-asa',
          summary: '',
          body: { text: 'Salin' },
          translator: 'translation-pipeline',
          review_status: 'reviewed',
          reviewed_at: '2026-10-07T00:00:00Z'
        }],
        taxonomyLinks: [{ revision_id: 'revision-1', taxonomy_id: 'emotion.hope', display_order: 0 }],
        taxonomy: [{ id: 'emotion.hope', kind: 'emotion', labels: { en: 'Hope' }, congregation_id: null }],
        decisions: [{
          id: 1,
          item_id: 'item-1',
          revision_id: 'revision-1',
          content_type: 'devotional',
          reviewer_type: 'automated_policy',
          decision: 'auto_approved',
          policy_id: 'biblequest.v7.library-release',
          policy_version: '1.0.0',
          reviewer_id: null,
          criteria: [{
            id: 'source_identity',
            result: 'pass',
            hard: true,
            evaluator: 'policy-primary',
            evaluatedAt: '2026-10-07T00:00:00Z',
            evidenceRefs: ['evidence:source']
          }],
          second_pass: {
            result: 'pass',
            revision: 'revision-1',
            evaluator: 'policy-adversarial',
            evaluatedAt: '2026-10-07T00:00:00Z',
            evidenceRefs: ['evidence:second-pass']
          },
          evidence_refs: ['evidence:source','evidence:second-pass'],
          note: '',
          decided_at: '2026-10-07T00:00:00Z',
          created_at: '2026-10-07T00:00:00Z'
        }]
      };
    },
    async saveLibraryHumanDecision(row) {
      saved = { id: 2, ...row, created_at: row.decided_at };
      return saved;
    }
  };
  const session = { getState: () => ({ authenticated: true, user: { id: 'reviewer-1' } }) };
  const congregation = {
    load: async () => [{ congregationId: 'congregation-1', role: 'leader', roleLabel: 'Leader', congregation: { name: 'Church' } }],
    getActive: () => ({ congregationId: 'congregation-1' })
  };
  const recall = {
    loadManifest: async () => ({ books: [] }),
    loadQuarantine: async () => []
  };
  const clock = () => new Date('2026-10-07T01:00:00Z');
  return { review: createContentReviewService({ api, session, congregation, recall, clock }), saved: () => saved };
}

test('Lane B loads the global Library audit queue separately from Recall moderation', async () => {
  const { review } = fixture();
  const state = await review.refresh();

  assert.equal(state.status, 'ready');
  assert.equal(state.congregationId, 'congregation-1');
  assert.equal(review.libraryReviewItems('devotional').length, 1);
  const devotional = review.libraryReviewItems('devotional')[0];
  assert.equal(devotional.title, 'Prayer and Hope');
  assert.equal(devotional.rights.status, 'verified');
  assert.equal(devotional.translations[0].locale, 'tl');
  assert.equal(devotional.taxonomy[0].id, 'emotion.hope');
  assert.equal(devotional.latestDecision.reviewerType, 'automated_policy');
  assert.equal(devotional.latestDecision.decision, 'auto_approved');
  assert.equal(devotional.latestDecision.secondPass.evaluator, 'policy-adversarial');
});

test('Lane B human override persists truthful reviewer identity and exact revision', async () => {
  const { review, saved } = fixture();
  await review.refresh();
  const result = await review.decideLibrary({
    revisionId: 'revision-1',
    decision: 'request_changes',
    rationale: 'Clarify the attribution wording.'
  });

  assert.equal(result.saved, true);
  assert.equal(saved().item_id, 'item-1');
  assert.equal(saved().revision_id, 'revision-1');
  assert.equal(saved().reviewer_type, 'human');
  assert.equal(saved().reviewer_id, 'reviewer-1');
  assert.equal(saved().decision, 'request_changes');
  assert.equal(saved().policy_id, null);
  assert.equal(saved().policy_version, null);
  assert.equal(review.libraryReviewItems('devotional')[0].latestDecision.decision, 'request_changes');
});

test('Lane B rejects human audit actions for revisions outside the authorized loaded queue', async () => {
  const { review } = fixture();
  await review.refresh();
  await assert.rejects(
    review.decideLibrary({ revisionId: 'revision-other', decision: 'approved' }),
    error => error?.code === 'BQ_LIBRARY_REVIEW_ITEM_INVALID'
  );
});


test('Lane B hides global Library audit actions from congregation-only reviewers', async () => {
  const { review } = fixture({ libraryCongregationId: null });
  await review.refresh();
  assert.equal(review.libraryReviewItems().length, 0);
});

test('Lane B exposes global Library audit actions to protected platform reviewers', async () => {
  const { review } = fixture({ libraryCongregationId: null, platformRole: 'admin' });
  await review.refresh();
  assert.equal(review.libraryReviewItems().length, 1);
});
