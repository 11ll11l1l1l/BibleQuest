# A2 Contract Investigation — #91 Content Review workbench

Agent: `BQ-A2-CONTRACT`
Disposition: **ACTIVE / IMPLEMENTATION EVIDENCE PRESENT; NO EXACT EXECUTION GREEN — DO NOT TREAT AS VERIFIED**

## Exact state inspected

- **Canonical:** `feature/v3-content-review` @ `784b77c2fad0aaac9f653e81fd465ffab2a4671e` at final evidence refresh.
- **A1 quarantine candidate:** `agent/a1-work/091-content-review` — **not found** when checked during this investigation.
- **Latest frozen v3 release:** `release/v3.61-content-moderation` @ `dfbbb690c814a514714967f240262eec39b6e3ee`.
- **Expected #91 release:** `release/v3.62-content-review` — **not found** when checked during this investigation.
- **Exact Actions evidence for canonical:** none. The branch Actions query still returned zero runs after #91 verification was accumulated.
- This report is stale immediately if canonical/candidate/frozen refs move, #91 inventory/contract/owners/tests/workflow change, or exact execution evidence appears.

## Primary evidence and FACT findings

### Authoritative inventory

**FACT:** `FEATURE_INVENTORY_V3.md` at exact canonical `784b77c2...` still marks #91 **Not started** with the authoritative acceptance contract:

`open review item; decision; save; permissions`

Rows #92 Admin console and #93 Admin operations are separately Not started and must not be absorbed into #91.

**FACT:** The same ledger marks #88 Content moderation Verified and #89/#90 Regression-tested, so #91 is the next non-deferred content/admin milestone in this sequence.

### Current v3 owner/contract material

**FACT:** `src/app/content-review.js` exists in the live #91 lineage. It defines the Content Review service around existing Session, Congregation Membership, shared API and Recall owners. It projects reviewer scopes, loads congregation review queues/quarantined Recall items, accepts only `include|exempt|remove`, validates rationale length and target presence, derives reviewer identity from Session, saves a moderation decision, and then marks matching reports reviewed.

**FACT:** `CONTENT_REVIEW_V3.md` documents a deliberately narrow #91 scope: reviewer workbench only, excluding #92 Admin Console, #93 Admin Operations, reset/recovery, new moderation schema, bulk moderation, escalation and editing features. It defines leader/pastor/admin congregation eligibility plus active platform owner/admin eligibility, and requires database RLS to remain final authority.

**FACT:** The milestone document requires permanent architecture validation, edge regression, browser regression and accumulated `v3-regression.yml` invocation before exact functional/bookkeeping promotion.

### Tests and accumulated workflow

**FACT:** Commit `90a22ed639ad305d47d3b36df052945c758b3c07` added `tests/v3-content-review-edge.mjs`. That regression meaningfully exercises signed-out containment, member/facilitator denial, leader/pastor/admin access, platform owner access, unsupported-role fail-closed behavior, congregation scoping, queue presentation, allowed decision values, rationale bounds, reviewer identity/stamps, successful decision save, matching-report resolution, backend denial and partial-save behavior.

**FACT:** Live canonical later advanced to `784b77c2fad0aaac9f653e81fd465ffab2a4671e`, commit `test(v3): accumulate Content Review verification`. Its primary diff adds `scripts/validate-v3-content-review.mjs`, `tests/v3-content-review-edge.mjs`, and `tests/v3-content-review-smoke.mjs` to the permanent accumulated architecture, edge/security and browser/mobile phases respectively.

**FACT:** The workflow remains `workflow_dispatch` only and the change appends #91 verification while retaining the prior accumulated lists; no prior suite removal/skip was observed in the exact accumulation diff.

**FACT:** Despite this permanent composition now being present, `actions/runs?branch=feature/v3-content-review` returned **zero workflow runs** after the accumulation commit. Consequently there is no exact functional or accumulated green for `784b77c2...`, and no PASS may transfer from v3.61 or another SHA.

### Retained / v2 evidence

**FACT:** A direct retained path matching `_retained/reference-only/deploy-package-2025-09-24_17-12-09/js/content-review.js` was not present when inspected. I did not use the current v3 milestone document as a substitute for retained source and did not invent parity behavior absent primary retained evidence.

**MISSING EVIDENCE:** exact retained/v2 Content Review implementation provenance supporting recovered workflow details remains to be identified or explicitly documented as unavailable. Until recovered, behavior beyond the authoritative inventory contract must not be elevated into parity requirements merely because current v3 implementation/documentation contains it.

## Contract assessment

**FACT:** The implementation direction and permanent test composition now map to the authoritative four-part #91 contract at a high level: open review item, decision, save and permissions.

**FACT:** The authoritative ledger nevertheless remains `Not started`; no authorized A1 quarantine candidate was found; and no exact workflow execution exists for the live accumulated-verification SHA.

**INFERENCE:** #91 has progressed materially from early construction into a verification-ready code state, but it is not evidence-ready for promotion. Permanent test presence is not equivalent to an executed exact-SHA PASS.

**RECOMMENDATION:** Keep #91 scoped exactly to `open review item; decision; save; permissions`. Do not absorb #92/#93. Recover retained/v2 provenance where available, reconcile the implementation through the authorized exact candidate lifecycle, execute targeted plus complete accumulated verification on that exact candidate SHA, and change inventory/release bookkeeping only after those gates pass.

## Missing evidence before A2 can regard #91 contract as ready for promotion

1. Authorized `agent/a1-work/091-content-review` exact candidate, or explicit governance-compliant provenance explaining its absence.
2. Primary retained/v2 source or documented evidence trail establishing which standalone-old behaviors are true parity rather than newly designed convenience.
3. Exact execution evidence for the now-present #91 architecture, edge and browser/mobile regressions.
4. Complete accumulated green on the same exact candidate SHA with all prior coverage retained.
5. Inventory bookkeeping only after the implementation/evidence gates actually pass.

## Dependency boundary

- **#92 Admin console:** separate Not-started milestone; no #91 parity requirement should expand into generic admin surfaces/actions.
- **#93 Admin operations:** separate Not-started milestone; no operational-action breadth should be introduced to satisfy #91.

## TRIAGE comparison — read only after independent findings

`automation/TRIAGE.md` is materially stale relative to live primary evidence: it still treats #87 corrective closure as active and says `DO NOT ADVANCE TO #88`, while immutable v3.61 Content Moderation is frozen and live #91 implementation plus permanent verification composition now exist. TRIAGE was not used to establish any finding above.
