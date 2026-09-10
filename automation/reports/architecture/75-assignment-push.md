# Architecture / Security Report — #75 Assignment Push Workflow

Agent: `BQ-A3-ARCH-SECURITY`
Updated: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#75 Assignment Push Workflow — HIGH-RISK**.
- Canonical `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Exact quarantine/bookkeeping candidate `agent/a1-work/075-assignment-push`: `e725e5dee5a46fcaebf05200301efdb93f868b22` at final pre-write recheck.
- Frozen base `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact bookkeeping verification: Actions run `34450088492`, job `102783621514`, completed `success`.
- The run trigger HEAD was `b1aac8df1b6e49715d1d0e0547c77af9987e7447` on isolated verify branch `verify/v3.48-assignment-push-bookkeeping-a1-20260910-1628-fix2`; its workflow explicitly checked out and asserted exact candidate `e725e5dee5a46fcaebf05200301efdb93f868b22` before the accumulated suite.

Candidate-specific conclusions become stale if the quarantine SHA moves; if assignment server authority, RLS/grants/schema, central API/owner, security tests, accumulated validator/workflow, or exact run evidence changes; or if canonical/frozen refs move.

## A3 DISPOSITION

**ARCHITECTURE / SECURITY READY for exact candidate `e725e5dee5a46fcaebf05200301efdb93f868b22`. No current architecture/security blocker is established.**

This does not authorize HIGH-RISK promotion by itself. Because the candidate modifies an existing accumulated validator after the earlier functional review, exact-candidate A4 review and A5 promotion disposition remain mandatory.

## PRIMARY EVIDENCE INSPECTED BEFORE TRIAGE

A3 independently inspected the required control files; live canonical/quarantine/frozen refs; exact candidate handoff; candidate-vs-prior functional state; `supabase/functions/bq-assignment/index.ts`; assignment schema/RLS/grant migrations including `20260904_assignments_presence_unlocks.sql`, `20260905181000_linked_activity_assignment_groups.sql`, and `20260905_browser_grant_parity.sql`; `tests/v3-assignment-publish-auth-edge.mjs`; the modified `scripts/validate-v3-assignments.mjs` commit; candidate normal workflow; exact run `34450088492`, job evidence, and isolated pinned workflow. Provisional findings were formed before reading `automation/TRIAGE.md`.

## FACT — SAFE TRUST BOUNDARY

The required safe path remains:

`authenticated session + selected congregation` → assignment application owner → central browser API boundary → authenticated `bq-assignment` trusted server → active congregation membership → action-specific authorization/target validation → service-authority persistence → SELECT-only assignment/progress RLS plus Realtime receive path.

- `bq-assignment` requires active membership in the supplied congregation before action handling.
- `targets` and `create` require `facilitator`, `leader`, `pastor`, or `admin`.
- Target discovery is server-scoped to active records in the selected congregation.
- `create` independently revalidates non-`all` targets server-side: active same-congregation member, team, or group; invalid/foreign/inactive targets fail before insert.
- `start` and `complete` use recipient eligibility, not ministry visibility. `member`, `team`, and `group` recipients are checked specifically.
- Assignment/progress browser exposure remains SELECT-oriented under RLS. Browser-grant normalization revokes browser table privileges and re-grants only operations backed by RLS policies; #75 mutation authority therefore stays on the trusted server path.
- Group assignment visibility is handled by the assignment-specific security-definer helper and does not require broadening ordinary Journey Group directory visibility.

## FACT — EXECUTABLE SECURITY EVIDENCE

`tests/v3-assignment-publish-auth-edge.mjs` executes the production `bq-assignment` request handler inside a controlled VM boundary. It proves ordinary-member denial for target discovery/create, ministry-role acceptance, active same-congregation discovery, rejection of foreign/inactive member/team/group targets before insertion, valid-target acceptance, and fail-closed missing-target behavior.

The exact verification workflow for run `34450088492` invokes this permanent test in the accumulated edge phase together with the separate recipient-response authorization regression and the existing #75 edge/browser coverage.

## FACT — BOOKKEEPING / VALIDATOR CHANGE

The only inspected post-functional HIGH-RISK code change is commit `0409ed8648f82ae512289990ca5bbb292d803c2a`, modifying `scripts/validate-v3-assignments.mjs` by replacing the old assertion that both inventory rows #75 and #79 must remain `Not started` with:

- #75 must use a valid lifecycle state (`Not started`, `Implemented`, `Verified`, or `Regression-tested`); and
- #79 must still remain `Not started`.

This change does **not** alter assignment runtime code, schema, RLS, grants, trusted server authority, recipient authorization, target validation, or browser mutation rights. It preserves the later #79 boundary while allowing the now-active #75 row to advance through its own lifecycle. Architecture/security review therefore finds no trust-boundary broadening caused by this validator correction.

Whether the modified accumulated validator preserves all intended QA semantics is an A4/A5 gate; A3 does not transfer prior QA approval across SHAs.

## FACT — EXACT RUN EVIDENCE

Run `34450088492` completed successfully. Its single job records successful execution of:

1. checkout;
2. exact bookkeeping SHA assertion;
3. accumulated architecture validators;
4. accumulated edge regressions;
5. Playwright/Chromium setup;
6. local v3 server startup; and
7. accumulated browser/mobile regressions.

The isolated workflow explicitly pins `e725e5dee5a46fcaebf05200301efdb93f868b22` and invokes `scripts/validate-v3-assignments.mjs`, `scripts/validate-v3-assignment-push.mjs`, `tests/v3-assignment-push-edge.mjs`, `tests/v3-assignment-response-auth-edge.mjs`, `tests/v3-assignment-publish-auth-edge.mjs`, and `tests/v3-assignment-push-smoke.mjs` inside the accumulated harness.

The candidate's normal `.github/workflows/v3-regression.yml` is restored to `workflow_dispatch` only.

## WHAT MUST NOT BE BROADENED

- Do not grant browser INSERT/UPDATE/DELETE on `bible_assignments`, `bible_assignment_progress`, or score-event tables.
- Do not broaden ordinary Journey Group RLS/directory visibility to support the ministry target selector.
- Do not treat ministry-wide read visibility as recipient response/completion authorization.
- Do not trust browser-selected congregation, target identifiers, or client-side role state without server revalidation.
- Do not revive a parallel assignment owner or duplicate task/inbox system.
- Do not absorb #77 notification delivery, recurrence execution, or #79 linked-activity execution into #75.
- Do not weaken, remove, skip, or bypass accumulated regressions to obtain green.
- Do not modify/deploy production Supabase, Cloudflare, v2, or `main` for this rebuild gate.

## FACT / INFERENCE / RECOMMENDATION

### FACT

- Candidate `e725e5dee5a46fcaebf05200301efdb93f868b22` was unchanged at final recheck.
- Canonical remains `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`; frozen base remains `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact run `34450088492` is fully green against the explicitly pinned/asserted candidate.
- Trusted assignment publish and recipient authorization remain server-enforced with executable permanent coverage.
- The post-functional validator correction changes inventory-lifecycle acceptance only and does not alter the inspected trust boundary.

### INFERENCE

- No architecture/security defect is evidenced on exact candidate `e725e5de...`.
- The narrow validator correction does not create a security bypass because runtime authorization, RLS/grants, and trusted server code are unchanged.

### RECOMMENDATION

- Keep `e725e5de...` unchanged while A4 audits the accumulated-validator semantic preservation and A5 performs the exact-SHA firewall decision.
- If A4 is READY and A5 recommends promotion for this unchanged SHA, A1 may perform the final non-force canonical/release transaction according to control rules.
- Re-audit A3 if any subsequent change touches assignment runtime authority, RLS/grants/schema, server/client ownership, authorization predicates, or the exact candidate SHA.

## MISSING / NON-BLOCKING EVIDENCE

- No deployed production Supabase integration was executed by A3; production is intentionally out of scope and untouched. Repository trusted-boundary execution plus exact accumulated gate is the current rebuild evidence.
- A3 does not independently certify that the existing-validator modification is QA-equivalent in every historical acceptance dimension; that exact question remains for A4/A5 because modifying an accumulated validator is automatically HIGH-RISK under control policy.

## TRIAGE RECONCILIATION

After primary-evidence analysis, A3 read `automation/TRIAGE.md`. TRIAGE still targets prior functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` and is stale for current candidate-specific promotion direction. Its previous trust-boundary restrictions remain consistent with primary evidence, but its promotion recommendation cannot transfer to `e725e5de...`.

## NEXT DEPENDENCIES

A3 did not broaden into #76/#77 implementation architecture because #75 is still inside its HIGH-RISK exact-candidate promotion gate. Any later dependency must be recovered independently after #75 closure rather than inferred into this milestone.
