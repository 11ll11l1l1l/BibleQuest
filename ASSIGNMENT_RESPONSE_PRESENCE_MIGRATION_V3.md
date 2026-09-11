# BibleQuest v3 — Assignment Response Presence Migration Guide

Status: required production-integration guide
Updated: 2026-09-11 JST

## Canonical source

Use the committed migration from the verified Assignment Private Responses line:

- product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`
- path: `supabase/migrations/20260911131000_assignment_response_presence.sql`
- Git blob SHA: `bbbceb057c631f08ec32826384ef6fcd61da4527`

If a future prompt supplies SQL text, compare it to this committed reviewed file first. The committed file is the source of truth unless a later reviewed migration deliberately supersedes it. Do not run a hand-edited/pasted variant merely because it looks equivalent.

## What the migration is for

The migration creates a privacy boundary between private assignment response content and peer-visible completion presence.

- `bible_assignment_progress` remains the private answer/feedback source.
- `bible_assignment_response_presence` contains only presence-safe projection fields: assignment, congregation, user, display name and completion timestamp.
- authenticated clients may SELECT the projection under RLS but may not INSERT/UPDATE/DELETE it directly.
- projection writes are owned by a private SECURITY DEFINER trigger function.
- the trigger/backfill keep completed-state presence synchronized without exposing private response text.

## Reviewed security/authorization properties

The committed migration intentionally:

1. creates/replaces `private.bible_assignment_visible(uuid,text,uuid)` with `SECURITY DEFINER` and an empty `search_path`;
2. requires an authenticated active congregation member;
3. permits ministry roles (`facilitator`, `leader`, `pastor`, `admin`) to inspect congregation assignments;
4. limits ordinary members according to `all`, `member`, `team`, and `group` audience rules;
5. requires active group membership, an active group, and matching congregation for group scope;
6. enables RLS on `public.bible_assignment_response_presence`;
7. revokes anon access and authenticated mutation rights while granting authenticated SELECT;
8. makes SELECT visibility depend on the active assignment plus `private.bible_assignment_visible(...)`;
9. creates `private.bible_sync_assignment_response_presence()` as `SECURITY DEFINER`, with empty `search_path` and fully-qualified objects;
10. revokes callable access to that sync function from public, anon and authenticated roles;
11. installs an AFTER trigger on `bible_assignment_progress` to upsert/delete presence as completion state changes;
12. backfills already-completed assignment progress.

## Important pre-apply check

The migration uses `create or replace function private.bible_assignment_visible(...)`. Before production application, compare the currently deployed helper definition and dependent authorization behavior with the committed migration. Do not assume production still has the same helper body. If they differ, reconcile deliberately and re-run authorization tests before applying.

Also confirm the migration has not already been applied. “File exists in Git” is not evidence that production Supabase has executed it.

## When to use it

Use this migration only as part of an explicitly selected production integration/release that contains or expects the compatible Assignment Private Responses code.

Preferred ordering:

1. freeze/select the exact cumulative release candidate;
2. verify the candidate and migration compatibility;
3. verify production schema/migration state;
4. apply this migration immediately before the compatible application deployment when operationally possible;
5. otherwise deploy it immediately after compatible code, keeping the lag short and explicitly tracked;
6. confirm Cloudflare/application propagation independently;
7. run live authorization/privacy smoke;
8. record that the migration is applied and which product SHA it accompanies.

Do **not** apply it merely because a newer unrelated Calendar/visual/docs branch exists.

## Expected lag behavior

If compatible Assignment code reaches production just before this migration, the principal expected degradation is the leader/ministry “who has completed this?” presence view. Private answer text must remain protected. A short migration lag may therefore be lower blast-radius than many schema changes, but it is still a release debt that must be closed immediately and verified.

## Mandatory post-apply/live test matrix

Verify with real authorization contexts where available:

- anonymous role cannot read/write the presence projection;
- authenticated ordinary members cannot mutate the projection;
- ordinary members see only assignments whose audience contains them;
- `member` scope is self-only for ordinary members;
- `team` scope requires team membership;
- `group` scope requires active membership + active group + matching congregation;
- ministry roles can see completion presence for authorized congregation assignments;
- no peer can obtain another member's private answer/feedback text through the projection;
- no cross-congregation leakage;
- completed insert/update creates or updates presence;
- reopening/uncompleting removes presence;
- deleting progress removes presence;
- backfill matches already-completed progress;
- sync function is not callable as an anon/authenticated RPC surface;
- Assignment, Advanced Assignments and Assignment Push regressions still pass.

## Future-run instruction

A future development/release run must report the migration state explicitly as one of:

- `NOT APPLIED / production integration blocked or pending`;
- `APPLIED / live authorization smoke pending`;
- `APPLIED + LIVE VERIFIED`, with evidence.

Never infer `APPLIED` from repository state, branch age or successful application tests.
