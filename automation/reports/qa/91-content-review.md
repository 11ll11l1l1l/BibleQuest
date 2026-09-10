# A4 QA / Regression — #91 Content Review

Identity: `BQ-A4-QA`

## STATE / PROVENANCE

- Milestone: **#91 Content Review workbench**.
- Risk: **HIGH-RISK** because reviewer authorization and RLS-protected moderation writes are part of acceptance.
- Canonical branch: `feature/v3-content-review`.
- Canonical exact HEAD inspected: `68516bdbdb651dd144270bd5bc615909967130a8`.
- Dedicated autonomous candidate: **none found** under `agent/a1-work/091-*`.
- Frozen base: `release/v3.61-content-moderation` @ `dfbbb690c814a514714967f240262eec39b6e3ee`.
- Authoritative inventory at canonical: #91 = **Not started**, required verification `open review item; decision; save; permissions`.
- Milestone contract: `CONTENT_REVIEW_V3.md` at canonical SHA.
- Exact functional verifier observed: `verify/v3.62-content-review-functional-68516bd-20260911`; trigger commit `d6912dbc4c8d728d8b8909fff6bf7e4566e7f01e` explicitly checks out/asserts product SHA `68516bdbdb651dd144270bd5bc615909967130a8`.
- Actions run: `34522265269` was **in progress** at final evidence inspection. Exact checkout/assertion, accumulated architecture validators, accumulated edge regressions, Playwright install, Chromium install and local-server start had completed green; accumulated browser/mobile regressions were still running. This run is not green until completion.
- No PASS is transferred from v3.61 or any other SHA.

## PRIMARY EVIDENCE INSPECTED

FACT:
- `FEATURE_INVENTORY_V3.md` defines #91 narrowly as Content Review workbench with `open review item; decision; save; permissions` and leaves #92/#93 separate.
- `CONTENT_REVIEW_V3.md` defines signed-out/unauthorized containment, reviewer eligibility, queue sources, exact decision values, rationale bounds, write/partial-save behavior, 44px touch target and 390px no-overflow acceptance.
- `.github/workflows/v3-regression.yml` on exact canonical remains `workflow_dispatch` only and adds `scripts/validate-v3-content-review.mjs`, `tests/v3-content-review-edge.mjs`, and `tests/v3-content-review-smoke.mjs` while retaining the prior accumulated validator/edge/browser lists from frozen v3.61.
- `tests/v3-content-review-edge.mjs` exercises signed-out, member/facilitator denial, leader/pastor/admin access, platform-owner access, congregation selection denial, quarantine normalization, exact decision validation, rationale bounds, snapshot construction, successful save, backend decision denial and partial-save report-resolution failure through a deterministic mocked API boundary.
- `tests/v3-content-review-smoke.mjs` mounts the real Content Review UI at 390px with a deterministic fake service, exercises decision save, visible failure handling, report context, search/filtering, 44px touch-target floor, no horizontal overflow, and routed guest fail-closed behavior.
- The isolated verifier workflow for run `34522265269` explicitly checks out/asserts `68516bdb...` and invokes the same accumulated architecture, edge and browser/mobile suites including #91.
- At the last observed job state for `34522265269`, architecture and edge phases were green, but browser/mobile was still in progress.

## ACCEPTANCE MATRIX

- Open review item / queue presentation: **covered by permanent edge + browser tests; execution incomplete until run finishes**.
- Decision values `include|exempt|remove`; reject `delete`: **covered by edge regression**.
- Save success and visible success state: **covered by edge + browser regression**.
- Backend denial surfaces error: **covered at mocked service/API level**.
- Partial save where decision commits but report resolution fails: **covered by edge regression**.
- Signed-out containment: **covered by edge + routed browser regression**.
- Member/facilitator denial; leader/pastor/admin eligibility; platform owner access: **covered at service/mock level**.
- Congregation selection/scoping: **covered at service/mock level**.
- Rationale length bound and invalid decision/item failure: **covered by edge regression**.
- Mobile 390px / 44px / overflow: **covered by browser test, pending exact run completion**.

## PERMANENT REGRESSION / ACCUMULATED SUITE AUDIT

FACT:
- Frozen v3.61 workflow and canonical #91 workflow were compared directly.
- The canonical workflow adds the #91 validator, edge regression and browser smoke to the accumulated lists.
- Prior accumulated validator, edge and browser/mobile invocations remain present; no unexplained deletion, skip, rename-away or timeout narrowing was found in the inspected workflow.
- Normal product workflow remains manual `workflow_dispatch`; temporary push trigger exists only on the isolated `verify/` branch inspected.

## FAILURES

- No executed #91 test failure is established from the inspected evidence.
- Run `34522265269` is incomplete, so it cannot be counted as PASS.

## MISSING EVIDENCE

1. **Complete exact functional green:** run `34522265269` must finish successfully through the accumulated browser/mobile phase; partial green phases are insufficient.
2. **Authorized quarantine provenance:** no `agent/a1-work/091-*` candidate exists. HIGH-RISK autonomous promotion requires review of the exact authorized candidate, not merely a canonical SHA or verifier trigger commit.
3. **Faithful trusted-boundary authorization evidence:** current #91 edge/browser tests use mocked API/service paths. They are strong orchestration/UI regressions but do not independently prove the real Supabase/RLS boundary. A4 requires the current A3 architecture/security review and faithful executable or equivalent trusted-boundary evidence for unauthorized member/facilitator writes, cross-congregation writes, permitted leader/pastor/admin and platform owner/admin writes, and forged reviewer identity before READY.
4. **Bookkeeping gate:** even after exact functional green and HIGH-RISK A3/A4/A5 approval, any bookkeeping SHA must receive its own complete exact accumulated green before release freeze.

## FACT vs INFERENCE / RECOMMENDATION

FACT: #91 implementation, permanent tests and accumulated workflow wiring exist on `68516bdb...`; the exact verifier pins that SHA; architecture and edge phases were green at inspection; browser/mobile was still running; no dedicated `agent/a1-work/091-*` candidate was found.

INFERENCE: source/test composition appears aligned with the authoritative #91 contract, but source presence and partial run progress are not enough to establish full acceptance or server authorization.

RECOMMENDATION: **NOT READY — do not autonomously bookkeep/promote/freeze #91 yet.** Wait for complete exact functional green, reconcile the exact product state into the required quarantine-candidate lifecycle, require current A3 trust-boundary satisfaction with faithful authorization evidence, then perform an A4 review of that exact candidate. If the candidate changes, this report does not authorize the new SHA.

## TRIAGE COMPARISON

`automation/TRIAGE.md` was read only after this independent QA pass. It is materially stale: it still treats #87 corrective closure as active, while live canonical/frozen evidence has progressed through frozen v3.61 to #91 Content Review implementation and verification activity. Its conclusions are not used as proof here.

## STALENESS CONDITIONS

This report becomes stale immediately if `feature/v3-content-review` moves from `68516bdbdb651dd144270bd5bc615909967130a8`, an `agent/a1-work/091-*` candidate appears or moves, the #91 contract/inventory changes, #91 product/API/RLS/test/workflow code changes, run `34522265269` completes/fails/cancels, a newer exact verifier becomes authoritative, or the frozen base/release state changes.