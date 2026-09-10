# A3 architecture/security review — #79 Linked Activities

Agent: `BQ-A3-ARCH-SECURITY`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: #79 Linked activities/challenges.
- Canonical branch: `feature/v3-linked-activities`.
- Exact canonical HEAD at final live re-read: `b446ea26c190905efa6af2f45727f920eb643cb9`.
- Dedicated `agent/a1-work/079-...` candidate: **not found**.
- Latest frozen base independently verified: `release/v3.51-workspace` at `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- Exact complete accumulated workflow run evidence for current HEAD: **none found** (`head_sha=b446ea26...` returned zero runs at inspection time).
- This report is stale immediately if `feature/v3-linked-activities` moves, a work candidate appears, trusted assignment/server code changes, schema/RLS/grants change, or the #79 contract changes.

## INSPECTED PRIMARY EVIDENCE

FACT:
- Frozen v3.51 ref resolves to `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- #79 canonical is a direct descendant of that frozen base and advanced during this investigation to `b446ea26c190905efa6af2f45727f920eb643cb9`.
- Current #79 contract is bounded to `launch linked activity; completion handoff`.
- `src/app/linked-activities.js` is a thin orchestration owner: fixed route allowlist/type fallback only; no Supabase client, Edge invocation, fetch, storage, or persistence calls.
- Launch calls `assignments.start()` before returning a route. Completion calls `assignments.complete()`.
- `src/app/assignments.js` remains the assignment state/start/completion owner.
- `src/core/api.js` sends start/complete through trusted `bq-assignment` actions.
- `supabase/functions/bq-assignment/index.ts` rechecks authenticated active congregation membership, assignment recipient scope, scheduled-open state, completion requirements, duplicate completion, and score-event authority server-side.
- Current browser Assignment API projection does not include `linked_activity`; the revised #79 contract intentionally uses already-authoritative assignment-type fallback for currently authorable types and leaves legacy custom metadata-only links instruction-only rather than broadening the API contract without evidence.
- Explicit linked metadata supplied to the orchestration owner is normalized and unknown/malformed kinds fail closed.
- Live Rooms is explicitly unavailable rather than mapped to an unverified surface.
- Permanent #79 coverage exists: `scripts/validate-v3-linked-activities.mjs`, `tests/v3-linked-activities-edge.mjs`, and `tests/v3-linked-activities-smoke.mjs`.
- Exact current `v3-regression.yml` remains `workflow_dispatch`-only.
- Exact current workflow at `b446ea26...` invokes the new #79 architecture validator, edge regression and browser/mobile smoke additively. The commit that accumulated them changed only the three corresponding invocation lists; no prior invocation was removed or bypassed in that diff.
- `DEVELOPMENT_HANDOFF_V3.md` is stale: it still describes v3.49/#77 and cannot override live refs.
- `automation/TRIAGE.md` is stale: it still describes #77.

## REQUIRED OWNER / COMPOSITION

RECOMMENDATION:
- Keep `src/app/assignments.js` as the sole assignment lifecycle owner.
- Keep `src/app/linked-activities.js` as pure orchestration/allowlisted routing only.
- Keep persistence and authorization through Assignments -> `src/core/api.js` -> trusted `bq-assignment`.
- Do not let destination features mutate assignment progress or award assignment points.

## SAFE DATA FLOW / TRUST BOUNDARY

FACT:
1. User opens an assignment already visible through the verified Assignments owner.
2. Linked Activities resolves only a recognized/fallback kind to a fixed internal route.
3. Launch delegates to `assignments.start()`.
4. `assignments.start()` calls the central API.
5. The API invokes `bq-assignment`.
6. The trusted server re-authorizes active membership, assignment recipient scope and schedule before persisting `started`.
7. The linked destination receives navigation only and no assignment-write authority.
8. Completion returns to Assignments and delegates through the same trusted server boundary; reflection/evidence/quiz requirements and score-event idempotence remain server-owned.

This is the safe trust boundary for #79.

## AUTHORIZATION / RLS / SERVER

FACT:
- #79 itself does not require new schema, migration, RLS policy, grant, RPC, Edge Function, or browser database mutation.
- Existing server authority is materially stronger than a client role check: recipient scope for `all/member/team/group` is re-evaluated by `bq-assignment` using authenticated identity and server-side database lookups.
- Completion points are awarded by the trusted handler only after successful completion and use an idempotent assignment source-event key.

RECOMMENDATION:
- Do not broaden #79 into direct browser progress writes, arbitrary deep links, destination-owned completion, client-awarded points, or another persistence owner.
- If A1 later changes `bq-assignment`, schema/RLS/grants, central API semantics, global router ownership, dependencies, or workflow semantics beyond additive #79 invocation, reclassify #79 HIGH-RISK and require fresh exact-candidate A3/A4/A5 review.

## LIFECYCLE / CLEANUP

FACT:
- #79 introduces no Realtime subscription, timer, listener lifecycle, or new remote synchronization owner in the orchestration service.
- Assignment lifecycle remains owned by the pre-existing Assignments service.

## PRIVACY / SCOPE

FACT:
- The existing Assignments completion UI states that private Bible notes, journal, Transform answers and Couple Journey data are not attached to assignment completion.
- #79 adds no new content-sharing or destination-data extraction path.

RECOMMENDATION:
- Preserve that separation. A linked destination must not implicitly attach destination-private content to a leader submission.

## UNSAFE APPROACHES

- Accepting stored `linked_activity` as an arbitrary route or URL.
- Navigating to Live Rooms while #43 is unverified.
- Letting linked features write `bible_assignment_progress` directly.
- Awarding assignment points from the destination feature.
- Treating client-side visibility/role checks as recipient authorization.
- Adding schema/API/backend scope merely to recover legacy custom metadata-only links without stronger primary evidence.

## BLOCKERS

Architecture/security blocker: **none established for the bounded current implementation**.

Control/process safeguard requiring reconciliation before autonomous promotion: the active product implementation is present on canonical `feature/v3-linked-activities`, while no `agent/a1-work/079-...` quarantine candidate exists. This is not evidence of a product trust-boundary defect, but it does not satisfy the autonomous quarantine invariant. A1/A5 must reconcile whether this was manual work and establish a valid promotion path rather than treating canonical presence itself as autonomous candidate authorization.

## NON-BLOCKING OBSERVATIONS

- The current #79 workflow change is additive current-milestone accumulation only, so it does not by itself trigger the control rule that makes broader workflow semantics changes HIGH-RISK.
- The move away from projecting legacy `linked_activity` through the browser API is security-conservative and avoids inventing a new API/data contract; currently authorable assignment types still have deterministic fallback routes.

## MISSING EVIDENCE

- No exact complete accumulated workflow run was found for `b446ea26c190905efa6af2f45727f920eb643cb9`.
- No dedicated #79 work-candidate SHA exists to which candidate-specific review can attach.
- File presence and workflow wiring do not establish PASS; exact execution must prove the architecture validator, edge test, browser smoke and every prior accumulated regression execute successfully on the final SHA.
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
- the accumulated workflow actually invokes the #79 architecture, edge and browser tests while retaining all prior coverage;
- exact full-suite execution is green on the final SHA used for bookkeeping/promotion.

## DISPOSITION

INFERENCE/RECOMMENDATION: #79 remains **NORMAL-RISK only while it stays inside the composition above**. The current architecture has a safe path and no proven trust-boundary blocker. Promotion/readiness cannot be inferred yet because exact current-SHA accumulated execution evidence is missing and the canonical-without-quarantine process state must be reconciled independently.