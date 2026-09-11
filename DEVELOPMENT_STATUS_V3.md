# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after branch/document reconciliation.

Read `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection and `RECONCILIATION_V3.md` for the authoritative branch graph/integration gates.

## Production/runtime baseline

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`
- documentation-ahead `main` recovered before reconciliation: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- historical applicable release-parity scope: 98/98 complete
- #39 Hiragana Match and #40 Kids Bible Who Am I: retired unless explicitly reopened

Production Supabase/data must not be changed merely because a development branch is green.

## Critical current state

**There is no single cumulative latest exact-green post-release product SHA.**

There are two verified divergent lines:

### Line A — Assignment → Workspace

- Assignment Private Responses: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`; verifier `34588223163`.
- Workspace schema compatibility: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`; verifier `34594577664`; parent includes Assignment exact-green.
- Assignment response-presence production migration is not recorded as applied; treat as **UNAPPLIED until positively verified**.

### Line B — Visual18 → Avatar Vault v2 → Calendar v1.5

- Visual game polish tranche 18: `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`; verifier `34601602518` success.
- Avatar Vault v2: `7ce6685a7383102f29797869a77eabcf7ab9c0c2`; verifier `34603004871` success; descendant of Visual18.
- Calendar v1.5: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`; verifier `34604370963` success; descendant of Avatar Vault v2.

Line A and Line B diverge from recovered merge base `545b5b98d88ca04001d3675317c37cbcd3306955`. Therefore neither line may be described as the whole-product “latest” until they are deliberately integrated and the new exact candidate is fully verified.

## Current blocker to main product promotion

`main` product promotion is blocked by integration divergence, not by a known P0/P1 failure:

1. explicitly reconcile the conflicting planning/status/feature-contract documents;
2. integrate Line A and the full intended Line B chain into one candidate;
3. preserve feature ownership and privacy/backend boundaries;
4. run focused Assignment/Workspace/Visual18/Avatar/Calendar checks;
5. run the complete accumulated exact-SHA suite;
6. only then select product promotion.

A docs-only reconciliation SHA is not a product candidate.

## Assignment Private Responses migration

Canonical migration:

`supabase/migrations/20260911131000_assignment_response_presence.sql`

Reviewed blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

The peer-visible completion projection must remain physically separated from private answer/feedback text. Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before production integration. Migration state must be reported as `NOT APPLIED`, `APPLIED / smoke pending`, or `APPLIED + LIVE VERIFIED`; never infer application from Git.

## Calendar status

`CALENDAR_V3.md` is the Calendar feature authority. The implemented v1/v1.5 contract on `01ba15e...` supersedes older generic preimplementation Calendar prose inside Calendar scope. Calendar does not override global priority/integration authority.

## Visual status

- Verified Visual tranche 18 is already an ancestor of Avatar Vault v2 and Calendar v1.5 on Line B.
- A 70-PNG semantic assignment guide exists and is reconciled as `docs/V3_ICON_ASSET_MAP.md`.
- At reconciliation time, `assets/icons/v3/` was not present on `main`; the map does **not** prove the binaries are committed.
- Future visual wiring must verify/import the exact PNG set first, then follow the map.
- Selected generated/mapped visual assets should be implemented and tested without routine user approval.

## Correct next development route

1. refresh live refs and confirm neither line has gained a newer cumulative successor;
2. use Line A `61ee54f...` as the dependency-preserving base unless newer evidence proves otherwise;
3. reconcile the full intended Line B delta through `01ba15e...`—including Visual18, Avatar v2 and Calendar v1.5—not Calendar alone;
4. create one cumulative candidate;
5. run focused + complete accumulated exact-SHA verification;
6. freeze the first exact-green cumulative SHA;
7. only then consider `main` product promotion and production integration;
8. at production release, verify/apply required migrations and separately verify Cloudflare/live authorization behavior.

## Evidence rules

- Never transfer PASS across changed product SHAs.
- Never claim unexecuted tests.
- Documentation-only commits are not product candidates.
- Distinguish production SHA, feature exact-green SHAs, branch HEAD and cumulative candidate SHA.
- Chronological recency does not override ancestry.
- GitHub promotion is not Cloudflare propagation proof.
- A committed migration is not evidence production executed it.
- Do not call the app bug-free.
