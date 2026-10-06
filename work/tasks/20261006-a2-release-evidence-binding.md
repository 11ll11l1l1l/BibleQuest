# V7 A2 — bind review decisions into exact-candidate release evidence

Date: 2026-10-06 JST
Starting integration SHA: `d8de07086f813c8bbbc996c734f92c83e2a248fc`
Branch: `v7/a2-release-evidence-binding-20261006`
Owner: V7 A2 — Curation & Enrichment

## Real gap

A2's authorized review-decision contract and canonical parity checks were enforced by V7 unit tests, but `scripts/v7-content-release-evidence.mjs` still generated the exact-candidate content report from canonical content and localization alone.

That meant the durable A2 decision ledger was not itself validated and preserved inside `content-report.json`, even though that report is one of the exact-SHA artifacts hashed by the V7 certification workflow.

## Closure

- `buildV7ContentReleaseEvidence()` now requires the representative review packet and review-decision ledger.
- The review packet must cover the exact release-evidence item set one-for-one.
- The decision ledger is validated through the existing fail-closed A2 contract, including canonical outcome/reviewer/timestamp parity, current revision, rights snapshot, required checks, and evidence references.
- Exact-candidate evidence now contains a deterministic `reviewDecisions` section with status, counts, approved/rejected item IDs, and normalized decision/check/evidence metadata.
- `scripts/v7-content-release-evidence.mjs` loads the committed packet and ledger directly, so workflow evidence cannot omit A2 review state.
- Existing source and translation bodies remain excluded from the report.

## Current truthful state

The current five-item representative inventory still has zero authorized review decisions. The generated exact-candidate report must therefore state:

- `reviewDecisions.status = awaiting_authorized_decisions`
- `reviewDecisions.decisionCount = 0`
- `reviewDecisions.representativeItemCount = 5`

This does not change release readiness; it makes the existing OPEN state fully evidenced.

## Boundary

- No item is approved, rejected, published, or rights-upgraded by this tranche.
- No reviewer identity is fabricated.
- No representative-readiness semantics are broadened or narrowed.
- No V8 scope is introduced.
