# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #92 Admin Console complete functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.62-content-review` at `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`.
- Active product milestone branch: `feature/v3-admin-console`.
- Exact green #92 functional candidate: `298ebcdd9b34a9582cbe24c856ec256292acb7a8`.
- Bookkeeping is isolated on `work/v3.63-admin-console-bookkeeping-20260911`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are never release SHAs.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 89 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 10 |
| Total | 100 |

Strict implemented-or-better parity is **90/100**. Regression stability is **89/100**.

- #91 Content Review workbench — **Regression-tested** after surviving #92's complete accumulated functional suite.
- #92 Admin console — **Verified** at exact functional candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8`.
- #93 Admin operations — **Not started** and is the next dependency-safe milestone after v3.63 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are bookkeeping changes and are not frozen until the final bookkeeping SHA passes its own complete accumulated exact-SHA gate. No PASS transfers from the functional candidate after documentation changes.

## #92 verified functional boundary

Admin Console is a platform Owner/Admin administration surface rebuilt against retained `admin.html` / `admin.js` behavior and the existing server-authoritative `bq-admin` Edge Function contract.

Session remains the only authenticated-user owner. `src/core/api.js` remains the only browser Supabase/Edge Function boundary. `src/app/admin-console.js` owns admin state, normalization, validation, fail-closed readiness and mutation orchestration. `src/features/admin-console/index.js` owns rendering/interaction. The existing `bq-admin` backend remains the final authority for authorization and conflict protection.

The recovered scope includes platform user access, congregation membership and ministry roles, congregation creation, small-group creation, group membership/roles, and group ownership transfer. Signed-out users make no admin reads. Signed-in non-Owner/Admin users fail closed. Mutations require verified ready Owner/Admin state and refresh normalized console data after success. Network/runtime failures remain distinct from permission denial.

#93 Admin Operations is explicitly excluded from #92. Its retained `bq-admin-ops` surface covers operational health, online presence, assignments, devotionals/announcements, polls, curated media and live rooms. Password/reset recovery also remains outside #92.

Permanent #92 evidence includes `ADMIN_CONSOLE_V3.md`, `src/app/admin-console.js`, `src/app/admin-entry.js`, `src/features/admin-console/index.js`, central `src/core/api.js`, `scripts/validate-v3-admin-console.mjs`, `tests/v3-admin-console-edge.mjs`, `tests/v3-admin-console-smoke.mjs`, and accumulated invocation in `.github/workflows/v3-regression.yml`.

## Verification and defect ledger

- #91 bookkeeping gate run `34523117239`: **success** against exact SHA `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`; v3.62 is frozen at that SHA.
- Initial #92 full-gate run `34528132854`: **failed before product regressions**. Root cause was verifier infrastructure: a temporary `push:` trigger had been added to the product `.github/workflows/v3-regression.yml`, correctly rejected by the workflow-contract/Admin Console validator. This was not a runtime defect.
- Focused isolated #92 run `34528237689`: **success** for Admin Console architecture, edge and browser/mobile checks.
- The verifier was corrected by keeping product `v3-regression.yml` dispatch-only and putting the temporary push trigger in a separate verifier-only workflow that explicitly checks out the clean product candidate.
- Complete accumulated #92 functional run `34528950642`: **success** against exact candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8`; exact-SHA assertion, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite passed.

## Current gate and next sequence

1. Finish #92 bookkeeping on `work/v3.63-admin-console-bookkeeping-20260911`.
2. Treat the final clean bookkeeping tip as a new exact candidate.
3. If `feature/v3-admin-console` still equals the green functional candidate, fast-forward it to that bookkeeping SHA.
4. Create an isolated one-shot bookkeeping verifier with branch-specific `push:` and explicit checkout/assertion of the exact bookkeeping SHA.
5. Run complete inventory/status, architecture, edge/security, and browser/mobile verification.
6. Correct only reproduced failures; do not weaken accumulated coverage.
7. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.63-admin-console` exactly there.
8. Verify the release ref, then create the next feature branch from v3.63 and begin #93 Admin Operations from recovered retained contracts.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.