# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains release/milestone history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; the trigger commit is never a release candidate and the branch is reset to the exact clean candidate after the run.
- Latest frozen checkpoint: `release/v3.35-backup-export-import-reset` at `cb72905992b2549d727b4e74f5887bfc53210a06`.
- Exact v3.35 bookkeeping run `34220313765` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the corrected #62 Couples/family local functional gate:

| State | Count |
|---|---:|
| Regression-tested | 62 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 37 |
| Total | 100 |

Strict verified-or-better parity is **63/100**.

Official regression stability is **62/100**.

Current leading rows:
- #99 Offline opened Bible packs — **Regression-tested**; frozen in v3.34 and still green.
- #100 Backup/export/import/reset — **Regression-tested** after surviving the complete #62 functional suite; frozen in v3.35.
- #62 Couples/family local tools — **Verified** after corrected exact functional run `34229105566` against `964fde5ad3381e4fe4d571c15591040c4e55fecb`.
- #63 Couples cloud is the next dependency-safe capability after the independent v3.36 bookkeeping freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

The rebuild still follows one source of truth per function. Relevant owners now include:

- `src/core/storage.js` — sole direct browser local-storage owner.
- `src/app/backup.js` — sole #100 backup file-format/workflow owner.
- `src/app/couples-family.js` — sole #62 local Couples persistence/orchestration owner.
- `src/content/couples-family.js` — recovered static Couples topic/card content only.
- `src/features/couples-family/index.js` — Couples local UI only; no cloud/session/progress persistence ownership.
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

### #62 — Verified

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
- #62 is therefore Verified. #100 is Regression-tested through this later complete-suite evidence.

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

## Next major milestone

Complete the independent exact #62 bookkeeping suite and freeze v3.36 only at the exact SHA that passes the complete accumulated regression workflow. After that freeze, continue with **#63 Couples cloud**.

Recovered #63 legacy boundary from retained `couple-cloud.js`:
- two authenticated accounts link through an 8-character pair code;
- only intentionally shared Couples journey/reflection/commitment/challenge data may synchronize;
- private local notes, Transform results, passwords and unrelated personal account data remain excluded;
- remote access must be user-scoped and fail closed;
- local #62 state remains owned separately and must not be silently uploaded;
- sync/error/reload behavior needs permanent edge and 390px browser coverage before promotion.

Kids #38–40 and Japanese furigana #15 remain deferred. Production deployment remains out of scope.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, and production Cloudflare remain unchanged throughout the rebuild.
