# BibleQuest V5 Lab A3 — Offline First

Branch: `lab/v5-a3-offline-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Latest implementation HEAD before this status commit: `d8b4c6ac56308f5482a21f1c15c982a77ba5a0ca`
Experiment state: **VIABLE — CONTINUE**

## Hypothesis

BibleQuest can gain a stronger V5 architecture by treating offline/mobile constraints as first-class contracts: app-shell availability, versioned downloadable Scripture, structured storage ownership, identity/tenant-scoped safe mutation queues, explicit reconnect/conflict behavior, media lifecycle, and permission-respecting push delivery.

## Completed this run

- Preserved the existing versioned Scripture manifest contract and kept Reader/service-worker behavior untouched.
- Added `src/offline/scripture-package-repository.js`, a dedicated IndexedDB owner for offline Scripture packages.
- Added explicit database/schema ownership constants: `biblequest-scripture-packages`, schema version `1`, and a single `packages` store with a translation index.
- Added validated package `put`, `get`, metadata `list`, `remove`, and `close` operations.
- Storage accepts only validated manifests and `ArrayBuffer`/`Uint8Array` payloads, copies caller bytes, and rejects content whose byte count disagrees with manifest metadata before persistence.
- Added `tests/v5-scripture-package-repository.test.mjs` with deterministic injected-IndexedDB characterization covering persistence lifecycle, mutation isolation, byte-size rejection, translation filtering, missing IndexedDB, and unsupported content representations.

## Offline/PWA/media evidence

- Scripture package storage now has an explicit owner independent of shell Cache Storage and independent of Reader UI state.
- IndexedDB schema versioning is explicit, so future content-record migrations can evolve separately from the app-shell service worker version and content-manifest schema version.
- This tranche intentionally does not fetch remote bytes, verify the manifest SHA-256 against downloaded bytes, integrate with Reader, or alter the service worker.
- No push, mutation queue, media, auth, RLS, production Cloudflare, or production Supabase behavior changed.

## Validation

Executed locally with Node `v22.16.0`:

`node --test tests/v5-scripture-package-repository.test.mjs`

Result: **5 passed, 0 failed, 0 skipped**.

Covered: store/read/list/remove lifecycle, caller-byte copy isolation, pre-storage byte-size mismatch rejection, normalized translation filtering, fail-closed behavior without IndexedDB, and unsupported payload rejection.

Previous manifest validation remains separately covered by `tests/v5-offline-content-manifest.test.mjs` with **6 passed, 0 failed, 0 skipped** on its implementation run.

Physical installed-PWA/offline behavior is **NOT TESTED**. No browser service-worker lifecycle or real-browser IndexedDB result is claimed for this tranche; the current repository suite uses an injected deterministic test double.

## Architecture decisions learned

1. Do not replace the current shell worker merely to call V5 offline-first; preserve shell parity until a deliberate versioned worker cutover has browser evidence.
2. App-shell cache version, application release version, Scripture manifest version, and Scripture IndexedDB schema version should remain independently evolvable.
3. Downloadable Scripture requires a licensing gate before any storage/download owner accepts a package.
4. The content repository should own durable bytes and package metadata; Reader should later consume it through a Scripture content-provider boundary rather than accessing IndexedDB directly.
5. Integrity verification belongs before repository commit. The current repository verifies declared size only; SHA-256 verification remains the next boundary.

## Known debt / open questions

- No download manager or checksum verification against downloaded bytes exists yet.
- No cancellation, resume, storage quota UI, corruption recovery, or IndexedDB schema migration beyond version 1 exists yet.
- No tested offline Reader repository consumes packages yet.
- Real-browser IndexedDB upgrade/blocked/versionchange behavior is not yet characterized.
- `offline-shell-sw.js` still uses its V3-named cache prefix and warmed-resource model; changing it is deferred until browser parity tests exist.
- Push delivery, safe offline mutations, account/tenant queue isolation, reconnect conflict rules, and media lifecycle remain unimplemented.

## Next 3 tasks

1. Add a download/integrity service that fetches same-origin package bytes, computes SHA-256 before commit, rejects corrupt payloads, and proves retry/recovery without touching Reader UI.
2. Add real-browser IndexedDB characterization for install/read/remove and schema-open failure/blocked behavior when a browser harness is available.
3. Build service-worker/app-shell characterization tests and then decide whether a versioned V5 worker should replace or wrap the current warmed-shell owner.

## Viability

**VIABLE — CONTINUE.** A structured offline package store can be introduced as an isolated domain owner without destabilizing auth, backend, Reader UI, or the current app shell. The architecture remains promising because content manifests, durable content storage, and shell caching now have separable responsibilities. The next meaningful risk is end-to-end integrity/download behavior and eventual real-browser lifecycle evidence.
