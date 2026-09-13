# BibleQuest V5 Lab A3 — Offline First

Branch: `lab/v5-a3-offline-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Latest implementation HEAD before this status commit: `0f5edd7e187083ef5be64114c73bc20d47701927`
Experiment state: **VIABLE — CONTINUE**

## Hypothesis

BibleQuest can gain a stronger V5 architecture by treating offline/mobile constraints as first-class contracts: app-shell availability, versioned downloadable Scripture, structured storage ownership, identity/tenant-scoped safe mutation queues, explicit reconnect/conflict behavior, media lifecycle, and permission-respecting push delivery.

## Completed this run

- Added `src/offline/bible-data-service-adapter.js` as a compatibility seam between the verified offline Scripture provider and the accepted V4 `createBibleDataService()` Reader contract.
- Added `tests/v5-bible-data-service-adapter.test.mjs` covering bundled-pack interception, live Japanese passthrough, licensed external-reader preservation, V4 bundled network fallback and required-boundary validation.
- Kept `src/core/bible.js`, `src/features/reader/index.js`, service-worker runtime, auth, backend, media, push, Cloudflare and Supabase unchanged.
- Disabled the old opened-pack Cache Storage only inside the new adapter by supplying a no-op legacy pack store; the underlying V4 service remains unchanged and available as fallback ownership.

## Offline/PWA/media evidence

- Bundled pack paths (`bible`, `tagalog`, `cebuano`) can now be resolved through an exact manifest and `createScriptureContentProvider()` while preserving the mature chapter/book normalization performed by `createBibleDataService()`.
- The adapter does not intercept the GetBible Japanese live-source URL, so `jko` remains owned by the existing live chapter path.
- Licensed external-reader translations such as NLT remain entirely inside the existing licensed-link behavior and do not touch offline package storage.
- If no offline manifest is registered for a bundled pack, acquisition falls back to the accepted V4 fetch path rather than inventing a package or silently substituting a translation.
- The new seam avoids making Reader own IndexedDB, Cache Storage, checksum validation or package download logic directly.

## Validation

Local syntax validation completed for `src/offline/bible-data-service-adapter.js` with `node --check`: **PASS**.

Attempted exact repository execution of:

`node --test tests/v5-bible-data-service-adapter.test.mjs`

The execution environment could not clone GitHub because DNS resolution for `github.com` failed, so this focused test is **NOT claimed as passed locally**.

Draft PR #189 triggered the inherited workflow suite for exact implementation HEAD `0f5edd7e187083ef5be64114c73bc20d47701927`; all seven workflows were still pending/in progress at the last inspection, so none is counted as passed yet.

Previous separately established local evidence remains: content-provider 7/7, service-worker characterization 6/6, download integrity 7/7, repository 5/5, manifest 6/6. Physical installed-PWA/offline behavior remains **NOT TESTED**.

## Architecture decisions learned

1. The safest incremental Reader migration is an acquisition adapter around the existing `createBibleDataService()` rather than reimplementing its book/chapter/search/licensing normalization in the offline layer.
2. Offline package ownership should intercept only recognized bundled pack paths. Live Japanese and licensed-link translations must retain their existing owners until a separate accepted migration proves equivalent behavior.
3. The old opened-pack Cache Storage can be bypassed for consumers using the new adapter, preventing duplicate persistence ownership, without deleting the V4 implementation before parity evidence is complete.
4. Manifest absence is not an error by itself during migration; controlled fallback to the accepted V4 bundled fetch path permits progressive package rollout.
5. Reader still should not be wired to this adapter until focused tests execute successfully and browser lifecycle evidence exists.

## Known debt / open questions

- The new adapter parity test has been committed but has not yet completed in local or CI execution on this exact head.
- Search behavior across multiple bundled books should receive an additional characterization once the core adapter test is green, because it can exercise many manifest/fallback decisions in one operation.
- No real-browser proof exists yet for IndexedDB install/read/remove/versionchange behavior or installed-PWA service-worker update/reload behavior.
- No storage quota/eviction recovery or package download progress UI exists.
- No mutation queue, account/tenant queue isolation, reconnect conflict policy, push delivery or media lifecycle abstraction exists yet.

## Next 3 tasks

1. Obtain exact-head execution evidence for `tests/v5-bible-data-service-adapter.test.mjs`; repair only demonstrated adapter defects without weakening existing Reader contracts.
2. Add a stable real-browser IndexedDB/service-worker lifecycle harness if it can remain isolated from unrelated CI architecture.
3. Define the first identity/tenant-scoped idempotent offline mutation-envelope contract without enabling background replay yet.

## Viability

**VIABLE — CONTINUE.** The experiment now has a bounded path from verified offline packages into the mature Reader data contract without replacing live Japanese, licensed-link, search/navigation normalization or production Reader ownership. The largest remaining uncertainty is execution/browser evidence rather than architectural fit.
