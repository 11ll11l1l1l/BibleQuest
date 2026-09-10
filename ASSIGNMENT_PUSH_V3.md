# BibleQuest v3 Assignment Push Workflow Contract

Updated: 2026-09-10 JST

This contract covers inventory row **#75 Assignment push workflow** only: an authorized ministry-role user publishes an assignment to a valid congregation audience, an eligible member receives it through the existing assignment read/realtime path, and the member completes it through the already-verified #73/#74 flow.

## Recovered retained sources

- retained root `assignment-advanced.js` leader create form and `bq-assignment` create invocation;
- retained `supabase/functions/bq-assignment/index.ts` authenticated `create` action and audience validation;
- verified #73/#74 owner `src/app/assignments.js` and presentation `src/features/assignments/index.js`;
- `ASSIGNMENTS_V3.md` and `ADVANCED_ASSIGNMENTS_V3.md` milestone boundaries;
- existing congregation membership, Journey Group and Team data/authorization boundaries.

## Scope and ownership

- `src/app/assignments.js` remains the sole assignment application owner. #75 extends that owner with leader publishing rather than introducing a second assignment/task service.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime boundary.
- `src/features/assignments/index.js` remains presentation/event forwarding only.
- Session and Congregation Membership remain authoritative for signed-in identity, selected congregation and fail-closed local role capability.
- The retained `bq-assignment` Edge Function remains server authority for create permission, target validation and persisted assignment identity.

## Authorized publisher

The retained server accepts assignment creation only for active congregation members whose role is one of `facilitator`, `leader`, `pastor`, or `admin`. #75 exposes publishing only to those ministry roles and still relies on the server check; browser role visibility is not authorization.

Ordinary members do not receive create/publish controls. Signed-out, local-preview and no-congregation states cannot publish.

## Audience contract

Retained target scopes are:

- `all` — all eligible members visible under the existing assignment RLS/read contract;
- `member` — one active member of the same congregation;
- `team` — one existing team in the same congregation;
- `group` — one active Journey Group in the same congregation.

For non-`all` scopes a target id is required. The browser helps select a valid target, while the retained server independently rejects a target outside the active congregation or an inactive/missing member/group.

#75 does not invent a second audience-membership calculation. Member receipt remains defined by the existing RLS-protected assignment read path and server-side visibility rules.

## Publish payload

The leader publishing surface recovers the retained assignment fields already supported by the trusted create action:

- title and instructions;
- assignment type;
- Scripture references;
- target scope and target id;
- due date and completion points;
- scheduled opening;
- reminder timestamp as stored metadata;
- recurrence rule as stored metadata only;
- required reflection;
- minimum quiz score;
- evidence type.

Input is normalized/bounded consistently with the retained server contract. A successful create reloads server truth rather than manufacturing a client-only assignment record.

### Linked activity boundary

`linked_activity` is deliberately **not** part of #75 browser publishing behavior. Inventory row #79 owns linked-activity launch/completion handoff.

### Notification boundary

A reminder timestamp may be stored because it is already part of advanced assignment metadata, but #75 does not implement Notification Center/inbox or push-delivery infrastructure. Row #77 owns notification/inbox behavior.

### Recurrence boundary

Recurrence rules may be stored/displayed, but automatic recurring-copy generation remains disabled until its independently authorized server scheduler exists. #75 does not emulate recurrence in the browser.

## Member receive and completion

Publishing feeds the same assignment identity used by #73/#74. Eligible members receive newly published assignments through the existing RLS-protected assignment query and Realtime refresh signal; no duplicate member inbox or local shadow store is introduced.

Opening, start, advanced requirement validation, completion, idempotent scoring and reload of server truth remain owned by the already-verified #73/#74 path. #75 does not duplicate those mutations.

## Privacy and safety

- Publishing cannot attach Private Notes, Cloud Notes, Transform answers, Couple Journey data, credentials or unrelated personal study state.
- Audience selection remains congregation-scoped and fail closed.
- Browser code does not directly insert into `bible_assignments`, `bible_assignment_progress`, or `bible_score_events`.
- Member responses remain governed by #73/#74; publishing does not broaden peer access to submissions.
- No production Supabase schema/function/configuration deployment is part of this rebuild milestone.

## Out of scope

- #76 Ministry Hub navigation/tool aggregation;
- #77 Notification Center/inbox and actual push notification delivery;
- #78 Workspace;
- #79 linked activity/challenge launching and completion handoff;
- leader feedback/archive administration beyond what is necessary to prove publish → receive → complete parity;
- production scheduler/deployment changes.

## Permanent verification

#75 permanent coverage proves:

1. only authorized ministry roles receive publish controls and unauthorized local attempts fail closed;
2. publish uses the central API boundary and trusted `bq-assignment` create action;
3. all/member/team/group target payloads normalize correctly and invalid/missing targets fail closed;
4. schedule, reminder, recurrence, reflection, quiz threshold and evidence fields carry without changing #74 semantics;
5. linked activity remains excluded from #75 browser publishing;
6. successful create reloads server truth and the resulting assignment appears to an eligible member through the same receive path;
7. the eligible member opens/starts/completes through existing #73/#74 behavior;
8. signed-out/local-preview/no-congregation/ordinary-member publish attempts cannot create assignments;
9. error/empty/retry states remain usable and no direct browser table-write bypass is introduced;
10. 390px leader publishing and member receive/complete paths have no horizontal overflow or page/console errors;
11. trusted handler coverage executes production authorization logic for ministry-only `targets/create`, active same-congregation discovery, invalid/foreign/inactive target rejection, valid target acceptance and missing-target fail-closed behavior;
12. accumulated #1–#74 architecture, edge and browser/mobile regressions remain green against the exact functional candidate.

## Verified functional evidence

Exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` passed complete accumulated run `34444825916`, whose isolated workflow explicitly checked out and asserted that exact SHA before executing architecture validators, edge/security regressions and browser/mobile regressions. A3 and A4 subsequently issued READY for that exact unchanged HIGH-RISK candidate, and A5 issued a promotion recommendation.

## Current state

The functional milestone contract is complete. This file is now part of the separate off-canonical #75 bookkeeping transaction. Inventory/status/handoff bookkeeping represents #74 as Regression-tested and #75 as Verified, but those states do not become canonical/frozen truth until the exact final bookkeeping SHA passes a new complete accumulated gate and is then fast-forwarded to `feature/v3-assignment-push` and frozen as the next immutable v3 release. No PASS transfers from the functional SHA to the bookkeeping SHA.