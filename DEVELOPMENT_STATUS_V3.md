# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after cumulative production release and live verification.

## Current release truth

- live `main` / deployed release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- release branch: `release/v3-cumulative-20260911-r1`
- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative product verifier: run `34610903807` — **success**
- documentation checkpoint above the product: `675c6181ecc4dc36a47ba410feab142605eba913`
- cumulative docs contract: run `34612119469` — **success**
- production/Cloudflare verifier: run `34612873935` — **success**
- previous production rollback/reference remains `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

`04bd51b...` is a history-preserving promotion merge whose tree matches the verified cumulative/docs tree. The verified product identity remains `cf17f36...`; later documentation-only commits do not become product SHAs.

## Production verification completed

Run `34612873935` independently verified both production hosts:

- `https://mybiblequest.pages.dev/`
- `https://biblequest-7th.pages.dev/`

It passed promoted-release identity checks, the deployment gate, byte-for-byte comparison of key live product files, and browser/mobile smoke covering shell, Assignments, Workspace, Avatar Vault, Calendar, accessibility and offline behavior on both hosts.

## Included cumulative work

The live cumulative product contains the previously divergent verified lines in one product:

- Assignment Private Responses;
- Workspace/Cloud Notes deployed-schema compatibility;
- Visual tranche 18;
- Avatar Vault v2;
- Calendar v1.5.

The former Line A / Line B divergence is closed. Do not repeat that integration unless newer repository ancestry proves a new divergence.

## Production Supabase state

Production project: `zkfmgezvzugchcwppreq`.

All release migrations are **APPLIED + LIVE VERIFIED**:

- `20260911144939` — `assignment_response_presence`
- `20260911144950` — `calendar_events`
- `20260911145003` — `calendar_congregation_sharing`

Assignment response-presence verification:

- backfill: 1 completed progress row / 1 presence row / 0 missing / 0 orphan;
- projection contains only assignment/congregation/user/display-name/completion-time fields, not private answer or feedback text;
- anon cannot read it; authenticated users can read under RLS but cannot insert/update/delete;
- private sync function is not executable by anon/authenticated;
- live rollback authorization matrix: intended member saw 4/4 `all/member/team/group` scoped rows, unrelated member saw only 1/4 (`all`), ministry/admin saw 4/4;
- trigger lifecycle in rollback smoke: reopen reduced 4→3, recomplete restored 3→4, progress delete reduced 4→3;
- no synthetic smoke data persisted.

Calendar verification:

- RLS enabled with personal own-row policies plus congregation-member read/ministry insert policies;
- private notification trigger is not executable by anon/authenticated;
- rollback live smoke proved ministry creation of personal + congregation events;
- ordinary member saw the congregation-shared event and did not see the ministry user's private event;
- rollback left 0 smoke calendar rows and 0 smoke notifications.

The post-migration Supabase security advisor introduced no new release-migration finding; pre-existing advisor findings remain separate follow-up work.

## Current blockers

No credible P0/P1 release blocker was found during cumulative, migration, Cloudflare or live authorization verification. Do not describe the app as bug-free.

## Correct next route

The production-integration gate is closed. Resume Priority 1 development from the current cumulative production base, not from either former Line A/Line B branch.

1. refresh live `main` and active investigator evidence before each write;
2. confirm the next functionality/visual milestone is genuinely unfinished;
3. preserve current production/rollback refs;
4. implement through existing owners only;
5. run focused checks and then required accumulated exact-SHA verification;
6. keep production promotion as a separate evidence-bearing step.

Calendar v1/v1.5 is complete. Calendar follow-ups are selected only from genuinely remaining requirements/verified defects. Visual Phase B must verify the real asset set before wiring `docs/V3_ICON_ASSET_MAP.md` paths.

## Evidence rules

Repository evidence overrides stale prose. Docs-only HEAD != product SHA. Never transfer PASS across changed product SHAs. Never claim unexecuted tests. GitHub promotion != Cloudflare propagation proof. A committed migration != an applied migration unless production evidence proves it. Do not call the application bug-free.
