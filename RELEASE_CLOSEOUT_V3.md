# BibleQuest v3 — Cumulative Release Closeout

Date: 2026-09-11 JST
Status: **released and live verified**

## Release identity

- exact-green cumulative product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- product verifier: `34610903807` — success
- docs checkpoint: `675c6181ecc4dc36a47ba410feab142605eba913`
- docs contract: `34612119469` — success
- promoted `main` / deployed release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- release branch: `release/v3-cumulative-20260911-r1`
- production verifier: `34612873935` — success
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

The promoted release preserves both the cumulative verified line and the prior `main` documentation history. Its runtime/product tree comes from the cumulative verified product state; the exact product PASS remains attached to `cf17f36...`.

## Released scope

The cumulative product reconciles and releases:

- Assignment Private Responses;
- Workspace/Cloud Notes deployed-schema compatibility;
- Visual tranche 18;
- Avatar Vault v2;
- Calendar v1.5.

The former Line A / Line B divergence is closed.

## Production hosts

Production verifier `34612873935` independently confirmed byte-for-byte promoted product files plus browser/mobile smoke on:

- `https://mybiblequest.pages.dev/`
- `https://biblequest-7th.pages.dev/`

Covered live smoke: shell, Assignments, Workspace, Avatar Vault, Calendar, accessibility and offline shell.

## Supabase release closeout

Production project: `zkfmgezvzugchcwppreq`.

Applied + live verified migrations:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Assignment verification included safe projection shape, grants/RLS, backfill parity, all/member/team/group visibility, ministry visibility and sync lifecycle. Calendar verification included ministry creation, congregation-member shared visibility, private isolation and notification-trigger privilege boundaries. Synthetic release smoke data was rollback-only.

The post-migration security advisor showed no new migration-introduced finding. Existing advisor warnings remain independent follow-up work.

## Release conclusion

No credible P0/P1 release blocker was found by the executed cumulative, production, migration and live authorization gates. This statement does not claim the application is bug-free.

The release gate is closed. Subsequent work resumes as normal Priority 1 development from the current cumulative production base and must earn fresh exact-SHA verification for each product change.
