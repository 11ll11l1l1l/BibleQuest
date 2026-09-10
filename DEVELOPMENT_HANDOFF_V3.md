# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #92 Admin Console complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.62-content-review`.
- Exact frozen SHA: `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`.
- v3.62 bookkeeping gate run `34523117239` passed against that exact SHA.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and are never release SHAs.

## Current #92 state

- Active product branch: `feature/v3-admin-console`.
- Exact green functional candidate: `298ebcdd9b34a9582cbe24c856ec256292acb7a8`.
- Isolated bookkeeping branch: `work/v3.63-admin-console-bookkeeping-20260911`, rooted at the exact green functional candidate.
- Initial full verifier run `34528132854` failed due verifier/workflow infrastructure, not runtime behavior: the temporary verifier had modified product `.github/workflows/v3-regression.yml` with a forbidden `push:` trigger.
- Focused isolated Admin Console run `34528237689` passed.
- Corrected complete accumulated exact-SHA functional run `34528950642` passed against candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8`.
- Current bookkeeping promotes #91 Content Review to **Regression-tested** and #92 Admin Console to **Verified**.
- Provisional inventory: **89 Regression-tested / 1 Verified / 0 Implemented / 10 Not started**.
- Provisional strict implemented-or-better parity: **90/100**.
- Provisional regression stability: **89/100**.
- These bookkeeping values require their own complete exact-SHA verification before v3.63 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #92 verified boundary

- Session is the only authenticated-user/session owner.
- `src/core/api.js` is the only browser Supabase/Edge Function boundary.
- `src/app/admin-console.js` owns Admin Console state, normalization, validation, fail-closed readiness and mutation orchestration.
- `src/features/admin-console/index.js` owns Admin Console rendering and interaction.
- Existing `supabase/functions/bq-admin/index.ts` remains server authorization/mutation authority; no schema or production deployment is part of #92.
- Signed-out users make no admin data calls.
- Signed-in non-Owner/Admin users fail closed before console data is accepted.
- Platform `owner`/`admin` access is verified before reads/mutations are accepted.
- Recovered administration includes user platform access, congregation membership/roles, congregation creation, small-group creation, group membership/roles, and group ownership transfer.
- Successful mutations refresh the normalized Admin Console state.
- Network/runtime failure is distinct from permission denial.
- Password/reset recovery is outside #92.
- #93 Admin Operations is outside #92 and must not be folded into this capability.

Permanent #92 evidence:
- `ADMIN_CONSOLE_V3.md`
- `src/app/admin-console.js`
- `src/app/admin-entry.js`
- `src/features/admin-console/index.js`
- `src/core/api.js`
- `scripts/validate-v3-admin-console.mjs`
- `tests/v3-admin-console-edge.mjs`
- `tests/v3-admin-console-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced verifier defect and permanent handling

- Run `34528132854` failed in accumulated architecture before edge/browser execution.
- Root cause: the verifier temporarily placed `push:` on the product `v3-regression.yml`, violating the repository's manual-only product-workflow contract. The validator correctly rejected it.
- Runtime code was not patched because no runtime defect was reproduced.
- The corrected verifier uses a separate verifier-only workflow with a branch-specific push trigger, explicitly checks out `298ebcdd9b34a9582cbe24c856ec256292acb7a8`, asserts that exact SHA, and leaves product `v3-regression.yml` dispatch-only.
- Corrected complete run `34528950642` passed all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite.

## Next capability boundary recovered read-only

#93 Admin Operations remains **Not started** until v3.63 freezes. Retained `admin-operations.html`, `admin-operations.js`, and `supabase/functions/bq-admin-ops/index.ts` establish a separate Owner/Admin operational dashboard. Its retained dashboard covers system health/client errors, online presence, recent assignments/progress, devotionals/announcements, persistent polls, curated media, and live rooms. `bq-admin-ops` performs server-side Owner/Admin authorization. Do not implement #93 until #92 bookkeeping has passed and v3.63 is frozen.

## Exact next executable sequence

1. Finish #92 bookkeeping on `work/v3.63-admin-console-bookkeeping-20260911`.
2. Treat the final clean bookkeeping tip as the new exact candidate.
3. Confirm `feature/v3-admin-console` still equals functional candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8`; if unchanged, fast-forward it to the bookkeeping candidate.
4. Create an isolated verifier with a branch-specific temporary `push:` workflow that explicitly checks out and asserts the exact bookkeeping SHA.
5. Run bookkeeping/inventory validation plus the complete accumulated architecture, edge/security and browser/mobile suite.
6. Correct only reproduced failures; never weaken or skip accumulated coverage.
7. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.63-admin-console` exactly there.
8. Verify release and product refs equal the successful bookkeeping SHA.
9. Create `feature/v3-admin-operations` from frozen v3.63 and implement #93 from the retained contract without production deployment.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; temporary push triggers stay isolated; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.