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
- The isolated verifier explicitly checked out and asserted `5d3446916b8aa809f8a419e3cffa88a312c4bbc5` before executing the complete suite.
- Accumulated architecture validators: green.
- Accumulated edge/security regressions: green.
- Complete Playwright/browser-mobile regressions: green.
- The isolated functional verification workflow has been restored to manual-only.

## #81 verified functional boundary

The recovered contract is exactly **complete assessment; result; persistence; mobile**.

- `src/features/psychometrics/neo-content.js`, `via-content.js` and `content.js` hold retained static item/source/safety data without storage, DOM or backend ownership.
- `src/engines/psychometrics.js` is the sole #81 scoring/normalization owner.
- `src/app/psychometrics.js` owns assessment lifecycle and current-owner persistence through `privateStorage`.
- `src/features/psychometrics/index.js` is presentation/event forwarding only.
- `src/app/router.js` remains the sole navigation/history owner.
- Quick Transform and Personality Profile retain their existing owners and are not relabeled as the deep psychometric suite.
- NEO-120, VIA-R-96 and Rosenberg-10 retain deterministic reverse-keyed scoring and exact item-count contracts.
- guest/account owner states are isolated; private psychometrics data stays on-device and outside normal portable backup/export.
- political/relativism wording, Spirituality/Religiousness and Depression facet names receive explicit interpretation boundaries and cannot become political, doctrinal, salvation, morality or diagnostic scores.
- no XP, progress, leaderboard, assignment, congregation, Scripture or permission authority is derived from psychometric results.
- no schema, migration, RLS, RPC, Edge Function, production Supabase or production Cloudflare change was introduced.

Permanent #81 evidence:
- `PSYCHOMETRICS_V3.md`;
- `scripts/validate-v3-psychometrics.mjs`;
- `tests/v3-psychometrics-edge.mjs`;
- `tests/v3-psychometrics-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause record

- Candidate `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`, run `34472943815`: the new validator incorrectly required duplicated literal safety copy inside the UI even though policy text came from centralized `PSYCHOMETRICS_SAFETY`. The validator was corrected to verify that centralized ownership/reference. Runtime behavior and earlier coverage were not weakened.
- Candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`, run `34473640903`: complete accumulated exact-SHA suite green.

## Bookkeeping transaction prepared

The feature branch now represents provisionally:
- #80 Personality profile — **Regression-tested**, because the complete #81 suite retained it green;
- #81 Psychometrics suite — **Verified**;
- **80 Regression-tested, 1 Verified, 0 Implemented, 19 Not started**;
- strict implemented-or-better parity **81/100**;
- regression stability **80/100**.

These values are not final until the exact final bookkeeping tip passes a new complete accumulated workflow. The functional green run cannot be transferred to changed bookkeeping commits.

## #82 next boundary

#82 Avatar Vault remains Not started. Its authoritative contract is **browse; select; persist; render fallback**. Before implementation, recover retained v2 files/assets and determine the existing avatar rendering/storage owner. Do not copy legacy globals or direct storage ownership merely to reproduce the old surface.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-psychometrics` after all bookkeeping/status/handoff/contract writes and reconcile any concurrent movement before further writes.
2. Treat that exact tip as the #81 bookkeeping candidate.
3. Create an isolated one-shot verifier from that exact SHA.
4. Temporarily add only the verifier push trigger plus exact-SHA checkout/assertion; preserve the full accumulated suite.
5. Execute complete architecture, edge/security and browser/mobile regressions.
6. On failure, identify and correct only the reproduced root cause, then verify a new exact SHA without weakening coverage.
7. On full green, restore the verifier to manual-only and create immutable `release/v3.54-psychometrics` at exactly the green bookkeeping SHA.
8. Only then create `feature/v3-avatar-vault` from v3.54 and begin #82 implementation.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- No PASS transfer between changed SHAs.
- Normal Actions remain manual-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
