# BibleQuest V5 Certification Reconciliation — Pass 3 — 2026-09-16

Reconciliation base: `1f74a64e59e9ed35a4168949ef31e673898e1963` (`v5/feature-completion`)

Purpose: promote only acceptance items proven by the merged exact-current-head evidence pack #392. No BACKEND-E2E or DEVICE/FIELD requirement is downgraded.

## Executive result

Pass 2 formal acceptance: **63/122 = 51.6%**.

Pass 3 supports **5 additional promotions**:

- Phase 1 Leader Center role-access gate: +1
- Phase 6 visible congregation switcher: +1
- Phase 6 Calendar active-congregation behavior: +1
- Calendar duplicate active-congregation acceptance item: +1
- P1 My Journey private/noncompetitive history: +1

Reconciled total: **68/122 = 55.7% formally accepted**.

## Exact-current-head evidence

PR #392 was created from integration `269a9679725cef973e47aa83025a187f3f774f2d` and merged as `1f74a64e59e9ed35a4168949ef31e673898e1963`.

Final exact PR head: `8e6bf5246267595691ad37068faece27353811d0`.

The first execution correctly surfaced a test-harness incompatibility in `tests/v5-my-journey-smoke.mjs`: the Playwright `page.evaluate` call supplied two arguments. The repair changed only the harness to pass one object argument. No product runtime was changed.

Final exact-head evidence:

- `V5 current-head evidence pack` run `35035310862`: **SUCCESS**.
- `BibleQuest V5 collision guard` run `35035310861`: **SUCCESS**.
- `BibleQuest V5 Section G state sweep` run `35035310881`: **SUCCESS**.

The evidence pack successfully executed:

- Leader Center static role contracts.
- Leader Center Chromium proof: ordinary member denied, authorized leader allowed, 390px mobile-safe behavior.
- Active-congregation selection and visible-switcher static contracts.
- Visible congregation switching Chromium proof at 390px.
- Calendar active-congregation contract proving Calendar consumes the active congregation rather than `memberships[0]`.
- Calendar month-grid Chromium proof including 42-day horizon, navigation, day selection, category cues, 390px overflow/touch-target checks.
- My Journey static/edge contracts proving existing-owner composition, meaningful/private history only, and absence of ranking/leaderboard/percentile/comparison output.
- My Journey Chromium proof for English, Tagalog, empty state, and 390px mobile behavior.
- Exact/source-clean verification.

## A. Phase 1 — Leader Center

Promote only:

- `[x] Ordinary member denied and authorized leader allowed on current candidate using real browser evidence.`

Do **not** promote the other five Leader Center requirements. Current implementation/evidence does not yet satisfy the accepted member-count, completed/review destination, People privacy-safe directory, or Groups & Teams composition requirements in full.

## F. Phase 6 — multi-congregation

Promote:

- `[x] Visible switcher exists for users with multiple memberships and has current-candidate acceptance evidence.`
- `[x] Calendar respects active congregation with dedicated/current-candidate acceptance evidence.`

Still open:

- controlled second test congregation or equivalent isolated topology;
- real Gate C cross-congregation isolation execution.

Those remain **BACKEND-E2E/DEVICE-FIELD** work and are not satisfied by browser/static evidence.

## J. P0 — real Calendar

Promote:

- `[x] Active-congregation filtering has dedicated/current-candidate Phase 6 acceptance evidence.`

The same exact-current-head Calendar contract and browser evidence supports this duplicate product acceptance item.

## N. P1 — content depth

Promote:

- `[x] My Journey/reflection history presents existing private signals only; no competitive spiritual leaderboard.`

Evidence confirms My Journey composes the existing Progress and Assignments owners, filters non-meaningful events, exposes no ranking/comparison fields, localizes EN/TL presentation, renders a real empty state, and remains mobile-safe at 390px.

## Result

**68 accepted / 122 total = 55.7% formal acceptance coverage.**

This remains an evidence-coverage ratio, not implementation-progress percentage.

## Highest-value remaining gates

1. Leader Center missing product requirements (five open items).
2. Admin real email-change BACKEND-E2E.
3. Phase 3 artwork/glyph closeout.
4. Phase 4 final Web Push backend/invalid-endpoint/device evidence.
5. Phase 6 controlled second congregation + real Gate C.
6. Latest-service correction controls and Home empty/mobile acceptance.
7. Remaining Tagalog, Cebuano/Bisaya, weekly journey, content depth, and Media discovery/organization.
8. Final exact-SHA accumulated regression/certification and promotion decision.

No production promotion is authorized by this reconciliation.
