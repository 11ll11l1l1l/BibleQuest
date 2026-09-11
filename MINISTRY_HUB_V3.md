# BibleQuest v3 Ministry Hub contract — milestone #76

Recovered: 2026-09-10
Updated: 2026-09-12 after completion of the post-release Calendar surface follow-up.

## Authoritative acceptance

`FEATURE_INVENTORY_V3.md` defines #76 Ministry Hub with required verification: **open tools; role guard; navigation**.

Retained v2 evidence shows the Ministry Hub was a distinct congregation surface. An ordinary active congregation member could open the hub, while facilitator, leader, pastor and admin roles received ministry-only convenience controls. Current v3 `src/app/congregation-membership.js` owns role normalization and fail-closed `read` / `ministry` capability projection.

## Bounded v3 scope

Milestone #76 is a portal/navigation migration only:

- expose one native Ministry Hub route through the existing v3 router/bootstrap;
- allow valid congregation members to open the hub and current verified member tools;
- use the existing congregation membership owner for role-aware presentation;
- show ministry-only affordances only when the existing `ministry` capability is true;
- navigate supported tools through the existing router to current owners;
- show unavailable/deferred destinations as unavailable rather than pretending they are implemented.

The original #76 verified destinations were Assignments and Journey Groups. Assignment publishing remains inside the existing Assignments owner and trusted `bq-assignment` server boundary.

## Explicitly outside #76

The retained v2 hub also contained congregation messages/devotionals, polls, calendar and media operations. Those legacy direct-client CRUD/storage paths are behavior evidence, not permission to reproduce their architecture. They were not proven by the narrow #76 inventory contract and were not migrated by #76.

Also outside #76:

- #43 Live Rooms — may be shown only as unavailable/deferred;
- #77 Notification Center;
- #78 Workspace;
- #79 Linked Activities;
- new Leader Dashboard implementation;
- schema, migration, RLS, grant, RPC, Edge Function, storage-policy or Realtime changes.

## Ownership

- composition and route registration: `src/app/bootstrap.js`;
- navigation/history: `src/app/router.js`;
- congregation membership and role projection: `src/app/congregation-membership.js`;
- Ministry Hub read-only portal projection: `src/app/ministry-hub.js`;
- Ministry Hub presentation: `src/features/ministry-hub/index.js`;
- Calendar lifecycle/persistence/shared-event behavior: `src/app/calendar.js`;
- Calendar presentation: `src/features/calendar/index.js`;
- remote/trusted mutations remain with their already-verified owners.

The Ministry Hub must not create another router, role model, Calendar owner, Supabase client, direct table/storage mutation path, or global authority object.

## Role behavior

- Signed out: show no congregation tools or ministry controls; offer Account.
- Valid member role: hub may open; Assignments, Calendar and Journey Groups are available; ministry-only controls are absent.
- Facilitator/Leader/Pastor/Admin: member tools remain available and bounded ministry affordances may be shown.
- Unknown/unsupported role: fails closed. It does not receive readable congregation tools or ministry-only controls through the existing membership capability owner.
- Missing membership: no congregation tools; offer congregation access.

UI visibility is convenience only. A ministry role projected in the browser is never authorization for a privileged mutation. Trusted actions must authorize again at their existing server boundary.

## Navigation behavior

Available destinations call the existing router. Deferred destinations are rendered as disabled/unavailable and do not navigate. #76 must not absorb another unfinished milestone merely to make a legacy button appear active.

## Post-release Calendar surface follow-up — completed

Calendar v1/v1.5 was completed and production-verified after the original #76 milestone. The later Ministry Hub follow-up therefore exposes `route:'calendar'` as a valid member tool without recreating any legacy calendar CRUD inside Ministry Hub.

The follow-up is deliberately narrow:

- Ministry Hub only advertises and navigates to the verified `calendar` route;
- `src/app/calendar.js` remains the single Calendar lifecycle/persistence owner;
- personal events, assignment due-date aggregation, congregation-shared events, recurrence and authorization semantics remain unchanged;
- valid congregation members see the Calendar entry through the existing readable-membership projection;
- unsupported roles still fail closed at the Ministry Hub membership boundary;
- no schema, migration, API, RLS, storage or Calendar-state change was introduced;
- Live Rooms, Notification Center, Workspace, Linked Activities, legacy polls/media operations and Leader Dashboard remain separate concerns.

Permanent Ministry Hub edge and 390 px browser tests assert the Calendar tool is present for valid members, delegates exactly to `calendar`, remains absent for unsupported roles, preserves >=44 px touch targets and introduces no horizontal overflow.

## Permanent acceptance evidence

A #76 or later Ministry Hub candidate requires:

1. architecture validation proving single-owner composition and no direct backend/storage shortcut;
2. executable role-boundary coverage proving signed-out, member, ministry-role and unsupported-role behavior;
3. 390 px browser/mobile coverage proving the real `#/ministry-hub` route opens, member/ministry presentation differs correctly, current destinations navigate, deferred destinations stay disabled, and the page does not overflow;
4. the full accumulated v3 regression workflow with all prior tests retained and Ministry Hub tests invoked;
5. exact-candidate verification before promotion or release freeze.

## Functional verification evidence

Original #76 functional candidate `dfc6440cd7105c73107081dfb4fb16f8bfac2d71` passed complete GitHub Actions run `34460593373` on 2026-09-10.

The post-release Calendar-surface candidate was verified as exact synthetic merge commit:

`350cb1e583b207e10ba8dc50c3bb683dc50f9494`

with parents:

- corrected base `de609669e7da7364e6969e11420ff599f45f666c`;
- feature head `5407c97308df27642b2d8462e5da1e573ea9f08e`.

GitHub Actions run `34616603649` checked out exact `350cb1e...` and passed the complete accumulated architecture, edge/security and browser/mobile suite, including updated Ministry Hub role-boundary and mobile Calendar navigation tests.

After that complete PASS:

- exact `350cb1e...` was frozen at `release/v3-ministry-calendar-surface-20260912`;
- `main` was fast-forwarded directly to that verified commit before the subsequent More-hub visual milestone.

No historical PASS transfers to later changed product SHAs.
