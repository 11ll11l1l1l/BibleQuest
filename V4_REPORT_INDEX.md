# BibleQuest V4 Captain Index

This is the central captain-readable status file for the BibleQuest V4 design and UX overhaul.

## Authority and operating model

- Active implementation branch: `v4/modern-ui-overhaul`.
- Governing plan: `V4_MODERN_UI_DEVELOPMENT_PLAN.md`.
- Repository evidence overrides stale chat context.
- The human/chat captain is the only implementation integrator for V4.
- V4 agents are analysis/reporting-only and must not autonomously merge runtime changes into the implementation branch.
- Preserve V3 single-owner architecture. V4 presentation work must not create competing owners for auth, routing, storage, Bible data, progress, scoring, media, or backend calls.
- Rebuild-and-verify remains the development rule. Prefer shared primitives and intentional route migrations over page-by-page patch accumulation.

## Current phase

**Phase 1 — Design System Foundation: in progress.**

Foundation tranche A establishes:

1. the V4 semantic color, typography, spacing, radius, motion, focus and elevation tokens;
2. shared surface and button behavior with V3 compatibility aliases;
3. a modernized responsive application shell presentation without changing shell ownership or routes;
4. reduced-motion, stronger-focus and stronger-contrast behavior;
5. the first route composition migration on Home, using only shared V4 tokens and existing feature actions.

The Home tranche is presentation-only. It does not modify Daily Journey, tutorial, recording, media or progress service behavior.

## Phase gates

| Phase | State | Gate before advancing |
| --- | --- | --- |
| 0. Inventory / governance | Active baseline | Keep this index current; reconcile useful agent findings before implementation decisions. |
| 1. Design system foundation | **In progress** | Shared system must render at least one route with no page-specific color fork; verify mobile, focus, contrast and reduced motion. |
| 2. Home / navigation | Not started | Foundation stable; shell and Home interaction inventory verified. |
| 3. Quiz / learning flows | Not started | Phase 2 stable; no regression to scoring, question retrieval or progress. |
| 4. Dashboard / progress | Not started | Shared data-display components established. |
| 5. Supporting routes | Not started | Priority route families grouped and migration order confirmed. |
| 6. Responsive / accessibility QA | Not started | All migrated routes ready for 320/375/768/1024 evidence. |
| 7. Stabilization / release | Not started | Regression, accessibility, route and deployment gates green. |

## Agent lanes

The dedicated V4 agent branches remain separate from implementation:

- `v4/agent-1-architecture` — architecture / information architecture analysis.
- `v4/agent-2-experience` — responsive UX / accessibility / PWA presentation analysis.
- `v4/agent-3-character` — product character / interaction identity / motion analysis.
- `v4/agent-4-design` — design system / components / visual hierarchy analysis.
- `v4/agent-5-governance` — report synthesis / governance analysis.

Agent reports are inputs, not implementation authority. Placeholder or scaffold reports must not be treated as completed findings. The captain should reconcile evidence against the current implementation branch before adopting recommendations.

## V4 implementation ledger

| Tranche | Scope | Architecture risk | Status |
| --- | --- | --- | --- |
| Foundation A | `src/ui/v4-foundation.css`, `src/ui/home-v4.css`, V4 CSS load order | Low: presentation only | Implemented in current V4 branch history |
| Foundation B | V4 icon system, typography asset decision, shared form/control refinements | Low–medium | Next |
| Home / Nav A | Intentional information hierarchy, navigation polish, responsive evidence | Medium | Pending |
| Quiz shell | Question/answer/result interaction redesign | Medium–high | Pending |

## Non-negotiable verification

For every V4 implementation tranche:

- preserve the V3 architecture boundaries and public feature behavior unless the V4 plan explicitly changes presentation behavior;
- verify no horizontal overflow at 320px and 375px paths;
- verify 44px minimum primary interactive targets where already required by V3 contracts;
- verify keyboard focus visibility and logical order;
- verify `prefers-reduced-motion` behavior;
- verify stronger-contrast mode remains readable;
- verify route actions still invoke the same service/navigation owners;
- record any unexecuted test or browser check explicitly rather than treating inspection as a passing test.

## Next captain action

Complete Foundation B and browser evidence for the shared foundation before broad route-by-route restyling. Do not merge agent branches wholesale; cherry-pick or reimplement only reconciled, source-backed findings.
