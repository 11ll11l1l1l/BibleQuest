# BibleQuest V5 Lab A4 — Component Rebuild Status

Updated: 2026-09-13 JST
Lab branch: `lab/v5-a4-component-rebuild`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head before this status commit: `8eadd8534ff1b1e3600da06d469d2c1e775a3fe9`

## Hypothesis

A component-driven V5 can reduce BibleQuest's fragile UI/state debt without a clean-slate rewrite by introducing explicit, testable view primitives and state contracts first, then migrating large owners such as Reader and Games behind those boundaries while preserving backend/security contracts.

## Current experiment decision

**VIABLE — CONTINUE.**

No framework has been selected. ADR-0001 explicitly requires a component-technology spike rather than framework adoption by fashion. This lab therefore continues with framework-neutral ES-module view primitives and now a single DOM mount/action owner. A later tranche can compare this baseline with a lightweight framework/component option using measured Reader/Games migration complexity and bundle/runtime evidence.

## Completed work

- Added `src/v5/ui/primitives.mjs` as a dependency-free component boundary.
- Added explicit action buttons with constrained variants and action identifiers.
- Added shared `idle/loading/ready/empty/offline/error/unauthorized` view-state vocabulary.
- Added reusable loading, empty and error status views with live-region semantics.
- Added an accessible dialog frame contract with labelled title and explicit close action.
- Decorative icon content is isolated from accessible labels with `aria-hidden="true"`.
- Added `src/v5/ui/view-mount.mjs` as the single delegated DOM action owner for a mounted subtree.
- The mount installs exactly one `click` listener, resolves nested action content through `closest('[data-bq-action]')`, rejects out-of-root/disabled actions, and has deterministic idempotent cleanup.
- Native buttons keep native keyboard activation; the adapter intentionally does not add a competing `keydown` shim.
- Added `tests/v5-component-primitives.mjs` and `tests/v5-view-mount.mjs` for the new component boundary.
- No production route imports these V5 modules yet; V4 behavior is unchanged in this tranche.

## Component/state decisions

1. Component APIs expose semantic actions (`data-bq-action`) instead of embedding feature-specific event listeners into each primitive.
2. One mount owns delegated action dispatch for its subtree; components do not register parallel listeners.
3. Keyboard activation remains the browser/native-control responsibility. The mount consumes resulting click events rather than synthesizing key behavior.
4. Shared components own presentation/accessibility semantics only; server authorization remains outside the view layer.
5. Async states are explicit values, not inferred from incidental DOM presence.
6. User-controlled strings are escaped by default. `dialogFrame.bodyHtml` is intentionally a trusted composed-component slot and must not receive raw user content.
7. Framework selection remains open until a bounded Reader/Games migration spike proves whether dependency-free components remain sufficient or a lightweight component runtime materially reduces complexity.

## Tests and evidence

Local isolated Node execution of the exact new mount/test content used in this tranche:

- `node tests/v5-view-mount.mjs` equivalent isolated run — PASS (`v5 view mount characterization: PASS`).
- Covered: single delegated listener, no keydown listener, nested action resolution, disabled/out-of-root suppression, render/clear, deterministic cleanup, no post-dispose dispatch, disposed-render rejection, and idempotent dispose.
- The prior primitive characterization remains unchanged from the previous tranche.
- No browser, responsive, PWA or production runtime evidence is claimed yet because these modules are not wired to shipped routes.
- No database/security behavior changed.

## Failures / constraints

- Repository work continues through the GitHub connector rather than a checked-out clone; local validation uses isolated copies of the exact new module/test contents.
- Existing V5 authority still marks the build/client ADR as PROPOSED on this disposable baseline. This lab treats its component work as experimental evidence, not as acceptance of ADR-0001.
- The draft lab PR supplies inherited CI evidence only; it is never a merge candidate.

## Known debt

- No CSS/design-token owner exists yet for the new primitives.
- Reader and Games remain monolithic production owners.
- The primitive/mount layer is JavaScript rather than TypeScript because this lab baseline intentionally has no Vite/TypeScript toolchain; typed contracts should be added when this experiment establishes its own build boundary.
- Trusted HTML composition needs a stronger typed/component slot once the lab has a build/type system.
- Real browser focus behavior and DOM semantics still require browser-level evidence once a shipped surface uses the mount.

## Next 3 tasks

1. Characterize Reader's current loading/error/chapter/verse-peek behavior and true state/service owner.
2. Migrate only Reader loading/error presentation to the V5 primitives/mount while preserving Reader service/state ownership and accepted behavior.
3. Spike one representative Games launcher/question/result slice behind the same component/state contract and compare complexity against the current monolithic renderer before selecting a framework.

## Safety

No writes were made to `main`, `v5/architecture-upgrade`, another lab, Cloudflare production or Supabase production. No auth/RLS/privacy/licensing behavior was changed.
