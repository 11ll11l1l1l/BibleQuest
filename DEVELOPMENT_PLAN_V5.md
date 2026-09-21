# BibleQuest V5 Development Plan

> **ARCHIVED / FROZEN — 2026-09-22 JST**
>
> V5 feature development is complete. This plan is retained only as historical release evidence. Do **not** start new V5 implementation tranches, claims, or agent branches from this document. Current V5 runtime/source truth is recorded in `V5_ACTIVE_STATUS.md`; post-release V5 changes are limited to reproduced production defects. New architecture or feature-platform work belongs to V6.


Updated: 2026-09-13 JST
Authority: `V5_ACTIVE_STATUS.md`
Integration branch: `v5/feature-completion`
Execution protocol: `V5_COORDINATED_AGENT_PROTOCOL.md`
Acceptance contract: `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`

## 1. Objective

V5 finishes BibleQuest as a coherent, usable product on the current proven architecture before the architecture upgrade begins.

Strict sequence:

`V5 feature completion -> V6 engine/architecture upgrade -> V7 full overhaul`

V5 is not allowed to pre-build V6. A small local helper is acceptable only when it is the minimum safe mechanism required for an accepted V5 feature and does not replace app-wide ownership/state/build/data architecture.

## 2. Non-negotiable V5 boundary

Do not introduce a Vite/build migration, global router/state rewrite, broad TypeScript conversion, Reader/Games engine rewrite, generalized offline/background-sync platform, replacement notification engine, generalized repository/data-access layer, tenant engine, replacement media platform, generalized search/index engine, or broad visual/navigation overhaul.

When a correct implementation would require one of those, implement only the bounded current-architecture form that satisfies the accepted V5 behavior and record the replacement architecture for V6.

## 3. Execution strategy

V5 uses five coordinated agents and one serialized integration branch. A1-A4 work in parallel only on non-overlapping owners. A5 integrates one PR at a time.

Every implementation tranche must:

1. start from the exact current `v5/feature-completion` HEAD;
2. read the current authority files and recent Issue #185 claims/PRs;
3. claim exact owners/files before writes;
4. implement one coherent bounded behavior;
5. add focused regression coverage;
6. classify evidence honestly as STATIC, BROWSER-AUTO, BACKEND-E2E, or DEVICE/FIELD;
7. open a PR to `v5/feature-completion`;
8. finish with `V5-DONE`, `V5-BLOCKED`, or `V5-RELEASED` on Issue #185.

No production promotion occurs during worker runs.

## 4. Core phase plan

### Phase 1 — Leader Center

Complete the previously skipped Leader Center as a composition/navigation layer over existing Assignments, response-review, congregation, Journey Groups, Team Center, and ministry-role presence owners. Do not create a new leader backend.

Required behavior: overview, assignments/review entry, ministry-safe people view, groups/teams composition, role-safe navigation/access.

Exit gate: current-head real browser evidence that an ordinary member is denied and an authorized leader can use the intended routes. Hiding UI alone is not authorization.

### Phase 2 — Admin Console completion

Complete the user-card/admin emergency-action UI over the existing backend. Preserve severity tiers and typed confirmation for destructive actions. Complete owner-only email-change/recovery using the established Edge Function/audit/session-revocation pattern.

Exit gate: every accepted action has a usable UI/confirmation/audit path and email-change is proven against a controlled real Supabase Auth account. Static tests alone are insufficient.

### Phase 3 — Artwork/icon completion and dead-owner cleanup

Finish only honest existing-asset matches across Games, Recognition, Couples, Notification Center, and Encouragements. Codes without a genuine match remain documented exceptions.

Retire the abandoned duplicate Media Library owners only while preserving the live Recordings/Media route and updating architecture/regression contracts atomically.

Exit gate: whole-app glyph/emoji scan finds only documented exceptions and no duplicate dead Media owner remains.

### Phase 4 — Minimum real Web Push

Use the existing in-app Notification Center as the source of truth. Push is only a delivery channel.

Required behavior: account/device-safe subscription persistence, explicit category opt-in defaulting off, client PushManager lifecycle, server-side delivery for accepted notification types, same-origin tap/deep-link handling, account/sign-out cleanup, invalid subscription cleanup, no client-side private VAPID key.

Exit gate: actual device/browser receives and opens a push with the app closed; disabled push does not change existing behavior.

### Phase 5 — Baseline offline Scripture reopening

Use the existing Scripture cache/opened-content behavior. V5 supports reopening previously-opened/currently-cached Scripture and shows a clear available/unavailable state.

Do not create book-package manifests, offline mutation queues, generalized cache-everything, or a new Reader engine.

Exit gate: actual browser/device no-network reopening works for previously-opened Scripture and never-opened content fails clearly rather than blank/broken.

### Phase 6 — Multi-congregation verification and minimum tooling

Provide the minimum current-architecture active-congregation context/switcher required for users with multiple memberships. Calendar, presence, and Assignments must respect the chosen congregation.

Create/prepare a controlled second test congregation only as required to execute Gate C safely.

Exit gate: visible switching works and real cross-congregation isolation is executed with evidence. A service-level selection primitive alone is not Gate C PASS.

### Phase 7 — Verification debt

Close, with current-head evidence:

- CEBOCB Reader preservation;
- Couples Journey bidirectional sharing/privacy behavior;
- deferred V4 whole-app Section E integration checks;
- deferred Section G loading/empty/error/offline sweep.

Exit gate: explicit PASS/FAIL evidence exists for every item and any demonstrated defect is fixed with bounded regression coverage.

## 5. Cross-phase content/UX completion workstream

This workstream is required for V5 certification. It may run in parallel with Phases 1-7 only when owners are independent and dependencies are satisfied.

### P0.1 — localization foundation

This is the prerequisite for broad Tagalog/Cebuano work.

Build the smallest current-architecture localization mechanism:

- plain locale dictionaries keyed by stable string IDs;
- `en` as canonical source/fallback, `tl` next, `ceb` later;
- tiny lookup helper (`t(key)` or equivalent);
- locale choice wired through an existing safe settings/state pattern;
- deterministic English fallback and missing-key reporting/test;
- no third-party i18n framework, build change, router/state rewrite, or remote translation service.

Do not mass-edit dozens of screens before this foundation is reviewed and integrated.

### P0.2 — Tagalog coverage

After the foundation lands, migrate user-visible BibleQuest-authored strings in bounded surfaces:

1. shared shell/navigation/common controls;
2. Transformation content/UI;
3. Home/Today;
4. Calendar;
5. Assignments and Notification Center;
6. settings/profile;
7. Community/Media and remaining member surfaces;
8. leader/admin user-visible instructions and states.

Use natural ministry-appropriate Tagalog, not literal word-for-word translation. Maintain a small glossary for recurring concepts. Scripture remains sourced from approved/licensed Bible translations and is never app-translated.

### P0.3 — real Calendar

Replace agenda-only primary presentation with a true month grid over existing event data. Retain useful agenda/detail views. Add consistent event-category colors plus text/icon cues, usable mobile day selection, and preservation of personal/congregation/assignment behavior.

Do not create a new calendar backend/engine.

### P0.4 — latest completed service in Media/Recordings

Use current Recordings/Media ownership and existing stable recording/video identity.

Allowed V5 behavior:

- when the current app/data flow already knows a recording is completed and has stable identity, surface it as latest service;
- deduplicate by stable video identity;
- categorize using existing metadata first;
- authorized hide/edit correction;
- a minimal leader confirm/import step when completion cannot be inferred safely.

Explicitly deferred to V6: YouTube Data API polling, external webhooks, scheduled external discovery, ingestion daemon/service, replacement media platform.

### P0.5 — Today / This Week Home

Compose existing owners into a useful daily/weekly surface: next event, current assignment, continue reading, latest service, Transformation prompt, unread notifications. No new state engine.

### P0.6 — connected weekly spiritual journey

Connect existing service/sermon, Scripture, Transformation/reflection, discussion/prayer, assignment/action, and Calendar context through links/composition/current owners. No new workflow engine.

### P1 — content depth

- Transformation: Scripture/context -> understand -> reflect -> apply -> pray; optional family/couple discussion and weekly action.
- Pastor/leader weekly message using current content patterns.
- My Journey/reflection history from existing private signals.
- Family & Couples tracks: communication, forgiveness, stewardship/finances, intimacy/love, parenting, serving together, family Bible time, gratitude, kindness, prayer.
- Non-competitive personal milestones using existing progress where possible.
- Ask at Dinner prompt attached to relevant weekly content.

Reuse existing owners first. New durable schema is never assumed.

### P2 — Cebuano/Bisaya and discovery

- Full Cebuano/Bisaya localization using the same string-key inventory as English/Tagalog.
- CEBOCB/approved Cebuano Scripture remains Scripture source.
- Lightweight filter/search only over content already exposed/loaded by current owners.
- Existing Media/Recordings organization by available metadata/categories.

No generalized search platform or replacement media engine.

## 6. Data/storage decision rule

Before any new table/column:

1. prove existing Transformation, Assignment, Journey, Calendar, Media/Recordings, settings, or current progress owners cannot model the behavior cleanly;
2. prefer composition or small metadata extension;
3. if schema is still necessary, isolate it in its own claimed PR with RLS/security tests;
4. do not let a small V5 schema become a generalized content/repository platform.

## 7. Parallelization map

To maximize throughput safely:

- **A1:** product-flow/UI/localization/content composition; primary implementer for localization foundation and member-facing P0/P1/P2 UI when unclaimed.
- **A2:** Admin/security/backend; owns security-sensitive functions/migrations/RLS and only supports content/UX work when a demonstrated minimal backend/schema need exists.
- **A3:** Push/offline/multi-congregation; remains focused on Phases 4-6 and their downstream consumer wiring. It should not absorb unrelated P0 UI work while Phase 4-6 gates remain open.
- **A4:** artwork plus verification/QA; owns Phase 3/7 verification, locale completeness/fallback/accessibility scans, browser/mobile regression, and translation leak detection. It may fix bounded demonstrated presentation defects after claiming them.
- **A5:** integration/dispatch; resolves overlap, merges one PR at a time, maintains authority/status, and keeps independent lanes supplied with work.

Agents may work-steal only an unclaimed, dependency-satisfied task that does not overlap another active owner.

## 8. Recommended implementation order from the current program state

A5 should serialize already-prepared bounded PRs first when their evidence is sufficient, because stacked unmerged work increases conflict risk.

In parallel, the preferred independent lanes are:

- A1: localization foundation, then bounded Tagalog/UI or Calendar/Home work once owner checks are clean;
- A2: Phase 2 exact-head evidence and controlled backend/security gaps;
- A3: Phase 4-6 missing client/server/device/tooling gaps;
- A4: Phase 7 evidence, artwork debt, and localization completeness/accessibility verification infrastructure;
- A5: restore/generalize a reproducible V5 PR gate using current tooling only, then serialize clean PRs.

Dependent work must wait: Tagalog screen migration waits for localization foundation; Reader availability UI waits for its underlying availability contract to integrate; downstream active-congregation consumers wait for the selection primitive to integrate; service auto-surfacing must not create external discovery infrastructure.

## 9. Phase 8 — certification and promotion

Freeze one exact candidate SHA only after all required checklist items pass with the correct evidence class. Run the accumulated regression/browser/security checks on that exact SHA. Record any manual/device/backend evidence against the same candidate or a precisely documented equivalent environment.

V4 remains rollback until V5 is explicitly accepted. No scheduled agent autonomously promotes V5 to `main` or production.
