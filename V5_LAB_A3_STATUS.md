# BibleQuest V5 Lab A3 — Offline First

Branch: `lab/v5-a3-offline-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Latest implementation HEAD before this status commit: `3eca7ed6b80047e83ff5b29d3dec56984e606a0d`
Experiment state: **VIABLE — CONTINUE**

## Hypothesis

BibleQuest can gain a stronger V5 architecture by treating offline/mobile constraints as first-class contracts: app-shell availability, versioned downloadable Scripture, structured storage ownership, identity/tenant-scoped safe mutation queues, explicit reconnect/conflict behavior, media lifecycle, and permission-respecting push delivery.

## Completed this run

- Preserved the current `offline-shell-sw.js` implementation and added characterization rather than changing worker behavior prematurely.
- Added `tests/v5-offline-shell-sw-characterization.test.mjs` with an isolated service-worker harness covering request interception, active cache behavior, navigation fallback, cache cleanup and client claiming.
- Proved the current shell worker does not intercept ordinary same-origin Scripture/data requests because those requests are neither navigation requests nor script/style/image/font destinations.
- Proved current shell assets are network-first with cache fallback, network probes/out-of-scope URLs are excluded, offline navigation falls back to the cached app-scope root, and activation removes only obsolete BibleQuest shell-cache versions.
- No Reader, service-worker runtime, auth, backend, media, push, Cloudflare or Supabase code changed.

## Offline/PWA/media evidence

- The current worker's shell ownership is intentionally narrow: navigations plus `script`, `style`, `image` and `font` destinations inside registration scope.
- Scripture package requests such as `/offline/web/jhn.json` currently bypass `respondWith`, so the previously introduced `scripture-package-download.js` remains the network/integrity owner for those bytes.
- Successful shell network responses refresh the active shell cache; failed shell requests may fall back to a warmed cached response.
- Failed offline navigations may fall back to the cached scope root when the exact route is unavailable.
- Worker activation cleans only obsolete caches carrying the BibleQuest shell prefix and leaves unrelated caches intact.
- This is deterministic Node service-worker characterization, not physical-device or installed-browser PWA evidence.

## Validation

Executed locally with Node against the exact fetched `offline-shell-sw.js` content and the exact new test content before repository write:

`node --test tests/v5-offline-shell-sw-characterization.test.mjs`

Result: **6 passed, 0 failed, 0 skipped**.

Covered: Scripture/data bypass, network-probe and scope exclusion, network-first shell refresh, cache fallback, navigation root fallback, and activation cache cleanup/client claim.

Previous download validation remains separately covered by `tests/v5-scripture-package-download.test.mjs` with **7 passed, 0 failed, 0 skipped** on its implementation run. Previous repository validation remains separately covered by `tests/v5-scripture-package-repository.test.mjs` with **5 passed, 0 failed, 0 skipped**. Manifest validation remains separately covered by `tests/v5-offline-content-manifest.test.mjs` with **6 passed, 0 failed, 0 skipped**.

Physical installed-PWA/offline behavior is **NOT TESTED**. Real-browser IndexedDB lifecycle, service-worker update lifecycle, storage quota behavior, device network transitions and cross-browser behavior remain unproven.

## Architecture decisions learned

1. Keep Scripture acquisition/integrity outside shell-cache interception. The current worker already has this separation; a future V5 worker must preserve it deliberately.
2. Characterize current service-worker behavior before replacing the V3-named cache strategy. Offline-first does not require an immediate worker rewrite.
3. Keep application release, app-shell cache version, Scripture manifest version, Scripture IndexedDB schema version and package content version independently evolvable.
4. Keep integrity verification before durable package persistence; service-worker cache fallback must never become an alternate Scripture trust path.
5. Reader should later consume verified packages through a content-provider boundary rather than directly owning fetch, Cache Storage or IndexedDB.

## Known debt / open questions

- The current worker still uses `biblequest-v3-offline-shell-` naming and a warmed-resource strategy; naming/version redesign is deferred until browser lifecycle evidence exists.
- No real-browser proof exists yet for install/activate/update/reload behavior, blocked worker updates or storage eviction.
- No real-browser IndexedDB characterization exists for install/read/remove, versionchange handling, quota errors or private/incognito storage constraints.
- No tested Reader provider consumes verified offline packages yet.
- No mutation queue, account/tenant queue isolation, reconnect conflict policy, push delivery or media lifecycle abstraction exists yet.
- The Node harness models the service-worker APIs relevant to current logic but does not substitute for browser/PWA execution.

## Next 3 tasks

1. Add real-browser IndexedDB/service-worker characterization if the existing browser harness can support it; specifically verify install/read/remove and worker offline navigation/update behavior.
2. Introduce a Reader-facing content-provider abstraction that resolves verified offline Scripture packages before controlled network fallback without exposing IndexedDB/fetch ownership to Reader UI code.
3. Define the first identity/tenant-scoped idempotent offline mutation-envelope contract without yet enabling background replay.

## Viability

**VIABLE — CONTINUE.** The experiment now has explicit evidence that the existing app-shell worker and the new Scripture integrity path are separate owners rather than competing caches. That materially reduces the risk of adding offline Scripture incrementally. The next evidence gap is browser lifecycle behavior, not basic ownership ambiguity.
