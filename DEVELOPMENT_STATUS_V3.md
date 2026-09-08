# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains release/milestone history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; the trigger commit is never a release candidate and the branch is reset to the exact clean candidate after the run.
- Latest frozen checkpoint: `release/v3.34-offline-bible-packs` at `bfba29fdb500c2f8ea3f466e941f043dae908f26`.
- Exact v3.34 bookkeeping run `34218225949` passed all 88 accumulated checks against that SHA before freeze.

## Current progress

Inventory state after the corrected #100 Backup/export/import/reset functional gate:

| State | Count |
|---|---:|
| Regression-tested | 61 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 38 |
| Total | 100 |

Strict verified-or-better parity is **62/100**.

Official regression stability is **61/100**.

Current leading rows:
- #98 Offline Shell — **Regression-tested**; frozen in v3.33.
- #99 Offline opened Bible packs — **Regression-tested** after surviving the complete #100 functional suite; frozen in v3.34.
- #100 Backup/export/import/reset — **Verified** after corrected exact functional run `34219329591` against `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215`.
- #62 Couples/family local tools is the next dependency-safe non-deferred local capability under active assessment.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

The rebuild still follows one source of truth per function. Relevant owners now include:

- `src/core/storage.js` — sole direct browser local-storage owner, including #100 portable namespace enumeration and transactional replacement/reset.
- `src/app/backup.js` — sole #100 backup file-format/workflow owner.
- `src/features/backup/index.js` — file/download/confirmation UI only; no persistence ownership.
- `src/core/bible.js` — Bible-source loading and #99 opened-pack persistence.
- `src/app/offline-shell.js` + `offline-shell-sw.js` — bounded application-shell offline behavior only.
- Existing Router, Session, API, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, congregation and diagnostics owners remain unchanged.

#100 exports/imports/resets only portable `biblequest.v3.` local learning state. `biblequest.v3.auth.*`, `biblequest.v3.device-id`, Supabase/cloud state, congregation server state, Cloud Notes, media, Cache Storage, opened Bible packs and unrelated browser storage are excluded. Import validates the complete backup before destructive writes, rolls back after storage-write failure, and reloads the app so existing owners rehydrate normally rather than receiving direct backup-specific mutations.

## Milestone 20 — Offline Shell

### #98 — Regression-tested

- Corrected functional candidate `85de7cd753f7a74606b1feb8bbe4fd81205d3aa4` passed all 85 numbered steps in run `34214663407`.
- Exact bookkeeping candidate `6c7e2e93d07def6e104e48c606dbbb3a7d3e48f7` passed run `34216091431` and is frozen at `release/v3.33-offline-shell`.
- #98 has remained green through #99 and #100.

## Milestone 21 — Offline opened Bible packs

### #99 — Regression-tested

- `src/core/bible.js` remains the sole bundled Scripture pack-path, semantic-validation and opened-pack persistence owner.
- Only explicitly opened bundled BSB/Tagalog books persist; Japanese live source, NLT licensed-link mode, context packs, APIs/cloud/media and bulk search persistence remain excluded.
- Functional candidate `8eaaf4e0687cd4d10a74f00de8ffbee291fe062e` passed all 88 accumulated checks in run `34217190770`.
- Exact bookkeeping candidate `bfba29fdb500c2f8ea3f466e941f043dae908f26` passed run `34218225949` and is frozen at `release/v3.34-offline-bible-packs`.
- #99 survived the complete #100 functional suite and therefore advanced to Regression-tested.

## Milestone 22 — Backup/export/import/reset

### #100 — Verified

Implementation:
- `src/core/storage.js` enumerates and transactionally replaces only portable BibleQuest v3 local-state keys.
- `src/app/backup.js` defines versioned JSON format `biblequest-v3-local-backup` version `1` and owns export/import/reset orchestration.
- `src/features/backup/index.js` exposes Download backup, Restore backup and confirmed Reset controls through More.
- `device-id`, auth keys and unrelated browser storage are preserved and excluded from backup payloads.
- Import rejects malformed JSON, wrong format/version, forbidden/duplicate keys and non-JSON data before mutation.
- Failed replacement attempts rollback to the previous portable snapshot.
- Successful import/reset reloads BibleQuest so Reader, Progress and other existing owners rehydrate through their normal boundaries.

Permanent protection:
- `BACKUP_IMPORT_V3.md` defines the ownership, portable-data and transaction contracts.
- `scripts/validate-v3-backup.mjs` prevents storage ownership leakage and enforces the verified ledger state.
- `tests/v3-backup-edge.mjs` covers exclusion, exact restore, schema rejection and simulated write-failure rollback.
- `tests/v3-backup-smoke.mjs` performs a real 390px Reader +10 XP setup → backup download → reset/reload → import/reload → Reader/Progress restoration workflow.

Functional verification:
- Initial candidate `f8fb9e03840cc2c7ba141f19352c79f7bc65e8c1` stopped at the new #100 validator because the validator used a stale shorthand acceptance phrase instead of the authoritative inventory row.
- Corrected exact candidate `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215` passed the complete accumulated architecture, edge and browser/mobile suite in run `34219329591`.
- #100 is therefore Verified. #99 is Regression-tested through this later complete-suite evidence.

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

## Next major milestone

Complete the independent exact #100 bookkeeping suite and freeze v3.35 only at the exact SHA that passes the complete accumulated regression workflow. After that freeze, continue with **#62 Couples/family local tools** as the first non-deferred dependency-safe local capability after the rebuilt 1–61 block.

#62 acceptance boundary from the authoritative ledger:
- open a couples/family topic;
- save a private local note/action through one dedicated owner using the central storage boundary;
- leave/reload and recover the saved state;
- keep #63 Couples cloud explicitly separate;
- add permanent edge + 390px browser regression;
- run the complete accumulated suite before promotion.

Kids #38–40 and Japanese furigana #15 remain deferred. Production deployment remains out of scope.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, and production Cloudflare remain unchanged throughout the rebuild.
