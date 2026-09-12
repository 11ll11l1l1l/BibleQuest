# BibleQuest V5 Lab A3 — Offline First

Branch: `lab/v5-a3-offline-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Latest implementation HEAD before this status commit: `7a188effede50f08960ad44a26a500c9456688eb`
Experiment state: **VIABLE — CONTINUE**

## Hypothesis

BibleQuest can gain a stronger V5 architecture by treating offline/mobile constraints as first-class contracts: app-shell availability, versioned downloadable Scripture, structured storage ownership, identity/tenant-scoped safe mutation queues, explicit reconnect/conflict behavior, media lifecycle, and permission-respecting push delivery.

## Completed this run

- Recovered the clean lab baseline and V5 authority/plan/checklist.
- Characterized the existing PWA split: `sw.js` is a legacy retirement shim, while `src/app/offline-shell.js` registers `offline-shell-sw.js`, which owns the current warmed same-origin shell cache.
- Added `src/offline/content-manifest.js`, a pure versioned Scripture package contract.
- Added `tests/v5-offline-content-manifest.test.mjs` with six executable contract tests.
- Enforced explicit redistribution permission before an offline package is accepted.
- Enforced SHA-256 integrity metadata, same-origin package paths, deterministic package identity, valid scope/book topology, positive byte size, and normalized timestamps.

## Offline/PWA/media evidence

- Current app-shell behavior and Scripture-package lifecycle are separate concerns in the baseline; this lab will keep those versions independent rather than storing Bible text as incidental shell cache entries.
- The new manifest contract does not yet download, cache, persist, or expose any Scripture content.
- No push, mutation queue, media, auth, RLS, production Cloudflare, or production Supabase behavior changed.

## Validation

Executed locally with Node `v22.16.0`:

`node --test tests/v5-offline-content-manifest.test.mjs`

Result: **6 passed, 0 failed, 0 skipped**.

Covered: accepted book package, explicit licensing denial, malformed checksum denial, cross-origin/protocol-relative path denial, duplicate/multi-book scope denial, and accepted multi-book translation package.

Physical installed-PWA/offline behavior is **NOT TESTED**. No browser/service-worker lifecycle result is claimed for this tranche.

## Architecture decisions learned

1. Do not replace the current shell worker merely to call V5 offline-first; preserve shell parity until a deliberate versioned worker cutover has browser evidence.
2. App-shell cache version, application release version, and Scripture content-package version should be independently evolvable.
3. Downloadable Scripture requires a licensing gate before any storage/download owner accepts a package.
4. Scripture package descriptors should be deterministic and integrity-addressable before IndexedDB/Cache Storage implementation begins.

## Known debt / open questions

- No actual content-pack storage owner or IndexedDB schema exists yet.
- No download manager, checksum verification against downloaded bytes, cancellation, resume, storage quota UI, corruption recovery, or package migration exists yet.
- No tested offline Reader repository consumes packages yet.
- `offline-shell-sw.js` still uses its V3-named cache prefix and warmed-resource model; changing it is deferred until browser parity tests exist.
- Push delivery, safe offline mutations, account/tenant queue isolation, reconnect conflict rules, and media lifecycle remain unimplemented.

## Next 3 tasks

1. Introduce a small IndexedDB-backed Scripture package metadata/content repository with explicit schema versioning and deterministic unit tests.
2. Add a download/verification service that hashes fetched bytes before commit and proves corrupt-package rejection/recovery without touching Reader UI.
3. Build service-worker/app-shell characterization tests and then decide whether a versioned V5 worker should replace or wrap the current warmed-shell owner.

## Viability

**VIABLE — CONTINUE.** The baseline already separates shell registration from the legacy retirement worker, and a standalone content-package contract can be introduced without destabilizing auth, backend, Reader UI, or production behavior. The main unresolved question is whether the eventual IndexedDB + service-worker + Reader repository integration remains simpler than a network-first architecture once real browser lifecycle tests are added.
