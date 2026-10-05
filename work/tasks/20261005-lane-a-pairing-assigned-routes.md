# Task: connect pairing lifecycle and assigned lesson routes

Owner: Lane A
Branch: `lane-a/pairing-routes-20261005`
Starting SHA: `bedf18892ace4feb5c2728d0514557bdf21e0083`
Refreshed integration SHA: `04811b38ed1bafc156a4b5cddbd65b3c32eb5042`
Status: COMPLETE — implementation and affected local checks; automatic integration follows.

## Scope

Participant invitation, accept/decline/confirmed end controls using the existing database authorities; shared ratified pair/assigned curriculum/lesson routes; existing Reader passage and exact-step return. Owns pairing service/repository/controller/page, shared routing, small additive Bible parser export, existing runner and Reader seams, localization and focused tests. Uses existing Lane B curriculum and Lane C/D runner/private-response capabilities. Pair-thread backend remains an unresolved accepted contract dependency.

## Execution and evidence

Invitation payloads derive authenticated self and congregation; leader permissions and both active members remain backend-authoritative. Participant/state/timestamp acknowledgements are verified. Controllers suppress overlapping actions and stale results. Assigned hierarchy validates track/module and passes immutable lesson revisions. Reader return restores the validated exact step without a progress write; published reference strings and canonical objects reuse the existing parser. Shared context hydration can reload the protected page without choosing a tenant.

281 V7 tests and 29 affected inherited Reader/router/bootstrap tests pass; build, typecheck, lint, format and whitespace checks pass on Node 24.19.0. Pinned CI remains the toolchain authority. No local Chromium executable; browser/mobile/live-backend acceptance remains OPEN. Generated types and schema are unchanged. Current development authority updated in `V7_ACTIVE_STATUS.md`.

## Handoff

Automatic integration target: `v7/development`, using an exact remotely verified tree and expected head SHA. No deployment or production DDL. Remaining Lane A work: browser/live journey evidence and accepted pair-private capability reconciliation, alongside content review/import phase gates. No V8 work.
