# BibleQuest v3 Assignments Contract

Updated: 2026-09-10 JST

This contract covers inventory row **#73 Assignments** only: receive, open, complete, and status sync. It deliberately does not implement #74 Advanced assignments, #75 Assignment push workflow, #76 Ministry Hub, #77 Notification Center/inbox, #78 Workspace, or #79 Linked activities/challenges.

## Retained sources recovered before rebuild

- old `assignment-center.js` member task lifecycle and realtime refresh behavior;
- later assignment schema/target hardening through commit `37170cc3fc2005844b620d25ccbe8fdc0bc6cbbe`;
- live `bq-assignment` authenticated Edge Function, currently `verify_jwt=true`;
- live `bible_assignments` and `bible_assignment_progress` schema, RLS, grants and realtime publication;
- `DEVOTIONAL_MINISTRY_DESIGN_V3.md`, which requires later ministry surfaces to reuse one task/post identity rather than invent competing assignment systems.

## Ownership

- `src/app/assignments.js` is the sole #73 application owner. It normalizes visible assignments and the current user's progress, owns open/close selection, invokes start/complete through the API, reloads server truth after mutation, and owns the realtime refresh lifecycle.
- `src/core/api.js` remains the sole browser Supabase boundary. #73 uses RLS-protected SELECTs plus the retained trusted `bq-assignment` function for start/complete.
- `src/features/assignments/index.js` is presentation only.
- Session and Congregation Membership remain authoritative for account identity and active congregation scope.

## Receive / visibility

The browser must never construct a second audience-authorization system. The existing assignment SELECT policy remains authoritative for congregation, target audience and scheduled-open visibility.

The #73 API requests only active assignments in the selected congregation. For progress it requests only the signed-in user's rows, even though ministry roles may have broader RLS read authority for later leader workflows. Progress from another user is never required by the #73 member surface.

Target scopes retained by the existing backend are `all`, `member`, `team`, and `group`. Future-scheduled assignments remain hidden from ordinary members until the existing RLS policy opens them.

The retained old assignment center made assignment completion controls member-facing. Therefore #73 remains **read-only for ministry roles** (`facilitator`, `leader`, `pastor`, `admin`): they may inspect visible assignment details in this bounded surface, but start/complete is blocked by the application owner and hidden by the UI. Leader creation, feedback, archive, scheduling and management belong to later assignment/ministry rows.

## Open

Opening a task selects one already-visible assignment and shows its title, instructions, type, Scripture references, due date, trusted completion-point value, and the current user's status. Opening alone does not fabricate a progress write.

For a normal member, a separate Start action invokes the retained trusted function and persists `started`. A task may also be completed directly because the retained server contract permits `complete` without a prior explicit start.

## Complete

Completion always invokes `bq-assignment` with the selected congregation and assignment id. Optional intentional member submission is trimmed and bounded to 4000 characters.

The retained trusted function owns:
- assignment visibility re-check;
- scheduled-open check;
- server-backed progress upsert;
- idempotent completion;
- trusted assignment score award and duplicate protection;
- any advanced requirement enforcement already present on existing assignments.

The browser does not write `bible_assignment_progress` or `bible_score_events` directly and does not calculate awarded points.

After start or complete, the #73 owner reloads assignment/progress state from the RLS-protected API rather than trusting optimistic client state.

## Status sync

Both retained assignment tables are already members of the Supabase realtime publication. `src/core/api.js` owns the channel implementation:
- assignment changes are scoped to the selected congregation;
- progress changes are scoped to the signed-in user;
- the application owner reloads server truth after a realtime signal;
- teardown removes the channel when the surface/congregation is left;
- cleanup is idempotent so route teardown cannot remove the same channel twice.

Realtime is a refresh signal only. Payload data is not treated as authoritative application state.

## Privacy / safety boundary

#73 may display only the signed-in user's submission and leader feedback. It never requests or renders peer response bodies.

Private Notes, Cloud Notes, Transform answers, Couple Journey data, credentials, and unrelated personal study state are not part of the assignment payload.

#73 does not implement leader create/feedback/archive controls. Those belong to later assignment/ministry milestones and must retain server-side authorization.

## Permanent verification

Coverage proves:
- signed-in receive and empty state;
- selected congregation scope and malformed/foreign data rejection;
- open/close and unknown assignment rejection;
- started and completed status reload from server truth;
- completion idempotency/result normalization;
- optional submission bounding;
- ministry-role read-only behavior;
- signed-out, local-preview, and no-congregation states;
- realtime refresh signal plus exactly-once cleanup;
- 390px browser flow with no horizontal overflow or console/page errors;
- architecture proof that direct Supabase/Realtime ownership remains in `src/core/api.js` and #74/#75/#79 remain outside #73.

Functional gate evidence:
- Initial exact candidate `502e9fd86b96415d379d65295ba76ec3f117f9fd` ran as `34416898681`. Architecture and all earlier edge coverage were green, then the new #73 foreign-scope edge assertion failed because its fake API filtered the deliberately malformed row before the owner could receive it.
- Root cause `V3-ASSIGNMENTS-EDGE-FIXTURE-001` is test-only: the fixture contradicted the scenario it intended to exercise. The owner behavior did not require an application fix.
- Corrected exact candidate `33871d45aec7111be95524333fe5210dceed71af` passed the complete accumulated architecture, edge, and Playwright/browser-mobile suite in run `34417012845`.
- After that successful later suite, #72 Congregation Recognition advanced to Regression-tested and #73 advanced to Verified.

No production v2, `main`, production Supabase schema/function, or production Cloudflare modification is required for this milestone.
