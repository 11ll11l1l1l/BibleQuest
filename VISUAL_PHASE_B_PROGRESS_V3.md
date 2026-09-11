# BibleQuest v3 — Visual Phase B Progress/Grow

Status: candidate milestone; not promoted until the exact synthetic merge candidate passes the complete accumulated regression.

## Scope

Upgrade the existing Grow/Progress surface with committed same-origin semantic artwork while preserving the single verified progress owner, badge definitions, reward meaning, navigation and persistence.

This milestone is presentation-only. It does not change XP, streaks, counters, stars, coins, badge unlock rules, event idempotency, cloud behavior, or any progress-writing API.

## Ownership boundaries

- `src/core/progress.js` remains the sole XP/streak/counter/reward/badge owner.
- feature owners may continue to request stable progress events but may not mutate progress state directly.
- `src/features/progress/index.js` owns Grow/Progress page rendering and existing navigation callback wiring only.
- `src/ui/progress.css` remains the base Progress layout.
- `src/ui/progress-visual-polish.css` remains the earlier Phase A presentation layer.
- `src/ui/progress-phase-b.css` is a presentation-only Phase B layer loaded after Phase A.
- `assets/progress-feature-icons.svg` contains passive same-origin decorative artwork only.

No schema, Supabase, API, storage, scoring, reward or route-owner change is authorized by this milestone.

## Artwork contract

The committed sprite provides distinct symbols for:

- `progress`
- `xp`
- `streak`
- `activity`
- `chapter`
- `growth`
- `profile`
- `psychometrics`
- `avatar`
- `achievements`
- `badge`
- `badge-locked`

This deliberately implements the canonical Progress / Achievements / Badge semantic roles from `docs/V3_ICON_ASSET_MAP.md` without wiring the absent historical `assets/icons/v3/` PNG family.

Artwork is decorative and must be hidden from assistive technology. Visible labels and actual Progress-owner state remain authoritative. An unlocked badge uses `badge`; a locked badge uses `badge-locked`. Artwork may never claim a reward or badge is earned when `progress.getState()` says it is not.

## Interaction contract

Existing navigation callbacks remain intact:

- Open Transformation;
- Personality Profile;
- Psychometrics Lab;
- Avatar Vault.

Buttons remain text-labelled controls; artwork must not replace them or reduce touch targets.

## Acceptance

Permanent focused verification must prove at minimum:

- all required sprite symbols exist and load from the same origin;
- the four existing metrics retain their existing data attributes and values while rendering semantic artwork;
- unlocked and locked badge artwork is selected strictly from existing badge state;
- all existing Grow navigation callbacks remain intact;
- relevant action targets remain at least 44 px high on the 390 px mobile acceptance viewport;
- no horizontal overflow, console errors or page errors are introduced;
- existing `tests/v3-progress-edge.mjs` and `tests/v3-progress-smoke.mjs` remain in the accumulated regression;
- the Phase B renderer does not edit `src/core/progress.js` or introduce a second progress owner.

## Evidence rule

No PASS transfers. Focused checks are not release evidence by themselves. Promotion requires the exact PR synthetic merge candidate to pass the complete accumulated `v3-regression.yml` suite. Freeze that exact green candidate before advancing `main`.
