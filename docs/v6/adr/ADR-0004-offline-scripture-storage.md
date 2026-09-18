# ADR-0004 — Offline Scripture storage and content-manifest strategy

Status: ACCEPTED
Date: 2026-09-18
Supersedes: none

## Context

BibleQuest V5 already supports bounded offline reopening of previously opened bundled Bible books. The Reader data owner persists validated BSB, Tagalog and Cebuano book packs in a dedicated Cache Storage cache. The application-shell service worker does not own Scripture packs. Search deliberately avoids bulk-persisting every book it scans. Japanese 口語訳 remains a live source and NLT remains an external licensed-reader mode.

V6 must expand this minimum into deliberate book/translation downloads, versioning, checksum validation, storage controls and offline local search without weakening licensing boundaries or mixing Scripture content into the shell cache.

## Decision

V6 adopts a versioned Scripture content-manifest architecture.

- The Reader/content engine remains the owner of Scripture package download, verification, activation, removal and recovery.
- Application-shell/service-worker caches remain separate from Scripture packages.
- Immutable Scripture package bytes use Cache Storage because they are large response-like resources.
- Package/install metadata, active manifest versions and content indexes use IndexedDB when the full downloader is implemented.
- Reading position and ordinary user preferences remain outside immutable Scripture package storage.
- Every downloadable translation manifest includes schema version, translation id, content version, source, license, attribution, redistribution policy, and per-book URL/SHA-256 metadata.
- Package bytes are verified against SHA-256 before activation. A corrupt or mismatched package is never exposed to Reader and is removed/recoverable.
- App build version, service-worker version and Scripture content version are independent.
- Download/install operations are deliberate user actions. V6 does not silently download an entire translation merely because Reader or search touched it.
- Offline search is limited to content actually installed or otherwise explicitly available offline.
- A live/licensed translation that is unavailable offline must show an unavailable state; BibleQuest must never silently substitute another translation.
- Storage estimate/persistence APIs are progressive enhancement only; failure to obtain durable storage must not break valid online Reader use.

Initial packaging policy preserves the current V5 repository contract:

- BSB: redistribution allowed; may be offered as downloadable offline packages.
- Tagalog ULB: CC BY-SA 4.0; may be offered as downloadable offline packages with required attribution.
- Cebuano/OCCB: CC BY-SA 4.0 per current repository metadata; may be offered as downloadable offline packages with required attribution.
- Japanese 口語訳: remains live-only until the exact source text/package lineage is separately reviewed and pinned; no V6 packaged redistribution is implied by the age of the underlying edition.
- NLT: external licensed-reader only; BibleQuest does not package or redistribute the text.

## Alternatives considered

1. Put Bible text into the generic PWA shell cache — rejected because it blurs ownership, makes shell upgrades expensive and risks accidental bulk caching.
2. Store full Scripture text in localStorage — rejected because of size, transactional and migration limitations.
3. Cache any same-origin Scripture response automatically — rejected because search or background activity could unexpectedly download large content.
4. Treat every translation the same offline — rejected because delivery and redistribution rights differ materially.
5. Use only filenames/versioned URLs without checksums — rejected because V6 needs deterministic corruption and update detection.

## Consequences

The Reader can eventually support explicit offline downloads and recovery while keeping the V5 shell-cache boundary intact. Content updates require manifest generation and checksum publication. Licensing metadata becomes a release-blocking input rather than display-only text.

Cache Storage and IndexedDB become two coordinated parts of the content engine, so package activation/removal must be transactional at the metadata level even though byte storage is external.

## Migration

1. Characterize current V5 Reader translation modes and opened-pack behavior.
2. Introduce typed manifest/license/checksum contracts alongside V5.
3. Generate manifests for redistributable bundled translations without changing Reader fetch ownership.
4. Add a package repository that stages bytes, verifies checksum, then records activation metadata.
5. Add download/progress/cancel/retry/remove/storage UI.
6. Add offline Reader and local-search adapters over installed packages.
7. Migrate current opened-pack fallback into the new repository.
8. Remove the V5 opened-pack cache only after upgrade/recovery/browser evidence proves installed content survives the migration.

## Required evidence

- manifest validation rejects missing source/license/attribution/checksum data;
- live/external translations cannot be declared downloadable;
- package SHA-256 mismatch is rejected before activation;
- corrupt/outdated packages are removed or recovered predictably;
- BSB/Tagalog/Cebuano attribution survives offline presentation;
- Japanese and NLT are never silently packaged by the V6 downloader;
- previously installed content reopens after application restart with network disabled;
- an unopened/uninstalled book is not fabricated offline;
- local search does not escape the installed-content boundary;
- physical installed-PWA offline acceptance passes before V6 certification.

## Rollback

Until the V6 package repository is fully migrated and certified, the V5 opened-pack cache remains the rollback implementation. The new manifest/checksum contracts are additive and do not alter current Reader fetch behavior by themselves.
