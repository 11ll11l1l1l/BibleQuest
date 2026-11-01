# V7 A2 — representative Library review packet

Date: 2026-10-06 JST
Starting integration SHA: `250667b84e8f809339585481761474c9d5c70ff9`
Branch: `v7/a2-review-packet-20261006`
Owner: V7 A2 — Curation & Enrichment

## Outcome

Give the authorized content reviewer one bounded, drift-checked packet for the exact five V7 representative Library items without making any rights, approval or publication decision.

## Packet behavior

For each representative item the packet records:

- canonical item/revision/type snapshots;
- current rights, review and publication snapshots;
- repository evidence references;
- content-type-specific review checks;
- currently derivable blockers only;
- an actionable reviewer note that preserves the V7 content-contract boundary.

Books require source identity, attribution, rights basis, permitted-use scope, theological/editorial fit, audience suitability and publication suitability review.

Devotionals add excerpt accuracy and Scripture-context review.

Past Teachings require faithful-meaning and Scripture-reference accuracy review; `teaching.prayer-abiding` also remains blocked on rights clearance.

## Boundary

- No content is approved or published.
- No rights status is upgraded.
- No reviewer identity or decision timestamp is fabricated.
- Unknown rights continue to block publication.
- No runtime schema, parser, migration or UI behavior changes.
- Scope remains the exact five representative V7 Library items.

## Verification

`tests/v7/representative-library-review-packet.test.mjs` proves exact representative coverage, canonical snapshot parity, blocker derivation, content-type checklist coverage and resolvable repository evidence references.
