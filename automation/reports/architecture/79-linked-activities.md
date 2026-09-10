# A3 architecture/security review — #79 Linked Activities

Agent: `BQ-A3-ARCH-SECURITY`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: #79 Linked activities/challenges.
- Canonical branch: `feature/v3-linked-activities`.
- Exact canonical HEAD at final pre-write re-read: `b3a54f9d3021bb2c800e293d5b9094a160dd7ca2`.
- Dedicated `agent/a1-work/079-...` candidate: **not found**.
- Latest frozen base independently verified: `release/v3.51-workspace` at `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- Exact #79 workflow run evidence for current HEAD: **none found**.
- This report is stale immediately if `feature/v3-linked-activities` moves, a work candidate appears, trusted assignment/server code changes, schema/RLS/grants change, or the #79 contract changes.

## INSPECTED PRIMARY EVIDENCE

FACT:
- Frozen v3.51 ref resolves to `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- #79 canonical is a direct descendant of that frozen base and had advanced to `b3a54f9d...` during this investigation.
- Current #79 contract is bounded to `launch linked activity; completion handoff`.
- `src/app/linked-activities.js` is a thin orchestration owner: route allowlist/fallback only; no Supabase client, Edge invocation, fetch, storage, or persistence calls.
- Launch calls `assignments.start()` before returning a route. Completion calls `assignments.complete()`.
- `src/app/assignments.js` remains the assignment state/start/completion owner.
- `src/core/api.js` sends start/complete through `bq-assignment`.
- `supabase/functions/bq-assignment/index.ts` rechecks authenticated active congregation membership, assignment recipient scope, scheduled-open state, completion requirements, duplicate completion, and score-event authority server-side.
- Current browser Assignment projection does not include `linked_activity`; the revised #79 contract intentionally uses already-authoritative assignment-type fallback for currently authorable types and leaves legacy custom metadata-only links instruction-only.
- Explicit linked metadata supplied to the orchestration owner is normalized and unknown/malformed kinds fail closed.
- Live Rooms is explicitly unavailable rather than mapped to an unverified surface.
- Permanent edge coverage exists at `tests/v3-linked-activities-edge.mjs`; a 390px browser regression and architecture validator have also been added by the current canonical sequence.
- At inspected HEADs, the normal `v3-regression.yml` remained `workflow_dispatch`-only. At `42f4e5f...`, the workflow had not yet been wired to invoke the new #79 validator/edge/smoke tests; `b3a54f9d...` added the architecture guard that requires those invocations, but no exact run against `b3a54f9d...` was found before this report was written.
- `DEVELOPMENT_HANDOFF_V3.md` is stale: it still describes v3.49/#77 and cannot be used as current state evidence.
- `automation/TRIAGE.md` is stale: it still describes #77.

## REQUIRED OWNER / COMPOSITION

RECOMMENDATION:
- Keep `src/app/assignments.js` as the sole assignment lifecycle owner.
- Keep `src/app/linked-activities.js` as pure orchestration/allowlisted routing only.
- Keep persistence and authorization through the existing Assignments -> `src/core/api.js` -> trusted `bq-assignment` path.
- Do not let destination features mutate assignment progress or award assignment points.

## SAFE DATA FLOW / TRUST BOUNDARY

FACT:
1. User opens an assignment already visible through the verified Assignments owner.
2. Linked Activities resolves only a recognized/fallback kind to a fixed internal route.
3. Launch delegates to `assignments.start()`.
4. `assignments.start()` calls the central API.
5. The API invokes `bq-assignment`.
6. The trusted server re-authorizes active membership, assignment recipient scope and schedule before persisting `started`.
7. The linked feature runs independently and receives no assignment-write authority.
8. Completion returns to Assignments and delegates through the same trusted server boundary; reflection/evidence/quiz requirements and score-event idempotence remain server-owned.

This is the correct trust boundary for #79.

## AUTHORIZATION / RLS / SERVER

FACT:
- #79 itself does not require new schema, migration, RLS policy, grant, RPC, Edge Function, or browser database mutation.
- Existing server authority is materially stronger than a client role check: recipient scope for `all/member/team/group` is re-evaluated by `bq-assignment` using authenticated identity and server-side database lookups.
- Completion points are awarded by the trusted handler only after successful completion and use an idempotent assignment source-event key.

RECOMMENDATION:
- Do not broaden #79 into direct browser progress writes, arbitrary deep links, destination-owned completion, client-awarded points, or a new persistence owner.
- If A1 later changes `bq-assignment`, schema/RLS/grants, central API semantics, global router ownership, or workflow semantics beyond additive #79 invocation, reclassify #79 HIGH-RISK and require exact-candidate A3/A4/A5 review.

## PRIVACY / SCOPE

FACT:
- The current handoff text presented in the Assignments UI states private Bible notes, journal, Transform answers and Couple Journey data are not attached to assignment completion.
- #79 adds no new sharing path.

RECOMMENDATION:
- Preserve that separation. A linked destination must not implicitly attach destination-private content to the leader submission.

## UNSAFE APPROACHES

- Accepting stored `linked_activity` as an arbitrary route/URL.
- Navigating to Live Rooms while #43 is unverified.
- Letting linked features write `bible_assignment_progress` directly.
- Awarding points from the destination feature.
- Treating a client-side role/visibility check as recipient authorization.
- Adding schema/API/backend scope merely to recover legacy custom metadata-only links without stronger contract evidence.

## BLOCKERS

Architecture/security blocker: **none established for the bounded current implementation**.

Control/process safeguard requiring reconciliation before release: the active product implementation is present on canonical `feature/v3-linked-activities`, while no `agent/a1-work/079-...` quarantine candidate exists. This is not evidence of a trust-boundary defect in the code inspected, but it does not satisfy the autonomous quarantine invariant. A1/A5 must reconcile authorship/process state before treating this branch as an autonomous promotion candidate.

## MISSING EVIDENCE

- No exact complete accumulated workflow run was found for canonical `b3a54f9d3021bb2c800e293d5b9094a160dd7ca2`.
- No dedicated #79 work-candidate SHA exists to which candidate-specific review can attach.
- At the last inspected workflow before the architecture-guard commit, #79 validator/edge/smoke invocations were not yet wired into the accumulated workflow; exact current-head execution must prove the final wiring rather than relying on file presence.
- No primary evidence was found requiring #79 to expose legacy custom `linked_activity` metadata through the current Assignment browser projection. Current fail-closed instruction-only handling is therefore acceptable unless stronger retained-source/contract evidence establishes that custom links are mandatory parity.

## ARCHITECTURE ACCEPTANCE CHECKS

#79 is architecture/security-ready only if the exact final candidate demonstrates all of the following:
- fixed internal route allowlist; malformed/unknown explicit metadata fails closed;
- Live Rooms remains unavailable while #43 is not rebuilt;
- launch reaches `assignments.start()` before navigation;
- completion reaches `assignments.complete()` and preserves requirement failures;
- no destination feature can award assignment completion or points;
- no new direct Supabase/browser mutation path is introduced;
- no schema/RLS/grant/RPC/Edge authority is broadened without explicit HIGH-RISK review;
- the accumulated workflow actually invokes the #79 architecture, edge and browser tests while retaining prior coverage;
- exact full-suite execution is green on the final SHA used for bookkeeping/promotion.

## DISPOSITION

INFERENCE/RECOMMENDATION: #79 remains **NORMAL-RISK only while it stays inside the composition above**. The current architecture has a safe path and no proven trust-boundary blocker. Promotion/readiness cannot be inferred yet because exact current-SHA accumulated execution evidence is missing and the quarantine/canonical process state must be reconciled independently.