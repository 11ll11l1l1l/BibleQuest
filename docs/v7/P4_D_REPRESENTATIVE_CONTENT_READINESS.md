# P4-D — Representative content readiness

Starting integration SHA: `9b2b084c6dd119cfa39d89a4e52628884acf2c73`.

This Lane D evidence record turns the V7 representative-content requirement into an explicit machine-readable boundary without inventing editorial approval. `src/v7/content/representative-readiness.js` assesses already validated V7 content records. A Library content type is release-ready only when at least one representative record is all of the following:

- not fixture content;
- rights status `verified`;
- publication review status `approved`; and
- publication state `published`.

The assessor does not mutate, approve, publish, translate or infer rights for content.

## Current representative inventory

| Type | Representative records | Current boundary |
|---|---|---|
| Book | `books.pilgrims-progress` r1; `books.practice-presence` r1 | Rights metadata is verified for external linking; editorial review remains pending and the records remain unpublished. |
| Devotional | `devotional.spurgeon.january-02-am` r1; `devotional.spurgeon.january-06-am` r1 | Rights metadata is verified for display; editorial review remains pending and the records remain unpublished. |
| Past Teaching | `teaching.prayer-abiding` / `prayer-abiding-r1` | Source identity is recorded, but rights remain unknown; editorial review remains pending and the record remains unpublished. |

Therefore the current aggregate result is **OPEN / not release-ready**. This is an acceptance boundary, not a failing runtime feature and not permission to change another lane's feature implementation.

`tests/v7/representative-content-readiness.test.mjs` preserves both the generic gate behavior and the exact current blocker classes. When an authorized reviewer later changes a representative record, the focused test must be updated together with durable evidence for the new review/rights/publication state rather than silently converting OPEN to PASS.

## What this closes

- P4-D now has a deterministic cross-content readiness check covering all three Library content types.
- Missing type coverage, fixture-only material, unverified rights, unapproved review and unpublished state are distinguishable blockers.
- The current repository cannot be misreported as having representative content acceptance merely because source metadata or runtime rendering exists.

## What remains open

- Genuine editorial/content review for the representative Books and Devotionals.
- Rights resolution plus editorial/content review for the representative Past Teaching adaptation.
- Browser/content-review evidence after approved representative records are actually published through the accepted V7 path.
- P5 exact-candidate evidence; this document is preparation and does not certify a release candidate.
