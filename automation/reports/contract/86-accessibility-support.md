# A2 contract investigation — #86 Accessibility support

Agent: `BQ-A2-CONTRACT`

## Exact inspected state

- Canonical branch: `feature/v3-accessibility-support`
- Canonical HEAD at final freshness check: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`
- Functionally verified product candidate contained in canonical history: `168a2b32d96d9c999cd6e93879d3215bebfe25da`
- Dedicated autonomous candidate `agent/a1-work/086-*`: not found at final inspection
- Latest valid frozen v3 release: `release/v3.58-tutorial-avatar-reactions`
- Frozen SHA: `c71db1502618a0a5679bf880fbd830762f9f5ef4`
- Current canonical is one bookkeeping/documentation commit ahead of the functionally verified product candidate and two commits ahead of the frozen base.

Staleness condition: this report must be revalidated if the canonical ref, an `agent/a1-work/086-*` ref, the v3.59 release ref, inventory, #86 contract, implementation/tests/workflow, or exact run evidence changes.

## Authoritative milestone contract

**FACT** — Current `FEATURE_INVENTORY_V3.md` records #86 Accessibility support as `Verified` with the bounded contract `keyboard nav; focus order; labels; reduced motion/readability`.

**FACT** — `ACCESSIBILITY_SUPPORT_V3.md` recovers the retained behavior from `accessibility-runtime.js`, `accessibility-runtime.css`, and `journey-accessibility.js`: normal/large/extra-large text, system/reduce/full motion, normal/strong contrast, visible keyboard focus, modal semantics/focus containment, dialog-owned Escape behavior, and reduced-motion presentation.

**FACT** — The contract explicitly rejects carrying forward the retained implementation mechanisms of direct `localStorage`, `window.BQAccessibility`, and MutationObserver discovery. It also keeps cloud/account state, Progress, Router ownership, and feature-specific dialog lifecycle outside the Accessibility owner.

**RECOMMENDATION** — Keep #86 bounded to the recovered Accessibility behavior. Do not add cloud preferences, analytics, content reporting/moderation, feature-specific dialog redesign, or additional global lifecycle ownership under this milestone.

## Retained/v2 primary evidence

**FACT** — `main` at inspected SHA `6d42c5445a582b55c81e8d925e6d2bc1b92659b9` contains the retained source named by the #86 contract.

**FACT** — Retained `accessibility-runtime.js` stores `{text,motion,contrast}` locally, applies root accessibility state, provides normal/large/xlarge text and system/reduce/full motion plus normal/strong contrast, reacts to `prefers-reduced-motion`, adds visible labels/dialog semantics through runtime DOM discovery, exposes `window.BQAccessibility`, and uses MutationObserver.

**FACT** — Retained `accessibility-runtime.css` provides text scaling, stronger contrast, reduced-animation behavior, a `3px` `:focus-visible` outline, and a mobile xlarge adjustment at `max-width:430px`.

**FACT** — Retained `journey-accessibility.js` explicitly labels Journey elements, gives the Journey layer dialog semantics, restores/focuses appropriate elements, handles Escape through the Journey close control, and traps Tab/Shift+Tab inside the visible Journey dialog.

**INFERENCE** — The current #86 contract is a clean architectural recovery of those user-visible behaviors rather than a requirement to preserve the retained global-injector mechanisms. This inference is supported by the contract's explicit non-port statement and current ownership boundaries.

## Current verified owners and implementation

**FACT** — At functional candidate `168a2b32d96d9c999cd6e93879d3215bebfe25da`, `src/app/accessibility.js` is the Accessibility preference owner. It normalizes only the three contracted option sets, persists through the shared `storage` service, derives effective motion from the device media query for `system`, publishes changes, and removes its media-query listener on disposal.

**FACT** — `src/ui/accessibility.js` is a presentation/runtime owner only: it applies root `data-bq-*` attributes and contains Tab focus inside the last visible `[role="dialog"][aria-modal="true"]`. It does not own Escape/close behavior.

**FACT** — `src/features/accessibility/index.js` is required by the permanent #86 validator as the explicit settings-page owner, while `src/features/more/index.js` and bootstrap compose routing/runtime integration rather than duplicating preference ownership.

**FACT** — Frozen v3.58 -> functional candidate `168a2b3...` introduced the #86 contract, service, presentation runtime, feature page, CSS, integration changes, validator, edge test, smoke test, and accumulated workflow wiring. The later canonical `5594f98...` changes only #86/bookkeeping/handoff/status/timeline documentation and inventory; it does not alter the #86 product/test/workflow implementation.

## Permanent regression contract

**FACT** — `scripts/validate-v3-accessibility.mjs` requires the #86 contract, owner files, shared storage, CSS, tests, and accumulated workflow. It rejects direct browser storage, `window.BQ*`, MutationObserver, Supabase/client creation and Progress ownership in the relevant Accessibility owners. It also requires the accumulated workflow to invoke the #86 validator, edge test, and browser smoke.

**FACT** — `tests/v3-accessibility-edge.mjs` covers malformed stored-value normalization, valid persisted values, invalid-option rejection, shared-storage persistence, explicit and system motion behavior, live device reduced-motion changes, reset, subscriber notification, disposal cleanup, and post-disposal mutation rejection.

**FACT** — `tests/v3-accessibility-smoke.mjs` runs at a 390x844 mobile viewport and covers More -> Accessibility routing, accessible labels, no horizontal overflow, text/motion/contrast application, visible keyboard focus, reload persistence, live system reduced-motion changes, reduced-motion integration with Tutorial, and modal Tab/Shift+Tab wrapping.

**FACT** — Comparing permanent `.github/workflows/v3-regression.yml` at frozen `c71db150...` and product candidate `168a2b32...` shows the prior accumulated invocation lists retained and exactly three #86 invocations appended: validator, edge test and browser smoke. The normal workflow remains `workflow_dispatch` only.

## Exact execution evidence

**FACT** — Targeted run `34501867982` concluded `success`. Its isolated verification job included a successful `Assert exact product candidate` step, #86 architecture/edge checks, and Accessibility browser/integration checks.

**FACT** — Complete accumulated run `34502063494` concluded `success`. The isolated verifier workflow explicitly checked out `168a2b32d96d9c999cd6e93879d3215bebfe25da` and asserted that exact SHA. Architecture validators, accumulated edge regressions, and accumulated browser/mobile regressions all passed. The verifier's accumulated lists include the #86 validator, #86 edge test and #86 smoke together with prior coverage.

**FACT** — The current canonical bookkeeping SHA `5594f9802e40b25c6df9b6331668c0bbfcedacc7` is different from the exact functionally green product SHA. At final inspection, no Actions run was returned for exact `5594f980...`.

**RECOMMENDATION** — Do not transfer the PASS from `168a2b32...` to `5594f980...`. The current bookkeeping SHA still needs the prescribed complete exact-SHA bookkeeping gate before a v3.59 freeze can be treated as known-good.

## Current A2 disposition

**FACT** — Product-contract evidence for #86 is complete enough to support the current `Verified` functional state at exact product SHA `168a2b32d96d9c999cd6e93879d3215bebfe25da`.

**FACT** — The live canonical HEAD is now `5594f9802e40b25c6df9b6331668c0bbfcedacc7`; it contains bookkeeping/inventory changes that have not yet been proven by an exact-SHA complete gate in the evidence available to A2.

**RECOMMENDATION** — #86 should not be frozen/released from `5594f980...` until that exact bookkeeping SHA passes the complete accumulated verification required by the durable handoff. If it passes without product/workflow changes, no additional Accessibility contract expansion is required.

## Next dependency-likely milestone

**FACT** — Inventory #87 Content reporting remains `Not started` with contract `submit report; validation; success/error`.

**FACT** — The current durable handoff keeps #87 separate from #88 moderation and states that retained reporting behavior plus backend/RLS contracts should be recovered read-only before product writes.

**RECOMMENDATION** — Do not begin #87 from provisional #86 bookkeeping. First freeze an exact-green v3.59 #86 checkpoint; then recover #87's retained submission/authorization contract without bundling #88 moderation or admin-review ownership.

## TRIAGE freshness check performed after independent findings

**FACT** — `automation/TRIAGE.md` inspected only after the primary-evidence findings above still identifies #85 at `19cde1f...` with v3.57 as the frozen base and defers #86. It is materially stale relative to live repository state (`release/v3.58...`, active #86, exact functional green evidence, and current canonical `5594f980...`).

TRIAGE agreement or disagreement was not used as evidence for the findings in this report.
