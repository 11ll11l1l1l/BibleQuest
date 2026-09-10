# A2 Contract Audit — #75 Assignment Push Workflow

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-10 JST

## STATE / PROVENANCE
- Active milestone: **#75 Assignment Push Workflow**.
- Canonical branch `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine candidate `agent/a1-work/075-assignment-push`: `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`.
- Frozen base `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional verification run inspected: `34438690160`.
- This report supersedes the prior A2 audit bound to candidate `1ddc4c8b8fd90f9a3e5a1b0a9788cb6dc1ea57be`.

## EVIDENCE INSPECTED — PRIMARY
- `FEATURE_INVENTORY_V3.md` on exact candidate.
- `ASSIGNMENT_PUSH_V3.md` on exact candidate.
- `DEVELOPMENT_HANDOFF_V3.md` on exact candidate.
- retained `assignment-advanced.js` from frozen v3.47.
- candidate `supabase/functions/bq-assignment/index.ts`.
- exact verification workflow as executed from trigger commit `bd3455e1252b77d5a5527e83c52b9e6ccb286be3`.
- Actions run `34438690160` and job `102749002955`.
- live canonical and candidate branch refs immediately before this report write.
- `automation/TRIAGE.md` was read only after the above independent pass.

## FACT — AUTHORITATIVE PARITY BOUNDARY
The authoritative inventory still defines row #75 narrowly as `leader publish→member receive→complete`. It records #74 Advanced assignments as Verified and #75 as Not started pending promotion bookkeeping; the ledger therefore remains intentionally behind quarantine implementation and must not be treated as candidate status evidence.

The retained compatibility source proves the old authoring flow used the existing assignment form and trusted `bq-assignment` function, supported group targeting and advanced schedule/reminder/recurrence/reflection/quiz/evidence fields, refreshed assignment truth after create, and also exposed a linked-activity selector. The current #75 contract correctly treats the latter as later-row evidence rather than permission to absorb #79.

Required #75 parity remains:
1. ministry-role publishing for `facilitator`, `leader`, `pastor`, and `admin`, with trusted server authorization remaining authoritative;
2. audiences `all`, `member`, `team`, and `group`, scoped to the selected congregation and independently validated server-side;
3. retained publish data: title, instructions, assignment type, Scripture refs, target scope/id, due date, points, schedule, reminder metadata, recurrence metadata, required reflection, minimum quiz score, and evidence type;
4. successful create converges by reloading server truth and reuses the existing #73/#74 assignment identity/read/realtime/start/complete path;
5. one assignment application owner and one browser trusted-function/API boundary; no direct browser assignment/progress/score table writes;
6. no Notification Center/push-delivery implementation (#77), no recurrence scheduler, no Workspace (#78), and no linked-activity launch/completion handoff (#79).

## FACT — CURRENT CANDIDATE CONTRACT IMPLEMENTATION
Candidate trusted function `supabase/functions/bq-assignment/index.ts` contains:
- a ministry-gated `targets` action returning only active same-congregation members, active teams, and active Journey Groups through the trusted admin/server boundary;
- ministry-gated `create` with four allowed target scopes, required non-`all` target id, and independent same-congregation validation for member/team/group targets;
- bounded/normalized advanced metadata and assignment insert through the trusted server;
- response authorization separated from ministry visibility: `start`/`complete` calls `assignmentRecipient`, which accepts congregation-wide `all`, exact member target, matching team membership, or active group membership. Ministry role alone no longer grants response eligibility.

This resolves the earlier candidate defect where ministry visibility could authorize response mutations for assignments not actually addressed to the ministry user.

## FACT — EXACT FUNCTIONAL EVIDENCE
Run `34438690160` completed with conclusion `success`. The workflow commit that triggered that run explicitly checked out `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4` and asserted that exact SHA before execution.

The successful job executed all three accumulated phases:
- accumulated architecture validators, including `validate-v3-assignment-push.mjs`;
- accumulated edge regressions, including `v3-assignment-push-edge.mjs` and `v3-assignment-response-auth-edge.mjs`;
- accumulated Playwright/browser-mobile regressions, including `v3-assignment-push-smoke.mjs`.

No PASS is transferred from an earlier SHA; this evidence is specific to `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`.

## VERIFIED OWNERS TO COMPOSE
- `src/app/assignments.js`: sole assignment application owner.
- `src/core/api.js`: sole browser cloud/trusted-function/Realtime boundary.
- `src/features/assignments/index.js`: assignment presentation/event forwarding surface.
- Session/congregation membership owners remain identity, active-congregation and local capability inputs; browser role gating is not server authorization.
- `supabase/functions/bq-assignment/index.ts`: trusted server authority for target discovery, create and assignment response mutations.

## UX / STATE — FACT
- Ordinary members must not receive authoring controls.
- Signed-out, local-preview and no-congregation states cannot publish.
- Authoring is congregation-scoped and fail-closed.
- Successful publish must reload server truth; no client-only assignment shadow is part of parity.
- Eligible members receive the created assignment through the existing assignment read/Realtime path and complete through #73/#74 semantics.

## EXPLICITLY OUT OF SCOPE
- #76 Ministry Hub tool aggregation/navigation.
- #77 Notification Center/read-unread inbox and actual notification delivery.
- #78 Workspace.
- #79 linked-activity/challenge launch and completion handoff.
- browser recurrence generation/scheduling infrastructure.
- broad Journey Group visibility changes solely for selector convenience.
- revival of retained `assignment-advanced.js` as a second runtime owner.

## LEGACY BEHAVIOR NOT TO COPY
- The retained compatibility layer directly enhanced DOM forms/cards and queried active groups itself. It is source evidence, not an architecture owner to revive.
- Its linked-activity selector crosses into #79 and must not be used to broaden #75.
- Recurrence metadata in retained behavior did not mean browser-side recurrence generation existed.

## FACT / INFERENCE / RECOMMENDATION
### FACT
- Exact candidate remains `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4` at report-write recheck.
- Canonical remains `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Exact functional run `34438690160` is green and executed the intended accumulated architecture, edge, and browser/mobile phases against the exact candidate.
- The current trusted function contains recipient-specific response authorization rather than ministry-wide response authorization.

### INFERENCE
- The current trusted target-directory approach is consistent with retained four-audience parity while avoiding an unnecessary broadening of ordinary Journey Group reads.
- The candidate appears contract-complete at source level for #75; final promotion authorization is outside A2 ownership and depends on fresh A4/A5 HIGH-RISK review plus later exact bookkeeping-SHA verification.

### RECOMMENDATION
- Keep `78fa191f...` unchanged until the required exact-candidate A4 review and A5 promotion disposition complete.
- If those reviews authorize promotion, bookkeeping should update the authoritative ledger/handoff off-canonical and the full accumulated suite must run again against the exact bookkeeping SHA before canonical/release advancement.
- Do not add #76/#77/#79 behavior while closing #75.

## AMBIGUITIES / BLOCKERS
No unresolved contract ambiguity or primary-evidence contract blocker was established by A2 for exact candidate `78fa191f...`.

The remaining gate is procedural/evidence-based for this HIGH-RISK milestone: exact-candidate independent QA/firewall promotion review, then exact bookkeeping-SHA verification. A2 does not classify or authorize promotion.

## MISSING EVIDENCE
- A2 did not independently execute a new runtime test suite; it audited the exact GitHub Actions run and workflow evidence already produced for this candidate.
- Bookkeeping candidate does not yet exist, so there is necessarily no exact bookkeeping-SHA accumulated run yet.
- Production behavior is intentionally not tested or modified as part of this rebuild gate.

## CONCRETE ACCEPTANCE CHECKLIST
- [x] Authoritative #75 contract recovered without broadening later rows.
- [x] Ministry publisher roles recovered and server-authoritative.
- [x] Four retained target scopes recovered and independently server-validated.
- [x] Target discovery stays trusted/congregation-scoped.
- [x] Existing assignment owner/API boundary retained.
- [x] Publish metadata contract retained while linked activity remains excluded.
- [x] Response authorization is recipient-specific for member/team/group and congregation-wide only for `all`.
- [x] Permanent #75 architecture/edge/browser coverage is invoked by the accumulated workflow.
- [x] Exact functional candidate `78fa191f...` has complete accumulated green run `34438690160`.
- [ ] Fresh HIGH-RISK A4/A5 promotion authorization on this exact unchanged candidate.
- [ ] Off-canonical bookkeeping candidate and exact bookkeeping-SHA complete accumulated green gate.

## DEPENDENCY-LIKELY NEXT MILESTONES
### #76 Ministry Hub — FACT
Inventory acceptance is only `open tools; role guard; navigation`. #75 explicitly excludes it. Before #76 implementation, recover retained tool-entry/navigation evidence and compose existing route/session/role owners; do not turn Ministry Hub into a new assignment owner or broad dashboard refactor.

### #77 Notification Center/inbox — FACT
Inventory acceptance is `load; read/unread; open target; refresh`. #75's `reminder_at` is metadata only and does not prove push/inbox delivery. Before #77 implementation, independently recover retained notification persistence/read authority, target-routing behavior and congregation/session scope.

## TRIAGE RECONCILIATION
After the independent pass, current TRIAGE was reviewed. It agrees with the primary evidence that the current authorization defect is corrected, exact functional evidence now exists, and promotion remains gated by exact-candidate HIGH-RISK review plus bookkeeping verification. This agreement is not used as proof.

## STALENESS CONDITIONS
This report becomes stale for candidate-specific conclusions immediately if:
- `agent/a1-work/075-assignment-push` moves from `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`;
- canonical `feature/v3-assignment-push` moves from `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`;
- frozen base moves from `2523f85d47f59721eae81da10cf1007d29af4139`;
- a later exact run supersedes or contradicts run `34438690160`;
- authoritative #75 contract/inventory changes.

Reinspect primary evidence before using this report against any changed SHA.