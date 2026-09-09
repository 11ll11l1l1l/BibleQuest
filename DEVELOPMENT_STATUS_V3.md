# BibleQuest v3 Development Status

Updated: 2026-09-09 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains release/milestone history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; the trigger commit is never a release candidate and the branch is reset to the exact clean candidate after the run.
- Latest frozen checkpoint: `release/v3.40-community-bridge` at `fca8edd2e18015b246aced2dff6590308ff6bde2`.
- Exact v3.40 bookkeeping run `34340610144` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the complete #67 Community Bridge functional gate:

| State | Count |
|---|---:|
| Regression-tested | 66 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 33 |
| Total | 100 |

Strict implemented-or-better parity is **67/100**.

Official regression stability is **66/100**.

Current leading rows:
- #99 Offline opened Bible packs — **Regression-tested**; frozen in v3.34 and still green.
- #100 Backup/export/import/reset — **Regression-tested** after surviving the complete #62 functional suite; frozen in v3.35.
- #62 Couples/family local tools — **Regression-tested** after exact v3.36 bookkeeping run `34236023685` and the later complete #63 functional suite.
- #63 Couples cloud — **Regression-tested** after the exact v3.37 bookkeeping freeze and the later complete #64 functional suite.
- #64 Journey Groups — **Regression-tested** through the later complete #65 functional suite.
- #65 Encouragements — **Regression-tested** through the later complete #67 functional suite.
- #67 Community Bridge — **Verified** by exact-candidate functional run `34340063733` against `4612f0501e5cd37e82c3d259094a0d91cf804e2d`.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

The rebuild still follows one source of truth per function. Relevant owners now include:

- `src/core/storage.js` — sole direct browser local-storage owner.
- `src/app/backup.js` — sole #100 backup file-format/workflow owner.
- `src/app/couples-family.js` — sole #62 local Couples persistence/orchestration owner.
- `src/app/couples-cloud.js` — sole #63 authenticated pair/shared-history orchestration owner.
- `src/app/journey-groups.js` — sole #64 Journey Group membership orchestration and fail-closed normalization owner.
- `src/app/encouragements.js` — sole #65 encouragement normalization, membership projection and duplicate-prevention owner.
- `src/app/community-bridge.js` — sole #67 privacy-minimized cross-feature projection owner.
- `src/content/couples-family.js` — recovered static Couples topic/card content only.
- `src/features/couples-family/index.js` — Couples local UI only; no cloud/session/progress persistence ownership.
- `src/core/api.js` — sole Supabase/trusted-function boundary, including Couples and Journey Group remote contracts.
- `src/core/bible.js` — Bible-source loading and opened-pack persistence.
- `src/app/offline-shell.js` + `offline-shell-sw.js` — bounded application-shell offline behavior only.
- Existing Router, Session, API, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, congregation and diagnostics owners remain unchanged.

#62 deliberately excludes #63 Couples cloud. The local owner uses only the shared v3 storage boundary, does not read the classic unprefixed `biblequest_couples_v1` key, and does not call Supabase, account/session APIs, cloud notes, congregation APIs or Progress. Scripture references hand off to the existing BSB Reader owner. No XP/progress reward was invented because none was recovered for this local Couples capability.

## Milestone 21 — Offline opened Bible packs

### #99 — Regression-tested

- `src/core/bible.js` remains the sole bundled Scripture pack-path, semantic-validation and opened-pack persistence owner.
- Only explicitly opened bundled BSB/Tagalog books persist; Japanese live source, NLT licensed-link mode, context packs, APIs/cloud/media and bulk search persistence remain excluded.
- Functional candidate `8eaaf4e0687cd4d10a74f00de8ffbee291fe062e` passed the complete accumulated suite in run `34217190770`.
- Exact bookkeeping candidate `bfba29fdb500c2f8ea3f466e941f043dae908f26` passed run `34218225949` and is frozen at `release/v3.34-offline-bible-packs`.

## Milestone 22 — Backup/export/import/reset

### #100 — Regression-tested

- `src/core/storage.js` enumerates and transactionally replaces only portable BibleQuest v3 local-state keys.
- `src/app/backup.js` defines versioned JSON format `biblequest-v3-local-backup` version `1` and owns export/import/reset orchestration.
- `src/features/backup/index.js` exposes Download backup, Restore backup and confirmed Reset controls through More.
- `device-id`, auth keys and unrelated browser storage are preserved and excluded from backup payloads.
- Import rejects malformed JSON, wrong format/version, forbidden/duplicate keys and non-JSON data before mutation.
- Failed replacement attempts rollback to the previous portable snapshot.
- Successful import/reset reloads BibleQuest so Reader, Progress and other existing owners rehydrate through their normal boundaries.
- Corrected exact functional candidate `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215` passed run `34219329591`.
- Exact bookkeeping candidate `cb72905992b2549d727b4e74f5887bfc53210a06` passed run `34220313765` and is frozen at `release/v3.35-backup-export-import-reset`.
- #100 survived the later complete #62 functional suite and therefore advanced to Regression-tested.

## Milestone 23 — Couples/family local tools

### #62 — Regression-tested

Recovered legacy scope:
- exact eight local categories and 32 conversation cards from retained `couples.js`;
- saved/favorite cards and discussed history;
- 7-day practices;
- Listen First drills;
- pass-the-phone Couple Check-in;
- Repair Room with the recovered safety boundary for fear, threats, coercion, stalking or violence;
- Us & God and Date Night local modes;
- explicit separation from retained `couple-cloud.js`.

Clean v3 implementation:
- `src/content/couples-family.js` owns static recovered content.
- `src/app/couples-family.js` owns versioned local state through shared storage only.
- `src/features/couples-family/index.js` owns the view only.
- More/router/bootstrap compose the page through existing v3 ownership.
- Scripture links use the existing BSB Reader owner instead of DOM-click emulation.
- malformed state is normalized and bounded histories are enforced.
- local state uses the v3-prefixed Couples key and never reads or mutates classic v2 storage.

Permanent protection:
- `COUPLES_FAMILY_LOCAL_V3.md` defines the local/cloud/privacy ownership boundary.
- `scripts/validate-v3-couples-family.mjs` prevents storage, cloud, session, progress and legacy-runtime leakage.
- `tests/v3-couples-family-edge.mjs` covers normalization, persistence, invalid input, limits and ownership.
- `tests/v3-couples-family-smoke.mjs` covers 390px mobile, favorite/practice persistence, reload, listening completion, Couple Check-in, Repair Room safety copy and Reader handoff.

Functional verification:
- Initial candidate `500d5e86bec2b8a16cfad485d5f3869e9277668b` reached the browser stage but exposed `V3-COUPLES-SMOKE-SELECTOR-001`: a strict Playwright locator matched both valid result-page controls returning to the Couples dashboard.
- Runtime behavior was correct; the regression selector was made specific to the intended `Done` control without changing acceptance behavior.
- Corrected exact candidate `964fde5ad3381e4fe4d571c15591040c4e55fecb` passed the complete accumulated architecture, edge and browser/mobile suite in run `34229105566`.
- Exact bookkeeping candidate `488fea911cc432c9843a2af39480b6f2cc67711e` passed run `34236023685` and is frozen at `release/v3.36-couples-family-local`.
- #62 survived the later complete #63 functional suite and is therefore Regression-tested.

## Milestone 24 — Couples cloud

### #63 — Regression-tested

- `src/app/couples-cloud.js` is the sole pair/session validation, shared-row normalization and authenticated cloud workflow owner.
- `src/core/api.js` is the only module that invokes the existing trusted `bq-couple` function or accesses `bible_couple_shared`.
- The existing backend contract is reused without a speculative migration: 8-character expiring invite codes, active pair membership, user-scoped access and append-only shared history.
- Only journey completions, entered commitments and read-only challenge history are in scope. Private Notes, #62 local Couples state, Transform results, credentials, Cloud Notes and untrusted score submission remain excluded.
- Permanent protection is retained in `COUPLES_CLOUD_V3.md`, `scripts/validate-v3-couples-cloud.mjs`, `tests/v3-couples-cloud-edge.mjs` and `tests/v3-couples-cloud-smoke.mjs`.
- Exact functional candidate `a7fdf3354efb688163d35fec8e2df3a93b4e9294` passed the complete accumulated architecture, edge and browser/mobile suite in run `34238007365`.
- The isolated trigger commit `936cf0755abcd50ef438761c8bfb91dd019d260d` explicitly checked out and asserted that candidate; `verify/v3.37-couples-cloud-functional` was then reset to the clean candidate.
- Exact bookkeeping candidate `f706896d8f4e8d2ee19e607a38cc87dada70d671` passed run `34240373295` and is frozen at `release/v3.37-couples-cloud`.
- #63 survived the later complete #64 functional suite and is therefore Regression-tested.

## Milestone 25 — Journey Groups

### #64 — Regression-tested

- `src/app/journey-groups.js` is the sole group normalization, authenticated membership and permission orchestration owner.
- `src/core/api.js` remains the only browser Supabase boundary and reuses the retained `bq-journey-group`, `bible_groups` and `bible_group_members` contracts without a production migration.
- The recovered lifecycle covers create, join, view, invite-code rotation and non-owner leave for 2–6-member groups. Owning leaders fail closed until leadership is transferred or the group is archived.
- Encouragements, Journey completion sharing, assignments, presence, chat, rankings, XP and private study data remain outside #64.
- Permanent protection is retained in `JOURNEY_GROUPS_V3.md`, `scripts/validate-v3-journey-groups.mjs`, `tests/v3-journey-groups-edge.mjs` and `tests/v3-journey-groups-smoke.mjs`.
- Initial run `34244782912` stopped before feature tests because consolidated workflow loops no longer matched seven validators' literal command-text assumptions.
- Corrected exact candidate `c49ce887bd28323292b6f1b60f7689a1aa194615` passed the complete accumulated architecture, edge and browser/mobile suite in run `34258746664`.
- The isolated trigger commit `9f9590b624c1957d31c6d3a4b8c6d65130b27db9` explicitly checked out and asserted that candidate; `verify/v3.38-journey-groups-functional-r2` was then reset to the clean candidate.
- #64 was Verified here and is now Regression-tested through the later complete #65 suite. #63 remains Regression-tested.
- Exact bookkeeping run `34259986598` passed candidate `7c06c3380eaac0e20e579ae26453611e63ac564d`, now frozen as `release/v3.38-journey-groups`.

## Milestone 26 — Encouragements

### #65 — Regression-tested

- `src/app/encouragements.js` owns the five retained preset definitions, received-row normalization, group-membership projection and same-day duplicate rejection.
- `src/core/api.js` remains the sole browser Supabase boundary. Reads use retained group-member RLS; sends use the authenticated `bq-journey-group` function.
- The trusted function derives the sender, verifies an active group and active membership, and rejects unknown presets.
- `20260909_encouragement_duplicate_guard.sql` makes a database trigger the sole UTC bucket owner for every new insert and adds a partial unique index. Direct/legacy inserts cannot bypass the guard; retained v2 rows are not rewritten or deleted.
- The dedicated route is preset-only and group-wide. Free text, direct messages, notifications, presence, completion sharing, assignments, rankings, XP, moderation and private study data remain excluded.
- Exact code candidate `b2fb1013822891930e017c8da0ea38e3e5c68b9e` passed the complete accumulated architecture, edge and browser/mobile suite in run `34337262620`.
- Isolated trigger commit `aa765edbfd11112c5d6db710fe4e0e83faba03d3` checked out and asserted that exact candidate; `verify/v3.39-encouragements-dedupe-functional` was then reset to the clean candidate.
- Canonical remote code candidate: `b2fb1013822891930e017c8da0ea38e3e5c68b9e`; draft PR: `#89`.
- Exact bookkeeping candidate `41c42a4030140ac1387612fbdbe3334baa5676a7` passed run `34337802329`; the isolated bookkeeping branch was reset to that candidate, now frozen as `release/v3.39-encouragements`.
- #65 survived the later complete #67 functional suite and advanced to Regression-tested.

## Milestone 27 — Community Bridge

### #67 — Verified

- `src/app/community-bridge.js` is the sole read-only cross-feature projection owner. It composes Session, Congregation Membership, Journey Groups, and Encouragements without direct storage, API, or cloud access.
- The projection exposes only congregation ID/name/role, group ID/name/role/member counts, and an encouragement total. Foreign-scope rows fail closed; signed-out and local-preview states expose no stale cloud data.
- `src/features/community/index.js` adds one responsive route connecting Membership & role, Journey Groups, and Encouragements through the existing Router owner.
- The retained storage monkey patch and local point conversion were not copied. Scores, XP, leaderboards, presence, teams, assignments, notifications, ministry controls, identities, and private study/Couples data remain excluded.
- Exact code candidate `4612f0501e5cd37e82c3d259094a0d91cf804e2d` passed all accumulated architecture, edge, and browser/mobile regressions in run `34340063733`.
- Isolated trigger commit `ef62892ead75098928005fe751582c394d8f832c` checked out and asserted that exact candidate; `verify/v3.40-community-bridge-functional` was then reset to the clean candidate.
- Canonical remote code candidate: `4612f0501e5cd37e82c3d259094a0d91cf804e2d`.
- Exact bookkeeping candidate `fca8edd2e18015b246aced2dff6590308ff6bde2` passed run `34340610144`; the isolated bookkeeping branch was reset to that candidate, now frozen as `release/v3.40-community-bridge`.

## Defect / root-cause ledger

Every real defect remains root-caused and protected by a regression. Important retained examples include:
- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-TRANSFORM-OWNER-001` — removed competing Transform calculation ownership.
- `V3-RECORDINGS-FREEZE-001` — one Audio owner + one Recordings owner with teardown coverage.
- `V3-GAMES-OWNER-001` — centralized game lifecycle.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-OPEN-REVIEW-OWNER-001` — Open Review cannot directly own Games recall persistence.
- `V3-PWA-OFFLINE-COMPOSITION-TEST-001` — PWA test validates ownership rather than assuming a permanently service-worker-free app.
- `V3-STATUS-STRUCTURE-001` — bookkeeping status headings remain validator-enforced rather than weakened.
- `V3-BACKUP-LEDGER-TEST-001` — the initial #100 validator expected stale shorthand wording instead of the authoritative inventory acceptance text; the validator was aligned to the ledger without weakening runtime or acceptance coverage.
- `V3-COUPLES-SMOKE-SELECTOR-001` — #62 smoke used an ambiguous strict locator after the result view intentionally exposed two dashboard-return controls; the regression now selects the intended result completion control specifically.
- `V3-COUPLES-CLOUD-VALIDATOR-001` — broad substring checks treated harmless source text such as `progress` as forbidden ownership; the validator now checks precise API/global tokens while retaining all storage, Supabase and score-owner boundaries.
- `V3-COUPLES-CLOUD-FOREIGN-ROW-001` — the initial edge fixture prefiltered shared rows and could not prove the owner rejects foreign-pair data; the fixture now returns mixed rows and permanently exercises owner-side rejection.
- `V3-WORKFLOW-LOOP-001` — workflow consolidation retained every regression but seven validators required literal `node <path>` text, so run `34244782912` failed before feature tests. A shared invocation parser now recognizes executable direct and looped commands, while `tests/v3-workflow-contract-edge.mjs` rejects comments, non-Node loops, variable mismatches and prefix-only path matches.
- `V3-ENCOURAGEMENT-HISTORY-001` — the initial #65 owner treated current sender membership as a read-time invariant, which would reject valid history after a sender left. Current membership is now enforced only when sending; a permanent edge regression retains former-member history.
- `V3-ENCOURAGEMENT-DEDUPE-001` — the initial partial index covered only callers that supplied a non-null bucket, so direct/legacy inserts could bypass duplicate prevention. A database `BEFORE INSERT` trigger now owns and overwrites the UTC bucket for every new row; the Edge Function no longer competes for that value.
- `V3-COMMUNITY-VALIDATOR-PATH-001` — the initial #67 validator imported the shared workflow parser from `tests/` instead of its actual `scripts/` owner. The import was corrected before candidate publication; the accumulated architecture run permanently exercises it.

## Next major milestone

Begin #68 Presence from frozen `release/v3.40-community-bridge` on `feature/v3-presence`. Recover the retained online/offline update, cleanup, stale-timeout, authorization, and privacy contract before implementation.

Kids #38–40 and Japanese furigana #15 remain deferred. Production deployment remains out of scope.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, and production Cloudflare remain unchanged throughout the rebuild.
