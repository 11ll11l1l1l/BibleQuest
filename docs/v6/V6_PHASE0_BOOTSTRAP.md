# BibleQuest V6 Phase 0 Bootstrap Record

Date: 2026-09-18 JST
Integration branch: `v6/architecture-upgrade`

## Frozen baseline

Released V5 production baseline:
`f6a0cff0e63ddf676b77b8470d84678958fe9d70`

Certified V5 runtime/source freeze:
`c0772d458e9d17ab1728c47c568e99857c7d67a1`

The obsolete pre-V5 V6 experiment is preserved at:
`archive/v6-pre-v5-experiment-20260913`

Preserved old V6 commit:
`8a5c09b7e95c0bd2956dac957fa359cc9829b20e`

The active V6 branch was reset to the exact released V5 production baseline before Phase-0 authority was applied. Old experimental V6 commits are not part of the active V6 history.

## Accepted initial ADRs

- ADR-0001 — V6 build/client architecture: ACCEPTED
- ADR-0002 — reproducible Supabase/Postgres database CI: ACCEPTED

## Inherited gate evidence

The Phase-0 local candidate reported green for the inherited static/governance set, including:

- deployment/build gate;
- V6 governance validation;
- PWA/install contracts;
- offline shell and offline Bible contracts;
- assignment authorization;
- shell/Home/Assignments/Calendar contracts;
- English/Tagalog localization contracts;
- active-congregation contracts;
- push lifecycle/persistence;
- glyph inventory;
- V5 state sweep.

Browser automation was not executable in that workspace because Chromium installation did not complete. That environment limitation is not treated as a product failure.

### Bootstrap policy

The missing local Chromium binary does **not** block starting bounded V6 implementation after the static/governance baseline is green. Browser-dependent parity remains mandatory before a runtime tranche is accepted/merged as certified and again before RC promotion. No browser PASS may be claimed without actual evidence.

## Phase-0 domain ownership map

- shell/router/session: application kernel
- congregation/tenant context: application kernel + repository boundary
- Bible Reader/content/offline: Reader engine
- Games: Games engine
- media: Media engine
- notifications/push/offline delivery: Notification engine
- ministry/admin: role-aware repositories + server-authoritative backend
- assignments/linked activities/calendar: domain repositories using explicit tenant context
- PWA/service worker/storage: PWA/offline platform with versioned contracts

Cross-cutting changes to auth, RLS, global routing, service-worker architecture or offline conflict policy require ADR/captain review. Bounded implementation around accepted contracts may proceed.

## Phase-0 exit

Phase 0 is considered complete when this authority/ADR state exists on the remote integration branch and the branch still descends from the exact released V5 baseline.

Phase 1 implementation may begin immediately after that condition is true.
