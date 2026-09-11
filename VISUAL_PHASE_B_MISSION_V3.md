# BibleQuest v3 — Visual Phase B Personal Mission artwork

## Scope

This milestone improves only the presentation of the existing Personal Mission surface. It must not change recommendation rules, Open Review ownership, storage, navigation semantics, callbacks, or study/review behavior.

## Ownership contract

- `src/engines/mission.js` remains the sole owner of recommendation selection.
- `src/app/mission.js` continues to obtain recommendation evidence from the existing Open Review owner.
- `src/features/mission/index.js` owns rendering and callback wiring only.
- Every existing button and route callback remains behaviorally equivalent: the primary action still routes `review` recommendations to `onReview`, otherwise to `onStudy`; Back still calls `onBack`.
- The engine's legacy `icon` property may remain for compatibility, but the Mission UI must not render that emoji as artwork.

## Artwork contract

- Mission artwork is committed, same-origin SVG under `assets/mission-feature-icons.svg`.
- `review` and `study` recommendations use distinct semantic symbols selected from the already-produced recommendation action.
- Artwork is decorative and hidden from assistive technology; recommendation meaning remains present in text.
- No remote artwork, data URI, second asset path, animation, or new runtime dependency is introduced.

## Presentation contract

- The existing `mission.css` remains the base geometry owner.
- `mission-phase-b.css` loads after it as a bounded presentation layer.
- The page keeps the existing content, mission instructions, primary action, and Back action while improving hierarchy and mobile containment.
- 390 px browser acceptance must prove artwork visibility, action routing, target size, and no horizontal overflow.

## Release evidence

- Existing Innovation Suite edge and browser regressions remain in the accumulated suite.
- New Mission Phase B static and 390 px browser checks are permanent accumulated regression gates.
- No PASS transfers from a feature head to a synthetic merge candidate. Promotion requires the exact candidate exercised by the accumulated regression to be green before merge/freeze.
