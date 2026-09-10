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

- First #81 exact candidate `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`, run `34472943815`: the exact SHA assertion and all earlier accumulated architecture validators passed, but the new Psychometrics validator required two safety sentences to be duplicated literally inside the UI source even though the UI consumed the centralized `PSYCHOMETRICS_SAFETY` policy owner. Root cause was a validator ownership mistake, not runtime behavior. The validator was corrected to require the centralized safety references instead of duplicated policy text. No runtime behavior or prior acceptance coverage was weakened.
- Corrected exact functional candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`, run `34473640903`: complete accumulated suite green.
- #80 bookkeeping heading failure remains retained in history: candidate `bb5f9d722a3e59c6bc02be985c3614aab76cb330`, run `34471472048`, was rejected because the global architecture guard requires the literal `Next major milestone` heading. The heading was restored without runtime changes.

Earlier milestone defect regressions remain retained in the accumulated suite.

## #82 read-only recovery boundary

#82 Avatar Vault remains Not started until #81 freezes. Its authoritative inventory contract is **browse; select; persist; render fallback**. Retained compatibility evidence must be recovered before product implementation. No Avatar Vault write belongs in the #81 bookkeeping candidate.

## Next major milestone

1. Treat the final #81 bookkeeping/status/handoff transaction on `feature/v3-psychometrics` as a new exact clean candidate.
2. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated architecture, edge/security and browser/mobile suite.
3. If any phase fails, do not freeze; identify the exact root cause, preserve all prior coverage and rerun a corrected exact SHA.
4. If fully green, restore the isolated verifier to manual-only and create immutable `release/v3.54-psychometrics` at exactly the verified bookkeeping SHA.
5. Only after v3.54 is frozen, create `feature/v3-avatar-vault` from that exact release and begin #82 from recovered evidence.
6. #82 must satisfy `browse; select; persist; render fallback` without duplicating storage or shell/avatar ownership.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
