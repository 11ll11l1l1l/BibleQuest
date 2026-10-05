# Task: recover ambiguous pair invitation writes

Owner: Lane A
Branch: `lane-a/invitation-recovery-20261005`
Starting SHA: `d470ecd7b3d14e4b150ef36bc4bafeac1c08a113`
Refreshed SHA: `a7a8d94dc556e316b3c38712e7909615c31179df` (concurrent Lane B publication-readiness fix retained)
Status: COMPLETE — implementation and affected local verification; automatic integration follows.

## Scope

An invitation insert can commit while its response is lost. The prior UI discarded member/role choices and had no identity with which to recover that attempt. Preserve a stable invitation UUID for identical in-page retries, insert it using the existing primary key, and read that exact request back through existing participant/tenant RLS after an ambiguous failure. Verify initiator, directed participants, tenant, identity and advanced lifecycle receipts. Never change acceptance/closure during recovery. Preserve failed form choices; clear choices/retry identity on account/congregation change or disposal. No durable client cache, schema, migration, new RPC or production changes.

Owned surfaces: pairing service/repository/controller/page, focused recovery tests, canonical status. Existing invitation RLS, triggers and audit ownership remain authority. Pair-private messaging is an accepted capability-contract dependency and remains unexposed.

## Verification

Eight focused tests: seven fail against an isolated `d470ecd7` baseline; all eight pass after the fix. Combined unit command passes 880 V6 and 291 V7 tests. Build, typecheck, lint, format and diff whitespace pass on Node 24.19.0. New tests cover acknowledgement loss and conflict retries, advanced closed/active state, changed initiator/directed participant/tenant/ID, unreadable or absent records, account/congregation changes, payload column restrictions, stable/changing IDs, overlapping clicks and escaped retained selections.

Pinned CI follows the exact published tree; real-browser/live-data invitation acceptance remains OPEN. Integrate onto the freshly fetched `v7/development`, verify reachability and keep current status evidence honest.
