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

## Bookkeeping transaction prepared

The feature branch represents provisionally:
- #80 Personality profile — **Regression-tested**;
- #81 Psychometrics suite — **Verified**;
- **80 Regression-tested, 1 Verified, 0 Implemented, 19 Not started**;
- strict implemented-or-better parity **81/100**;
- regression stability **80/100**.

These values are not final until the corrected exact bookkeeping tip passes a new complete accumulated workflow. No PASS transfers from an earlier SHA.

## #82 next boundary

#82 Avatar Vault remains Not started. Its authoritative contract is **browse; select; persist; render fallback**. Retained v2 files/assets and current avatar/storage/rendering ownership must be recovered before implementation. No #82 product write belongs before v3.54 freezes.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-psychometrics` after the stale-validator correction and audit-doc updates; reconcile concurrent movement before further writes.
2. Treat that exact tip as a new #81 bookkeeping candidate.
3. Create an isolated verifier from that exact SHA with only a temporary push trigger plus exact checkout/assertion.
4. Execute the complete accumulated architecture, edge/security and browser/mobile suite.
5. On any failure, correct only the reproduced cause and verify another exact SHA without weakening coverage.
6. On full green, restore the verifier to manual-only and freeze `release/v3.54-psychometrics` at exactly the green bookkeeping SHA.
7. Only then create `feature/v3-avatar-vault` from v3.54 and begin #82.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- No PASS transfer between changed SHAs.
- Normal Actions remain manual-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
