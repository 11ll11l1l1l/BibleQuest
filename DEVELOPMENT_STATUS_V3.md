# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #93 Admin Operations complete functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.63-admin-console` at `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
- v3.63 bookkeeping gate run `34529824942` passed against that exact SHA.
- Active product milestone branch: `feature/v3-admin-operations`.
- Exact green #93 functional candidate: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
- Bookkeeping is isolated on `work/v3.64-admin-operations-bookkeeping-20260911`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are never release SHAs.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 90 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 9 |
| Total | 100 |

Strict implemented-or-better parity is **91/100**. Regression stability is **90/100**.

- #92 Admin console — **Regression-tested** after surviving #93's complete accumulated functional suite.
- #93 Admin operations — **Verified** at exact functional candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
- #94 Reset/recovery page — **Not started** and is the next dependency-safe milestone after v3.64 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are bookkeeping changes and are not frozen until the final bookkeeping SHA passes its own complete accumulated exact-SHA gate. No PASS transfers from the functional candidate after documentation changes.

## #93 verified functional boundary

Admin Operations rebuilds the retained Ministry Operations dashboard and Owner account-deletion control as a separate capability from #92 Admin Console. Retained repository history introduced `bq-admin-ops` and Owner deletion together, so deletion is parity restoration rather than a new feature.

Session remains the only authenticated-user owner. `src/core/api.js` remains the only browser Supabase/network implementation boundary and owns the `adminOperations` facade. `src/app/admin-operations.js` owns fail-closed Owner/Admin authorization, operational dashboard normalization, frontend-health projection, refresh/error state, and Owner-only deletion orchestration. `src/features/admin-operations/index.js` owns standalone rendering/filter interaction. Existing `supabase/functions/bq-admin-ops/index.ts` remains final server authority.

The recovered dashboard covers system health, current online presence, assignment/progress aggregates, devotionals/announcements, persistent poll aggregates, curated media, and live-room aggregates. Privileged client-error user/congregation identifiers are not projected into the UI, and individual poll voter identity is not rendered. Signed-out state performs no privileged request; permission denial is distinct from network/runtime failure.

Owner account deletion is composed into #92's existing user cards but remains owned by #93. Only a verified platform Owner can request deletion; the active Owner cannot delete itself; the destructive request requires the exact `DELETE <email-or-name>` phrase. Server authority additionally rejects another active Owner, refuses deletion while congregation or active small-group ownership remains, ends active rooms created by the target, records an audit event, and performs final Auth deletion.

#94 Reset/recovery remains explicitly outside #93. No production function deployment, migration, production data mutation, Cloudflare change, or `main` change is part of #93.

Permanent #93 evidence includes `ADMIN_OPERATIONS_V3.md`, `admin-operations.html`, `src/app/admin-operations.js`, `src/app/admin-operations-entry.js`, `src/features/admin-operations/index.js`, `src/ui/admin-operations.css`, central `src/core/api.js`, retained `supabase/functions/bq-admin-ops/index.ts`, `scripts/validate-v3-admin-operations.mjs`, `tests/v3-admin-operations-edge.mjs`, `tests/v3-admin-operations-smoke.mjs`, and accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #92 bookkeeping gate run `34529824942`: **success** against exact SHA `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`; `release/v3.63-admin-console` is frozen at that SHA.
- Initial #93 targeted run `34531083463`: **failed in the neighboring #92 architecture guard before #93 edge/browser execution**. Root cause was a validator false positive: the old #92 regex scanned from `const adminConsole` through all later API declarations and therefore misclassified the newly separate later `adminOperations` facade as #92 absorption; an exact adjacency assertion in the shared API return list also rejected insertion of any later facade. Runtime ownership was not implicated.
- The #92 guard was corrected without weakening the boundary: it now extracts only the bounded `adminConsole` facade for the `bq-admin-ops` exclusion and validates required returned facades by name rather than adjacency.
- Corrected #93 targeted run `34531492122`: **failed only in the #93 contract validator** because `ADMIN_OPERATIONS_V3.md` said the signed-in Owner cannot delete itself but did not contain the validator's exact invariant wording, `active Owner account cannot delete itself`. Backend and service enforcement were already present. The contract wording was aligned; runtime code was unchanged.
- Final targeted #93 run `34531588788`: **success** against exact candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`; neighboring #92/#93 architecture, edge/security and browser/mobile checks passed.
- Complete accumulated #93 functional run `34531751123`: **success** against the same exact candidate; exact-SHA assertion, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite passed.
- Bookkeeping writer run `34532182063`: **success** after first asserting `work/v3.64-admin-operations-bookkeeping-20260911` still equaled exact green functional SHA `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`; it changed inventory lifecycle values only.

## Next major milestone

1. Finish #93 bookkeeping files on `work/v3.64-admin-operations-bookkeeping-20260911`.
2. Treat the final clean bookkeeping tip as a new exact candidate; do not transfer run `34531751123` to that changed SHA.
3. Confirm `feature/v3-admin-operations` still equals exact green functional candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`; if unchanged, fast-forward it to the final bookkeeping SHA.
4. Create an isolated one-shot bookkeeping verifier with branch-specific `push:` and explicit checkout/assertion of the exact bookkeeping SHA.
5. Validate inventory/status chronology, then run the complete accumulated architecture, edge/security, and browser/mobile suites.
6. Correct only reproduced failures; do not weaken or skip accumulated coverage.
7. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.64-admin-operations` exactly there.
8. Verify release and product refs equal the successful bookkeeping SHA.
9. Only then create the next feature branch from v3.64 and recover #94 Reset/recovery before implementation.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.
