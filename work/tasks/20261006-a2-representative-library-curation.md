# V7 A2 — representative Library curation tranche

Date: 2026-10-06 JST
Starting integration SHA: `7570b53032d48ff10a79b21db26bea0f79e710e6`
Branch: `v7/a2-representative-curation-20261006`
Owner: V7 A2 — Curation & Enrichment

## Outcome

Create a bounded editorial-curation sidecar for the exact five representative Library items consumed by V7 release evidence, without changing the frozen V7 runtime/data contract or claiming content approval/publication.

## Canonical items curated

- `books.pilgrims-progress`
- `books.practice-presence`
- `devotional.spurgeon.january-02-am`
- `devotional.spurgeon.january-06-am`
- `teaching.prayer-abiding`

## Enrichment captured

For every item:

- neutral summary;
- controlled theological-fit tier plus rationale;
- topics;
- Scripture relationships with explicit source/editorial relationship type;
- collections and life-topic pathways;
- audience;
- difficulty and bounded reading-time metadata;
- ONE 2 ONE step fit;
- group-discussion suitability as editorial metadata only;
- reading-plan fit;
- editorial priority;
- source/provenance notes;
- rights/review/publication snapshots copied from the canonical record for drift detection.

## Boundary

- No content item is approved or published by A2.
- No reviewer identity or approval timestamp is fabricated.
- No rights status is upgraded.
- No V7 schema/parser/migration is changed.
- No expanded Books catalog, bulk content import, full Ilocano rollout, Conversation Deck, or group/realtime feature is introduced.
- `groupDiscussionFit` describes editorial suitability only; it does not create or require a V7 group feature.
- The theological tiers are curation labels, not a replacement for Scripture, church doctrine, or the required human editorial review.

## Files

- `data/v7/curation/representative-library-curation.json`
- `tests/v7/representative-library-curation.test.mjs`
- this handoff

## Verification intent

`tests/v7/representative-library-curation.test.mjs` checks that:

1. the sidecar covers exactly the canonical representative items loaded from the three release-evidence bundles;
2. rights, review and publication snapshots remain identical to the canonical records;
3. A2 does not introduce reviewer/approval-decision fields;
4. required curation dimensions use controlled vocabularies;
5. Scripture links are references with explicit relationship types and do not copy Bible text.

## Remaining A2 work after this tranche

1. Run/observe the focused test and normal V7 unit gate for this branch.
2. Reconcile any integration-head movement before PR merge.
3. Continue A2 curation on additional content only when it is within the frozen V7 representative scope; expanded catalogs and bulk-corpus work remain deferred unless the integration authority changes the V7 scope.
4. Formal content approval/publication remains with the authorized editorial/content-review owner; `teaching.prayer-abiding` additionally remains blocked on rights verification.
