# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains the release/milestone history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; the trigger commit is never a release candidate and the branch is reset to the exact clean candidate after the run.
- Latest frozen checkpoint: `release/v3.33-offline-shell` at `6c7e2e93d07def6e104e48c606dbbb3a7d3e48f7`.
- Exact v3.33 bookkeeping run `34216091431` passed all 85 numbered accumulated regression steps against that SHA before freeze.

## Current progress

Inventory state after the #99 Offline opened Bible packs functional gate:

| State | Count |
|---|---:|
| Regression-tested | 60 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 39 |
| Total | 100 |

Strict verified-or-better parity is **61/100**.

Official regression stability is **60/100**.

Current leading rows:
- #97 PWA install/manifest — **Regression-tested**; frozen in v3.32.
- #98 Offline Shell — **Regression-tested** after surviving the later complete #99 functional suite; frozen in v3.33.
- #99 Offline opened Bible packs — **Verified** after exact functional run `34217190770` against `8eaaf4e0687cd4d10a74f00de8ffbee291fe062e`; exact bookkeeping/release gate is active.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

The rebuild still follows one source of truth per function. The currently relevant offline owners are:

- `src/app/pwa-install.js` — install-prompt lifecycle only.
- `src/app/offline-shell.js` — page-side service-worker registration and first-load shell warmup only.
- `offline-shell-sw.js` — application-shell Cache Storage and shell fetch fallback only.
- `src/core/bible.js` — Bible-source loading, bundled pack validation, in-memory cache, and #99 opened-pack Cache Storage persistence.
- `src/core/client-diagnostics.js` + `src/core/api.js` — diagnostics classification and the real no-store network probe.

#98 still does **not** cache generic fetch/XHR payloads, Bible packs, Supabase/API responses, account/cloud state, or media. #99 uses a distinct `biblequest-v3-opened-bible-packs-v1` cache through the Bible-data owner only. Reader UI and the #98 service worker do not own Bible-pack persistence.

Eligible #99 persistence is limited to bundled BSB and Tagalog book packs that are explicitly opened. Japanese 口語訳 remains live, NLT remains external/licensed, STEPBible context packs remain outside #99, and whole-translation text search does not silently populate the offline pack cache.

## Milestone 19 — PWA install/manifest

### #97 — Regression-tested

- Deployment-relative `manifest.webmanifest` remains the single app identity/launch contract.
- `src/app/pwa-install.js` remains the sole optional `beforeinstallprompt` / `appinstalled` owner.
- Corrected functional candidate `b0f3e81c5a85addf7580e5ad0bd02fcdfe642667` passed run `34212434449`.
- Exact bookkeeping SHA `200d69ec37b9aba48e8b926dfef7f2a8203d4855` passed run `34213223642` and is frozen at `release/v3.32-pwa-install`.
- #97 survived #98 and remains Regression-tested.

## Milestone 20 — Offline Shell

### #98 — Regression-tested

- `src/app/offline-shell.js` and `offline-shell-sw.js` remain the bounded #98 shell owners.
- Corrected functional candidate `85de7cd753f7a74606b1feb8bbe4fd81205d3aa4` passed all 85 numbered steps in run `34214663407`.
- Exact bookkeeping candidate `6c7e2e93d07def6e104e48c606dbbb3a7d3e48f7` passed all 85 numbered steps in run `34216091431` and is frozen at `release/v3.33-offline-shell`.
- #98 survived the later complete #99 functional suite and advanced to Regression-tested.

## Milestone 21 — Offline opened Bible packs

### #99 — Verified

Implementation:
- `src/core/bible.js` remains the sole bundled Scripture pack-path and semantic-validation owner.
- Opened bundled BSB/Tagalog book packs are persisted only after the network payload passes the existing verse/chapter/duplicate validation.
- Network remains first choice. If network is unavailable or non-successful, a previously opened persisted pack may be reused.
- Persisted content is revalidated before use; semantically corrupt persisted data is evicted and rejected with controlled recovery guidance.
- Cache write/quota failure never breaks an otherwise valid online Scripture read.
- Full-text search uses `persistOffline:false`, so scanning books does not become a bulk offline download. If a searched in-memory pack is later explicitly opened, that normalized pack is then persisted.
- Live Japanese, licensed NLT, context packs, generic APIs, cloud/account state, media, and arbitrary fetches remain excluded.

Permanent protection:
- `OFFLINE_BIBLE_PACKS_V3.md` defines the #99 ownership and eligibility contract.
- `scripts/validate-v3-offline-bible-packs.mjs` prevents persistence ownership from leaking into Reader or the #98 worker.
- `tests/v3-offline-bible-packs-edge.mjs` covers online→persistent→offline recovery, source metadata, bounded search persistence, corrupt-cache eviction, cache-write failure, malformed network behavior, Japanese exclusion, and NLT exclusion.
- `tests/v3-offline-bible-packs-smoke.mjs` performs a real 390px Chromium BSB + Tagalog online open, separate persistent-cache check, offline reload/switch, attribution check, shell-cache separation, and unopened Exodus rejection.

Functional verification:
- Exact clean functional candidate `8eaaf4e0687cd4d10a74f00de8ffbee291fe062e` passed all **88 numbered accumulated regression steps** in run `34217190770`.
- The isolated trigger commit checked out and asserted that exact candidate; the verification branch was reset afterward to remove its temporary push trigger.
- #99 is Verified pending its independent exact bookkeeping/release gate. #98 is Regression-tested through this later complete-suite evidence.

## Defect / root-cause ledger

Every real defect remains root-caused and protected by a regression. Important retained examples include:
- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-TRANSFORM-OWNER-001` — removed competing Transform calculation ownership.
- `V3-RECORDINGS-FREEZE-001` — one Audio owner + one Recordings owner with teardown coverage.
- `V3-GAMES-OWNER-001` — centralized game lifecycle.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-OPEN-REVIEW-OWNER-001` — Open Review cannot directly own Games recall persistence.
- `V3-PWA-OFFLINE-COMPOSITION-TEST-001` — PWA test validates ownership rather than assuming a permanently service-worker-free app.
- `V3-STATUS-STRUCTURE-001` — the v3.33 bookkeeping attempt exposed validator-required status headings; the document structure was restored instead of weakening validation.

## Next major milestone

Complete the independent exact #99 bookkeeping suite and freeze `release/v3.34-offline-bible-packs` only at the exact SHA that passes all 88 accumulated steps. After that freeze, reassess the remaining 39 Not started rows and select the next dependency-safe parity milestone rather than blindly continuing inventory order.

Kids #38–40 and Japanese furigana #15 remain deferred. Production deployment remains out of scope.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, and production Cloudflare remain unchanged throughout the rebuild.
