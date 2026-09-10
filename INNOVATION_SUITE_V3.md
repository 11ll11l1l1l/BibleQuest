# BibleQuest v3 Innovation Suite Contract

Milestone #83 is bounded to the authoritative inventory requirement: **inventory-specific workflows documented before migration**.

## Recovered legacy contract and v1 scope decision

`innovation-suite.js` (main, legacy `window.BQ*`) bundled five sub-workflows: Guided Study, Personal Mission, Bible World, Characters & Places, and Church Challenges. Per the inventory contract, these must be documented against the current inventory before any migration:

1. **Guided Study** — already migrated and owned by `src/app/study.js` (`createGuidedStudyService`) under a separate milestone. Out of #83 scope.
2. **Characters & Places** — already migrated as the Character Detective game mode, owned by `src/app/games.js` / `src/features/games/detectives.js` under a separate milestone. Out of #83 scope.
3. **Personal Mission** — not yet migrated. In scope for #83 v1: a recommendation dispatcher reusing Open Review's existing `overview()` signal (due count, weakest category). No new ownership of review scheduling, mastery, or progress data.
4. **Bible World** (region-mastery map) — not yet migrated. **Deferred**: the legacy map keys off per-era Bible mastery percentages that no v3 owner exposes yet (the same gap already recorded against #82's deferred avatar styles). Building it now would mean inventing or duplicating mastery tracking. Follow-up sub-milestone once a mastery owner exists.
5. **Church Challenges** (congregation-cloud challenges) — not yet migrated. **Deferred**: requires a new congregation-scoped schema and role-gated launch/progress flow comparable in size to #73 Assignments. Treated as its own follow-up sub-milestone rather than rushed inside #83.

This is an explicit, documented reduction of #83 to its cleanly deliverable slice (Personal Mission), not a completion claim for the full legacy surface.

## Ownership

- `src/engines/mission.js` — sole owner of the recommendation rule. Pure function; no storage, DOM, or network.
- `src/app/mission.js` — lifecycle owner. Reuses `src/app/open-review.js`'s `overview()` getter; does not track its own due-count or mastery state.
- `src/features/mission/index.js` — presentation/event forwarding only.
- Entry point: More page (`data-open-mission`), matching the pattern of other More-page tools. No new route ownership beyond the `mission` key in `src/app/router.js`'s route map.

## #84 next boundary

#84 Tutorial/onboarding trainer remains Not started. No #84 product write belongs before #83 freezes.
