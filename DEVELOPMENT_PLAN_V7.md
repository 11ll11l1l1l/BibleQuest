> **2026-10-07 RELEASE RESET:** Remaining V7 work is now governed by `V7_ACTIVE_STATUS.md`, `docs/v7/V7_RELEASE_RESET_20261007.md`, and issues #1300–#1303. The phase-specific A–D map below is retained as historical development context only. The old A1/A2/A3/A4 structure is retired. The reset explicitly brings the 150–300 devotional build plus TL/CEB/ILO translations into V7 and replaces human/manual release gates with fail-closed automated policy/evidence where technically possible.

# BibleQuest V7 Development Plan

Updated: 2026-10-04 JST
Status: **ACTIVE — NARROWED SCOPE**
Active authority for progress: `V7_ACTIVE_STATUS.md`
Operational authority: `work/RULEBOOK.md`
Development branch: `v7/development`
Production baseline: V6 `7997d60e6069aa406ec005c32e33e46fee39bc12`

## 1. V7 line in the sand

**BibleQuest V7 = Library + structured ONE 2 ONE discipleship.**

V7 is intentionally smaller than the previous full-product-overhaul proposal. It builds two coherent product systems on the released V6 engine:

1. a reusable Library for Books, Devotionals and Past Teachings; and
2. a structured ONE 2 ONE discipleship journey for mentors and mentees.

V7 must reuse the V6 app kernel, authentication, tenant context, Reader/content engine, assignments/deep-link capabilities, PWA/offline foundation, localization system, notification infrastructure and design/component system. V7 does not rebuild those systems unless an actual V7 requirement exposes a bounded reusable gap.

The purpose of the narrowed scope is to deliver a complete, releasable discipleship product instead of combining unrelated realtime, media-storage, localization-rollout and content-expansion projects in one release.

## 2. In scope

### Library

- Library landing and navigation.
- Books MVP: metadata, browse/detail presentation and legitimate external links; hosted book content only where licensing permits.
- Devotionals MVP: browse/detail, life-topic discovery and representative source-valid/public-domain content.
- Past Teachings MVP: structured teaching/article model, browse/detail and representative converted content.
- Shared categories, tags, topics, filtering and search across Library content.
- Source/provenance/licensing metadata appropriate to each content type.
- Multilingual-ready content contracts using existing V6 localization architecture.

### ONE 2 ONE discipleship

- Mentor/mentee pairing and relationship state.
- Tracks → modules → lessons hierarchy.
- Leader/authorized authoring and assignment/start flow.
- Lesson runner with the canonical sequence:
  `Scripture → Understand → Discuss → Reflect → Apply → Pray → Action`.
- Progress, reflection, prayer/action and completion state.
- Correct congregation/role/privacy boundaries.
- QR/deep-link entry where useful.
- Bounded reuse of existing V6 assignment, Scripture and communication capabilities rather than duplicate systems.

### Supporting V7 work

- Minimum navigation/app-shell wiring required to expose the new features.
- Minimum content/media references required inside Library or lessons using existing V6 capabilities.
- Accessibility, responsive behavior, localization readiness, PWA/offline compatibility and performance for the changed surfaces.
- Ilocano-compatible contracts only; no full Ilocano Bible or UI rollout in V7.

## 3. Explicit V7 non-goals — moved to V8

The following are not V7 release requirements and must not expand a V7 lane unless the user explicitly changes scope:

- Leader Conversation Deck.
- Participant broadcast and realtime small-group session engine.
- Central Google Drive media ingest/storage pipeline.
- Full media moderation workflow and storage-provider project.
- Full Ilocano Bible rollout.
- Full Ilocano application UI rollout.
- Bulk devotional corpus ingestion.
- Bulk Past Teachings/sermon conversion.
- Large/expanded Books catalog or broad hosted-book program.
- Couples expansion and new Couples question bank.
- Advanced/personalized recommendation engine and deeper content discovery beyond the V7 Library MVP.
- A second whole-app visual redesign unrelated to Library/ONE 2 ONE.

These are recorded once in `DEVELOPMENT_PLAN_V8.md`. `docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` is retained as historical planning input only and is **not an active V7 requirement**.

## 4. Execution model from the rulebook

V7 uses bounded parallel preparation/implementation with serialized integration.

For every parallel lane:

1. record the exact `v7/development` starting SHA;
2. give the chat one concrete outcome, owned surface/files, exclusions, affected existing checks and handoff destination;
3. use a dedicated task branch such as `v7/p2-a-books`;
4. produce implementation/evidence, not repeated repository-wide analysis;
5. do not edit another lane's owned surface or shared status authority without explicit handoff;
6. refresh from the live integration head before merge;
7. integrate one ready change at a time and run the checks affected by the combined change.

Single-owner/shared surfaces include migrations/schema ordering and generated DB contracts, global router/navigation wiring, service worker/PWA policy, deployment/workflow configuration, `V7_ACTIVE_STATUS.md`, and release-candidate identity. Parallel lanes consume these surfaces or request a serialized change; they do not race to modify them.

Use the smallest checks that detect the risk introduced by the change. Full accumulated regression belongs at phase/integration/release boundaries, not after every small edit. Existing V6 evidence remains valid unless V7 changes its inputs or exposes an actual regression.

### Persistent lane command contract

Lane letters A, B, C and D persist for the entire V7 lifecycle. The user does **not** need to know or specify the current phase.

The command:

`Continue V7 lane A`

means: resolve the current eligible V7 assignment for persistent lane A from the live repository and continue execution immediately.

The same applies to lanes B, C and D.

Required behavior:

- read the live `V7_ACTIVE_STATUS.md` and current `v7/development` head first;
- determine which phase is currently active/eligible and which assignment belongs to the requested lane letter;
- continue unfinished work for that lane if present;
- when that lane's current assignment is complete and the next same-letter assignment is eligible, continue directly into it without asking the user for the next phase;
- when an entire phase exit gate is satisfied, advance to the next phase rather than stopping merely because the previous phase finished;
- if another lane still blocks a genuine shared gate, do not fabricate readiness; perform safe non-overlapping gate-closing work or record the exact dependency;
- P2 and P3 may overlap after P1 contracts are frozen, as already permitted below;
- optional lane E in P3 is supplemental only and never changes A–D continuity;
- after V7 release is complete, a V7 continuation command reports completion and stops; it does not silently begin V8.

Persistent lane map:

| Lane | P0 | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|
| **A** | Domain/data contracts | DB/RLS/generated contracts | Books MVP | Pairing + relationship security | Library UX/a11y evidence | Browser/mobile/a11y release evidence |
| **B** | UX/information architecture | Library core | Devotionals MVP | Tracks/modules/lessons authoring | ONE 2 ONE journey evidence | Backend/RLS/security release evidence |
| **C** | Security/privacy/tenancy | Discipleship core | Past Teachings MVP | Mentee lesson runner | Backend/RLS/privacy hardening | Build/PWA/offline/performance release evidence |
| **D** | Acceptance/content/provenance | Taxonomy/provenance/localization | Library discovery | Progress/reflection/prayer/action | Cross-cutting regression | Content/provenance/localization release evidence |

P3-E remains an optional extra lane for QR/deep-link/V6 integration bridges. If lane E is not separately active, the integration owner assigns that bounded work to an available lane without changing the persistent A–D meanings above.

---

# Phase 0 — Scope freeze and contracts

Goal: freeze the narrowed V7 product/data/security/acceptance contracts before runtime implementation.

Run at least four independent chat lanes in parallel:

### P0-A — Domain and data contracts

Owns:
- Library entities and relationships;
- Books/Devotionals/Past Teachings common and type-specific metadata;
- taxonomy/tag/topic model;
- ONE 2 ONE relationship, track/module/lesson and progress-state contracts;
- minimum content/media reference interfaces.

Must not implement central Drive/media storage, realtime groups or V8 systems.

### P0-B — UX and information architecture

Owns:
- Library navigation and main journeys;
- Books/Devotionals/Past Teachings browse/detail flows;
- ONE 2 ONE mentor and mentee journeys;
- lesson-runner sequence and progressive disclosure;
- mobile-first route/surface map.

Must not redesign unrelated V6 product families.

### P0-C — Security, privacy and tenancy

Owns:
- mentor/mentee visibility and mutation matrix;
- author/leader/pastor/admin capabilities required by V7;
- congregation scoping and denial cases;
- private reflection/progress boundaries;
- deep-link/session authorization requirements.

Must preserve backend authority/RLS and existing V6 tenant rules.

### P0-D — Acceptance, content and provenance

Owns:
- V7 feature acceptance matrix;
- evidence type for each acceptance item;
- source/licensing/provenance requirements;
- representative fixture/content policy;
- multilingual/i18n readiness criteria;
- explicit V8 transfer/non-goal manifest.

### Phase 0 exit gate

- V7 scope and V8 deferrals are unambiguous.
- Shared data/domain/security contracts are agreed.
- Route/user-journey map is agreed.
- Acceptance/evidence expectations exist before implementation.
- No V7 implementation depends on an undefined central-media/realtime/Ilocano-rollout system.

---

# Phase 1 — Shared V7 foundation

Goal: build the minimal reusable foundation for Library and ONE 2 ONE without feature-family collisions.

Run four parallel lanes:

### P1-A — Database / RLS / generated data contracts

Sole owner for V7 schema migrations, RLS/policy changes and generated DB contracts during this phase.

Deliver:
- accepted Phase-0 schema;
- append-only migrations;
- relevant positive and denial fixtures/checks;
- generated types/contracts required by other lanes.

### P1-B — Library core

Deliver:
- Library domain/service/repository layer;
- content-type registration/interfaces;
- Library shell and bounded route integration interfaces;
- common content presentation/state contracts.

### P1-C — Discipleship core

Deliver:
- ONE 2 ONE domain/service/repository layer;
- pairing, curriculum hierarchy and progress interfaces;
- shell/route integration interfaces;
- explicit boundaries to existing assignments/Reader/communications.

### P1-D — Taxonomy, provenance and localization foundation

Deliver:
- categories/topics/tags contracts;
- source/license/provenance handling;
- multilingual-ready content fields and UI-string ownership;
- content fixtures/import format for representative V7 content.

Ilocano compatibility is allowed; a full Ilocano rollout is not.

### Integration order

Integrate ready work serially, normally P1-A → P1-B → P1-C → P1-D, rebasing/refreshing each next candidate onto the current integration head. Global route/navigation wiring is a bounded integration-owner change after lane contracts are ready.

### Phase 1 exit gate

Library and ONE 2 ONE have stable shared foundations, RLS/data authority is defined, and feature lanes can implement without creating competing schema or infrastructure.

---

# Phase 2 — Library MVP

Goal: deliver a complete but bounded Library rather than a bulk-content project.

Run four parallel lanes:

### P2-A — Books MVP

- browse/detail;
- metadata, source/licensing fields;
- legitimate external links;
- representative catalog entries;
- no large catalog ingestion requirement.

### P2-B — Devotionals MVP

- browse/detail;
- life-topic/category discovery;
- representative public-domain/source-valid content;
- clear source/provenance;
- no bulk corpus requirement.

### P2-C — Past Teachings MVP

- browse/detail/article presentation;
- structured teaching metadata;
- representative sermon/teaching-to-article examples;
- provenance to original source;
- no bulk historical conversion requirement.

### P2-D — Library discovery

Sole owner for shared Library discovery behavior:
- landing page;
- cross-type search;
- categories/topics/tags;
- filtering/sorting where required;
- empty/loading/offline/error states.

### Phase 2 exit gate

Books, Devotionals and Past Teachings are reachable through one coherent Library, representative content works end-to-end, and discovery does not require a V8 bulk-content pipeline.

---

# Phase 3 — ONE 2 ONE MVP

Goal: deliver the end-to-end mentor/mentee discipleship experience.

Run at least four lanes; five are preferred because the surfaces are naturally separable:

### P3-A — Pairing and relationship security

- mentor/mentee relationship lifecycle;
- congregation and role checks;
- relationship visibility;
- allow/deny paths and account/congregation-switch handling.

### P3-B — Tracks/modules/lessons authoring

- curriculum hierarchy;
- authorized create/edit/publish/archive behavior;
- lesson-step content model presentation;
- assignment/start preparation.

### P3-C — Mentee lesson runner

Implement the canonical flow:
`Scripture → Understand → Discuss → Reflect → Apply → Pray → Action`.

Own mobile lesson navigation, step states, resume and completion UX.

### P3-D — Progress, reflection, prayer and action state

- persisted progress;
- reflection/private-state boundaries;
- action/prayer state;
- completion/resume behavior;
- safe recovery/error behavior.

### P3-E — QR/deep links and V6 integration bridges

- QR/deep-link entry;
- session hydration/protected route behavior;
- bounded reuse of V6 assignments, Reader and existing communications where useful;
- no new messaging platform.

Any newly discovered schema/RLS requirement is routed through the serialized schema owner rather than independently migrated by multiple P3 chats.

### Phase 3 exit gate

An authorized leader/mentor can establish a discipleship path, a mentee can enter and complete lessons, and progress/resume/privacy/tenancy work correctly end-to-end.

### Phase 2 / Phase 3 concurrency

After Phase 1 contracts are frozen, substantial parts of Phase 2 and Phase 3 may execute concurrently because their runtime ownership is separate. Their merges remain serialized onto `v7/development`.

---

# Phase 4 — Integrated hardening and acceptance

Goal: find integration defects without sending multiple chats to patch the same system.

Run four independent evidence lanes:

### P4-A — Library browser/mobile/accessibility

Certify Library journeys, responsive states, keyboard/focus/contrast, language switching and affected offline/error behavior.

### P4-B — ONE 2 ONE browser/mobile/role journeys

Certify mentor/mentee/author journeys, deep links, resume/completion and representative device-width behavior.

### P4-C — Backend/RLS/security/privacy

Certify affected positive paths plus tenant/role/relationship denial, private-state boundaries and account/congregation switching.

### P4-D — Cross-cutting regression

Certify affected app-shell/navigation, PWA/offline, build/bundle/performance, localization and representative inherited V6 flows touched by V7.

Certification lanes report exact defects. Fix ownership is then assigned once per defect/surface; all four lanes do not race to patch the same failure.

### Phase 4 exit gate

All machine-solvable V7 acceptance requirements are green or have an explicit bounded blocker, and affected inherited V6 behavior has no unresolved regression.

---

# Phase 5 — Exact-SHA V7 release certification and promotion

Parallel preparation/evidence may use four lanes, but release-candidate ownership and promotion are serialized.

### P5-A — Browser/mobile/accessibility evidence

### P5-B — Backend/RLS/security evidence

### P5-C — Build/PWA/offline/performance/regression evidence

### P5-D — Content/provenance/localization evidence

Then one integration/release owner:

1. freezes one exact V7 candidate SHA;
2. runs or reuses valid required gates for that exact candidate;
3. deploys/verifies the exact candidate artifact in the supported preview/test path;
4. obtains genuine backend/device/live evidence where the governing requirement needs it;
5. keeps PASS, OPEN, FAIL and OWNER-WAIVED distinct;
6. promotes the exact certified candidate through the existing production process;
7. verifies deployed identity and essential production smoke;
8. retains the verified V6 rollback reference until post-production verification is complete.

A source/build change after candidate freeze creates a new candidate and reruns the affected certification. Static evidence does not replace browser/backend/device evidence.

## 5. Definition of done

V7 is complete when:

- one coherent Library exposes Books, Devotionals and Past Teachings with bounded real/representative content and valid provenance;
- ONE 2 ONE pairing, authoring, lesson execution and progress work end-to-end with correct privacy/tenancy;
- QR/deep-link and bounded V6 integrations work where included;
- changed surfaces meet the required responsive/accessibility/i18n/PWA/performance expectations;
- V7 has not weakened inherited V6 auth/RLS/privacy or broken affected released flows;
- all required acceptance evidence is attached to one exact release candidate;
- V8 features have not leaked into V7 merely because a future extension point exists.

V7 is a focused discipleship release: **Library + ONE 2 ONE, finished and releasable.**
