# A5 firewall triage — #79 Linked Activities high-risk reconciliation

Agent: `BQ-A5-FIREWALL`
Date: 2026-09-10 JST

## Exact live state
- Canonical: `feature/v3-linked-activities` @ `1b963b8c69b2951b46b457f2564d2a40c7c12266`.
- Dedicated work candidate: `agent/a1-work/079-linked-activities` not found.
- Frozen base: `release/v3.51-workspace` @ `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- `release/v3.52-linked-activities`: not found.
- Prior functional candidate: `debc386328d4655977681fcb08b7a345346ea3fc`; exact run `34468348888` completed success with explicit checkout/assertion and the complete accumulated suite.
- Prior bookkeeping candidate: `270d58a5e34b69b99af87abade3c53099348168e`; exact run `34468933900` failed in accumulated architecture validators and skipped later phases.
- Current corrected candidate: `1b963b8c69b2951b46b457f2564d2a40c7c12266`; no complete exact run established at final inspection.

## Primary evidence / facts
- `DEVELOPMENT_STATUS_V3.md` at the bookkeeping lineage records #79 Verified by `debc3863...`/`34468348888`, #78 Regression-tested, provisional parity 79/100 and stability 78/100 pending bookkeeping green.
- The exact cause of run `34468933900` was compatible with an accumulated lifecycle conflict: `scripts/validate-v3-assignments.mjs` still required #79 to remain `Not started` after #79 bookkeeping advanced the row.
- Current commit `1b963b8c...` changes only that assertion, from `Not started`-only to accepting the normal lifecycle states, while retaining the surrounding #73/#74/#75 ownership/lifecycle assertions.
- #79 lineage changes shared Router ownership by adding the central navigation-request path.
- #79 lineage also changes the pre-existing `tests/v3-assignments-smoke.mjs` fixture after historical run `34467523354` exposed a stale generic-start fixture once Reading became a linked activity.
- Control rules classify global router/shell ownership as HIGH-RISK and independently make any existing accumulated validator/test modification HIGH-RISK.
- No `agent/a1-work/079-linked-activities` quarantine branch exists.
- Writer lease was FREE during A5 inspection; A5 did not modify it.

## Source-report freshness
- A2 #79 report: missing.
- A3 #79 report: stale; analyzed `b446ea26c190905efa6af2f45727f920eb643cb9`.
- A4 #79 report: stale; analyzed `debc386328d4655977681fcb08b7a345346ea3fc` before its exact green completed and did not review current `1b963b8c...`.

## Classification

### BLOCKER
1. `1b963b8c...` cannot be promoted without a complete exact accumulated green. Counterfactual: freezing it would transfer PASS from older `debc3863...` across a changed validator SHA.
2. #79 is HIGH-RISK. Counterfactual: NORMAL-RISK treatment would bypass mandatory independent review for shared Router ownership plus existing accumulated test/validator changes.
3. The autonomous promotion path must reconcile the missing mandated quarantine branch. Counterfactual: continuing unverified autonomous writes directly on canonical defeats the quarantine invariant.

### MILESTONE
1. Run the complete accumulated suite against exact `1b963b8c...` or the next corrected exact candidate.
2. Preserve `launch linked activity; completion handoff`, existing Assignments authority, fixed internal routes, fail-closed unsupported destinations and explicit completion handoff.
3. Preserve all original semantic protection in the corrected Assignments validator; do not remove or weaken unrelated accumulated checks.

### DEFER
#80 Personality Profile, #81 Psychometrics, #43 Live Rooms, #15 Japanese furigana and Kids #38–40.

### IGNORE
- The `270d58a5...` future-state assertion is historical once corrected; it is not evidence of a #79 runtime defect.
- Earlier NORMAL-RISK conclusions are stale against current lineage and explicit control rules.
- A4's old missing-run premise for `debc3863...` is obsolete after `34468348888`, but that does not create A4 READY for current SHA.

## Promotion readiness
**NO PROMOTION RECOMMENDATION.**

The functional implementation has a proven green ancestor, and the bookkeeping validator defect was narrowly corrected, but current SHA remains HIGH-RISK and lacks its own complete exact green plus fresh A3 and exact-candidate A4 READY review.

## Staleness
This report becomes stale if canonical/work/frozen refs move, a quarantine branch appears, a new exact run completes, A3/A4 refresh against the new SHA, or `release/v3.52-linked-activities` appears.
