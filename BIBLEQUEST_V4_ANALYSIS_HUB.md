# BibleQuest v4 — Central Analysis Hub

Status: ACTIVE
Owner: Human user / single ChatGPT captain
Agent authority: ANALYSIS + REPORTING ONLY
Repository: `11ll11l1l1l/BibleQuest`

## 1. v4 product direction

BibleQuest is now moving from v3 to v4.

The primary v4 program is a page-by-page design and experience overhaul. The v3 visual shell is no longer a design ceiling. v4 may substantially redesign the presentation, composition, hierarchy, interaction patterns, artwork, icons, navigation treatment, cards, controls, typography, spacing, backgrounds, motion, responsive behavior, empty/loading/error states, and page-specific visual identity when that produces a clearly better product.

The result must feel like a modern, polished, intentionally designed application rather than an old website with cosmetic styling. It should be attractive, intuitive, coherent, responsive, accessible, and appropriate to each BibleQuest surface.

Design freedom does NOT authorize agents to implement changes. Agents investigate, compare, test, identify problems/opportunities, and produce evidence-backed recommendations. A human user or one explicitly designated ChatGPT captain decides and executes changes.

## 2. Non-negotiable analysis principles

- Do not preserve a v3 layout merely because it already exists. Preserve it only when it is still the best solution.
- Do not constrain recommendations to simple artwork swaps, token tweaks, or cosmetic replacements.
- Page structure and information hierarchy may be reconsidered when needed.
- Favor cohesive app-quality systems over stacked patches and one-off CSS.
- Every recommendation must account for mobile first, then larger screens.
- Serious study, privacy, account, ministry, and administrative surfaces must feel mature and trustworthy; Kids/Games may be more playful.
- Scripture, doctrinal-safety, privacy, auth, storage, backend, and security boundaries remain protected. A visual idea that affects those boundaries must be explicitly flagged for captain review rather than silently assumed safe.
- Do not weaken tests, duplicate feature owners, introduce parallel runtimes, or recommend hacks merely to obtain a visual effect.
- Distinguish FACT, OBSERVATION, INFERENCE, and DESIGN PROPOSAL.
- Use repository evidence and current runtime evidence; stale v3 documents are historical context, not automatic v4 constraints.

## 3. Agent system

The active v4 analysis team is:

1. `BQ-A1-V4-DESIGN-SYSTEM` — visual design system, page aesthetics, component quality, art/iconography, modernity and consistency.
2. `BQ-A2-V4-RESPONSIVE-ACCESSIBILITY` — mobile/responsive, interaction ergonomics, accessibility, PWA presentation and cross-device behavior.
3. `BQ-A3-V4-ARCHITECTURE-SAFETY` — architectural ownership, security/privacy/backend boundaries, performance risks and implementation feasibility of proposed redesigns.
4. `BQ-A4-V4-UX-FLOWS` — page-by-page functional UX, information architecture, navigation, state transitions, discoverability and task completion.
5. `BQ-A5-V4-ANALYSIS-FIREWALL` — read-only triage/compiler. It does not act as captain and cannot approve implementation. It deduplicates A1-A4 evidence, rejects noise, and maintains the captain-facing synthesis in this file.

A1-A4 must write only to their own designated report files. A5 is the only agent allowed to update this hub, and only the sections explicitly marked for compiled findings. No agent may modify application code, tests, workflows, production configuration, Supabase, Cloudflare, branches, releases, or implementation documents.

Designated reports:

- `BIBLEQUEST_V4_A1_DESIGN_REPORT.md`
- `BIBLEQUEST_V4_A2_RESPONSIVE_REPORT.md`
- `BIBLEQUEST_V4_A3_ARCH_SAFETY_REPORT.md`
- `BIBLEQUEST_V4_A4_UX_REPORT.md`

## 4. Required page-by-page coverage

Agents must discover the current authoritative route/surface inventory from the repository rather than assuming this list is exhaustive. At minimum investigate:

- Home / launch / primary navigation
- Learn / Reader / translation and source presentation
- Daily Journey / Progress / Bible World
- Play / Games / Kids experiences
- Grow / Transform / Study / Deep Questions / Story / Wisdom
- Notes and reflection surfaces
- Couples
- Community / congregation / groups / live-room surfaces
- Media / recordings
- Adaptive / Open Review
- Calendar
- Assignments / notifications / workspace / ministry
- Account / authentication / recovery / tutorial / settings
- Admin or leader surfaces that ship in the product
- Loading, offline, empty, error, permission-denied, and recovery states

Every page should be assessed as its own designed experience while still fitting one coherent BibleQuest product system.

## 5. Evaluation standard

For each surface, evaluate at least:

- first-impression quality and modernity
- visual hierarchy and readability
- information architecture
- navigation clarity and discoverability
- component consistency without forced sameness
- typography, spacing, density, alignment and rhythm
- color, elevation, borders, backgrounds and depth
- iconography, illustration, artwork and asset quality
- empty/loading/error/locked/disabled states
- feedback, transitions and motion where useful
- mobile ergonomics and touch targets
- responsive behavior at 320 / 360 / 390 / 412 / 430 px and representative tablet/desktop widths
- accessibility and reduced-motion behavior
- functional clarity and state continuity
- perceived trustworthiness for serious/private surfaces
- delight and game feel for Kids/Games
- implementation ownership and likely technical risk
- performance/asset-weight implications

## 6. Recommendation format

Every meaningful finding must include:

- exact branch/SHA inspected
- route/surface
- evidence or reproduction
- category
- severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `INFO`
- problem statement
- why the current experience feels outdated, confusing, weak, inconsistent, or technically risky
- recommended v4 direction
- whether the recommendation is DESIGN-ONLY, UX-STRUCTURE, FUNCTION-AFFECTING, ARCHITECTURE-AFFECTING, BACKEND-AFFECTING, or SECURITY/PRIVACY-AFFECTING
- true owner/component/file when identifiable
- dependencies and conflicts
- test/browser/accessibility evidence needed after implementation
- confidence level

Agents must not inflate trivial cosmetic preferences into high-priority work.

## 7. Captain execution model

Only the human user or a single explicitly designated ChatGPT captain may convert analysis into implementation work.

The captain should:

1. Read this hub first.
2. Open the relevant A1-A4 report for evidence when needed.
3. Decide the next bounded v4 redesign tranche.
4. Preserve functional/security/doctrinal contracts unless a deliberate product change is approved.
5. Implement in the true owner rather than layering patches.
6. Validate the changed surface and accumulated regressions.
7. Update v4 development/status documents as implementation proceeds.

Agents are advisors, not executors and not captains.

---

## 8. A5 compiled findings — agent-maintained section

A5 may replace content between the markers below. It must not change Sections 1-7.

<!-- A5-COMPILED-START -->

No v4 agent synthesis has been compiled yet.

<!-- A5-COMPILED-END -->

## 9. Captain decisions / implementation notes — captain-maintained

Do not let scheduled agents edit this section.

- 2026-09-12: v4 transition established. Design constraints are intentionally loosened; page-level redesign is allowed. Agents remain analysis/reporting only.
