# BibleQuest v3 — Final Release Acceptance Matrix

Updated: 2026-09-12 JST

This matrix separates product verification, provider deployment evidence and real field validation. A PASS in one column must not be transferred to another.

## Exact product baseline

- current exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- frozen product ref: `release/v3-phase-b-progress-artwork-20260912`
- exact accumulated product run: `34633247237` — success
- current release-hardening branch: `release/v3-final-mobile-width-gate`

A docs/validation-only HEAD is not automatically a new product SHA.

## Automated exact-candidate gates

| Gate | Required final-candidate evidence | Current status |
|---|---|---|
| Cloudflare deployment build gate | `bash build.sh` / `scripts/deploy-gate.mjs` validates JS syntax, production entry assets and deployment/runtime guards | Registered in accumulated PR workflow by this release-hardening milestone; must pass exact candidate |
| Architecture / ownership | Complete accumulated architecture validators | Existing accumulated gate; rerun on every changed final candidate |
| Edge / security / privacy | Complete accumulated edge/security/static suite | Existing accumulated gate; rerun on every changed final candidate |
| Browser / functional | Complete accumulated browser/mobile suite | Existing accumulated gate; rerun on every changed final candidate |
| Explicit phone widths | 320 / 360 / 390 / 412 / 430 px at 100% zoom against current v3 shell and primary routes | `tests/v3-final-mobile-widths-smoke.mjs` added by this release-hardening milestone; must pass exact candidate |
| Current primary navigation | Five current v3 routes: Home / Learn / Play / Grow / More; equal usable columns, no clipping | Included in explicit-width gate |
| Home priority | Daily Journey surface/CTA discoverable and practical touch target | Included in explicit-width gate |
| Mobile text floor | Critical body/support text avoids tiny unreadable values | Included in explicit-width gate |
| PWA install contract | Relative manifest, standalone display, install icons, browser install event, safe mobile install UI | Existing `tests/v3-pwa-install-smoke.mjs`; must remain accumulated |
| Offline shell | Offline/service-worker/cache behavior | Existing offline-shell regressions; must remain accumulated |
| Accessibility | Keyboard/readability/preferences/reduced-motion-sensitive regressions | Existing accumulated accessibility gates; rerun exact candidate |
| Visual assets | Same-origin committed artwork, fallbacks and no console/page errors | Existing focused Phase B + accumulated tests; rerun exact candidate |

## Issue #6 reconciliation

Issue #6 was written against an older BibleQuest shell that had four bottom tabs and a Home world/path layout with nine squeezed nodes. Current v3 intentionally has five primary destinations in `src/ui/shell.js`: Home, Learn, Play, Grow and More. Bible World is now a separate feature route.

Therefore the final acceptance intent is retained while obsolete structure is not reintroduced:

- no zoom-out required at 320–430 px;
- no horizontal page overflow;
- readable primary/supporting text;
- Daily Journey remains obvious and usable;
- header and account/progress controls fit without overlap;
- all five current nav destinations are equal and usable;
- practical touch targets remain approximately 44 px or larger where applicable;
- PWA install/offline behavior remains verified.

Real Android Chrome/Brave and truly installed-PWA checks remain field evidence and must not be claimed from headless Chromium alone.

## Multi-account field gate — Issue #68

This remains **FIELD VALIDATION REQUIRED**. Use multiple real/test accounts that exercise Member, Pastor/Leader and Congregation Admin boundaries without bypassing authentication or RLS.

Required field evidence:

- create/join congregation and Journey Group from UI;
- create Cloud Team, add/remove members, target assignment to team;
- target assignment to Journey Group and prove only that group receives it;
- link two couple accounts and launch a couples assignment;
- run couples-type congregation challenge and verify one pair-shared day plus individual progress/points;
- host/join Live Room across devices;
- refresh/reconnect/close-reopen PWA/re-login;
- verify expected database rows and realtime behavior;
- verify unrelated congregation/group/couple cannot read or mutate data;
- verify empty/error states and expired/invalid invite codes.

Static regressions do not close this gate.

## Provider / production gate

Before official release approval:

1. establish one exact intended final product SHA;
2. complete all automated gates above on that exact candidate, including `bash build.sh`;
3. complete Issue #68 field validation;
4. deploy that exact candidate through the approved provider path;
5. record provider deployment identity/SHA;
6. independently verify canonical `https://mybiblequest.pages.dev/` and compatibility `https://biblequest-7th.pages.dev/` serve the expected bytes/assets and critical browser flows;
7. confirm production visual state matches the verified candidate;
8. if any product correction is required, create a new exact candidate and repeat the required gates. Never transfer PASS.

## Visual Phase B gate — Issue #94

Accepted exact-green bounded checkpoints currently include More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow. Additional visual changes are required only when current investigator/tree evidence identifies a material remaining placeholder, generic or inconsistent user-facing surface. Do not create visual work simply to extend tranche count.
