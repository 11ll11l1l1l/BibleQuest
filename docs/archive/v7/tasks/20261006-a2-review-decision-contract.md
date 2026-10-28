# V7 A2 — representative review decision contract

Date: 2026-10-06 JST
Starting integration SHA: `3a024a6436b16652f42fab956e1bef7b52da5839`
Branch: `v7/a2-review-decision-contract-20261006`
Owner: V7 A2 — Curation & Enrichment

## Outcome

Provide a deterministic, fail-closed format for a future authorized reviewer to record revision-specific representative Library review decisions without letting the existence of a sidecar file imply approval, publication, or rights clearance.

## Changes

- add `src/v7/content/representative-review-decisions.js` as a bounded validator for authorized representative review decisions;
- add an empty repository decision ledger at `data/v7/curation/representative-library-review-decisions.json`;
- require each decision to bind the current item ID, revision and canonical rights snapshot;
- require every content-type review check from the representative review packet exactly once;
- require all checks to pass before an approval can validate;
- reject approval while canonical rights are not `verified`;
- require at least one failed check for a rejection;
- require the decision to retain all repository evidence references already mandated by the reviewer packet;
- reject duplicate decisions for the same item revision and derive ledger status from recorded decision count.

## Boundary

- The committed ledger contains zero decisions.
- Presence of the ledger is explicitly non-authorizing.
- No reviewer identity is invented in repository evidence; reviewer strings used by tests are synthetic fixtures only.
- No content review status, rights status or publication state changes.
- The validator does not publish content or mutate canonical records.
- No expanded content catalog or V8 feature work.

## Verification

`tests/v7/representative-review-decisions.test.mjs` proves:

1. the current ledger is empty and non-authorizing;
2. a complete synthetic approval validates only for a current verified-rights revision;
3. the current Past Teaching cannot be approved while rights remain unknown;
4. evidence-backed rejection remains possible when a required check fails;
5. incomplete checks, stale revisions and dropped required evidence fail closed;
6. ledger status is derived from decision count and duplicate item-revision decisions are rejected.
