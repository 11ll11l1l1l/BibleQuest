# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST during manual #81 development.

GitHub live refs and exact executed verification evidence are authoritative.

## Immutable / frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Exact v3.53 bookkeeping verification run: `34471685908` — complete accumulated architecture, edge/security and browser/mobile suite green against that exact SHA.
- Production v2, `main`, production Supabase and production Cloudflare remain untouched.
- BibleQuest autonomous A1–A5 scheduled agents remain paused; current work is manual.
- Normal v3 Actions remain `workflow_dispatch` only. Temporary `push:` triggers belong only to isolated verification branches and are restored afterward.

## #81 Psychometrics exact functional state

- Active branch: `feature/v3-psychometrics`.
- Frozen base: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Exact green functional candidate: `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`.
- Exact functional verification run: `34473640903` — completed `success`.
- The isolated verifier explicitly checked out and asserted the exact candidate before executing the complete suite.
- Accumulated architecture validators, edge/security regressions and complete Playwright/browser-mobile regressions were green.
- The isolated functional verification workflow was restored to manual-only.

## #81 verified functional boundary

The recovered contract is exactly **complete assessment; result; persistence; mobile**.

- static Psychometrics item/source/safety data owns no storage, DOM, backend or progress behavior;
- `src/engines/psychometrics.js` is the sole #81 scoring/normalization owner;
- `src/app/psychometrics.js` owns assessment lifecycle and owner-scoped persistence through `privateStorage`;
- `src/features/psychometrics/index.js` is presentation/event forwarding only;
- `src/app/router.js` remains navigation/history owner;
- Quick Transform and Personality Profile retain separate existing owners;
- NEO-120, VIA-R-96 and Rosenberg-10 retain deterministic reverse-keyed scoring and exact item-count contracts;
- guest/account states are isolated and private/non-portable;
- political/relativism wording, Spirituality/Religiousness and Depression facet names cannot become political, doctrinal, salvation, morality or diagnostic scores;
- no XP, progress, leaderboard, assignment, congregation, Scripture or permission authority is derived from psychometric results;
- no schema, migration, RLS, RPC, Edge Function, production Supabase or production Cloudflare change was introduced.

Permanent #81 evidence:
- `PSYCHOMETRICS_V3.md`;
- `scripts/validate-v3-psychometrics.mjs`;
- `tests/v3-psychometrics-edge.mjs`;
- `tests/v3-psychometrics-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause record

- Candidate `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`, run `34472943815`: the new #81 validator incorrectly required duplicated UI safety sentences despite centralized `PSYCHOMETRICS_SAFETY` ownership. The validator was corrected to verify the centralized safety reference; runtime behavior and earlier coverage were not weakened.
- Candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`, run `34473640903`: complete accumulated functional suite green.
- First bookkeeping candidate `7eb305d0998654aeb3bcdc987f65ebd960b22e20`, run `34474359203`: exact SHA assertion passed, but the older #80 Personality Profile validator still hard-coded #81 to remain `Not started`. This stale future-state assertion was reproduced only after #81 legitimately became Verified. The #80 validator now accepts #81's normal lifecycle states; the dedicated #81 validator remains authoritative. Runtime code and #81 acceptance coverage were unchanged. The failed verifier was restored to manual-only.

## Bookkeeping transaction: confirmed final

Bookkeeping candidate `cc591aac786a91183eb5a7a5ad958ae7314a9577` (tip of `feature/v3-psychometrics`) passed isolated verifier `verify/v3.54-psychometrics-bookkeeping-cc591-20260910`, run `34474642839` — exact-SHA assertion, complete accumulated architecture validators, edge/security regressions and browser/mobile regressions all green. Verifier restored to manual-only.

- #80 Personality profile — **Regression-tested**;
- #81 Psychometrics suite — **Verified**;
- **80 Regression-tested, 1 Verified, 0 Implemented, 19 Not started**;
- strict implemented-or-better parity **81/100**;
- regression stability **80/100**.

`release/v3.54-psychometrics` is frozen at exactly `cc591aac786a91183eb5a7a5ad958ae7314a9577`. This is now final.

## #82 next boundary

#82 Avatar Vault: Not started, now the active milestone. `feature/v3-avatar-vault` created from `release/v3.54-psychometrics` (currently identical, no #82 commits yet). Its authoritative contract is **browse; select; persist; render fallback**.

Legacy contract recovered from `avatar-vault.js` (main, reference only — legacy `window.BQ*`, not valid v3 shape): 15 metric-gated cosmetic styles; selection in `localStorage` with optional Supabase sync to `bible_avatar_cosmetics` / `bible_congregation_members`; avatar-render patch overlay for the cosmetic glyph.

Existing v3 owners to reuse: `src/app/session.js`, `src/app/store.js` (owner-scoped `privateStorage`), `src/app/router.js`; `src/app/personality-profile.js` + `src/features/personality-profile/` is the closest existing select/persist/render pattern.

## #82 bookkeeping transaction prepared

Exact functional candidate `37f1dc671804a1bb67ede2e5104002160b24c9dd` passed isolated verifier `verify/v3.55-avatar-vault-functional-58982-20260910`, run `34483151962` (exact-SHA assertion + complete accumulated architecture/edge/browser-mobile suite, including the new `AVATAR_VAULT_V3.md`, `scripts/validate-v3-avatar-vault.mjs`, `tests/v3-avatar-vault-edge.mjs`, `tests/v3-avatar-vault-smoke.mjs`). Verifier restored to manual-only.

Committed for #82: `supabase/migrations/20260910_avatar_vault_visibility.sql` (completes a pre-existing gap: the `avatar` column on `bible_congregation_members` was granted column privileges in an earlier migration but never created, and had no RLS UPDATE policy), `src/engines/avatar-vault.js`, `src/app/avatar-vault.js`, `src/features/avatar-vault/index.js`, `src/core/api.js` (`avatarVault.load/save`, leaderboard directory now selects `avatar`), `src/app/leaderboards.js` (renders equipped cosmetic on ranked rows), `src/app/bootstrap.js` + Grow page wiring, plus the #81 validator's stale #82-must-stay-Not-started assertion was narrowed (same defect class already documented for #80/#81).

v1 scope decision (recorded in `AVATAR_VAULT_V3.md`, not silent): only 5 of 15 legacy styles are unlock-evaluable in v1 (xp/streak-gated via Progress); the other 10 are catalogued with `available:false` and a `needsOwner` tag pending metric owners (question counts, recall reps, couples, community, assignments, Journey mastery) that don't exist in v3 yet. Follow-up sub-milestone, not #83 scope.

- #80 Personality profile — **Regression-tested**;
- #81 Psychometrics suite — **Regression-tested** (survived #82's accumulated suite);
- #82 Avatar Vault — **Verified**;
- **80 Regression-tested, 1 Verified, 0 Implemented, 18 Not started**;
- strict implemented-or-better parity **82/100**;
- regression stability **81/100**.

These values are not final until the corrected exact bookkeeping tip passes its own complete accumulated workflow. No PASS transfers from an earlier SHA.

## #83 next boundary

#83 Innovation suite remains Not started. Its authoritative contract is **inventory-specific workflows documented before migration**. No #83 product write belongs before v3.55 freezes.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-avatar-vault` after this bookkeeping transaction; reconcile concurrent movement before further writes.
2. Treat that exact tip as a new #82 bookkeeping candidate.
3. Create an isolated verifier from that exact SHA with only a temporary push trigger plus exact checkout/assertion.
4. Execute the complete accumulated architecture, edge/security and browser/mobile suite.
5. On any failure, correct only the reproduced cause and verify another exact SHA without weakening coverage.
6. On full green, restore the verifier to manual-only and freeze `release/v3.55-avatar-vault` at exactly the green bookkeeping SHA.
7. Only then create `feature/v3-innovation-suite` from v3.55 and begin #83.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- No PASS transfer between changed SHAs.
- Normal Actions remain manual-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
