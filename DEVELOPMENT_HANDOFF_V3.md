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

## Exact next executable sequence

1. Recover exact old-version #82 contract detail (unlock conditions incl. mastery/region logic, cloud sync retry/failure behavior, guest-vs-account boundary, mobile rendering) from `avatar-vault.js`, the `bible_avatar_cosmetics` schema, and any related tests.
2. Build the smallest clean implementation on `feature/v3-avatar-vault`: single scoring/unlock owner, single lifecycle/persistence owner reusing `session.js`/`store.js`, presentation-only `src/features/avatar-vault/`, reusing `router.js` for navigation — no duplicate storage/shell/avatar ownership.
3. Targeted architecture validator + edge/unit regression + focused browser/mobile regression first.
4. Full functional gate on an isolated `verify/...` branch (checkout + exact-SHA assertion + complete accumulated suite) once targeted checks are green.
5. On green, promote #82 to Verified, do bookkeeping, gate the bookkeeping candidate, then freeze `release/v3.55-avatar-vault`.
6. Only then create the next feature branch and begin #83 Innovation suite.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- No PASS transfer between changed SHAs.
- Normal Actions remain manual-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
