# A4 QA / Regression — #81 Psychometrics suite

Identity: `BQ-A4-QA`
Date: 2026-09-10 JST
Disposition: **NOT READY — exact current-SHA complete gate missing**

## STATE / PROVENANCE

### FACT
- Active canonical branch: `feature/v3-psychometrics`.
- Exact canonical HEAD re-read before report: `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`.
- Dedicated autonomous quarantine candidate `agent/a1-work/081-psychometrics`: **not found**.
- Frozen base: `release/v3.53-personality-profile` at exact `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Authoritative #81 inventory requirement: **`complete assessment; result; persistence; mobile`**.
- #82 Avatar Vault remains `Not started`; required verification is `browse; select; persist; render fallback`.
- #83 Innovation suite remains `Not started`; required verification is `inventory-specific workflows documented before migration`.
- The control-plane `automation/CURRENT.md` is stale at v3.48 and `automation/TRIAGE.md` is stale at #79; neither was used to establish the findings below.

Primary evidence inspected independently before TRIAGE:
- live canonical/frozen refs and commit ancestry;
- `FEATURE_INVENTORY_V3.md` at current HEAD;
- `DEVELOPMENT_HANDOFF_V3.md` at current HEAD;
- `PSYCHOMETRICS_V3.md`;
- `.github/workflows/v3-regression.yml`;
- `scripts/validate-v3-psychometrics.mjs` at failed exact candidate and current HEAD;
- `tests/v3-psychometrics-edge.mjs`;
- `tests/v3-psychometrics-smoke.mjs`;
- exact workflow/run/job evidence for run `34472943815`;
- frozen base `release/v3.53-personality-profile` ref.

## ACCEPTANCE MATRIX

| Requirement | Permanent evidence present | Executed exact-current-SHA evidence | A4 status |
|---|---|---|---|
| Complete all three retained assessments | Edge test asserts 120 NEO items, 96 VIA items, 10 RSE items and deterministic scoring; browser smoke exercises RSE completion | None for `5d344691...` | MISSING EVIDENCE |
| Result correctness | Edge test covers NEO facets/domains, VIA constructs, reverse keys, RSE 0 and 30 extrema | None for current HEAD | MISSING EVIDENCE |
| Persistence / reopen | Edge test covers same-owner reopen and guest/A/B isolation; browser smoke verifies persisted RSE result reopen | None for current HEAD | MISSING EVIDENCE |
| Malformed/out-of-range fail closed | Edge test covers malformed schema, invalid answers and incomplete calculation rejection | None for current HEAD | MISSING EVIDENCE |
| Interpretation safety | Edge test asserts centralized politics/salvation/diagnosis warnings; smoke requires all three warnings visible | None for current HEAD | MISSING EVIDENCE |
| Mobile | Browser smoke runs at 390x844, checks no horizontal overflow and >=44px rating target | None for current HEAD | MISSING EVIDENCE |
| #80 owner separation | Validator rejects Psychometrics engine absorption into Quick Transform/Profile | None for current HEAD | MISSING EVIDENCE |
| #82 remains outside #81 | Validator requires #82 inventory row to remain `Not started` | None for current HEAD | MISSING EVIDENCE |

## PERMANENT REGRESSIONS / HARNESS INTEGRITY

### FACT
Current `.github/workflows/v3-regression.yml` is still `workflow_dispatch`-only and invokes all three #81 permanent gates additively:
- `scripts/validate-v3-psychometrics.mjs` in accumulated architecture validators;
- `tests/v3-psychometrics-edge.mjs` in accumulated edge regressions;
- `tests/v3-psychometrics-smoke.mjs` in accumulated browser/mobile regressions.

The inspected workflow continues to invoke the prior accumulated validators, edge tests and browser/mobile tests through #80. I found no unexplained deletion, skip, renamed-away test, shortened browser list, or coverage-reducing timeout change in the current workflow.

### FACT — test quality
`tests/v3-psychometrics-edge.mjs` is behavior-bearing rather than merely source-string based for the core scoring/persistence contract. It checks exact retained item counts, explicit reverse-key outcomes, deterministic quality flags with injected time, NEO/VIA result cardinality, RSE 0/30 scoring, owner isolation, persistence reopen and malformed-state normalization. Static source assertions are supplemental boundary checks.

`tests/v3-psychometrics-smoke.mjs` mounts the real Psychometrics page at 390px with the real engine/service/private storage modules. It verifies the three assessment families render, safety warnings are visible, NEO/VIA pagination is usable, RSE can be completed/calculated/persisted/reopened, navigation callbacks fire, touch target height is >=44px, no horizontal overflow occurs, and no page/console errors are emitted.

### RECOMMENDATION
The smoke test does not complete all 120 NEO and 96 VIA items through browser interaction, but the edge regression already executes their full deterministic calculations and the browser test exercises their real rendered pagination. This is acceptable for the current bounded contract unless a retained interaction-specific defect is reproduced; do not manufacture a multi-hundred-click browser requirement solely for redundancy.

## EXACT RUN / SHA EVIDENCE

### FACT — failed functional attempt
Run `34472943815` was triggered from isolated verifier branch `verify/v3.54-psychometrics-functional-1bd77-20260910`.

Its verifier commit explicitly checked out and asserted exact product candidate:
`1bd77237de6b08f18794387bf5c1d9c8098a3e4a`.

Job evidence:
- exact-SHA assertion: **success**;
- accumulated architecture validators: **failure**;
- accumulated edge regressions: **skipped**;
- Playwright/Chromium/local server: **skipped**;
- accumulated browser/mobile regressions: **skipped**.

Therefore run `34472943815` is **not green** and provides no edge/browser PASS for `1bd77237...`.

### FACT — current correction
Current canonical HEAD `5d3446916b8aa809f8a419e3cffa88a312c4bbc5` post-dates that failed candidate and modifies `scripts/validate-v3-psychometrics.mjs`. The correction moves validator expectations for the politics/salvation/diagnosis safety copy from literal UI ownership to the centralized `PSYCHOMETRICS_SAFETY` content owner and requires the UI to reference that centralized owner. This is consistent with the current implementation's single-owner safety design, but source inspection is not execution evidence.

### FACT
GitHub run lookup for exact current SHA `5d3446916b8aa809f8a419e3cffa88a312c4bbc5` returned **0 workflow runs** at inspection time. The latest repository run remained failed run `34472943815` against older exact product SHA `1bd77237...`.

## FAILURES

1. **Exact candidate `1bd77237...` failed accumulated architecture validation in run `34472943815`.** Later phases never executed.
2. **Current exact HEAD `5d344691...` has no complete exact accumulated run.** No PASS may transfer from a prior SHA.
3. **No `agent/a1-work/081-psychometrics` candidate exists.** The implementation is present on canonical despite the autonomous quarantine invariant. A4 does not repair branch topology.

## MISSING EVIDENCE

Before A4 can mark the current #81 candidate READY:
- execute the complete accumulated workflow against exact `5d3446916b8aa809f8a419e3cffa88a312c4bbc5` or the later reconciled exact candidate;
- the verifier must explicitly checkout/assert that exact product SHA;
- architecture validators must pass including the corrected #81 validator;
- accumulated edge regressions must actually execute and pass including `tests/v3-psychometrics-edge.mjs`;
- Playwright/Chromium/local server and the complete browser/mobile sequence must execute and pass including `tests/v3-psychometrics-smoke.mjs`;
- all prior accumulated test invocation must remain intact;
- if the candidate SHA changes, this candidate-specific QA disposition becomes stale immediately.

If bookkeeping changes the SHA after functional green, that changed bookkeeping SHA requires its own complete exact accumulated gate before `release/v3.54-psychometrics` can freeze.

## NEXT TWO LIKELY MILESTONES — ACCEPTANCE ONLY

### #82 Avatar Vault
Authoritative requirement: `browse; select; persist; render fallback`.
QA should require at minimum: retained/authorized avatar inventory renders; selection persists for the same owner; invalid/missing asset falls back without breaking shell; account/guest state follows the established owner boundary; mobile selection controls remain usable; no #83 behavior is absorbed prematurely.

### #83 Innovation suite
Authoritative requirement: `inventory-specific workflows documented before migration`.
No implementation acceptance should be invented yet. QA gate is first a recovered, evidence-backed workflow inventory/contract; only then can executable acceptance be defined.

## READY / NOT READY

**NOT READY** for exact current SHA `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`.

Reason: permanent coverage is meaningful and accumulated invocation is intact, but the only exact functional attempt failed before edge/browser execution and current HEAD has no exact complete run. No PASS transfers across SHAs.

## STALENESS CONDITIONS

This report becomes candidate-stale if any of the following changes:
- `feature/v3-psychometrics` HEAD moves from `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`;
- an `agent/a1-work/081-psychometrics` candidate appears or moves;
- the frozen base changes from `release/v3.53-personality-profile` / `2c62a63e5bbdedae47834714e65751a57d58b696`;
- #81 contract/inventory requirements change;
- #81 validator/edge/smoke tests or accumulated workflow invocation changes;
- new exact workflow evidence completes for the candidate.
