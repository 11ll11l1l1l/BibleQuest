# A2 Contract Investigation — #91 Content Review workbench

Agent: `BQ-A2-CONTRACT`
Disposition: **ACTIVE / CONTRACT EVIDENCE INCOMPLETE — DO NOT TREAT AS VERIFIED**

## Exact state inspected

- **Canonical:** `feature/v3-content-review` @ `90a22ed639ad305d47d3b36df052945c758b3c07` at final inspection.
- **A1 quarantine candidate:** `agent/a1-work/091-content-review` — **not found** at final inspection.
- **Latest frozen v3 release:** `release/v3.61-content-moderation` @ `dfbbb690c814a514714967f240262eec39b6e3ee`.
- **Expected #91 release:** `release/v3.62-content-review` — **not found** at final inspection.
- **Exact Actions evidence for canonical:** none. `actions/runs?branch=feature/v3-content-review` returned zero runs.
- This report is stale immediately if canonical/candidate/frozen refs move, #91 inventory/contract/owners/tests/workflow change, or exact execution evidence appears.

## Primary evidence and FACT findings

### Authoritative inventory

**FACT:** `FEATURE_INVENTORY_V3.md` at canonical still marks #91 **Not started** with the authoritative acceptance contract:

`open review item; decision; save; permissions`

Rows #92 Admin console and #93 Admin operations are separately Not started and must not be absorbed into #91.

**FACT:** The same ledger marks #88 Content moderation Verified and #89/#90 Regression-tested, so #91 is the next non-deferred content/admin milestone in this sequence.

### Current v3 owner/contract material

**FACT:** `src/app/content-review.js` already exists on canonical. It defines the Content Review service around existing Session, Congregation Membership, shared API and Recall owners. It projects reviewer scopes, loads congregation review queues/quarantined Recall items, accepts only `include|exempt|remove`, validates rationale length and target presence, derives reviewer identity from Session, saves a moderation decision, and then marks matching reports reviewed.

**FACT:** `CONTENT_REVIEW_V3.md` documents a deliberately narrow #91 scope: reviewer workbench only, excluding #92 Admin Console, #93 Admin Operations, reset/recovery, new moderation schema, bulk moderation, escalation and editing features. It defines leader/pastor/admin congregation eligibility plus active platform owner/admin eligibility, and requires database RLS to remain final authority.

**FACT:** The milestone document states the required permanent verification is: architecture validation, an edge regression, a browser regression, and accumulated `v3-regression.yml` invocation of all #91 permanent tests before exact functional/bookkeeping promotion.

### Tests and accumulated workflow

**FACT:** Exact canonical commit `90a22ed639ad305d47d3b36df052945c758b3c07` is `test(v3): add Content Review edge regression` and adds `tests/v3-content-review-edge.mjs`.

**FACT:** That edge regression meaningfully exercises signed-out containment, member/facilitator denial, leader/pastor/admin access, platform owner access, unsupported role fail-closed behavior, congregation scoping, queue presentation, allowed decision values, rationale bounds, reviewer identity/stamps, successful decision save, matching-report resolution, backend denial, and partial-save behavior.

**FACT:** At the same canonical SHA, `.github/workflows/v3-regression.yml` remains `workflow_dispatch` only and retains the pre-#91 accumulated architecture/edge/browser suites, but **does not invoke any #91 architecture validator, `tests/v3-content-review-edge.mjs`, or #91 browser/mobile regression**. Therefore the new edge test is not yet part of the accumulated gate.

**FACT:** There are **zero workflow runs** reported for branch `feature/v3-content-review`; consequently there is no exact-SHA functional or accumulated green for `90a22ed639ad305d47d3b36df052945c758b3c07` and no PASS may be transferred from v3.61 or another SHA.

### Retained / v2 evidence

**FACT:** A direct retained path matching `_retained/reference-only/deploy-package-2025-09-24_17-12-09/js/content-review.js` was not present when inspected. I did not use the current v3 milestone document as a substitute for retained source and did not invent parity behavior absent primary retained evidence.

**MISSING EVIDENCE:** exact retained/v2 Content Review implementation provenance supporting the recovered workflow details remains to be identified or explicitly documented as unavailable. Until that is recovered, behavior beyond the authoritative inventory contract must not be elevated into parity requirements merely because the current v3 implementation/document contains it.

## Contract assessment

**FACT:** The implemented service direction is compatible with the authoritative four-part #91 contract at a high level: it can open review targets, choose a decision, save, and project permissions. However, authoritative inventory status has not yet been promoted from Not started, and no exact candidate or execution gate proves the implementation.

**INFERENCE:** The repository is in mid-milestone construction rather than a reviewable/promotion-ready state. The presence of an owner and edge test does not satisfy the inventory definition of Implemented/Verified by itself.

**RECOMMENDATION:** Keep #91 scoped exactly to `open review item; decision; save; permissions`. Do not absorb #92/#93. Recover retained/v2 provenance where available; complete the missing permanent architecture and browser verification; wire all #91 tests into the accumulated manual workflow without weakening prior coverage; reconcile work through the authorized exact candidate lifecycle; then require exact candidate functional and complete accumulated green before inventory/release bookkeeping.

## Missing evidence before A2 can regard #91 contract as ready for promotion

1. Authorized `agent/a1-work/091-content-review` exact candidate, or explicit governance-compliant provenance explaining its absence.
2. Primary retained/v2 source or a documented evidence trail establishing which standalone-old behaviors are true parity rather than newly designed convenience.
3. Permanent #91 architecture validator and browser/mobile regression required by the milestone contract.
4. Permanent accumulated workflow invocation of all #91 required tests while retaining every prior required suite.
5. Exact candidate workflow run proving the complete accumulated gate on the same SHA.
6. Inventory bookkeeping only after the implementation/evidence gates actually pass.

## Dependency boundary

- **#92 Admin console:** separate Not-started milestone; no #91 parity requirement should expand into generic admin surfaces/actions.
- **#93 Admin operations:** separate Not-started milestone; no operational-action breadth should be introduced to satisfy #91.

## TRIAGE comparison — read only after independent findings

`automation/TRIAGE.md` is materially stale relative to live primary evidence: it still treats #87 corrective closure as active and says `DO NOT ADVANCE TO #88`, while immutable v3.61 Content Moderation is now frozen and live #91 implementation work exists. TRIAGE was not used to establish any finding above.
