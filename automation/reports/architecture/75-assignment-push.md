# Architecture / Security Report — #75 Assignment Push Workflow

Agent: `BQ-A3-ARCH-SECURITY`
Updated: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#75 Assignment Push Workflow — HIGH-RISK**.
- Canonical `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine `agent/a1-work/075-assignment-push`: `a42100452d1b1fff7c146543e8ab5cd67da32193` at final pre-write recheck.
- Frozen base `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional evidence: Actions run `34444825916`, job `102767251066`, completed `success`.
- The run trigger commit was `cb2fa98653dda709f850636b247d25dcf050ba18` on an isolated verification branch, but its workflow explicitly checked out `a42100452d1b1fff7c146543e8ab5cd67da32193` and asserted `git rev-parse HEAD` equals that SHA before executing the accumulated suite.

Candidate-specific conclusions become stale immediately if the quarantine SHA moves, or if `bq-assignment`, assignment RLS/grants/migrations, the central assignment API/owner, #75 security tests, or exact workflow evidence changes. Canonical/frozen provenance becomes stale if those refs move. Bookkeeping will create a different SHA and requires a fresh review appropriate to that state.

## A3 DISPOSITION

**ARCHITECTURE / SECURITY READY for exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`. No current architecture/security blocker is established.**

This is an A3 trust-boundary disposition only. #75 is HIGH-RISK, so promotion still requires a fresh A4 READY review of this exact unchanged candidate and then A5 promotion recommendation. No PASS transfers to a later bookkeeping SHA.

## PRIMARY EVIDENCE INSPECTED BEFORE TRIAGE

A3 independently inspected live canonical/quarantine/frozen refs; candidate-vs-frozen/canonical changes; `ASSIGNMENT_PUSH_V3.md`; `DEVELOPMENT_HANDOFF_V3.md`; `src/core/api.js`; `supabase/functions/bq-assignment/index.ts`; assignment schema/RLS/grant migrations including `20260904_assignments_presence_unlocks.sql`, `20260905181000_linked_activity_assignment_groups.sql`, and `20260905_browser_grant_parity.sql`; permanent #75 authorization regressions; candidate accumulated workflow; exact Actions run/job evidence; and the isolated exact-SHA verification workflow. Provisional findings were formed before reading `automation/TRIAGE.md` or A2/A4 conclusions.

## FACT — SAFE TRUST BOUNDARY

1. The browser assignment boundary remains centralized in `src/core/api.js`. Assignment reads use RLS-backed `bible_assignments` / `bible_assignment_progress`; target discovery and `create/start/complete` invoke the trusted `bq-assignment` Edge Function. Realtime subscription ownership is centralized and cleanup is idempotent through a `closed` guard plus `removeChannel`.
2. `bq-assignment` authenticates the request, requires active membership in the supplied congregation, and then applies action-specific authorization before service-role database mutations.
3. `targets` and `create` require role `facilitator`, `leader`, `pastor`, or `admin`. Target discovery filters members, teams and Journey Groups to active records in the selected congregation.
4. `create` independently revalidates every non-`all` target server-side: member through active congregation membership; team through matching id + congregation + active; group through matching id + congregation + active. Invalid, foreign, inactive or missing targets fail before assignment insertion.
5. `start` and `complete` use recipient eligibility rather than ministry visibility. `all` includes active congregation members; `member` requires exact user id; `team` requires membership; `group` requires active group membership. Ministry status alone does not authorize response/completion.
6. Assignment/progress browser table privileges remain read-oriented. Their defining RLS policies are SELECT-only, and the later browser-grant normalization first revokes all browser privileges and re-grants only operations backed by RLS policies. Therefore #75 mutations remain on the trusted function/service path rather than direct browser DML.
7. The later group-visibility migration extends assignment visibility to `group` and adds `pastor` to ministry read visibility without broadening ordinary Journey Group directory access. Ministry-wide read visibility is intentionally distinct from recipient mutation eligibility.

## FACT — PERMANENT SECURITY EVIDENCE NOW CLOSES THE PRIOR GAP

`tests/v3-assignment-publish-auth-edge.mjs` loads the production `supabase/functions/bq-assignment/index.ts`, removes only TypeScript/import syntax needed for Node VM execution, captures the production request handler, and executes it with controlled auth/database boundary doubles. It proves:

- ordinary `member` is denied `targets` and `create`, with no insertion;
- `facilitator`, `leader`, `pastor`, and `admin` are accepted;
- discovery returns only active same-congregation members, teams and groups;
- foreign/inactive member/team/group targets are rejected before insert;
- valid active same-congregation targets succeed;
- missing non-`all` target fails closed.

`tests/v3-assignment-response-auth-edge.mjs` executes the production recipient helper and proves non-recipient ministry identities cannot respond to member/team/group-targeted assignments. It also guards against restoring the former ministry-wide response path.

The specific HIGH-RISK proof weakness previously identified for trusted `targets/create` authorization is therefore no longer present on `a4210045...`.

## FACT — EXACT EXECUTED WORKFLOW EVIDENCE

Run `34444825916` completed successfully. Its single regression job shows successful steps for exact candidate SHA assertion, accumulated architecture validators, accumulated edge regressions, Playwright/Chromium installation, local server, and accumulated browser/mobile regressions.

The isolated verification workflow explicitly pins checkout to `a42100452d1b1fff7c146543e8ab5cd67da32193` and invokes:

- `scripts/validate-v3-assignment-push.mjs` in the accumulated architecture phase;
- `tests/v3-assignment-push-edge.mjs`;
- `tests/v3-assignment-response-auth-edge.mjs`;
- `tests/v3-assignment-publish-auth-edge.mjs`;
- `tests/v3-assignment-push-smoke.mjs` in the accumulated browser/mobile phase.

The live candidate workflow is restored to normal `workflow_dispatch`-only operation. Candidate-vs-frozen comparison shows #75 test/validator additions and bounded assignment owner/API/function changes; no unexplained deletion of the accumulated harness was identified.

## REQUIRED SERVER / AUTHORIZATION PATH

The safe required path is:

`session + selected congregation` → `src/app/assignments.js` sole application owner → `src/core/api.js` sole browser cloud boundary → authenticated `bq-assignment` → active congregation membership → action-specific role/recipient/target validation → service-role persistence → existing RLS/Realtime read/receive path.

Browser role checks remain UX gating only. Server membership/role/recipient/target checks are authoritative because the Edge Function uses service authority for persistence and can bypass ordinary RLS.

## WHAT MUST NOT BE BROADENED

- Do not broaden ordinary Journey Group RLS or congregation-wide group directory visibility merely to populate the ministry target selector.
- Do not grant browser INSERT/UPDATE/DELETE over `bible_assignments`, `bible_assignment_progress`, or score-event tables.
- Do not treat ministry read visibility as recipient mutation eligibility.
- Do not trust browser-selected congregation, target lists, or local role state without server revalidation.
- Do not revive retained `assignment-advanced.js` as a parallel assignment owner.
- Do not add a second task/inbox system; #75 composes the existing #73/#74 receive/complete path.
- Do not absorb #77 notification delivery/inbox, recurrence execution, or #79 linked-activity execution into #75.
- Do not weaken/remove accumulated regressions or move normal Actions away from manual-only operation.
- Do not modify or deploy production Supabase/Cloudflare/v2 as part of this rebuild gate.

## FACT / INFERENCE / RECOMMENDATION

### FACT

- Exact candidate is `a42100452d1b1fff7c146543e8ab5cd67da32193` and remains unchanged at final pre-write recheck.
- Canonical remains `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`; frozen base remains `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact run `34444825916` is green and executes the accumulated suite against the pinned/asserted candidate.
- Trusted publish authorization/target scope and recipient response authorization now have meaningful permanent executable coverage against production function logic.
- Assignment browser DML is not opened by the inspected RLS/grant chain; trusted service code remains the mutation authority.

### INFERENCE

- Given the inspected source, RLS/grant chain, faithful trusted-boundary tests, and exact accumulated run, no unresolved #75 architecture/security defect is evidenced on this SHA.
- The trusted target directory is the correct narrow mechanism; broadening Journey Group RLS would increase exposure without being required by #75.

### RECOMMENDATION

- Preserve `a4210045...` unchanged while A4/A5 review the same SHA.
- If A4 becomes READY and A5 recommends promotion, perform bookkeeping separately and re-run the complete accumulated suite on the exact bookkeeping SHA before canonical/release advancement.
- Re-audit A3 if bookkeeping or later work touches assignment trust boundaries, RLS/grants, API ownership, or authorization predicates.

## MISSING / NON-BLOCKING EVIDENCE

- No deployed production Supabase integration was executed by A3; production is intentionally out of scope and untouched. This is not a functional-candidate blocker because the permanent tests execute production authorization logic and the milestone gate is repository rebuild verification.
- A4's existing report is stale because it audits `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`, not current `a4210045...`; a fresh A4 exact-SHA disposition is still mandatory.
- A5 TRIAGE is likewise stale for candidate-specific direction: it targets `78fa191f...` and requests the trusted publish-auth executable evidence that now exists on `a4210045...`.
- No bookkeeping candidate/evidence exists yet.

## TRIAGE / REPORT RECONCILIATION

After forming the provisional primary-evidence findings, A3 read TRIAGE and advisory reports. A2 is current on `a4210045...` and independently records no contract blocker. A4 and TRIAGE still target older `78fa191f...`; their prior request for faithful `targets/create` proof was valid for that SHA but is satisfied by the current candidate's permanent handler-execution regression. Their old promotion disposition must not be transferred to the new SHA.

## NEXT DEPENDENCIES

A3 did not broaden into #76/#77 architecture in this run because active HIGH-RISK #75 is not yet promotion-authorized. #77 remains explicitly outside #75. Any later milestone must be independently recovered from its authoritative live contract rather than inferred into this review.
