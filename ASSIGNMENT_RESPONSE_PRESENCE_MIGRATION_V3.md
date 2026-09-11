# BibleQuest v3 — Assignment Response Presence Migration Guide

Status: **APPLIED + LIVE VERIFIED** for cumulative production release
Updated: 2026-09-11 JST

## Canonical source

- compatible product lineage: Assignment Private Responses → cumulative product `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- migration path: `supabase/migrations/20260911131000_assignment_response_presence.sql`
- reviewed Git blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`
- production Supabase project: `zkfmgezvzugchcwppreq`
- applied production migration history: `20260911144939 assignment_response_presence`

Do not reapply this migration. A future change must use a deliberately reviewed superseding migration.

## Privacy boundary

- `bible_assignment_progress` remains the private answer/feedback source.
- `bible_assignment_response_presence` exposes only assignment, congregation, user, display name and completion timestamp.
- authenticated clients may SELECT the projection under RLS but may not INSERT/UPDATE/DELETE it directly.
- projection writes are owned by a private SECURITY DEFINER trigger function.
- that sync function is not executable by public/anon/authenticated roles.

## Pre-apply evidence completed

Before production application, the deployed `private.bible_assignment_visible(uuid,text,uuid)` definition was read from production and matched the reviewed migration's expected helper logic. Production migration history and schema confirmed the presence projection had not yet been applied.

## Post-apply structural verification

Verified on production:

- projection table exists with RLS enabled;
- columns are exactly presence-safe (`assignment_id`, `congregation_id`, `user_id`, `display_name`, `completed_at`);
- anon SELECT privilege is absent;
- authenticated SELECT exists;
- authenticated INSERT/UPDATE/DELETE privileges are absent;
- `private.bible_sync_assignment_response_presence()` is not executable by anon/authenticated;
- AFTER trigger exists for INSERT/UPDATE/DELETE on `bible_assignment_progress`;
- backfill parity was 1 completed progress row / 1 presence row / 0 missing / 0 orphan.

## Live authorization and lifecycle verification

A rollback-only production matrix used existing real authenticated identities plus synthetic assignment/team/group rows that were never persisted after the transaction.

Visibility result:

- intended ordinary member: 4/4 visible (`all`, self `member`, joined `team`, joined active matching-congregation `group`);
- unrelated ordinary member: 1/4 visible (`all` only);
- ministry/admin: 4/4 visible.

Trigger result:

- four completed synthetic responses → four projection rows;
- reopening one response → three projection rows;
- recompleting it → four projection rows;
- deleting one progress row → three projection rows.

The projection contains no submission/leader-feedback fields, so this peer-visible path cannot return private answer text by schema shape.

## Release evidence

- cumulative exact-green product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative verifier: `34610903807` — success
- promoted release/main commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- production Cloudflare verifier: `34612873935` — success on both production hosts

## Future-run rule

Report this migration as `APPLIED + LIVE VERIFIED` unless later production evidence proves drift or a superseding migration changes the contract. Never infer future schema state solely from this document; re-check production before later schema work.
