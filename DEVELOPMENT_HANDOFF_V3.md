# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST during manual #80 development.

GitHub live refs and exact executed verification evidence are authoritative.

## Immutable / frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.52-linked-activities` at `38639bd71ffc0fdc2449f9cba3add59a8b88b4b7`.
- Exact v3.52 bookkeeping verification run: `34469317262` — complete accumulated architecture, edge/security and browser/mobile suite green against that exact SHA.
- Production v2, `main`, production Supabase and production Cloudflare remain untouched.
- BibleQuest autonomous A1–A5 scheduled agents remain paused; current work is manual.
- Normal v3 Actions remain `workflow_dispatch` only. Temporary `push:` triggers belong only to isolated verification branches and are restored afterward.

## #80 Personality Profile functional state

- Active branch: `feature/v3-personality-profile`.
- Frozen base: `release/v3.52-linked-activities` at `38639bd71ffc0fdc2449f9cba3add59a8b88b4b7`.
- Exact functional candidate: `097f6c7658a5caa9d2a58f8ce93d9f0b22f9b50f`.
- Exact functional verification run: `34470882834` — completed `success`.
- The isolated verifier explicitly checked out and asserted `097f6c7658a5caa9d2a58f8ce93d9f0b22f9b50f` before executing the suite.
- Accumulated architecture validators: green.
- Accumulated edge/security regressions: green.
- Complete Playwright/browser-mobile regressions: green.
- The isolated functional verification workflow has been restored to manual-only.

## #80 verified functional boundary

The recovered contract is exactly the inventory requirement **complete; save; reopen; privacy boundary**.

- `src/engines/transform.js` remains the single Quick Transform personality scoring owner.
- #80 identifies that assessment as `bq_quick_transform_ipip20_v1`; it does not reuse the stale retained 50-item label.
- `src/app/personality-profile.js` owns only validated/sanitized profile snapshots and presentation hints.
- `src/app/transform.js` delegates capture and clear to the profile owner after Transform completion/reset.
- `src/core/storage.js` owns persistence; #80 private profile keys are excluded from portable backup/export.
- Guest and signed-in account profiles are separate local owners; account switching cannot reveal another owner's profile.
- Guest data is not auto-promoted to a signed-in user.
- #80 does not claim cloud synchronization or modify production Supabase.
- Presentation hints cannot change Scripture, doctrine, scoring, permissions, completion rules or content truth.
- #81 Psychometrics remains separate.

Permanent #80 evidence:
- `PERSONALITY_PROFILE_V3.md`;
- `scripts/validate-v3-personality-profile.mjs`;
- `tests/v3-personality-profile-edge.mjs`;
- `tests/v3-personality-profile-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Bookkeeping transaction prepared

The feature branch now represents provisionally:
- #79 Linked activities/challenges — **Regression-tested**, because the complete #80 functional suite retained it green;
- #80 Personality profile — **Verified**;
- **79 Regression-tested, 1 Verified, 0 Implemented, 20 Not started**;
- strict implemented-or-better parity **80/100**;
- regression stability **79/100**.

These values are not final until the exact tip after bookkeeping/status/handoff changes passes a new complete accumulated workflow. The functional green run is evidence only for its exact functional SHA and cannot be transferred to a changed bookkeeping SHA.

## #81 read-only recovery

The retained standalone Psychometrics Lab contains three distinct assessments:
- IPIP-NEO-120 — five domains, 30 facets, 120 total items, reverse-key scoring, raw 1–5 means and response-quality checks;
- IPIP-VIA-R — 24 constructs, 96 items, two positively and two negatively keyed items per construct;
- Rosenberg Self-Esteem Scale — 10 items, retained 0–30 score calculation.

The inventory requirement for #81 is **complete assessment; result; persistence; mobile**.

Migration safeguards already established:
- keep #81 separate from the Quick Transform/Profile owners;
- do not copy legacy `window.BQ_*` globals or direct `localStorage` ownership;
- psychological scores are descriptive self-report, not diagnosis, moral worth, employment fitness, doctrine, salvation or spiritual maturity;
- historical political/relativism wording in the NEO Values/Openness facet must not be interpreted as political or theological correctness;
- VIA Spirituality/Religiousness remains a psychological construct, not a faith score;
- any Scripture reflection is downstream of scoring and must never modify psychometric calculation;
- no #81 product writes until v3.53 is frozen.

## Exact next executable sequence

1. Treat the current final tip of `feature/v3-personality-profile` as the #80 bookkeeping candidate after confirming no concurrent branch advancement.
2. Create an isolated one-shot bookkeeping verifier from that exact SHA.
3. Temporarily add only the push trigger plus explicit exact-SHA checkout/assertion; preserve the product workflow's accumulated test lists exactly.
4. Execute the complete architecture, edge/security and browser/mobile suite.
5. On failure, identify and correct the reproduced root cause, then verify a new exact SHA. Do not weaken prior tests.
6. On full green, restore the isolated verifier to manual-only and create immutable `release/v3.53-personality-profile` at exactly the verified bookkeeping SHA.
7. Create `feature/v3-psychometrics` from v3.53 and begin #81 rebuild-and-verify.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- No PASS transfer between changed SHAs.
- Normal Actions remain manual-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
