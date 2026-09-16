# BibleQuest V5 Media Architecture Ownership

Updated: 2026-09-16 JST
Scope: V5 current-architecture overlay for media ownership

This document is the V5-specific authority for the Media/Recordings ownership change completed by the Media Library retirement tranche. Where the historical `ARCHITECTURE_V3.md` active-owner list still describes the former duplicate Media Library orchestration owner, this V5 overlay supersedes that historical entry for V5.

## Canonical V5 ownership

- `src/app/recordings.js` is the sole V5 Recordings/media playback orchestration owner.
- `src/features/recordings/index.js` is the live Recordings/Videos presentation owner.
- Both the `recordings` route and the retained `media` route alias resolve to the existing Recordings page.
- `src/app/audio.js` remains the sole embedded-player lifecycle owner.
- `src/core/api.js` remains the remote media-data boundary.

## Retired duplicate owners

The following abandoned duplicate owners are intentionally absent from V5 source and must not be restored:

- `src/app/media-library.js`
- `src/features/media-library/index.js`

The retirement does not remove the user-facing `media` route. It removes only duplicate orchestration/presentation ownership; the route continues through Recordings.

## Validator and regression contract

`scripts/validate-v3-architecture.mjs` no longer requires or enforces a `createMediaLibraryService` owner. `tests/v5-media-library-retirement.test.mjs` is the focused V5 contract that verifies the retired files remain absent and the live `media` alias remains bound to Recordings.

The retirement workflow must watch this V5 ownership document, the architecture validator, the retirement contract, and the live composition files so a future edit cannot silently reintroduce conflicting ownership.

## Scope firewall

This reconciliation introduces no replacement media platform, ingestion daemon, generalized search/index layer, new backend/API, schema/RLS change, router rewrite, or V6/V7 architecture. It documents and protects the already-accepted V5 current-architecture owner boundary.