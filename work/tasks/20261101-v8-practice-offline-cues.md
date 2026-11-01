# V8 practice offline preparation and transition cues — 2026-11-01 JST

Continuation of integration PR #1558 from remote candidate `f8ac92ab5753850a305e739f951bc6867d7a07a1` (locally equivalent source). All eleven distinct workflows on that previous candidate PASS. New code below requires its own exact-head evidence.

## Implemented

The existing offline-shell owner already walks the built Vite graph, including lazy practice guide chunks. Reuse its readiness state rather than creating a second guide cache. Practice offline controls now load the existing Bible Reader package manager on demand, show selected-book status, prepare/refresh, cancel and remove its shared managed package. Existing license/download eligibility, checksums, update status, quota and storage behavior remain owned by that manager. Removing a book explicitly affects the Reader too. Loading/error/refresh states explain when guides or Bible text are unavailable; unavailable text is never fabricated or copied to private practice storage.

Preparation is serialized per page. Account changes, cancellation, exit and late responses cannot report stale success or keep old progress visible. A new preparation is not cleared by a previous cancelled operation's final callback. Package download cancellation uses the existing manager. No private notes, account API responses or provider credentials enter shell/package caches.

Transition sound is optional and off by default each visit/account. Explicit user activation resumes a browser AudioContext; a short quiet sine tone plays only on a recent foreground timer transition. No cue is played merely by enabling it, no missed background/resume burst is replayed, and suspended audio does not queue delayed tones. Stop/disable/close paths release sound on pause, hide, owner change and exit; late permission results cannot reactivate a disposed page. No new audio asset/dependency or narrator content is introduced.

## Development validation

Aggregate units 1,662/1,662 PASS: V6 880, V7 773 and media V8 9; existing 31-attempt ledger audit PASS. New tests cover shared-manager delegation, unsupported/checksum-failed downloads, stale-owner progress/result rejection, duplicate/cancel/dispose races, opt-in/suspended/late audio behavior and the actual page controller's foreground-vs-missed-transition behavior. Typecheck, production build, existing lint/format and whitespace checks PASS on local Node 24.22.1.

Built manifest includes `src/features/spiritual-practices/index.js` with the existing `src/v6/reader/browser-packages.ts` dynamic dependency, so shell graph ownership remains explicit. This is source/build evidence, not a physical airplane-mode, device-storage-eviction, audible-speaker or full browser PASS. No production deployment or provider/backend mutation occurred.

## Remaining

Reviewed EN/TL/CEB practice localization, actual offline/device/audio acceptance and closed-app reminder delivery remain open, along with the broader V8 scope. Offline preparation/cue code is now implemented; do not recreate an alternate cache or timer engine. Preserve existing exact-SHA integrated release boundaries.
