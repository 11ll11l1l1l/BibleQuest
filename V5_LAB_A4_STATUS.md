# BibleQuest V5 Lab A4 — Component Rebuild Status

Updated: 2026-09-13 JST
Lab branch: `lab/v5-a4-component-rebuild`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head before this status commit: `65cd36ee1d2b934b44c0b4b95e37847b6737a195`

## Hypothesis

A component-driven V5 can reduce BibleQuest's fragile UI/state debt without a clean-slate rewrite by introducing explicit, testable view primitives and state contracts first, then migrating large owners such as Reader and Games behind those boundaries while preserving backend/security contracts.

## Current experiment decision

**VIABLE — CONTINUE.**

No framework has been selected. ADR-0001 explicitly requires a component-technology spike rather than framework adoption by fashion. This lab therefore begins with framework-neutral ES-module view primitives so their accessibility, escaping and action/state contracts can be tested independently of Reader/Games runtime ownership. A later tranche can compare this baseline with a lightweight framework/component option using measured migration complexity and bundle/runtime evidence.

## Completed work

- Added `src/v5/ui/primitives.mjs` as a dependency-free component boundary.
- Added explicit action buttons with constrained variants and action identifiers.
- Added shared `idle/loading/ready/empty/offline/error/unauthorized` view-state vocabulary.
- Added reusable loading, empty and error status views with live-region semantics.
- Added an accessible dialog frame contract with labelled title and explicit close action.
- Decorative icon content is isolated from accessible labels with `aria-hidden="true"`.
- Added `tests/v5-component-primitives.mjs` covering escaping, action validation, async-state semantics, dialog labelling and invalid-state rejection.
- No production route imports these primitives yet; V4 behavior is unchanged in this tranche.

## Component/state decisions

1. Component APIs expose semantic actions (`data-bq-action`) instead of embedding feature-specific event listeners into each primitive.
2. Shared components own presentation/accessibility semantics only; server authorization remains outside the view layer.
3. Async states are explicit values, not inferred from incidental DOM presence.
4. User-controlled strings are escaped by default. `dialogFrame.bodyHtml` is intentionally a trusted composed-component slot and must not receive raw user content.
5. Framework selection remains open until a bounded Reader/Games migration spike proves whether dependency-free components remain sufficient or a lightweight component runtime materially reduces complexity.

## Tests and evidence

Local isolated Node execution of the exact primitive/test content used in this tranche:

- `node tests/v5-component-primitives.mjs` equivalent isolated run — PASS (`v5 component primitive characterization: PASS`).
- Syntax/import execution — PASS as part of the same Node run.
- No browser, responsive, PWA or production runtime evidence is claimed yet because these primitives are not wired to shipped routes.
- No database/security behavior changed.

## Failures / constraints

- The execution container could not clone GitHub because DNS resolution for `github.com` was unavailable. Repository reads/writes therefore used the GitHub connector; local validation used an isolated copy of the exact new module/test contents.
- Existing V5 authority still marks the build/client ADR as PROPOSED on this disposable baseline. This lab treats its component work as experimental evidence, not as acceptance of ADR-0001.

## Known debt

- No CSS/design-token owner exists yet for the new primitives.
- No DOM mounting/action-dispatch adapter exists yet.
- Reader and Games remain monolithic production owners.
- The primitive layer is JavaScript rather than TypeScript because this lab baseline intentionally has no Vite/TypeScript toolchain; typed contracts should be added when this experiment establishes its own build boundary.
- Trusted HTML composition needs a stronger typed/component slot once the lab has a build/type system.

## Next 3 tasks

1. Add a tiny DOM mount/action-dispatch adapter plus focused tests proving cleanup, keyboard-safe action dispatch and no duplicate listeners.
2. Characterize Reader's current loading/error/chapter/verse-peek behavior, then migrate only its loading/error states to the new primitives without changing reader service/state ownership.
3. Spike one representative Games launcher/question/result slice behind the same component/state contract and compare complexity against the current monolithic renderer before selecting a framework.

## Safety

No writes were made to `main`, `v5/architecture-upgrade`, another lab, Cloudflare production or Supabase production. No auth/RLS/privacy/licensing behavior was changed.
