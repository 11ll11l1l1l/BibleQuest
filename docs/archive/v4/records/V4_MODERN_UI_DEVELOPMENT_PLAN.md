# BibleQuest V4 Modern UI Development Plan

## Objective

Take BibleQuest from a functional application that still reads visually like an internal rebuild into a modern, polished, app-like and selectively game-feeling product **without regressing behavior that already works**.

V4 is a presentation and experience overhaul, not an architectural rewrite. The stable V3 service/state model remains the application foundation.

## Authority and operating model

- Active implementation branch: `v4/modern-ui-overhaul`.
- This file is the governing V4 development plan.
- `V4_REPORT_INDEX.md` is the captain-readable live status/index and must stay synchronized with this plan.
- Repository evidence overrides stale chat context or old status summaries.
- The human/chat captain is the only V4 implementation integrator.
- V4 agents are analysis/reporting-only unless the user explicitly changes that rule. They do not autonomously merge runtime changes.
- Preserve the V3 single-owner architecture. V4 must not create competing owners for auth, routing, storage, Bible data, progress, scoring, media, sessions, or backend calls.
- Rebuild-and-verify remains the delivery rule. Prefer deliberate shared primitives and route migrations over accumulating another generation of visual patches.

## Why the current UI needs V4

The starting problem is concrete rather than subjective:

1. **Application chrome reads like a development build.** The inherited shell used a plain `BQ` mark, a `Rebuild v3` subtitle, and Unicode navigation symbols. V4 has already begun replacing this, but the shell remains a primary system-level migration target.
2. **Too many pages share the same undifferentiated primitives.** `bq-panel`, `bq-primary-button`, and `bq-secondary-button` make unrelated experiences such as quizzes, notes, administration, and media feel structurally identical.
3. **Iconography and artwork are inconsistent.** Emoji/Unicode placeholders and feature-local visual conventions make the application feel prototype-like. V4 uses one trusted SVG icon language and deliberate artwork where the experience benefits from it.
4. **Presentation ownership is fragmented.** The inherited `index.html` loads many feature styles plus numerous `*-visual-polish.css` overlays. V4 must progressively move migrated routes toward explicit shared/family/route ownership rather than add indefinite override layers.

None of these issues justify replacing the working V3 service/state architecture.

## Experience-family model

Every V4 page belongs to an experience family. All families share the same structural design system underneath, while each family is allowed a controlled visual personality.

| Experience family | Primary pages | Personality | V4 direction |
| --- | --- | --- | --- |
| **Explore / Home / Journey** | Home, Daily Mission, Progress, Bible World, Personal Mission, Calendar | Warm, aspirational, quest-like | Dashboard composition rather than stacked generic panels; one dominant continuation action; streak/progress as visual rhythm; Bible World as explorable progression rather than a plain list. |
| **Learn / Read / Study** | Learn hub, Reader, Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning/Review, Open Review | Mature, editorial, calm | Scripture typography is the visual anchor; organize Learn into meaningful categories; distinguish learning modes without turning all of them into the same quiz card. |
| **Play / Games / Avatar** | Games launcher, Memory Meadow, Detective, Timeline, Recall, Kids modes, Avatar Vault | Playful, tactile, collectible | Real card/icon artwork instead of emoji placeholders; coherent game HUD; satisfying reduced-motion-safe completion/unlock feedback; Avatar Vault as a collectible/vault experience with clear locked/unlocked states. |
| **Grow / Reflect** | Transform, Personality Profile, Psychometrics, Private Notes, Cloud Notes | Personal, spacious, contemplative | More whitespace and fewer stacked cards; clear visual privacy/sync state; calmer hierarchy for reflection and personal material. |
| **Community / Relational** | Community, Couples, Journey Groups, Live Rooms, Media/Recordings, Encouragements | Human, warm, trustworthy | People-first layouts using identity, presence and relationship context rather than generic list rows; richer empty/live states. |
| **Ministry / Ops / Admin** | Ministry Hub, Assignments, Workspace, Notifications, Congregation, Content Review, Admin Console, Account | Restrained, professional, high-trust | Status chips, tables where appropriate, strong permission/role cues, due-date/status/privacy hierarchy, minimal decorative game treatment. |

### Shared system underneath every family

All experience families must reuse:

- one SVG icon family with consistent stroke, optical size and state behavior;
- one typography scale with explicit UI, display and Scripture roles;
- one spacing scale and responsive layout vocabulary;
- one surface/card/elevation system;
- one form/control/status system;
- one focus language and accessibility baseline;
- one motion language whose animations are purposeful and always have reduced-motion fallbacks;
- one responsive breakpoint strategy and no-horizontal-overflow requirement.

Families may reskin shared primitives through semantic tokens. They must not fork them into incompatible mini design systems.

## Presentation ownership and CSS migration

V4 must improve CSS ownership rather than merely append more polish files forever.

1. `src/ui/v4-foundation.css` is the shared V4 token/primitive compatibility layer while migration is underway.
2. Family-level styling should be introduced only when multiple routes genuinely share the same experience language.
3. Route CSS owns route-specific composition; it does not duplicate global primitives.
4. Existing `*-visual-polish.css` files remain until their owning route/family has been migrated and verified.
5. Redundant inherited polish may be removed **only after** the replacement route passes its full regression/browser gates.
6. Do not perform a wholesale stylesheet cleanup during an unrelated page redesign.

## Change classes

To prevent visual work from silently becoming architecture work, every tranche is classified before implementation.

### Class A — route presentation

Typical scope: `src/features/<feature>/index.js` presentation markup, route/family CSS, artwork/icon references, accessibility labels that do not change feature behavior.

- No new service owner.
- No change to persisted state, scoring, question selection, Bible data, auth, backend contracts, or storage semantics.
- Existing data hooks and route actions must remain valid unless the tranche explicitly documents an intentional UI contract migration.

### Class B — shared presentation foundation

Typical scope: shell presentation, icons, shared primitives, typography, spacing, motion, surfaces, form controls, status badges, family tokens.

- May affect multiple screens visually.
- Must remain service/state agnostic.
- Requires wider visual regression coverage because it has a larger presentation blast radius.

### Class C — behavior, data or infrastructure

Typical scope: bootstrap validation, service dependency ordering checks, API/service contracts, state behavior, new data requirements.

- Must be isolated from visual tranches.
- Requires its own architecture/edge/regression evidence.
- A visual redesign that appears to require Class C work must stop and split that requirement into a separate tranche.

## Three non-breakage rules

### Rule 1 — Never change the service layer merely to accomplish a visual redesign

A redesign should consume the feature's existing services and state through the established presentation boundary. If a page genuinely needs new data or behavior, classify that as separate Class C work, document why it is necessary, and verify it independently.

### Rule 2 — One page or tightly related group per independently verified tranche

Each implementation tranche follows this lifecycle:

1. Start from the current verified/captain-approved checkpoint.
2. Make the smallest coherent visual or experience change.
3. Add or extend static contract coverage appropriate to the tranche, including preservation of critical hooks/ownership boundaries.
4. Run the applicable existing architecture validators, edge tests, and full browser/mobile Playwright regression suite against the **exact candidate commit**.
5. Freeze an explicit rollback/checkpoint ref before integrating the next significant page/family tranche.

A later redesign failure must not make already verified V4 work difficult to recover.

### Rule 3 — Close the startup wiring failure class before accelerating V4

The plan records a previously reproduced failure class in `src/app/bootstrap.js`: invalid service construction/dependency ordering can make the whole application fail during startup and surface as a generic application timeout.

Before broad V4 route migration resumes, create a separate Class C infrastructure safety-net tranche that:

- detects invalid bootstrap dependency/wiring order deterministically and early;
- fails with an actionable diagnostic rather than a generic timeout where practical;
- includes a regression test that demonstrates the known misordering class is caught;
- preserves normal startup behavior when dependencies are correctly wired;
- does not become a second bootstrap/runtime owner.

This infrastructure tranche is not a reason to restructure otherwise working application services.

## Verification contract for every V4 candidate

Executed evidence is required. A successful GitHub push or static inspection alone is not a test pass.

For each applicable candidate SHA:

- run existing architecture/single-owner validators;
- run relevant feature edge/regression tests;
- run the full browser/mobile Playwright suite before a page/family tranche is declared certified;
- verify representative widths at **320, 375, 768 and 1024 px**;
- verify no horizontal overflow on required mobile routes;
- preserve approximately 44 px minimum interactive targets wherever existing V3 accessibility contracts require them;
- verify keyboard focus visibility and logical order;
- verify `prefers-reduced-motion` behavior;
- verify stronger-contrast mode/readability;
- verify status, error, selected and disabled states do not depend on color or decoration alone;
- verify the same route/service owners receive the same actions after presentation changes;
- verify critical `data-*` hooks used by existing tests/runtime are preserved or intentionally migrated together with their tests;
- record any test/browser check that could not be executed as **open**, never as implicitly passing.

Shared-foundation changes receive broader route sampling than isolated route changes because their visual blast radius is larger.

## Revised V4 execution order

This is the default development sequence, ordered by safety and leverage.

1. **Infrastructure safety net** — bootstrap dependency/wiring-order fail-fast guard and regression coverage.
2. **V4 foundation certification** — icon system, typography scale/asset decision, spacing, surfaces/elevation, controls/status, focus, motion and responsive rules.
3. **Global shell / navigation** — finish/certify brand, real icons, navigation states, session/progress chrome, responsive shell behavior; remove all visible internal-rebuild language.
4. **Home** — convert the daily-return experience into an intentional dashboard with a dominant continuation path.
5. **Learn hub + Reader** — modernize the core Scripture/study entry path; group Learn meaningfully and give Scripture stronger editorial hierarchy.
6. **Games + Avatar Vault** — establish the Play family's art, HUD, collection/unlock and completion language.
7. **More hub** — replace flat catch-all presentation with clear information architecture and discoverability.
8. **Ministry + Assignments + Workspace + Notifications** — establish the professional/high-trust operational family early enough that later playful work cannot bleed into it.
9. **Bible World + Progress + Personal Mission + Calendar** — unify the journey/progression family.
10. **Study family** — Guided/Deep Questions, Story Journey, Wisdom, Adaptive/Open Review as distinguishable learning experiences sharing an editorial foundation.
11. **Account + Notes + Transform + Psychometrics + Accessibility** — privacy/trust/personal-reflection pass.
12. **Community + Couples + Journey Groups + Live Rooms + Media/Recordings + Encouragements** — relational, people-first pass with richer empty/live states.
13. **Admin + Content Review + Congregation + diagnostics/recovery** — final operational pass after the reusable patterns are mature.

### Parallelism rule

Once the foundation is certified, later route/family work may be **prepared in parallel on isolated branches or analysis lanes** where file ownership does not overlap. However:

- the captain remains the sole integration authority;
- agent branches remain analysis/reporting-only under the current operating rule;
- overlapping runtime implementation must not be merged concurrently;
- candidate integration/verification is serialized so each accepted checkpoint has an unambiguous parent and evidence set.

Parallel preparation is allowed; unreviewed parallel integration is not.

## What “game-like” means in V4

### Use game feel where it supports the experience

- tactile completion and unlock feedback in Games and Avatar Vault;
- collectible/vault presentation for avatar inventory;
- map/progression language for Bible World and journey surfaces;
- satisfying streak/progress feedback;
- purposeful card art and identity for game modes;
- small micro-interactions that reinforce state changes.

### Do not gamify high-trust workflows

Assignments, Ministry Hub, Admin, Account, Content Review, moderation, permissions, private responses and similar operational flows must look trustworthy and serious. They can be polished and modern without using playful reward language or decorative game treatment.

### Always

- provide a reduced-motion fallback;
- never communicate essential navigation, status, privacy, errors, permissions or correctness through decoration alone;
- preserve readability and directness over visual novelty.

## Current V4 work reconciled against this plan

Existing V4 work is retained; the new plan does **not** roll it back.

### Already implemented on `v4/modern-ui-overhaul`

- `41caa3650f0060f7b9cb0ec5e77240411bf6a17e` — Foundation A shared V4 tokens/primitives, Home composition, V4 CSS load order and initial captain index.
- `a8b6960f418fef766b51c9bde7f7efffcae196f3` — reusable shell SVG icon system and shell presentation update.

### Reclassification under the stronger master plan

Those changes are **implemented but not yet fully certified** under the new verification contract because full branch CI/browser evidence was not available at the time they were written.

Therefore:

- do not undo Foundation A, the icon system, shell work or Home work solely because this plan was adopted;
- do not treat them as a reason to skip the new infrastructure gate;
- after the infrastructure safety net is complete, certify/fill the remaining foundation controls, then obtain complete browser/regression evidence for Foundation/Shell/Home before moving into Learn + Reader.

## Checkpoint policy

For significant tranches, preserve an explicit rollback ref after verification. Recommended checkpoint progression:

- `release/v4-infra-safety-net`
- `release/v4-foundation`
- `release/v4-shell`
- `release/v4-home`
- subsequent `release/v4-<route-or-family>` checkpoints as the migration proceeds.

Checkpoint creation happens only after the candidate's required evidence is complete. A checkpoint name must point to the exact verified SHA.

## Agent reporting contract

Agent reports must stay useful to the captain rather than becoming an alternative plan authority.

- Agent findings cite current repository evidence and identify the inspected commit/ref.
- Findings distinguish verified facts, recommendations, and unresolved questions.
- Agents do not mark implementation complete from screenshots or assumptions.
- Agent recommendations are reconciled against this governing plan before implementation.
- `V4_REPORT_INDEX.md` records which findings were adopted, deferred or rejected when they materially change the execution route.

## Immediate next action

The next V4 implementation work is **not another page redesign**.

1. Implement and verify the isolated bootstrap infrastructure safety-net tranche.
2. Finish/certify the remaining shared Foundation B controls and responsive/accessibility evidence.
3. Certify Global Shell / Navigation against the full gate.
4. Certify Home against the full gate.
5. Proceed to Learn hub + Reader as the next major experience migration.

This ordering gives V4 the fail-fast protection, shared visual language and rollback discipline needed to accelerate the remaining page families safely.