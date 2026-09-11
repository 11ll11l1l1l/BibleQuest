# BibleQuest v3 — Visual Phase B Avatar Vault artwork

## Scope

This milestone improves only the presentation of the existing Avatar Vault page. It must not change the 15-style catalog, unlock requirements, availability flags, metric ownership, earned state, selected style persistence, cloud synchronization, leaderboard compatibility, routing, or scoring/fair-play behavior.

## Ownership contract

- `src/engines/avatar-vault.js` remains the sole owner of the style catalog, unlock evaluation, requirements, progress text and legacy `icon` compatibility values.
- `src/app/avatar-vault.js` remains the sole owner of selected/earned state, owner scoping, local persistence, metrics aggregation and Avatar Vault API synchronization.
- `src/features/avatar-vault/index.js` owns Vault page rendering and callback wiring only.
- `src/core/api.js` remains the browser backend/Supabase boundary.
- Equip still calls `vault.select(style.id)` and Back still calls `onBack`.
- Existing style `icon` emoji may remain for compatibility consumers outside this page, but the Avatar Vault page must not render those emoji as its artwork.

## Artwork contract

- Avatar Vault artwork is committed, same-origin passive SVG under `assets/avatar-vault-icons.svg`.
- Every existing catalog id has a matching symbol: `starter`, `sakura`, `lantern`, `flame`, `crown`, `scholar`, `scroll`, `shepherd`, `couple`, `community`, `world`, `kitsune`, `moon`, `fuji`, `tea`.
- Locked cards use the committed `lock` symbol instead of the literal lock emoji.
- Artwork is decorative and `aria-hidden`; style names, requirements, progress text and control labels remain authoritative.
- No remote artwork, data URI, runtime image dependency, animation or second asset path is introduced.

## Presentation contract

- `src/ui/avatar-vault.css` remains the base layout/geometry owner.
- `src/ui/avatar-vault-phase-b.css` loads after it as a bounded presentation layer.
- The page keeps all 15 catalog cards, availability wording, fair-play note, Equip controls, scope wording and Back control.
- Locked/unlocked/active meaning must not depend on artwork alone.
- 390 px acceptance must prove all catalog cards render, unlocked Equip still works, locked art differs from unlocked art, every displayed symbol resolves to the committed sprite, touch targets remain at least 44 px where applicable, and the page has no horizontal overflow.

## Release evidence

- Existing Avatar Vault architecture, edge and browser regressions remain in the accumulated suite.
- New Avatar Vault Phase B static and 390 px browser checks are permanent accumulated gates.
- No PASS transfers from feature head to the PR synthetic merge candidate. Promotion requires the exact candidate exercised by the complete accumulated regression to be green before freeze/merge.
