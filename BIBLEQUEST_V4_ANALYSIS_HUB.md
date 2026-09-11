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

### 8.1 Current exact SHA and evidence freshness

- Current `main` before this A5 compilation: `8bb4fe553242977f0c3c5e1ce7f90f230e5ffd70` (`docs(v4): populate A4 UX flow investigation`). The A1-A4 writes in this lineage are documentation-only; A5 re-checked the important runtime claims directly against the current tree rather than inheriting report conclusions.
- A1 report inspection base: `aa312e3248271f7cbe9c47d7af67069c19acb397`.
- A2 report inspection base: `b3b6cd84603defe0eeca88f3db6982dfcb65eff9`.
- A3 report inspection base: `8f16974f9c976f77299d1db365655794b853912b`.
- A4 report inspection base: `61c05482cd0275d7ddcfac9b19f122810c7ae747`.
- Primary evidence re-verified on current tree: `src/ui/shell.js`, `src/ui/app.css`, `src/ui/accessibility.css`, `src/features/more/index.js`, `src/features/account/index.js`, `src/app/bootstrap.js`, `src/app/offline-shell.js`, `offline-shell-sw.js`, and `index.html`.
- There is no implemented v4 product candidate yet. These are redesign findings against the current shipped/runtime architecture, not post-v4 acceptance results.

### 8.2 Top v4 priorities

1. **Establish the v4 foundation and shell before broad page polish.** Current shell still exposes `BQ`, `Rebuild v3`, unicode nav glyphs and one narrow 760 px app frame. Build one coherent v4 chrome/layout system with modern SVG iconography, typography/spacing/elevation/motion primitives, safe-area handling and responsive composition regions. Do not add another overlay stylesheet layer.
2. **Fix information architecture at the same time as visual hierarchy.** `More` is a mixed dumping ground and Learn exposes ten peer-level destinations. Home is a feature showcase instead of a next-action dashboard. These require page composition/IA redesign, not asset swaps.
3. **Make responsive behavior intentional, not merely fitting.** Preserve the requested XL text scale, design mobile list→detail and tablet/desktop split-pane compositions where appropriate, and validate 320/360/390/412/430 plus tablet/desktop as actual design states.
4. **Redesign high-use reading/learning flows next.** Reader should be reading-first; Study/Deep Questions/Story/Wisdom should receive distinct flow identities; Notes should present a coherent entry model without merging private/cloud storage ownership.
5. **Give Games/Kids a stronger game identity without creating new runtimes.** Real art, game-specific HUD/composition and differentiated mode identity are high-value, but existing gameplay/progress/service ownership remains protected.
6. **Treat ministry/admin/private surfaces as mature operational products.** Assignments, Workspace, Ministry, Calendar, Congregation, Content Review and Admin need task/status/privacy hierarchy and mobile list→detail behavior, not playful card styling.
7. **Address demonstrated state correctness before styling over it.** Account sign-out currently has a high-confidence stale outer-shell state risk; resolve in Account/session ownership rather than hiding signed-in UI cosmetically.
8. **Protect architecture/PWA while modernizing.** Current feature modules and CSS are eagerly loaded; route-level lazy loading is not an existing capability. Any future code-splitting/resource-manifest strategy is a separate architecture/PWA decision.

### 8.3 Page / surface matrix

Legend: `H` high redesign need, `M` medium, `P` largely preserve/revalidate, `S` safety-sensitive, `D` demonstrated defect.

| Surface | Design | UX / IA | Responsive / A11y | Architecture-safety |
|---|---|---|---|---|
| Global shell / navigation | H | H | H | S — keep router/session/state outside shell |
| Home | H | H | H | Safe if recommendation state reuses existing owners |
| Learn hub | H | H | H | S — doctrinal/source policy remains protected |
| Reader / translation / source | H | H | H | S — one Reader state/service owner |
| Study / Deep Questions / Story / Wisdom | M-H | M-H | H | Safe structural redesign around existing services |
| Adaptive / Open Review | M | M | M | Preserve learning/progress ownership |
| Daily Journey / Mission | H | M-H | H | Preserve exactly-once progress/reward semantics |
| Progress / Bible World | M-H | M | H | Preserve progress/world state owners |
| Games / Kids | H | H | H | Safe presentation freedom; one launcher/runtime/progress owner |
| Grow / Transform / Personality / Psychometrics | M-H | H | H | S — privacy/trust and scoring meaning must not drift |
| Avatar Vault | H | M | H | Preserve achievement/progress owner |
| Private Notes / Cloud Notes | M-H | H | H | S — local/private/cloud boundaries must remain separate |
| Couples device / cloud | M | H | H | S — do not blend local and paired cloud data |
| Community / Groups / Encouragements / Live Rooms | M-H | H | H | S — role/privacy/service boundaries remain explicit |
| Media / Recordings | M | M | H | Preserve single audio/player lifecycle |
| More hub | H | CRITICAL | H | Role-conditioned visibility must not imply authority |
| Ministry Hub | H | H | H | S — membership authorization remains owner |
| Assignments | H | CRITICAL | H | S — member/leader views may differ; one service/RLS model |
| Notifications | M | H | M-H | Preserve one notification state owner |
| Workspace | H | H | H | S — Reader/Cloud Notes remain data owners |
| Calendar | M-H | H | H | S — personal/shared scopes and destructive actions |
| Congregation / leader/admin/review | H | H | H | S — permission/RLS/destructive-action critical |
| Account / auth / recovery | M-H | H + D | M-H | S — session remains sole auth truth |
| Tutorial / onboarding | M | M | H | Must teach actual v4 destinations after IA stabilizes |
| Accessibility settings | M | M | H | Preserve user-selected scale/motion/contrast semantics |
| Offline/loading/error/denied | H | H | H | S — presentation may change; SW/cache/auth meaning must not |

### 8.4 Accepted findings

**A5-01 — Replace the stacked v3 presentation model with a real v4 foundation.** Severity `CRITICAL`; class `ARCHITECTURE-AFFECTING + DESIGN-ONLY by migrated page`. Evidence: `index.html` eagerly links a long chain of base, `*-visual-polish.css` and `*-phase-b.css` files; `app.css` supplies the universal narrow frame. Owner: `index.html`, `src/ui/app.css` / future v4 primitives, then each feature stylesheet. Dependency/order: foundation first, page-by-page migration second. Do not perform a one-shot global CSS rewrite. Proof: visual/state regression, no uncontrolled specificity, focus/reduced-motion/contrast, all routes still functional.

**A5-02 — Redesign the global shell and navigation as a true app frame.** Severity `CRITICAL`; class `UX-STRUCTURE`, becoming `FUNCTION-AFFECTING` only if destination semantics change. Evidence: `shell.js` hard-codes `BQ`, `Rebuild v3`, unicode icons and five destinations; `app.css` caps topbar/main at 760 px and uses a fixed 72 px five-item bottom nav. Owner: `src/ui/shell.js` + shell/layout styles; navigation semantics remain `src/app/router.js` / route map. Dependency: A4 IA decision before changing top-level destinations; A2 safe-area/text-size ergonomics. Proof: deep links, back/forward, route highlighting, 320–1440 layouts, keyboard/screen-reader, authenticated/guest transitions.

**A5-03 — Replace `More` with grouped end-user IA.** Severity `CRITICAL`; class `UX-STRUCTURE`. Evidence: current More page renders Workspace, Notifications, Community, Ministry, Content Review, two Couples modes, Groups, Team, Accessibility, Install, Backup, Mission, Calendar and Congregation as repeated full panels. Owner: `src/features/more/index.js`. Dependency: captain decision only if a domain is promoted to primary navigation. Proof: every current route remains reachable; role-conditional items do not become authorization gates; install/backup/accessibility stay discoverable.

**A5-04 — Home should become a next-action dashboard.** Severity `HIGH`; class `UX-STRUCTURE`. Evidence from A1/A4: hero + Daily Journey + Tutorial + Recordings + Media + Progress are sequential major modules. Owner: `src/features/home/index.js`. Dependency: use existing mission/progress state; any new recommendation engine is a separate functional proposal. Proof: new/guest/returning/mission-available states, media/tutorial reachability, 320 px and desktop composition.

**A5-05 — Learn/Reader need task-first information architecture.** Severity `HIGH`; class `UX-STRUCTURE`. Learn should group by Read / Study & Explore / Practice & Review / Notes rather than peer-level feature inventory. Reader should privilege Scripture and move secondary translation/source/context/Japanese tools into contextual sheets/sidebars. Owners: `src/features/learn/index.js`, Reader feature/styles and existing Reader service. Dependencies: doctrinal/source policy remains unchanged; no duplicate Reader state. Proof: all Learn destinations, translation/book/chapter persistence, search/context/Japanese/licensed-source failure recovery, keyboard/dialog focus.

**A5-06 — Responsive system must preserve accessibility preferences instead of shrinking them.** Severity `HIGH`; class `DESIGN-ONLY / UX-STRUCTURE`. Evidence: `accessibility.css` sets XL to 125% globally but reduces it to 118.75% at `<=430px`; global shell has only one major `<=480px` breakpoint. Owners: accessibility scale policy plus actual component/layout owners. Dependency: typography/layout foundation. Proof: 320/360 at full XL, browser zoom/text scaling, no clipping/off-screen controls, correct focus/read order.

**A5-07 — Dense operational pages need width-specific composition, not compressed cards/tables.** Severity `HIGH`; class `UX-STRUCTURE`, sometimes `SECURITY/PRIVACY-AFFECTING`. Applies to Assignments, Ministry, Workspace, Calendar, Congregation, Content Review/Admin, Notifications. Direction: mobile list→detail/task flows; tablet/desktop split panes; one service/state owner. Dependency: A4 task hierarchy before implementation; A3 review for role/privacy/destructive-action presentation. Proof: role matrix, long labels, 320 XL, keyboard, destructive action confirmation, resize without duplicate subscriptions/mutations.

**A5-08 — Notes/Couples/local-cloud visual unification must not become data unification.** Severity `HIGH`; class `UX-STRUCTURE` with protected privacy boundary. Current architecture deliberately separates local/private/cloud ownership. Direction: one coherent entry experience with explicit scope cues while delegating to existing separate services. Owners: respective feature pages/services and `src/core/storage.js`. Proof: local-only data never syncs accidentally; cloud signed-out behavior; backup exclusions; account transitions; privacy copy matches actual behavior.

**A5-09 — Account sign-out stale-shell risk is a demonstrated correctness issue, not styling debt.** Severity `HIGH`; class `FUNCTION-AFFECTING / SECURITY-PRIVACY-AFFECTING presentation correctness`. Evidence: `accountPage()` chooses guest/signed-in outer shell once from initial session state; sign-out calls `session.signOut(); render('login')`, where `render()` only replaces `[data-account-body]`. Owner: `src/features/account/index.js` consuming `src/app/session.js`; no new auth model. Dependency: correct before major Account visual redesign. Proof: sign-in/signup/recovery/sign-out/password/device flows; assert no stale identity/profile after sign-out.

**A5-10 — Route-level lazy loading is not currently available and must not be assumed by v4 design work.** Severity `HIGH`; class `ARCHITECTURE/PWA`. Evidence: `bootstrap.js` statically imports all feature pages/services; `index.html` eagerly loads the stylesheet chain. `offline-shell.js` warms resources observed in the current page lifecycle and the service worker runtime-caches requested same-origin navigation/script/style/image/font resources. Owners: bootstrap/index/PWA owners. Direction: first optimize assets and page ownership without changing module topology; if startup cost justifies code splitting, treat it as a separate milestone with explicit visited/unvisited offline semantics. Proof: first boot, never-visited deep route, installed/offline/update/cache matrix.

**A5-11 — Architecture enablers should precede risky cross-cutting expansion.** Severity `HIGH`. Add/strengthen a focused bootstrap dependency-order guard before introducing new shell/global services, and add real migration-apply/RLS validation before any v4 redesign changes backend contracts. These are enabling safeguards, not permission to refactor runtime indiscriminately.

### 8.5 Rejected / noise / contradictory findings

- **Rejected:** preserving v3 panel/card structure because prior release documents constrained redesign. v4 explicitly removes that ceiling.
- **Rejected:** a pure asset-swap/CSS-polish program as sufficient for v4. Evidence across A1/A4 shows IA and composition debt, not only artwork debt.
- **Rejected:** another global `visual-polish`/`phase-b` overlay, uncontrolled `!important`, viewport-specific patch piles, `overflow:hidden` masking, duplicate mobile/desktop runtimes, or copied legacy components.
- **Rejected:** treating all pages identically for design consistency. BibleQuest needs shared primitives plus distinct experience families: editorial Study, playful Games, contemplative Reflection, relational Community, operational Ministry/Admin.
- **Rejected:** assuming current runtime already has route-lazy modules. A3 corrected this; primary bootstrap evidence confirms eager static imports.
- **Rejected:** merging Private Notes/Cloud Notes or device/cloud Couples storage simply to simplify navigation. Visual/IA unification is acceptable; storage ownership changes require explicit functional/privacy approval.
- **Rejected:** moving role/auth checks into UI visibility. Hidden controls are not authorization; congregation capability/RLS/session owners remain authoritative.
- **Rejected:** changing doctrine/source/provenance policy content as part of Learn/Reader visual restructuring.
- **Rejected:** treating "it fits at 320 px" as sufficient responsive quality. v4 requires intentional mobile composition and larger-screen use of space.
- **Rejected:** speculative backend, PWA or router changes to achieve visual effects when the same result can be produced in presentation owners.

### 8.6 Recommended next bounded redesign tranche

**Recommended tranche for captain consideration: v4 Foundation + Shell + Home + More, with no backend/schema changes.** This has the highest leverage because every later page inherits its typography, spacing, iconography, responsive regions, safe-area behavior and navigation context.

Boundaries for this tranche:

1. Define the compact v4 visual/layout primitives and begin replacing the stacked CSS ownership model without deleting unrelated legacy styles in bulk.
2. Redesign `src/ui/shell.js` presentation and responsive chrome while preserving the existing router/session/progress owners and current five destinations unless the captain separately approves IA changes.
3. Redesign Home around the existing Daily Journey/progress/media/tutorial actions; no new recommendation service.
4. Rebuild `More` as grouped Personal/Planning, Community, Ministry/Leader, and App/Device sections while keeping every current destination reachable and authorization in existing services.
5. Preserve full XL text scale and add safe-area-aware shell geometry as part of the foundation.
6. Add/extend focused browser coverage for shell/Home/More across 320/360/390/412/430, tablet and desktop before proceeding to Learn/Reader.

A second bounded tranche should then target Learn + Reader + Notes entry IA. Games/Kids can follow with stronger art/game feel once the shared shell/layout foundation is stable. Operational Ministry/Assignments/Workspace/Admin should be redesigned after the responsive/task primitives are proven, with A3 review for role/privacy boundaries.

### 8.7 Risks / decisions requiring captain approval

- Whether the five primary shell destinations remain `Home / Learn / Play / Grow / More`, or whether Journey/Community/Planning replaces part of that model.
- Whether Notes receives a new facade/entry route versus only Learn-level grouping; any new controller/state owner would need architecture review.
- Whether Couples local/cloud are presented through a new common entry route while preserving separate services.
- Whether Media + Recordings become one parent experience; player/service ownership must stay single.
- Whether route-level dynamic imports/code splitting are introduced. This is architecture/PWA work, not a visual optimization toggle.
- Any new personalized recommendation/search/global-recent-items/notification aggregation in the shell or Home.
- Any backend/schema/RLS change for redesigned shared/community/ministry surfaces.
- Any storage-key migration, sync-policy change, backup scope change, psychometric meaning/scoring change, or doctrinal/source-policy change.

### 8.8 Report freshness and remaining gaps

- A1-A4 initial v4 baselines are populated, but there is no implemented v4 candidate to validate yet.
- Most design/UX conclusions are high-confidence static evidence; exact runtime visual quality at target widths still requires browser execution after implementation.
- Account sign-out is a high-confidence code-path defect and should be runtime-reproduced as part of its fix.
- Current PWA evidence establishes resource-observation warmup + runtime caching, but no v4 asset/code-splitting behavior exists yet; do not infer future offline guarantees.
- Current reports do not establish a v4 route × width automated acceptance matrix. That should be built/expanded as implementation starts, sourced from the authoritative route inventory rather than a stale manually copied list where practical.
- A3 identifies an important backend test gap: current evidence does not prove all Supabase migrations/RLS against a real scratch Postgres environment. This becomes mandatory before any v4 backend-affecting change, but it does not block presentation-only redesign.

<!-- A5-COMPILED-END -->

## 9. Captain decisions / implementation notes — captain-maintained

Do not let scheduled agents edit this section.

- 2026-09-12: v4 transition established. Design constraints are intentionally loosened; page-level redesign is allowed. Agents remain analysis/reporting only.
