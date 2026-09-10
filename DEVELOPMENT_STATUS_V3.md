# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-psychometrics`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Exact v3.53 bookkeeping verification run: `34471685908`, complete accumulated architecture, edge/security and browser/mobile suite green against the frozen SHA.
- Safety refs remain untouched.

## Current progress represented by the #81 bookkeeping transaction

| State | Count |
|---|---:|
| Regression-tested | 80 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 19 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping transaction is **81/100**.
Official regression stability represented by this bookkeeping transaction is **80/100**.

These values are provisional until the exact final #81 bookkeeping SHA passes a new complete accumulated gate and is frozen. No PASS transfers from the functional SHA to a changed bookkeeping SHA.

Current leading rows:
- #79 Linked activities/challenges — Regression-tested.
- #80 Personality profile — Regression-tested because it survived the complete #81 functional suite.
- #81 Psychometrics suite — Verified by exact functional candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5` in complete run `34473640903`.
- #82 Avatar vault — next non-deferred inventory row after #81 release closure.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #81 Psychometrics Suite — functional gate complete

The milestone is bounded to the authoritative inventory contract: **complete assessment; result; persistence; mobile**.

Recovered and verified behavior:
- the deep suite remains separate from Quick Transform and Personality Profile;
- IPIP-NEO-120 uses exactly 120 items across five broad domains and 30 four-item facets, with retained 1–5 reverse-key scoring and raw means;
- IPIP-VIA-R uses exactly 96 items across 24 four-item constructs with retained positive/reverse keying and within-profile ranking;
- Rosenberg Self-Esteem uses exactly 10 items, retained 0–3 responses and 0–30 scoring, without invented universal category cutoffs;
- `src/engines/psychometrics.js` is the sole scoring/normalization owner and remains independent of DOM, router, storage implementation, API and progress;
- `src/app/psychometrics.js` owns assessment lifecycle and owner-scoped persistence through `privateStorage`;
- guest and signed-in account states are isolated on-device and excluded from normal portable backup/export;
- historical political/relativism wording in the NEO Values/Openness facet is explicitly not a verdict on politics, theology or moral correctness;
- VIA Spirituality/Religiousness is explicitly a psychological self-report construct, not salvation, doctrine or Christian-maturity scoring;
- the retained Depression facet is explicitly not a clinical diagnosis;
- no XP, leaderboard, congregation, assignment, Scripture truth, doctrine or permission logic is derived from psychometric scores;
- no production schema, RLS, RPC, Edge Function, Supabase or Cloudflare change was introduced.

Permanent #81 evidence:
- `PSYCHOMETRICS_V3.md`;
- `scripts/validate-v3-psychometrics.mjs`;
- `tests/v3-psychometrics-edge.mjs`;
- `tests/v3-psychometrics-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`, which remains manual-only on the product branch.

Exact functional candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5` passed run `34473640903`. The isolated verification workflow explicitly checked out and asserted that exact SHA; accumulated architecture validators, all edge/security regressions and the full browser/mobile regression suite completed successfully.

## Defect / root-cause ledger

- First #82 bookkeeping candidate `dde924f86f83baf78659f303e442930b38749aca`, run `34483915685`: exact SHA assertion passed, but `scripts/validate-v3-inventory.mjs` failed — `FEATURE_INVENTORY_V3.md`'s `## Current totals` summary header (Regression-tested/Not started counts) was not updated when rows #81/#82 were promoted, so it no longer matched the numbered rows. Root cause was a bookkeeping-doc omission, not runtime behavior. Corrected candidate `b0aa6defc4...` fixes the summary header only (Regression-tested 80→81, Not started 19→18); no row states, runtime code, or other coverage were changed.

- First #81 exact candidate `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`, run `34472943815`: the exact SHA assertion and all earlier accumulated architecture validators passed, but the new Psychometrics validator required two safety sentences to be duplicated literally inside the UI source even though the UI consumed the centralized `PSYCHOMETRICS_SAFETY` policy owner. Root cause was a validator ownership mistake, not runtime behavior. The validator was corrected to require the centralized safety references instead of duplicated policy text. No runtime behavior or prior acceptance coverage was weakened.
- Corrected exact functional candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`, run `34473640903`: complete accumulated suite green.
- First #81 bookkeeping candidate `7eb305d0998654aeb3bcdc987f65ebd960b22e20`, run `34474359203`: exact SHA assertion and all architecture checks through #79 passed, then the older #80 Personality Profile validator rejected #81 because it still hard-coded the future row to remain `Not started`. Root cause was a stale future-state assertion that became invalid only after #81 legitimately advanced to Verified. The #80 validator was narrowed to accept #81's normal lifecycle states while the dedicated #81 validator remains authoritative. No runtime code or #81 acceptance coverage was weakened.
- #80 bookkeeping heading failure remains retained in history: candidate `bb5f9d722a3e59c6bc02be985c3614aab76cb330`, run `34471472048`, was rejected because the global architecture guard requires the literal `Next major milestone` heading. The heading was restored without runtime changes.

Earlier milestone defect regressions remain retained in the accumulated suite.

## #82 read-only recovery boundary

#82 Avatar Vault remains Not started until #81 freezes. Its authoritative inventory contract is **browse; select; persist; render fallback**. Retained compatibility evidence must be recovered before product implementation. No Avatar Vault write belongs in the #81 bookkeeping candidate.

## #81 bookkeeping gate: confirmed complete

Exact bookkeeping candidate `cc591aac786a91183eb5a7a5ad958ae7314a9577`'s isolated verifier (`verify/v3.54-psychometrics-bookkeeping-cc591-20260910`, run `34474642839`) explicitly checked out and asserted that exact SHA, then completed the full accumulated architecture, edge/security and browser/mobile regression suite successfully. The isolated verifier has been restored to manual-only (`workflow_dispatch` only, temporary `push:` trigger removed). `release/v3.54-psychometrics` is frozen at exactly that verified SHA.

Final #81/#82 counts: **80 Regression-tested, 1 Verified (Psychometrics, #81), 0 Implemented, 19 Not started**. Strict implemented-or-better parity **81/100**. Regression stability **80/100**.

`feature/v3-avatar-vault` has been created from `release/v3.54-psychometrics` (currently identical to the frozen SHA; no #82 product commits yet).

## Next major milestone: #82 Avatar Vault

Recovered legacy contract from `avatar-vault.js` (main, reference-only): 15 cosmetic styles gated by metrics (streak/XP/answers/correct/deck/couples/group/assignments/region mastery), selection persisted to `localStorage` plus optional Supabase sync (`bible_avatar_cosmetics`, `bible_congregation_members`), and avatar-render patching for a cosmetic glyph overlay. This is legacy `window.BQ*` reference material only, not a valid v3 implementation shape.

Existing v3 owners identified for reuse (no new ownership to be created): `src/app/session.js` (Session/Auth), `src/app/store.js` (owner-scoped persistence / `privateStorage`), `src/app/router.js` (navigation), with `src/app/personality-profile.js` + `src/features/personality-profile/` as the closest existing select/persist/render pattern to follow.

1. Recover exact old-version contract detail (unlock conditions, cloud sync failure/retry behavior, guest-vs-account boundary, mobile rendering) from `avatar-vault.js`, `bible_avatar_cosmetics` schema, and any related tests before writing code.
2. Build the smallest clean `src/engines/avatar-vault.js` (or equivalent single scoring/unlock owner) plus `src/app/avatar-vault.js` (lifecycle/persistence owner) and `src/features/avatar-vault/` (presentation only), reusing `session.js`/`store.js`/`router.js` — no duplicate storage, shell, or avatar-render ownership.
3. #82 must satisfy `browse; select; persist; render fallback` without duplicating storage or shell/avatar ownership.
4. Targeted validators/tests first; full accumulated gate only once targeted checks are green.

## #82 functional gate: confirmed complete

Exact functional candidate `37f1dc671804a1bb67ede2e5104002160b24c9dd` (tip of `feature/v3-avatar-vault`) passed isolated verifier `verify/v3.55-avatar-vault-functional-58982-20260910`: run `34483151962` (after an earlier reproduced failure on the same branch, run `34482567082`, root-caused and corrected before this candidate). The verifier explicitly checked out and asserted that exact SHA, then the complete accumulated architecture validators, edge/security regressions and browser/mobile Playwright suite (including the new `scripts/validate-v3-avatar-vault.mjs`, `tests/v3-avatar-vault-edge.mjs`, `tests/v3-avatar-vault-smoke.mjs`) all passed. The verifier has been restored to manual-only.

v1 scope, recorded in `AVATAR_VAULT_V3.md`: 5 of 15 legacy styles are unlock-evaluable (xp/streak-gated, sourced from Progress); the remaining 10 are catalogued but `available:false` pending metric owners that don't exist in v3 yet (question-answer/correct counts, recall-deck reps, couples conversations, group sessions, assignment completions, Journey region mastery) — an explicit, documented deferral, not silent breakage.

`FEATURE_INVENTORY_V3.md` now records #82 Verified and #81 Regression-tested (survived #82's accumulated suite). Updated counts: **80 Regression-tested, 1 Verified, 0 Implemented, 18 Not started**; strict parity **82/100**; regression stability **81/100**. These are provisional until the bookkeeping candidate itself passes its own complete accumulated gate — no PASS transfers from this SHA to a different bookkeeping SHA.

## #82 exact next executable sequence

1. Treat this exact #82 bookkeeping/status/handoff transaction as a new clean candidate.
2. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated suite.
3. On green, restore the verifier to manual-only and freeze `release/v3.55-avatar-vault` at exactly that SHA.
4. Only then create `feature/v3-innovation-suite` from v3.55 and begin #83, respecting Kids #38–40 and Japanese furigana #15 as deferred, and the 10 Avatar Vault styles above as an explicit #82 follow-up (not #83 scope).

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
