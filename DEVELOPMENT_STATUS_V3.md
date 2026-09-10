# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-personality-profile`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint: `release/v3.52-linked-activities` at `38639bd71ffc0fdc2449f9cba3add59a8b88b4b7`.
- Exact v3.52 bookkeeping verification run: `34469317262`, complete accumulated architecture, edge/security and browser/mobile suite green against the frozen SHA.
- Safety refs remain untouched.

## Current progress represented by the #80 bookkeeping transaction

| State | Count |
|---|---:|
| Regression-tested | 79 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 20 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping transaction is **80/100**.
Official regression stability represented by this bookkeeping transaction is **79/100**.

These values are provisional until the exact final #80 bookkeeping SHA passes a new complete accumulated gate and is frozen. No PASS transfers from the functional SHA to a changed bookkeeping SHA.

Current leading rows:
- #78 Workspace — Regression-tested.
- #79 Linked activities/challenges — Regression-tested because it survived the complete #80 functional suite.
- #80 Personality profile — Verified by exact functional candidate `097f6c7658a5caa9d2a58f8ce93d9f0b22f9b50f` in complete run `34470882834`.
- #81 Psychometrics suite — next non-deferred inventory row after #80 release closure.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #80 Personality Profile — functional gate complete

The milestone is intentionally bounded to the authoritative inventory contract: **complete; save; reopen; privacy boundary**.

Recovered and verified behavior:
- `src/engines/transform.js` remains the sole owner of the current Quick Transform 20-item personality scoring;
- the saved profile uses explicit assessment identifier `bq_quick_transform_ipip20_v1` rather than the stale retained `ipip_big_five_50_v1` wrapper label;
- `src/app/personality-profile.js` owns sanitized profile snapshots and presentation-only hints but does not score the assessment;
- profile snapshots are isolated by local owner (`guest` or the exact signed-in account id), so switching accounts cannot expose another account's saved profile;
- a guest snapshot is never silently promoted into a signed-in account profile;
- the profile stays on-device and uses `privateStorage`, which is excluded from the normal portable BibleQuest backup/export set;
- completing Quick Transform captures the current owner's profile, while resetting personality clears only that owner's profile snapshot;
- malformed saved profile data fails closed rather than being displayed;
- presentation hints cannot alter Scripture, doctrine, permissions, scoring, completion rules or content truth;
- no production schema, migration, RLS, RPC, Edge Function, Cloudflare or other production-system change was introduced;
- #81 Psychometrics Suite remains a distinct later milestone and was not absorbed into #80.

Permanent #80 coverage:
- `PERSONALITY_PROFILE_V3.md` — recovered compatibility, provenance, ownership and privacy contract;
- `scripts/validate-v3-personality-profile.mjs` — architecture/provenance/privacy and milestone-isolation guard;
- `tests/v3-personality-profile-edge.mjs` — valid-result capture, malformed data, guest/account isolation, private-backup exclusion and Transform capture/reset behavior;
- `tests/v3-personality-profile-smoke.mjs` — real 390px profile presentation/navigation/overflow coverage;
- `.github/workflows/v3-regression.yml` invokes all #80 evidence while retaining the complete prior accumulated suite and remains manual-only on the product branch.

Exact functional candidate `097f6c7658a5caa9d2a58f8ce93d9f0b22f9b50f` passed run `34470882834`. The isolated verification workflow explicitly checked out and asserted that exact SHA; accumulated architecture validators, all edge/security regressions and the full browser/mobile regression suite completed successfully.

## Defect / root-cause ledger

No #80 runtime defect was reproduced during the exact functional gate. The first #80 functional candidate passed the complete accumulated suite without weakening prior regression coverage.

- Bookkeeping candidate `bb5f9d722a3e59c6bc02be985c3614aab76cb330`, run `34471472048`: exact SHA assertion passed, but the global architecture validator rejected a documentation heading rename because `DEVELOPMENT_STATUS_V3.md` must retain the literal `Next major milestone` queue heading. Root cause was bookkeeping wording only. The required heading was restored; runtime code and all #80 acceptance tests remain unchanged.

Earlier milestone defect regressions remain retained in the accumulated suite, including #79's central-Router navigation ownership correction and stale Assignments future-state validator correction.

## #81 recovery already established read-only

The retained Psychometrics Lab is a separate comprehensive suite and must not be conflated with the Quick Transform profile. Recovered retained components include:
- IPIP-NEO-120: five broad domains, 30 facets, four items per facet, reverse-key scoring, raw 1–5 means and response-quality checks;
- IPIP-VIA-R: 96 items across 24 character-strength constructs, two positive and two negative-keyed items per construct;
- Rosenberg Self-Esteem Scale: 10 items and 0–30 scoring;
- local persistence/resume and mobile standalone presentation;
- explicit warnings that psychological results are not diagnosis, employment selection, moral worth, salvation, doctrine or spiritual maturity.

Migration risks already identified for #81:
- historical NEO Openness/Values items include political/relativism wording and must not be presented as political, theological or moral correctness;
- the VIA Spirituality/Religiousness construct is psychological self-report and must not become a faith or salvation score;
- Scripture reflection material must remain downstream interpretation, never part of psychometric scoring;
- legacy global `window.BQ_*` ownership and direct `localStorage` writes should not be copied into v3.

No #81 product write should occur until #80 is frozen.

## Next major milestone

1. Treat the final #80 bookkeeping/status transaction on `feature/v3-personality-profile` as a new exact clean candidate.
2. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated architecture, edge/security and browser/mobile suite.
3. If any phase fails, do not freeze; identify the exact root cause, preserve all prior coverage and rerun a corrected exact SHA.
4. If fully green, create immutable `release/v3.53-personality-profile` at that exact green bookkeeping SHA and close #80 as completed.
5. Only after v3.53 is frozen, create `feature/v3-psychometrics` from that exact release SHA and begin #81 write work from the recovered standalone evidence.
6. #81 must satisfy `complete assessment; result; persistence; mobile` without duplicating Quick Transform/Profile ownership or importing legacy globals.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
