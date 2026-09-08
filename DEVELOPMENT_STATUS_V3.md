# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains the release/milestone history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; the trigger commit is never a release candidate and the branch is reset to the exact clean candidate after the run.
- Latest frozen checkpoint: `release/v3.32-pwa-install` at `200d69ec37b9aba48e8b926dfef7f2a8203d4855`.
- Exact v3.32 bookkeeping run `34213223642` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the corrected #98 Offline Shell functional gate:

| State | Count |
|---|---:|
| Regression-tested | 59 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 40 |
| Total | 100 |

Strict verified-or-better parity is **60/100**.

Official regression stability is **59/100**.

Current leading rows:
- #97 PWA install/manifest — **Regression-tested** after surviving the later complete #98 functional suite; frozen in v3.32.
- #98 Offline Shell — **Verified** after corrected exact functional run `34214663407` against `85de7cd753f7a74606b1feb8bbe4fd81205d3aa4`; exact bookkeeping/release gate is active.
- #99 Offline opened Bible packs — **Not started** and explicitly separate from #98.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

The rebuild still follows one source of truth per function. The currently relevant owners are:

- `src/app/pwa-install.js` — install-prompt lifecycle only.
- `src/app/offline-shell.js` — page-side service-worker registration and first-load shell warmup only.
- `offline-shell-sw.js` — application-shell Cache Storage and shell fetch fallback only.
- `src/core/client-diagnostics.js` + `src/core/api.js` — diagnostics classification and the real no-store network probe.
- `src/core/bible.js` — Bible data owner; #99 may extend opened-pack offline availability without moving Bible-pack ownership into the shell worker.
- Existing router, session, store, storage, Lesson, Progress, Transform, Audio, Recordings, Games, Notes, and congregation owners remain unchanged.

#98 deliberately does **not** cache generic fetch/XHR payloads, Bible packs, Supabase/API responses, account/cloud state, or media. Runtime interception is restricted to same-origin in-scope navigation and shell destinations (script/style/image/font). The `bq-net-probe` is excluded from both warming and fetch interception so Client Diagnostics remains truthful offline.

## Milestone 19 — PWA install/manifest

### #97 — Regression-tested

- Deployment-relative `manifest.webmanifest` remains the single app identity/launch contract.
- `src/app/pwa-install.js` remains the sole optional `beforeinstallprompt` / `appinstalled` owner.
- Corrected functional candidate `b0f3e81c5a85addf7580e5ad0bd02fcdfe642667` passed run `34212434449`.
- Exact bookkeeping SHA `200d69ec37b9aba48e8b926dfef7f2a8203d4855` passed run `34213223642` and is frozen at `release/v3.32-pwa-install`.
- #97 survived the complete #98 functional suite and therefore advanced to Regression-tested.

## Milestone 20 — Offline Shell

### #98 — Verified

Implementation:
- `src/app/offline-shell.js` registers deployment-relative `offline-shell-sw.js` with deployment-relative `./` scope.
- First online load reports only the already-loaded same-origin document/script/style/image shell resources; generic `fetch`/XHR entries are excluded.
- Warmup uses `BIBLEQUEST_WARM_SHELL` plus MessageChannel acknowledgement before the owner reports ready.
- `offline-shell-sw.js` uses a versioned BibleQuest shell cache, network-first refresh, cached navigation/static fallback, `skipWaiting`, client claim, and removal only of superseded BibleQuest shell caches.
- Bible pack/API/probe ownership remains outside #98; #99 alone may add opened-Bible-pack caching.

Permanent verification:
- `scripts/validate-v3-offline-shell.mjs` enforces ownership and #99 boundary.
- `tests/v3-offline-shell-edge.mjs` verifies registration, filtering, acknowledgement, idempotence, disposal, and unsupported-browser behavior.
- `tests/v3-offline-shell-smoke.mjs` verifies real Chromium 390px online load → offline switch → reload, one mounted shell, no horizontal overflow, service-worker control, and absence of Bible packs / `bq-net-probe` in the shell cache.

Functional verification history:
- Initial candidate `627601ecc28df466bc7dd561d40983917c3ee773` reached browser regressions but exposed one obsolete #97 test assumption.
- Root cause `V3-PWA-OFFLINE-COMPOSITION-TEST-001`: the #97 PWA smoke test asserted that no service-worker controller could exist anywhere, rather than asserting that #97 itself does not own/register one.
- The regression was corrected to permit a controller only when its script is the dedicated `offline-shell-sw.js`; the PWA owner remains service-worker independent.
- Corrected exact candidate `85de7cd753f7a74606b1feb8bbe4fd81205d3aa4` passed all **85 numbered accumulated steps** in run `34214663407`.
- #98 is therefore Verified and #97 is Regression-tested.

## Defect / root-cause ledger

Every real defect remains root-caused and protected by a regression. Important retained examples include:
- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-TRANSFORM-OWNER-001` — removed competing Transform calculation ownership.
- `V3-RECORDINGS-FREEZE-001` — one Audio owner + one Recordings owner with teardown coverage.
- `V3-GAMES-OWNER-001` — centralized game lifecycle.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-OPEN-REVIEW-OWNER-001` — Open Review cannot directly own Games recall persistence.
- `V3-PWA-OFFLINE-COMPOSITION-TEST-001` — PWA test now validates ownership rather than assuming a permanently service-worker-free app.
- `V3-STATUS-STRUCTURE-001` — the v3.33 bookkeeping attempt exposed that shortening `DEVELOPMENT_STATUS_V3.md` removed validator-required defect-ledger and next-work-queue headings; the headings were restored instead of weakening the architecture validator.

Historical detail remains available in Git history and `TIMELINE_V3.md`; this status file intentionally emphasizes the current handoff state.

## Next major milestone

After the exact #98 bookkeeping candidate passes the complete suite and `release/v3.33-offline-shell` is frozen, continue directly to **#99 Offline opened Bible packs**.

#99 acceptance boundary:
- open a Bible pack/chapter online;
- persist only the intended opened Bible content through the Bible-data ownership boundary;
- reload/use the same opened content offline;
- do not turn the #98 shell cache into a generic API cache;
- preserve translation/source attribution and malformed-cache recovery;
- preserve truthful Client Diagnostics;
- add permanent edge + real mobile/browser offline regression;
- run the entire accumulated suite before promotion.

Kids #38–40 and Japanese furigana #15 remain deferred. Production deployment remains out of scope.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, and production Cloudflare remain unchanged throughout the rebuild.
