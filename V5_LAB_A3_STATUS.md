# BibleQuest V5 Lab A3 — Offline First

Branch: `lab/v5-a3-offline-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Latest implementation HEAD before this status commit: `fd1e636bd4e6a71bc81338b206569cf333c99b9e`
Experiment state: **VIABLE — CONTINUE**

## Hypothesis

BibleQuest can gain a stronger V5 architecture by treating offline/mobile constraints as first-class contracts: app-shell availability, versioned downloadable Scripture, structured storage ownership, identity/tenant-scoped safe mutation queues, explicit reconnect/conflict behavior, media lifecycle, and permission-respecting push delivery.

## Completed this run

- Added `src/offline/scripture-content-provider.js` as the first Reader-facing offline-first content boundary without wiring it into the production Reader yet.
- Added `tests/v5-scripture-content-provider.test.mjs` with deterministic coverage for local-first resolution, explicit offline-only behavior, verified network repair, corrupt local content removal and durable-write proof.
- Kept `src/features/reader/index.js`, `src/core/bible.js`, service-worker runtime, auth, backend, media, push, Cloudflare and Supabase unchanged.
- Preserved the existing package trust chain: manifest/license validation -> verified SHA-256 download -> IndexedDB repository -> content provider.
- Confirmed the existing browser audit installs Playwright ad hoc; no stable Lab A3 browser fixture exists yet, so this run did not claim browser/PWA evidence.

## Offline/PWA/media evidence

- `createScriptureContentProvider()` requires an exact versioned manifest and uses its deterministic package key; it does not infer a "latest" package or silently select a different translation/version.
- The provider reads durable verified content before invoking the network.
- `allowNetwork: false` produces an explicit offline-missing error and never invokes the downloader.
- Stored metadata that does not match the requested manifest is removed before repair.
- Stored bytes that are not valid UTF-8 JSON are removed before repair; in offline-only mode that corruption fails closed instead of substituting content.
- Network repair is delegated only to the previously verified downloader. A download is not considered usable until the expected package can be read back from durable storage.
- The current production Reader is not migrated yet. `src/core/bible.js` still owns the accepted V4 bundled/live/licensed translation behavior and its older Cache Storage opened-pack fallback.
- This run is deterministic Node/domain evidence, not physical-device or installed-browser PWA evidence.

## Validation

Executed locally against the exact provider/test content before repository write:

`node --test tests/v5-scripture-content-provider.test.mjs`

Result: **7 passed, 0 failed, 0 skipped**.

Covered: local package precedence, missing-package verified download, explicit offline-only missing behavior, metadata mismatch cleanup + repair, malformed local JSON cleanup + repair, offline corrupt-content fail-closed behavior, and rejection when a successful downloader call does not yield readable durable content.

Previous service-worker characterization remains separately covered by `tests/v5-offline-shell-sw-characterization.test.mjs` with **6 passed, 0 failed, 0 skipped** on its implementation run. Previous download validation remains separately covered by `tests/v5-scripture-package-download.test.mjs` with **7 passed, 0 failed, 0 skipped**. Previous repository validation remains separately covered by `tests/v5-scripture-package-repository.test.mjs` with **5 passed, 0 failed, 0 skipped**. Manifest validation remains separately covered by `tests/v5-offline-content-manifest.test.mjs` with **6 passed, 0 failed, 0 skipped**.

Physical installed-PWA/offline behavior is **NOT TESTED**. Real-browser IndexedDB lifecycle, service-worker update lifecycle, storage quota behavior, device network transitions and cross-browser behavior remain unproven.

## Architecture decisions learned

1. Reader should depend on a Scripture content-provider boundary rather than owning IndexedDB, Cache Storage or raw package downloads directly.
2. Exact manifest identity is the compatibility contract. Offline-first must not guess a newest version or silently substitute another translation when the requested package is absent.
3. Corrupt or metadata-mismatched durable content should be removed and may be repaired only through the verified download path; offline-only mode must fail closed.
4. A completed network transfer is not sufficient evidence of availability. The provider requires successful read-back from durable storage before returning downloaded content.
5. Keep the current `src/core/bible.js` owner intact until an adapter/parity tranche proves bundled, live Japanese and licensed-link behavior through the new provider boundary.
6. Keep Scripture acquisition/integrity outside shell-cache interception; app-shell cache and Scripture package storage remain separate trust domains.

## Known debt / open questions

- The new provider currently returns parsed package JSON but is not yet adapted to the accepted `createBibleDataService()` chapter/search/navigation contract.
- `src/core/bible.js` still uses `biblequest-v3-opened-bible-packs-v1` Cache Storage for previously opened bundled packs; migration/removal must wait for parity evidence.
- No real-browser proof exists yet for IndexedDB install/read/remove/versionchange behavior or installed-PWA service-worker update/reload behavior.
- No storage quota/eviction recovery or package download progress UI exists.
- No mutation queue, account/tenant queue isolation, reconnect conflict policy, push delivery or media lifecycle abstraction exists yet.
- The Node harnesses do not substitute for browser/PWA execution or physical-device acceptance.

## Next 3 tasks

1. Add a compatibility adapter/characterization tranche that maps a verified offline book package into the accepted `createBibleDataService()` book/chapter shape without changing licensed-link or live-Japanese behavior.
2. Add real-browser IndexedDB/service-worker characterization using a stable checked-in browser harness if it can be introduced without coupling this lab to unrelated CI architecture.
3. Define the first identity/tenant-scoped idempotent offline mutation-envelope contract without enabling background replay yet.

## Viability

**VIABLE — CONTINUE.** The lab now has an explicit Reader-facing local-first content resolution seam on top of independently tested manifest, integrity-download and IndexedDB layers. The remaining risk is no longer basic storage ownership; it is compatibility with the mature Reader data contract plus browser lifecycle evidence. That is a bounded incremental migration problem, not evidence that the offline-first hypothesis should be scrapped.
