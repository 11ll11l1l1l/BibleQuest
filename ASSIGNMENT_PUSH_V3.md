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

- `src/app/assignments.js` remains the sole assignment application owner. #75 must extend that owner with leader publishing rather than introduce a second assignment/task service.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime boundary.
- `src/features/assignments/index.js` remains presentation/event forwarding only.
- Session and Congregation Membership remain authoritative for signed-in identity, selected congregation and fail-closed local role capability.
- The retained `bq-assignment` Edge Function remains server authority for create permission, target validation and persisted assignment identity.

## Authorized publisher

The retained server accepts assignment creation only for active congregation members whose role is one of `facilitator`, `leader`, `pastor`, or `admin`. #75 may expose publishing only to those ministry roles and must still rely on the server check; browser role visibility is not authorization.

Ordinary members must not receive create/publish controls. Signed-out, local-preview and no-congregation states cannot publish.

## Audience contract

Retained target scopes are:

- `all` — all eligible members visible under the existing assignment RLS/read contract;
- `member` — one active member of the same congregation;
- `team` — one existing team in the same congregation;
- `group` — one active Journey Group in the same congregation.

For non-`all` scopes a target id is required. The browser may help select a valid target, but the retained server must independently reject a target outside the active congregation or an inactive/missing member/group.

#75 must not invent a second audience-membership calculation. Member receipt remains defined by the existing RLS-protected assignment read path and server-side visibility rules.

## Publish payload

The leader publishing surface may recover the retained assignment fields already supported by the trusted create action:

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

Input must be normalized/bounded consistently with the retained server contract. A successful create must reload server truth rather than manufacture a client-only assignment record.

### Linked activity boundary

`linked_activity` is deliberately **not** part of #75 browser publishing behavior. Inventory row #79 owns linked-activity launch/completion handoff. The old compatibility form containing a linked-activity selector is evidence of retained future capability, not permission to collapse #79 into #75.

### Notification boundary

A reminder timestamp may be stored because it is already part of advanced assignment metadata, but #75 does not implement Notification Center/inbox or push-delivery infrastructure. Row #77 owns notification/inbox behavior.

### Recurrence boundary

Recurrence rules may be stored/displayed, but automatic recurring-copy generation remains disabled until its independently authorized server scheduler exists. #75 must not emulate recurrence in the browser.

## Member receive and completion

Publishing must feed the same assignment identity used by #73/#74. Eligible members receive newly published assignments through the existing RLS-protected assignment query and Realtime refresh signal; no duplicate member inbox or local shadow store is introduced.

Opening, start, advanced requirement validation, completion, idempotent scoring and reload of server truth remain owned by the already-verified #73/#74 path. #75 must not duplicate those mutations.

## Privacy and safety

- Publishing cannot attach Private Notes, Cloud Notes, Transform answers, Couple Journey data, credentials or unrelated personal study state.
- Audience selection must remain congregation-scoped and fail closed.
- Browser code must not directly insert into `bible_assignments`, `bible_assignment_progress`, or `bible_score_events`.
- Member responses remain governed by #73/#74; publishing does not broaden peer access to submissions.
- No production Supabase schema/function/configuration change is required merely to reconstruct this retained workflow.

## Out of scope

- #76 Ministry Hub navigation/tool aggregation;
- #77 Notification Center/inbox and actual push notification delivery;
- #78 Workspace;
- #79 linked activity/challenge launching and completion handoff;
- leader feedback/archive administration beyond what is necessary to prove publish → receive → complete parity;
- production scheduler/deployment changes.

## Required permanent verification

Before #75 can become Verified, permanent tests must prove at minimum:

1. only authorized ministry roles receive publish controls and the application owner rejects unauthorized local attempts;
2. publish uses only the central API boundary and trusted `bq-assignment` create action;
3. all/member/team/group target payloads normalize correctly and invalid/missing targets fail closed;
4. schedule, reminder, recurrence, reflection, quiz threshold and evidence fields are carried without changing #74 semantics;
5. linked activity remains excluded from #75 browser publishing;
6. a successful create reloads server truth and the resulting assignment appears to an eligible member through the same receive path;
7. the eligible member can open/start/complete using existing #73/#74 behavior, including advanced requirements and idempotent scoring;
8. signed-out/local-preview/no-congregation/ordinary-member publish attempts cannot create assignments;
9. error/empty/retry states remain usable and no direct browser table write bypass is introduced;
10. 390px leader publishing and member receive/complete paths have no horizontal overflow or page/console errors;
11. accumulated #1–#74 architecture, edge and browser/mobile regressions remain green against the exact #75 candidate.

## Current state

Contract recovery is complete. Implementation remains Not started until the existing central API, assignment owner and presentation can be extended cleanly with the target-directory data required by the four retained audience scopes. No production or `main` change is part of this contract.
