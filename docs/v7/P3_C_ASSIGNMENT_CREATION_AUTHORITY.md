# P3-C — race-safe ONE 2 ONE assignment creation authority

Status: implemented for issue #1170.
Owner: Lane C — discipleship core/security boundary.

This supersedes the earlier P1-C note that left assignment persistence with the V6 lifecycle. The integrated V7 schema now uses `public.v7_pair_assignments` as the single V7 assignment lifecycle authority. Lane B assignment preparation remains read-only: it emits one frozen request containing `pairId`, `trackId`, `moduleId`, `lessonId`, and `lessonRevisionId`, then hands that request to an injected mutation owner.

## Database authority

`public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid)` is the only authenticated assignment-create path.

The RPC:

- derives the actor from `auth.uid()`; actor and congregation are never trusted request fields;
- locks the target mentor-pair row, serializing creation with pair lifecycle transitions;
- requires an active pair whose mentor is the authenticated actor;
- revalidates active congregation membership for both mentor and mentee;
- revalidates and locks the exact track → module → lesson → lesson-revision ancestry;
- requires published track/module/lesson state, non-null revision publication time, and global-or-pair-congregation track scope;
- inserts `assigned_by` from the authenticated actor;
- returns one stable non-cancelled assignment ID/status on safe retries;
- appends one server-owned `assignment_created` audit event only when a new assignment row is created.

Authenticated direct `INSERT` on `v7_pair_assignments` is revoked and the former insert RLS policy is removed. A partial unique index on `(pair_id, lesson_revision_id) WHERE status <> 'cancelled'` makes the single-live-assignment invariant race-safe at the database level. Cancelled assignments remain as history and allow one later replacement assignment.

## Client boundary

`src/app/v7-assignment-authority.js` exposes `createV7AssignmentAuthority({ client, session, membership })`. Its `createAssignment(preparedRequest)` method forwards only the five immutable hierarchy IDs to the RPC, rechecks shared account/congregation context before and after the call, requires one valid non-cancelled acknowledgement, and returns a frozen assignment snapshot.

This module does not register routes, own session state, or mutate assignment tables directly. Lane B can inject `authority.createAssignment` into its existing assignment-preparation page callback without moving authorization into the UI.

## Evidence

`supabase/tests/v7-assignment-creation-authority.test.sql` covers RPC/table privileges, the unique live-assignment invariant, positive creation, stable retry identity, audit idempotency, mentee denial, cross-congregation denial, hierarchy mismatch, publication revalidation, ended-pair denial, membership revocation, and cancelled-history reassignment.

`tests/v7/assignment-authority.test.mjs` covers exact RPC payload forwarding, stable returned states, malformed acknowledgement rejection, backend denial propagation, stale-context invalidation, and required hierarchy IDs.

The existing P4 assignment-identity trigger remains in force, so a created assignment cannot later be moved to a different pair, lesson revision, or actor.
