# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #93 Admin Operations complete functional verification and bookkeeping correction.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.63-admin-console`.
- Exact frozen SHA: `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
- v3.63 bookkeeping gate run `34529824942` passed against that exact SHA.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and are never release SHAs.

## Current #93 state

- Active product branch: `feature/v3-admin-operations`.
- Exact green functional candidate: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
- Isolated bookkeeping branch: `work/v3.64-admin-operations-bookkeeping-20260911`, rooted at the exact green functional candidate before bookkeeping changes.
- Initial targeted run `34531083463` exposed a neighboring #92 validator false positive; runtime ownership was not implicated.
- Corrected targeted run `34531492122` exposed only an exact-wording gap in the #93 contract document; runtime enforcement was already present.
- Final targeted exact-SHA run `34531588788` passed #92/#93 architecture, edge/security and browser/mobile checks.
- Complete accumulated exact-SHA functional run `34531751123` passed against candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
- Bookkeeping writer run `34532182063` first confirmed the isolated bookkeeping branch still equaled that functional SHA, then promoted inventory lifecycle values only.
- Initial bookkeeping gate `34532442314` passed its exact-SHA and bookkeeping assertions, then failed in the retained #92 architecture validator because #92 still permanently required #93 to be `Not started`. That lifecycle assertion has been corrected without relaxing #92/#93 ownership separation.
- Current bookkeeping promotes #92 Admin Console to **Regression-tested** and #93 Admin Operations to **Verified**.
- Provisional inventory: **90 Regression-tested / 1 Verified / 0 Implemented / 9 Not started**.
- Provisional strict implemented-or-better parity: **91/100**.
- Provisional regression stability: **90/100**.
- The corrected bookkeeping tip requires its own complete exact-SHA verification before v3.64 can freeze. Do not transfer the functional PASS or failed bookkeeping result to the changed SHA.

## #93 verified boundary

- Session is the only authenticated-user/session owner.
- `src/core/api.js` is the only browser Supabase/network implementation boundary and exposes the #93 `adminOperations` facade.
- `src/app/admin-operations.js` owns Admin Operations authorization projection, operational-data normalization, frontend-health state, refresh/error behavior and Owner-only account-deletion orchestration.
- `src/features/admin-operations/index.js` owns standalone dashboard rendering/filter interaction.
- Existing `supabase/functions/bq-admin-ops/index.ts` remains final server authority; no production deployment or schema change is part of #93.
- Signed-out users make no Admin Operations request.
- Signed-in accounts must pass server-authoritative platform `owner`/`admin` status before dashboard data is accepted.
- Permission denial fails closed and remains distinct from network/runtime failure.
- Dashboard parity covers system health, current presence, assignment/progress aggregates, devotionals/announcements, persistent poll aggregates, curated media and live-room aggregates.
- Privileged client-error user/congregation identifiers are not projected into rendered state; individual poll voter identity is not rendered.
- Owner account deletion belongs to #93 retained parity. Only verified platform Owner state may invoke it; Admin cannot delete, the active Owner cannot delete itself, and the UI requires exact `DELETE <email-or-name>` confirmation.
- The existing backend additionally protects active Owner accounts and outstanding congregation/group ownership, ends target-created active rooms, audits the delete, and performs final Auth deletion.
- #92 Admin Console remains the user/congregation/group administration owner. It only composes #93 deletion onto its existing user cards and does not invoke `bq-admin-ops` directly.
- #94 Reset/recovery remains outside #93.

Permanent #93 evidence:
- `ADMIN_OPERATIONS_V3.md`
- `admin-operations.html`
- `src/app/admin-operations.js`
- `src/app/admin-operations-entry.js`
- `src/features/admin-operations/index.js`
- `src/ui/admin-operations.css`
- `src/core/api.js`
- `supabase/functions/bq-admin-ops/index.ts`
- `scripts/validate-v3-admin-operations.mjs`
- `tests/v3-admin-operations-edge.mjs`
- `tests/v3-admin-operations-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent handling

- Run `34531083463` failed in #92 architecture before #93 edge/browser execution. Root cause: the old #92 API regex scanned from `const adminConsole` through later facades, so a properly separate later `adminOperations` facade falsely looked like #92 ownership of `bq-admin-ops`; a return-list adjacency token also assumed no later facade could be inserted. The permanent correction bounds the #92 facade extraction and checks exported facade membership rather than adjacency. It still rejects `bq-admin-ops` inside #92 service/UI/facade.
- Run `34531492122` then passed #92 but failed the #93 contract validator because the contract expressed self-delete refusal as “signed-in Owner” while the validator required the explicit invariant “active Owner account cannot delete itself.” The document was aligned to the invariant; backend/service behavior was unchanged.
- Run `34531588788` passed the corrected targeted gate against exact candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
- Run `34531751123` passed the complete accumulated architecture, edge/security, and browser/mobile suite against the same exact candidate.
- Run `34532442314` passed bookkeeping assertions but failed the accumulated #92 validator solely because it pinned #93 to `Not started`. The corrected permanent guard accepts any valid #93 lifecycle state after #92 while preserving all #92 ownership and endpoint-separation assertions.

## Next capability boundary

#94 Reset/recovery page remains **Not started** until v3.64 freezes. Recover its retained standalone behavior and current clean reset/backup/recovery ownership before implementation. Do not silently fold #94 into #100 Backup/export/import/reset or into account password/recovery-code workflows; establish the retained boundary first.

## Exact next executable sequence

1. Treat the corrected final #93 bookkeeping tip as a new exact candidate.
2. Confirm `feature/v3-admin-operations` has not moved unexpectedly and reconcile only by safe fast-forward.
3. Create/reset an isolated verifier with a branch-specific temporary `push:` workflow that explicitly checks out and asserts the exact corrected bookkeeping SHA.
4. Validate bookkeeping/inventory/status/timeline values plus the complete accumulated architecture, edge/security and browser/mobile suite.
5. Correct only reproduced failures; never weaken or skip accumulated coverage.
6. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.64-admin-operations` exactly there.
7. Verify release and product refs equal the successful bookkeeping SHA.
8. Create the next feature branch from frozen v3.64 and only then rebuild #94 from recovered evidence.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; temporary push triggers stay isolated; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.
