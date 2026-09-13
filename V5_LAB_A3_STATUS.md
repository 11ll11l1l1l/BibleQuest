# BibleQuest V5 Lab A3 — Offline First

Branch: `lab/v5-a3-offline-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Latest implementation HEAD before this status commit: `70af05813778348375198cc35e480dfda594fc5a`
Experiment state: **VIABLE — CONTINUE**

## Hypothesis

BibleQuest can gain a stronger V5 architecture by treating offline/mobile constraints as first-class contracts: app-shell availability, versioned downloadable Scripture, structured storage ownership, identity/tenant-scoped safe mutation queues, explicit reconnect/conflict behavior, media lifecycle, and permission-respecting push delivery.

## Completed this run

- Preserved the existing versioned Scripture manifest and IndexedDB repository boundaries and kept Reader/service-worker behavior untouched.
- Added `src/offline/scripture-package-download.js`, a dedicated download/integrity owner that validates the manifest before fetch, requests only the manifest-controlled same-origin path, disables HTTP cache reuse for the integrity read, verifies byte size, computes SHA-256 with Web Crypto, and writes to durable storage only after integrity passes.
- Added explicit typed-like error codes for `NETWORK_ERROR`, `HTTP_ERROR`, `SIZE_MISMATCH`, `CHECKSUM_MISMATCH`, and `CRYPTO_UNAVAILABLE` so future UI/retry policy can distinguish failure classes without parsing messages.
- Preserved caller cancellation: an already-aborted signal propagates its original failure rather than being rewritten as a generic network failure.
- Added `tests/v5-scripture-package-download.test.mjs` covering verified commit, corruption rejection, size mismatch, HTTP failure, network/cancellation behavior, retry-after-corruption recovery, and fail-closed behavior without SHA-256 support.

## Offline/PWA/media evidence

- Downloaded Scripture bytes now cross three explicit gates before persistence: manifest/license validation, declared byte-size validation, and SHA-256 equality.
- A corrupt or truncated response cannot call `repository.put()`, so a previously valid package is not overwritten by failed download attempts through this service.
- Retry is intentionally stateless at this layer: a failed corrupt attempt leaves no durable write, and a later verified attempt can commit cleanly.
- Fetch uses the validated relative `contentPath`, `credentials: same-origin`, and `cache: no-store`; no bearer/service-role credentials are introduced.
- This tranche does not add background sync, resumable downloads, Reader integration, push, mutation queues, media changes, auth/RLS changes, or service-worker changes.

## Validation

Executed locally with Node against the exact new service/test content and the existing manifest contract:

`node --test tests/v5-scripture-package-download.test.mjs`

Result: **7 passed, 0 failed, 0 skipped**.

Covered: successful SHA-256 verification before commit, corrupt-checksum rejection with zero durable writes, byte-size rejection before hashing/storage, HTTP error handling, wrapped network errors with explicit cancellation preserved, retry after corruption committing only the later verified bytes, and fail-closed behavior when Web Crypto SHA-256 is unavailable.

Previous repository validation remains separately covered by `tests/v5-scripture-package-repository.test.mjs` with **5 passed, 0 failed, 0 skipped** on its implementation run. Previous manifest validation remains separately covered by `tests/v5-offline-content-manifest.test.mjs` with **6 passed, 0 failed, 0 skipped** on its implementation run.

No GitHub Actions workflow runs were present for exact implementation SHA `70af05813778348375198cc35e480dfda594fc5a` when checked, so CI is **NOT CLAIMED GREEN** for this run.

Physical installed-PWA/offline behavior is **NOT TESTED**. No real-browser IndexedDB, service-worker lifecycle, storage quota, background-fetch, or device-network transition evidence is claimed.

## Architecture decisions learned

1. Keep integrity verification outside the durable repository: the repository owns trusted package persistence; the downloader owns acquisition and trust establishment.
2. Do not replace the current shell worker merely to call V5 offline-first; preserve shell parity until a deliberate versioned worker cutover has browser evidence.
3. App-shell cache version, application release version, Scripture manifest version, Scripture IndexedDB schema version, and downloadable package content version should remain independently evolvable.
4. Downloadable Scripture requires explicit redistribution permission before network acquisition or storage.
5. Corrupt downloads should fail before durable mutation. Retry policy can therefore remain an orchestration concern rather than requiring rollback logic inside IndexedDB.
6. Reader should later consume verified packages through a Scripture content-provider boundary rather than fetching or accessing IndexedDB directly.

## Known debt / open questions

- No download coordinator exists for progress reporting, concurrency limits, resumable transfers, storage quota checks, or package replacement policy.
- No real-browser IndexedDB characterization exists for install/read/remove, blocked upgrades, versionchange handling, quota errors, or private/incognito storage constraints.
- No tested offline Reader provider consumes verified packages yet.
- `offline-shell-sw.js` still uses its V3-named cache prefix and warmed-resource model; changing it remains deferred until browser parity tests exist.
- No browser evidence yet proves `cache: no-store` plus service-worker routing cannot accidentally serve stale package bytes under a future worker strategy; the V5 worker must preserve the integrity contract.
- Push delivery, safe offline mutations, account/tenant queue isolation, reconnect conflict rules, and media lifecycle remain unimplemented.

## Next 3 tasks

1. Add real-browser IndexedDB characterization for install/read/remove plus upgrade-blocked/versionchange behavior if the existing browser harness can support it; otherwise add service-worker/app-shell characterization first.
2. Build service-worker/app-shell characterization tests that prove current warmed-shell ownership, offline navigation behavior, update/recovery behavior, and that future Scripture package fetches cannot bypass integrity verification.
3. Introduce a Reader-facing content-provider abstraction that can resolve verified offline packages before network fallback without exposing IndexedDB or fetch ownership to Reader UI code.

## Viability

**VIABLE — CONTINUE.** The offline-first architecture now separates package declaration/licensing, network acquisition/integrity, durable storage, and the still-unchanged Reader/app-shell owners. The experiment continues to show that strong offline primitives can be added incrementally without destabilizing auth, backend, or current PWA behavior. The next meaningful risk has shifted from package corruption to real-browser lifecycle and service-worker interaction evidence.
