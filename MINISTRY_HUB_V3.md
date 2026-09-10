# BibleQuest v3 Ministry Hub contract — milestone #76

Recovered: 2026-09-10

## Authoritative acceptance

`FEATURE_INVENTORY_V3.md` defines #76 Ministry Hub with required verification: **open tools; role guard; navigation**.

Retained v2 evidence shows the Ministry Hub was a distinct congregation surface. An ordinary active congregation member could open the hub, while facilitator, leader, pastor and admin roles received ministry-only convenience controls. Current v3 `src/app/congregation-membership.js` already owns role normalization and fail-closed `read` / `ministry` capability projection.

## Bounded v3 scope

Milestone #76 is a portal/navigation migration only:

- expose one native Ministry Hub route through the existing v3 router/bootstrap;
- allow valid congregation members to open the hub and current verified member tools;
- use the existing congregation membership owner for role-aware presentation;
- show ministry-only affordances only when the existing `ministry` capability is true;
- navigate supported tools through the existing router to current owners;
- show unavailable/deferred destinations as unavailable rather than pretending they are implemented.

Supported current destinations are Assignments and Journey Groups. Assignment publishing remains inside the existing Assignments owner and trusted `bq-assignment` server boundary.

## Explicitly outside #76

The retained v2 hub also contained congregation messages/devotionals, polls, calendar and media operations. Those legacy direct-client CRUD/storage paths are behavior evidence, not permission to reproduce their architecture. They are not proven by the narrow #76 inventory contract and are not migrated here.

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
- remote/trusted mutations remain with their already-verified owners.

The Ministry Hub must not create another router, role model, Supabase client, direct table/storage mutation path, or global authority object.

## Role behavior

- Signed out: show no congregation tools or ministry controls; offer Account.
- Valid member role: hub may open; Assignments/Journey Groups are available; ministry-only controls are absent.
- Facilitator/Leader/Pastor/Admin: member tools remain available and bounded ministry affordances may be shown.
- Unknown/unsupported role: fails closed. It does not receive readable congregation tools or ministry-only controls through the existing membership capability owner.
- Missing membership: no congregation tools; offer congregation access.

UI visibility is convenience only. A ministry role projected in the browser is never authorization for a privileged mutation. Trusted actions must authorize again at their existing server boundary.

## Navigation behavior

Available destinations call the existing router. Deferred destinations are rendered as disabled/unavailable and do not navigate. #76 must not absorb another unfinished milestone merely to make a legacy button appear active.

## Permanent acceptance evidence

A #76 candidate requires:

1. architecture validation proving single-owner composition and no direct backend/storage shortcut;
2. executable role-boundary coverage proving signed-out, member, ministry-role and unsupported-role behavior;
3. 390 px browser/mobile coverage proving the real `#/ministry-hub` route opens, member/ministry presentation differs correctly, current destinations navigate, deferred destinations stay disabled, and the page does not overflow;
4. the full accumulated v3 regression workflow with all prior tests retained and the new #76 tests invoked;
5. exact-SHA verification before inventory promotion or release freeze.

## Functional verification evidence

Exact functional candidate `dfc6440cd7105c73107081dfb4fb16f8bfac2d71` passed complete GitHub Actions run `34460593373` on 2026-09-10. The isolated workflow explicitly checked out and asserted that exact SHA, then passed the accumulated architecture validators, accumulated edge/security regressions and complete Playwright/browser-mobile regression suite.

No application failure was observed in that exact functional gate. The candidate intentionally did not copy the retained v2 hub's direct-client messages/devotionals, polls, calendar or media CRUD because those behaviors exceed the proven #76 contract and would broaden the trust boundary.

The functional contract is therefore complete. Inventory/status/handoff bookkeeping may represent #75 as Regression-tested and #76 as Verified, but the resulting changed bookkeeping SHA must itself pass a new complete exact-SHA accumulated gate before v3.49 is frozen. No PASS transfers from the functional SHA to the bookkeeping SHA.