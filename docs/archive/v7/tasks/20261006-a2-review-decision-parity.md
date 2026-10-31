# V7 A2 — canonical review decision parity

Date: 2026-10-06 JST
Starting integration SHA: `2a5ed3058dcbabb8f6dec23206c75ed84c1de702`
Branch: `v7/a2-review-decision-parity-20261006`
Owner: V7 A2 — Curation & Enrichment

## Outcome

Prevent a future representative Library record from acquiring a final canonical review state without the matching revision-specific authorized A2 decision evidence, and prevent decision evidence from being committed without atomically applying the same reviewer decision to canonical content.

## Changes

- bind every `approved` or `rejected` representative canonical review state to a matching decision ledger entry;
- reject a ledger decision while the canonical review remains draft/pending;
- reject canonical final review state when the decision ledger has no matching item/revision decision;
- require canonical review outcome, reviewer and decision timestamp to match the ledger exactly;
- keep rights validation and complete checklist/evidence requirements from the existing A2 decision contract;
- preserve the current repository state: all five representative records remain pending review and the decision ledger remains empty.

## Boundary

- No editorial decision is made by this change.
- No reviewer identity is added to canonical content or the ledger.
- No rights status or publication state changes.
- Rejected representative decisions remain possible even when rights are unresolved, but must identify the authorized reviewer and timestamp in both canonical review metadata and the decision ledger.
- Approval still fails closed when canonical rights are not verified.

## Verification

`tests/v7/representative-review-decisions.test.mjs` proves:

1. current empty/pending state still validates;
2. decision-only changes fail;
3. canonical-final-state-only changes fail;
4. matching approval and rejection pairs validate;
5. reviewer drift fails;
6. duplicate item/revision decisions fail;
7. complete ledger status is valid only when every representative item has a matching final canonical decision.
