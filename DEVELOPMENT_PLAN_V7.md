# BibleQuest V7 Development Plan

Updated: 2026-09-13 JST
Status: **PLANNED / BLOCKED BY V6**
Authority before activation: this document
Future active authority: `V7_ACTIVE_STATUS.md`
Required baseline: exact accepted V6 production SHA after V6 Phase 12
Depends on: the certified V6 engine

## 1. V7 line in the sand

V5 completes the product. V6 replaces the engine. **V7 performs the full product overhaul using that engine.**

V7 is deliberately broader than a motion/sound polish pass. It may substantially redesign page composition, navigation treatment, information hierarchy, interaction patterns, component structure, responsive behavior, visual language, artwork placement, motion, sound and cross-page cohesion.

V7 does **not** create another backend/client engine. It consumes the V6 app kernel, repositories, tenant context, Reader/content engine, Games engine, media engine, notification/sync engine, component/design-token system and motion/sound registry. If the V6 engine lacks a genuinely reusable capability, that gap is fixed at the engine layer rather than bypassed with page-specific hacks.

## 2. Goal

The V7 target is a BibleQuest that feels like one deliberately designed modern application rather than a set of independently modernized pages.

The overhaul must achieve all of the following together:

- coherent app shell/navigation and page hierarchy;
- polished responsive layouts across phone/tablet/desktop;
- consistent component behavior and state presentation;
- page-family-specific visual identity without fragmentation;
- complete replacement of legacy-looking UI patterns where the V6 engine makes a better pattern possible;
- motion/sound/haptics used intentionally and accessibly;
- consistent loading/empty/offline/error/unauthorized experiences;
- preserved privacy, security, data and feature behavior from V5/V6;
- measurable performance and accessibility budgets.

## 3. V7 freedom and limits

### V7 may change

- page layouts and information architecture;
- navigation placement/treatment and route composition;
- cards, panels, dialogs, sheets, forms and controls;
- responsive composition and density;
- typography, spacing, depth and visual hierarchy;
- artwork/icons/backgrounds and contextual illustrations;
- interactions, progressive disclosure and onboarding flows;
- transition/motion/sound/haptic treatment;
- feature presentation as long as accepted capability remains available and secure.

### V7 may not silently change

- server authorization/RLS/privacy rules;
- user data meaning or ownership;
- feature availability accepted by V5/V6;
- Bible translation licensing constraints;
- tenant isolation;
- privileged admin semantics;
- engine contracts merely to solve one page's cosmetic problem.

Any intentional product-contract change requires explicit acceptance and corresponding tests/evidence.

## 4. Execution model

V7 uses one serialized integration stream with page-family tranches. Each tranche:

1. starts from the certified V6 engine and current V7 integration tip;
2. inventories the full route/state matrix for the target family;
3. designs the new composition and interaction model before coding;
4. uses only V6 engine/component/motion/sound primitives unless a reusable engine gap is proven;
5. migrates bounded surfaces and removes superseded page-specific legacy code;
6. validates mobile/tablet/desktop, keyboard/touch, reduced motion, sound disabled, offline/error states and performance;
7. runs accumulated regression/security/browser/PWA evidence;
8. updates `V7_ACTIVE_STATUS.md` and V7 acceptance evidence.

No tranche should preserve an outdated V4/V5 page structure merely because it exists. The point of V7 is to use the engine to redesign confidently.

---

# Phase 0 — Full-app overhaul inventory and design language

## Work

- complete route/surface inventory, including member, leader and admin states;
- map every page to a product family and primary user job;
- define global shell/navigation model;
- define page hierarchy, spacing, typography, component and responsive rules;
- define family-specific visual registers: Explore/Journey, Play, Learn/Read, Grow/Reflect, Community, Ministry/Admin;
- complete motion/sound/haptic moment-to-preset registry using V6 engine capabilities;
- define accessibility/performance budgets and visual-regression strategy;
- identify every legacy UI pattern to retire.

## Exit gate

A complete overhaul map exists with no major route/family omitted and every shared interaction mapped to canonical V6 components/presets.

---

# Phase 1 — App shell, navigation, Home/Explore/Journey

Overhaul the highest-traffic product frame first:

- global shell/header/bottom or adaptive navigation;
- Home/Explore hierarchy and Continue My Journey prominence;
- Daily Journey progression/resume/completion;
- Bible World and Calendar composition;
- notification/account access patterns;
- responsive behavior from narrow phone through desktop;
- route transitions and primary completion feedback.

## Exit gate

The app shell and daily journey feel coherent on phone/tablet/desktop and all existing critical flows remain reachable and persistent.

---

# Phase 2 — Learn / Reader / Study overhaul

Use the V6 Reader/content engine to redesign without monolithic-render constraints:

- Reader navigation/chapter controls;
- translation/furigana/vocabulary presentation;
- search and verse/context tools;
- Guided Study / Smart Review / contextual learning flows;
- offline/download states;
- calm editorial motion/sound register;
- legal/licensed translation handling remains explicit.

## Exit gate

Reader/Study family is visually and behaviorally unified, supports online/offline states clearly and passes representative translation/device/accessibility matrices.

---

# Phase 3 — Play / Games / Kids / Avatar overhaul

Use the V6 Games engine and component layer for the most playful family:

- launcher/discovery;
- individual game family UIs;
- shared question/feedback/result/score patterns;
- Memory Meadow and visual assets;
- Avatar/achievement/unlock presentation;
- solo/local-multiplayer flows;
- stronger animation/sound/haptic use within accessibility preferences.

## Exit gate

Every game family follows the shared engine/UI language while retaining its own personality; no legacy monolithic visual path remains live.

---

# Phase 4 — Grow / Reflect / Transformation overhaul

Redesign reflective/personal-growth experiences with a calm, private register:

- progress and reflection flows;
- Transform/assessment presentation;
- Personality/Profile/Psychometrics presentation where retained;
- Notes/reflection continuity;
- save/recovery/error states;
- privacy messaging and boundaries.

No playful/game treatment should trivialize private reflection content.

---

# Phase 5 — Community / Congregation / Couples overhaul

Redesign relational surfaces around people and context:

- congregation home/directory/context switching;
- Journey Groups/Teams;
- Live Rooms;
- Couples/Family/Cloud features;
- Recognition/Encouragements;
- community notification/deep-link flows;
- warm but non-gamified relational motion/sound language.

## Exit gate

Community flows remain tenant-safe and role-safe while becoming much easier to understand and navigate.

---

# Phase 6 — Ministry / Leader / Admin overhaul

Use the V6 engine to give operational surfaces a mature professional treatment:

- Leader Center;
- Assignments/review/follow-up;
- group/team management;
- Content Review/moderation;
- Admin Console and privileged actions;
- role/tenant context clarity;
- restrained functional micro-feedback only.

## Exit gate

Operational tools are efficient, trustworthy and clear without game-like decoration; role/privacy boundaries remain independently enforced.

---

# Phase 7 — Media / Notifications / Settings / Account overhaul

Redesign cross-cutting utility experiences:

- Videos/Recordings/player surfaces using V6 media engine;
- playlists/resume/PiP presentation;
- Notification Center and push preferences;
- offline/download/storage management;
- account/security/recovery/settings;
- install/update/PWA state;
- consistent permission/error/recovery UI.

---

# Phase 8 — Cross-page cohesion, motion, sound and visual-completion pass

This is the full-system pass that family-by-family work cannot do alone.

- consistent route transitions;
- one canonical treatment for completion/error/success/notification moments;
- registered motion/sound presets only;
- no one-off animation/audio implementations without registry justification;
- visual spacing/typography/depth consistency;
- empty/loading/offline/error/unauthorized consistency;
- artwork/icon completeness;
- reduced-motion/sound-off matrix;
- performance and memory regression review;
- accessibility sweep across every route family.

## Exit gate

A whole-app audit finds no major legacy UI, unregistered motion/sound, inconsistent state treatment or unexplained family drift.

---

# Phase 9 — Integrated V7 certification and promotion

## Required evidence

- complete route/surface acceptance matrix;
- full accumulated feature/security/database/browser/PWA regression;
- responsive matrix across representative phone/tablet/desktop sizes;
- keyboard/focus/contrast/text-scaling checks;
- reduced-motion and sound-off/on matrices;
- physical-device audio-unlock/haptic verification where applicable;
- performance/bundle/runtime budgets;
- exact-SHA candidate freeze and rollback plan.

## Exit gate

One exact V7 candidate is accepted as the fully overhauled BibleQuest production application.

## 5. Definition of done

V7 is complete only when:

- **Full** — every active product family and route is covered, not merely the most visible pages.
- **Overhauled** — pages use the V6 engine/component system and no longer preserve obsolete structures by default.
- **Coherent** — shared concepts use shared components/presets and navigation/state language across families.
- **Appropriate** — Play can be expressive, Reader calm, Community warm and Ministry/Admin restrained without becoming visually disconnected.
- **Accessible** — motion, sound, haptics and visual complexity remain controllable and understandable.
- **Safe** — all V5/V6 privacy/security/data guarantees still hold.

V7 is the product transformation version. V6 builds the engine that makes this breadth safe.