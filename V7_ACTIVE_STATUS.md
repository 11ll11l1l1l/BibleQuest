# BibleQuest V7 Active Status

Updated: 2026-10-06 JST

Phase: **P4 — Integrated hardening; P5 evidence preparation eligible**. Library and ONE 2 ONE implementation are integrated. Representative reviewed-content acceptance remains OPEN; no final release candidate is frozen. P0 scope/contracts remain frozen.
Development branch: `v7/development`.
Production baseline: V6 `7997d60e6069aa406ec005c32e33e46fee39bc12` on `main`.
Canonical roadmap: `DEVELOPMENT_PLAN_V7.md`.
Operational rules: `work/RULEBOOK.md`.
Deferred V8 scope: `DEVELOPMENT_PLAN_V8.md`.

## Persistent lane command

The user may issue only:

- `Continue V7 lane A`
- `Continue V7 lane B`
- `Continue V7 lane C`
- `Continue V7 lane D`

That is sufficient instruction regardless of whether V7 is currently in P0, P1, P2, P3, P4 or P5. The user does **not** need to issue a separate integration, merge, phase-advance or release-preparation command.

The executor must resolve the live phase and same-letter assignment from this file plus `DEVELOPMENT_PLAN_V7.md`. Do **not** ask the user which phase to continue and do **not** stop merely because the lane has reached an integration boundary.

## Automatic integration protocol

Integration is part of every `Continue V7 lane X` command.

### Normal lane responsibility

Every persistent lane A–D must integrate its **own completed bounded work** before stopping whenever the following are true:

1. the lane implementation/evidence is complete;
2. its affected checks are green or valid same-SHA evidence already exists;
3. the change does not require unresolved behavioral reconciliation with another lane;
4. the target remains `v7/development` and V7 has not entered a frozen release-candidate state.

A lane may not end with only `ready for integration`, `waiting for merge`, `integration needed`, or equivalent status if it can safely perform that integration itself.

Before integrating, fetch the live `v7/development` HEAD. If the integration head moved since the lane started, refresh/rebase the lane onto that live head, resolve conflicts **inside the lane's owned surface**, rerun only the checks affected by the refresh/conflict, and integrate against the refreshed head. Never force-update `v7/development` to bypass concurrent work.

After successful integration, verify the integrated commit/tree is reachable from the current `v7/development` head, then continue into the next eligible same-letter assignment when allowed by the phase gates.

### Lane A — standing integration coordinator

Lane A has an additional persistent responsibility across all V7 phases. Every `Continue V7 lane A` starts by checking whether completed work from any lane is waiting on one of these integration-only conditions:

- shared router/navigation wiring;
- shared schema/generated-contract reconciliation;
- cross-lane merge conflict that cannot be resolved entirely inside the originating lane's owned surface;
- canonical `V7_ACTIVE_STATUS.md` phase-gate reconciliation;
- phase transition after the exit gate is objectively satisfied;
- P5 exact-SHA candidate assembly, freeze and promotion preparation.

Lane A must drain those integration responsibilities first, in dependency order, before resuming its own feature/evidence assignment. This is internal work; the user does not need to say `integrate`.

When integrating another lane's completed work, Lane A must preserve that lane's intended behavior, use the live integration head, run the affected combined checks, and avoid unrelated refactors. Mechanical conflicts may be resolved directly. Behavioral conflicts must be reconciled against the accepted V7 contracts rather than choosing one implementation arbitrarily.

### Fallback when a non-A lane encounters an integration-only blocker

Lanes B–D should first integrate their own work as described above. If the only remaining blocker is a shared/cross-lane integration task reserved to Lane A, they must preserve their completed artifact and may perform safe non-overlapping next work where the roadmap permits. They must not undo or duplicate another lane's implementation.

This condition does **not** require a new user command type. The next normal `Continue V7 lane A` automatically picks up that integration duty. If the user continues B/C/D again before A, that lane should keep doing useful eligible work rather than repeatedly restating the same integration wait.

### Optimistic serialization rule

There is no permanent manual merge queue and no user-operated lock. Serialization is achieved by repository state:

1. read the live `v7/development` HEAD immediately before integration;
2. integrate only onto that head;
3. if the head changed before the write completes, refresh/rebase and retry safely;
4. never force a stale lane over the current integration head;
5. after merge, verify reachability and affected combined checks.

This preserves the rulebook's one-integration-owner-at-a-time principle without creating a separate integration chat or requiring integration commands from the user.

## Continuation loop

For any `Continue V7 lane X` command, execute this loop:

1. fetch live `v7/development` and this status;
2. resolve the current lane assignment;
3. for Lane A, first drain pending shared/cross-lane integration duties;
4. continue or finish the lane's assigned work;
5. run the smallest affected checks;
6. integrate the lane's own completed bounded work automatically;
7. reconcile the phase exit gate if applicable;
8. if the next same-letter assignment is eligible, continue directly into it;
9. repeat until the execution window ends, a genuine human/external boundary is reached, or V7 is complete.

Finishing a task, reaching a merge boundary, or completing a phase is not by itself a reason to stop.

If the requested lane's assignment in the current phase is already complete:

1. check whether its completed work is actually integrated; if not, integrate it first;
2. check whether the next same-letter assignment is eligible;
3. if eligible, continue directly into that next phase assignment in the same run;
4. if the entire current phase exit gate is already satisfied but this file has not yet advanced, reconcile the phase transition safely and continue;
5. if a real shared prerequisite is still open, do bounded non-overlapping work that helps close it or preserve the exact blocker without pretending the next phase is ready.

A lane may cross more than one completed phase in one continuation run. Finishing a phase is not, by itself, a reason to stop and wait for another user instruction.

A–D are persistent identities. P3-E is supplemental only and does not alter A–D continuation. V7 continuation stops at completed V7 and never silently enters V8.

## Persistent A–D progression

| Lane | P0 | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|
| **A** | Domain/data contracts | DB/RLS/generated contracts | Books MVP | Pairing + relationship security | Library UX/a11y evidence | Browser/mobile/a11y release evidence |
| **B** | UX/information architecture | Library core | Devotionals MVP | Tracks/modules/lessons authoring | ONE 2 ONE journey evidence | Backend/RLS/security release evidence |
| **C** | Security/privacy/tenancy | Discipleship core | Past Teachings MVP | Mentee lesson runner | Backend/RLS/privacy hardening | Build/PWA/offline/performance release evidence |
| **D** | Acceptance/content/provenance | Taxonomy/provenance/localization | Library discovery | Progress/reflection/prayer/action | Cross-cutting regression | Content/provenance/localization release evidence |

The live phase/eligibility gates below determine which cell is executable. The table is a durable lookup, not permission to skip prerequisites.

## Current V7 objective

**BibleQuest V7 = Library + structured ONE 2 ONE discipleship.**

The previous full-product-overhaul V7 plan is retired. V7 no longer includes Conversation Deck/realtime groups, central Drive/media pipeline, full media moderation, full Ilocano rollout, bulk content ingestion, Couples expansion or another whole-app visual overhaul. Those goals are explicitly deferred to V8.

`docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` is historical planning input only and is not an active V7 requirement.

## P0 parallel lanes

Four independent Phase-0 chat lanes are authorized. Each lane must use the live `v7/development` head at task start, stay inside its owned contract surface and hand off durable output for serialized integration.

### P0-A — Domain and data contracts

Own Library entities/relationships, content taxonomy/data requirements, ONE 2 ONE relationship/curriculum/progress contracts and minimum media-reference interfaces.

Excludes central Drive/media storage, realtime groups and V8 implementation.

### P0-B — UX and information architecture

Own Library journeys/routes, Books/Devotionals/Past Teachings browse/detail flows, mentor/mentee journeys, lesson sequence and mobile-first route/surface map.

Excludes unrelated V6 product redesign.

### P0-C — Security, privacy and tenancy

Own mentor/mentee and author/leader permission matrix, congregation scoping, reflection/progress privacy and protected deep-link/session requirements.

Preserve existing V6 backend authority, RLS and tenant isolation.

### P0-D — Acceptance, content and provenance

Own V7 acceptance/evidence matrix, source/license/provenance requirements, representative content policy, i18n readiness and the V8 non-goal transfer manifest.

## P0 exit gate

Phase 0 is complete only when:

- V7 scope and V8 deferrals are unambiguous;
- shared domain/data/security contracts are agreed;
- route/user-journey contracts are agreed;
- acceptance/evidence requirements exist before implementation;
- no V7 feature depends on an undefined V8 realtime/media/Ilocano-rollout system.

P0 exit accepted in the serialized freeze: narrowed scope, Library/ONE 2 ONE data and security contracts, eight proposed unique route keys with entry/return behavior, acceptance/provenance evidence rows, and V8 exclusions are aligned across P0-A/B/C/D. P1 changes must follow these frozen contracts.

## P0 completion record

- Integrated contract set: `docs/v7/V7_DATA_ARCHITECTURE.md`, `docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md`, `docs/v7/V7_SECURITY_TENANCY_CONTRACT.md`, and `docs/v7/V7_ACCEPTANCE_AND_CONTENT_CONTRACT.md`.
- V7 scope: Library plus structured ONE 2 ONE; Conversation Decks, new group realtime/chat, central Drive media pipeline/full moderation, full Ilocano rollout, bulk content, Couples expansion, recommendations beyond MVP, and unrelated redesign are V8.
- P1 begins only from this integrated contract set. Runtime routes, database schema, authorization changes, and feature evidence remain unimplemented/open.

## Planned V7 phases after P0

- **P1 — Shared foundation:** database/RLS, Library core, discipleship core, taxonomy/provenance/localization foundation. Minimum four parallel lanes; serialized integration.
- **P2 — Library MVP:** Books, Devotionals, Past Teachings and Library discovery. Four parallel lanes.
- **P3 — ONE 2 ONE MVP:** pairing/security, authoring, lesson runner, progress/private state and QR/deep-link/V6 bridges. At least four lanes; five preferred.
- **P4 — Integrated hardening:** Library UX/a11y, ONE 2 ONE journeys, backend/RLS/privacy and cross-cutting regression. Four independent evidence lanes.
- **P5 — Exact-SHA release:** four evidence lanes followed by one serialized candidate owner and production promotion.

After P1 contracts are frozen, independent P2 Library and P3 ONE 2 ONE work may overlap where ownership is genuinely disjoint. Integration onto `v7/development` remains serialized by the automatic protocol above.

## Rulebook constraints in force

- Exact starting SHA per lane.
- One concrete outcome and explicit owned/excluded surface per chat.
- Persistent lane letter across phase transitions; the executor resolves the phase automatically.
- Integration is internal to `Continue V7 lane X`; no separate user integration command is required.
- Each lane integrates its own safe bounded completed work; Lane A owns cross-lane/shared reconciliation and phase advancement.
- One owner at a time for shared schema/migrations/generated DB contracts, global router/navigation wiring, service worker/deployment configuration and canonical status edits.
- No broad historical repository audit at task start.
- No unrelated refactors or V8 scope creep.
- Targeted affected checks during implementation; accumulated checks at integration/release boundaries.
- Refresh a task branch from live integration before merge; stale green CI is not current integration evidence.
- Static/browser/backend/device evidence remain distinct; unperformed evidence stays OPEN/UNVERIFIED.
- Existing V6 evidence is inherited unless V7 changes its inputs or reveals an actual regression.

## Repository baseline and cleanup

Repository preparation is complete. The V1–V6 lessons are consolidated in `work/RULEBOOK.md` and `work/LESSONS_LEARNED.md`. Runtime, tests, deployment workflows, migrations, released V6 build configuration and rollback evidence remain preserved.

The V6 owner-waived physical acceptance rows remain recorded in the original V6 acceptance authority; V7 does not rewrite them as PASS.

## Current integration checkpoint — 2026-10-06

Lane A's Library read recovery is integrated through [PR #1248](https://github.com/11ll11l1l1l/BibleQuest/pull/1248) at `4773a1e6a54e227528469e385b90ac9d867ab2e4`. Browse/detail/pagination waiting is bounded to ten seconds; reset and superseding reads settle the old operation promptly. Existing localized Retry remains the UI owner. Pagination preserves its displayed items/cursor, and late results cannot restore old-context data.

Exact source `e4b07e670a82d6babc857ac9d0848d24f79ee27f` passed pinned [Build/PWA/Performance run 37357088648](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37357088648): all 339 V7 tests, build identity/performance, Library/ONE 2 ONE browser smoke, inherited parity, PWA and automated accessibility. Its tree equals the integrated merge tree. This is development verification, not final release-candidate certification.

The earlier Library item Retry/offline/accessibility tranche is integrated through #1245; the frozen contract references now point to the accepted communication boundary through #1247. Superseded P0-A draft PRs #1127/#1132 are closed, with historical evidence retained.

Remaining gates: reviewed representative Books/Devotionals must be approved and published; Past Teachings still require rights verification plus editorial approval/publication. The current content evidence reports localization ready and representative content not ready. No final release candidate is frozen or production promotion performed. Preserve content-review decisions as OPEN and continue eligible lane evidence/integration work.

Lane A's [P5 browser/mobile/accessibility preparation](docs/v7/P5_A_BROWSER_MOBILE_ACCESSIBILITY_EVIDENCE_PREP.md) maps the existing signed-out browser checks to their actual coverage and records the remaining populated-content, authenticated-role, accessibility and applicable device/deployment evidence. It reuses the current gate and does not certify a new release SHA or change content decisions.

Further Lane A [Library locale/filter hardening](work/tasks/20261006-lane-a-library-locale-filter-restoration.md) makes Search/Clear use the existing browse route owner, so the real language selector's reload preserves submitted filters and does not restore cleared filters or unsent drafts. The existing Chromium gate now covers those interactions; populated/live-content and final candidate acceptance remain OPEN.

## Historical integration checkpoint — 2026-10-05

Lane A drained the pending context-readiness integration through PR #1238 at `0aae98daa6cf3eefd7106948d39d210af5304b30`. All 330 combined V7 tests and typecheck passed on the merge tree; source head `7609288621d8ae6007d99a59919891947ac31df9` passed pinned Build/PWA/Performance run [37309790177](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37309790177).

Lane A now adds Library-specific built-artifact browser evidence to the existing gate: three mobile widths and all three supported locales, search/filter restoration, keyboard controls, missing-item denial and return navigation. See [task/evidence scope](work/tasks/20261005-lane-a-library-browser-gate.md). This does not certify published content or authenticated journeys.

Current accepted communication capability is lesson-response sharing; generic pair-private chat remains excluded/unavailable under the integrated PR #1230 capability contract. Representative Books/Devotionals still need editorial approval, and Past Teachings still need rights resolution plus review; see [content readiness](docs/v7/P4_D_REPRESENTATIVE_CONTENT_READINESS.md). Final quiescent exact-SHA release certification/promotion remains OPEN.

The dated entries below preserve historical checkpoints; earlier statements about missing runtime, routes, communication reconciliation or database deployment are not a current status assertion.

## Historical foundation next action (2026-10-04)

P1 foundations are integrated: append-only schema/RLS and generated contracts (Lane A), Library repository/service and route entry (Lane B/shared integration), discipleship service/Supabase adapter with shared API/session composition (Lane C/shared integration), taxonomy/provenance/localization and content integrity (Lane D). The P1 exit gate is satisfied: feature lanes consume the same stable foundations without competing schema/infrastructure.

Persistent next assignments: A Books MVP; B Devotionals MVP; C Past Teachings MVP; D Library discovery. Disjoint P3 work may overlap as the roadmap permits. Feature/browser/live-data/release acceptance remains open; foundation completion is not production certification.

No V7 DDL has been applied to the connected production project; isolated disposable migration/RLS validation remains the database evidence path. Pair-private messaging remains an unresolved accepted-contract dependency; its reserved thread route stays unexposed. Preserve Lane A's schema/generated-contract ownership and automatic shared integration duty.

## Lane A — Library lifecycle integration (2026-10-04)

Library service is now composed through the existing API repository factory. Account authentication/identity/remote-availability changes reset its state; congregation selection, membership reload and clear invalidate pending reads and cached results. Page disposal removes the session subscription. This closes Lane B’s Library reset handoff without adding a second tenant owner.

Verification: 44 V7/active-congregation tests, 10 affected V6 bootstrap/settings tests, congregation edge regression, bootstrap syntax and diff whitespace passed locally on Node 24.19.0. This is development verification, not pinned-toolchain release certification. P1 remains active: shared route wiring and the discipleship database adapter remain incomplete; P2-A is not yet eligible. No V7 DDL was applied to the connected production project.

## Lane A — Library route foundation (2026-10-04)

Learn now launches the lazy `library` route. Library item selection reaches the ratified `library-item` route with an encoded ID; return navigation restores search/type context. The shared detail foundation displays escaped published metadata, source, attribution and permitted uses, and clears its content on context reset. The router preserves query parameters without changing existing route keys. Type-specific article/book content and representative catalog publication remain P2 work.

Verification: 33 V7 tests, 4 affected V6 routing/lazy-loading tests, Learn composition regression, build, typecheck and diff whitespace passed locally on Node 24.19.0. Browser smoke was attempted but Chromium is absent; browser/visual acceptance remains UNVERIFIED. Live data acceptance remains open because production V7 DDL is not applied. P1 still needs discipleship database/route integration; do not mark P2 eligible yet.

## Lane A — ONE 2 ONE entry/read foundation (2026-10-04)

Grow now launches the lazy ratified `one-to-one` landing page through Lane C's existing service. `src/app/discipleship-pair-repository.js` supplies bounded pair list/get reads against `v7_mentor_pairs`, with explicit congregation and participant filters and authenticated-user revalidation. Existing RLS remains authority. The landing clears results and invalidates pending responses on account/congregation transitions; it provides account, congregation selection, reload and return controls. It does not expose pair-thread, curriculum or lesson actions before their adapters exist.

Verification: 43 V7 tests after refresh onto `ec84335d` and 3 affected V6 lazy/bootstrap tests passed; build, typecheck and diff whitespace passed on Node 24.19.0. Adapter queries were exercised with a thenable Supabase test double, including account mismatch, injected/malformed IDs, database errors, response scope denial and late-response suppression. Browser and live backend evidence remain UNVERIFIED; no V7 DDL or real-user mutations occurred.

P1 remains active: Lane C can compose these pair reads with its remaining curriculum/progress/private-response adapter. Global pair/track/module/lesson route wiring follows that completed adapter. Library foundations are integrated; P2-A remains gated by the shared P1 exit.

## P1 exit reconciliation / shared adapter composition (2026-10-04)

Lane C's complete Supabase repository is composed through the existing API client provider and existing session/congregation owners. The hardened pair read adapter supplies list/get; Lane C's assigned-revision curriculum, operational progress, private response and sharing methods remain intact. A combined composition test loads the pinned curriculum revision through that service. Pair/track/module/lesson feature pages and lifecycle UI remain P3 work, not undefined P1 infrastructure.

Combined evidence on integrated `80bf3804`: 53 V7 tests, build and typecheck passed after concurrent Lane C/D merges. Composition changes: the same combined suite passed before one additional focused composition test was added and passed (54 total); affected V6 bootstrap/lazy tests, build and typecheck also passed locally on Node 24.19.0. Browser/live backend/device acceptance remains open. P2-A Books is now the next Lane A assignment.

## P2-A — Books metadata and external-link implementation (2026-10-04)

Books detail now renders author/source-language metadata and a localized English/Tagalog/Cebuano external-reading action through the shared Library item route. The action requires published book content, approved review, verified rights, and explicit `external_link` permission. It rejects non-HTTPS/credentialed URLs and Gutenberg file links rather than canonical ebook pages. Source/attribution/rights remain visible in the shared detail foundation. Existing Library content-type filtering supplies Books browsing.

`data/v7/books/representative-catalog.json` supplies two real canonical-source entries with link-only rights evidence. Both remain pending review; no full text is hosted and no review decision is fabricated. The accompanying README records catalog identities, update revisions and linking policy. P2-A end-to-end content/browser acceptance remains OPEN until reviewed records are imported into a V7 test target and the actual user flow is exercised.

Verification: 60 V7 tests, build, typecheck and diff whitespace passed locally on Node 24.19.0. Includes unpublished/unapproved/unknown-rights denial, explicit-action permission, unsafe URL/direct-file denial, escaped metadata, external-tab safety attributes, and catalog parsing/pending-review integrity. Production DDL/promotion remains untouched.

## Lane A — publication/assignment authority integration (2026-10-05)

Starting integration: `3e89d8cf110b233578685673a009d338c816ec97`, refreshed onto `72cb913fdf4d30d950d32515775ec2f6c88c976a`. PR #1208 reconciles #1199/#1200/#1201 plus the integrated #1204 authoring surface. The publication panel now uses the atomic publisher; withdrawal recovery remains available. Assignment creation uses one server-owned race-safe RPC and preserves stable retry identity and audit history. SQL fixture repairs preserve immutable published revisions and explicit test-role access.

Disposable Database CI run `37265685978` passed migration replay, all RLS/privilege tests and function lint, then correctly detected generated-type drift. Its generated artifact `11326043665` supplies the refreshed canonical types and SHA-256 `75b52fc6c1d2a864294312ab90ab392d3ddddfd8f259dc0f9e002836541bf056`; final complete CI remains required on the updated head.

Shared composition now exposes lazy authoring/publication and mentor-assignment workspaces at `#/one-to-one?view=authoring` and `#/one-to-one?view=assignment`, with entry/return controls from ONE 2 ONE. Both use the existing API client, session and selected-congregation owners. Author capability derives from the current owned leader/pastor/admin membership; backend RLS/RPC remains authority. Feature pages retain their context-invalidation/disposal boundaries. No production DDL or real-user mutations occurred.

Local evidence: 261 V7 tests, build, typecheck and whitespace checks pass on Node 24.19.0. Workspace browser/live-backend evidence remains OPEN. Pair/track/module/lesson shared routes, Reader return wiring, representative content review/import, pair-private communication and final release certification remain incomplete; this does not declare P2/P3 acceptance complete.

PR #1208 integrated at `bc9cc517d5f409388d8208ac6a6c1d7e29419469`. Exact head `0c4f964eb8e12e03f96a674f5633416beb547dd2` passed final Database CI `37266010995` (both V5 and V4 replay, RLS, lint, deterministic types) and Build/PWA/performance gate `37266010974` (including built Chromium checks).

## Lane A — first-assignment curriculum recovery (2026-10-05)

The mentor assignment picker previously reused the learner's assignment-pinned curriculum read, so a pair with no assignments could not select its first lesson. A separate `loadAssignableCurriculum` service/repository boundary now lists published global/current-congregation hierarchy for the active pair mentor, choosing the highest published immutable revision per lesson. The existing learner read remains assignment-pinned. Draft/withdrawn paths and unpublished revisions remain excluded; mentees and inactive pairs are denied. Existing assignment creation RPC still revalidates the exact path at mutation time.

Evidence: 264 V7 tests, build, typecheck and whitespace checks pass locally on Node 24.19.0. New regressions cover first assignment with no preexisting rows, mentor/mentee denial, ended pairs, cross-congregation exclusion, global curriculum, withdrawn paths and unpublished revisions. No schema or production changes. Pair lifecycle UI and shared lesson/Reader route wiring remain the next Lane A integration work; browser/live-data and content review/import acceptance remain OPEN.

## Lane A — pairing lifecycle and assigned-route integration (2026-10-05)

ONE 2 ONE now exposes participant-owned invitations and acceptance/decline/explicitly confirmed ending through the existing RLS invitation policy and `bible_v7_transition_mentor_pair` RPC. Inviting requires the current congregation's leader/pastor/admin role; participant IDs and tenant scope come from the authenticated context. Lifecycle receipts are checked against the requested pair, participants, state and timestamps. Account/congregation changes clear visible data and suppress late responses.

The ratified `one-to-one-pair`, `one-to-one-track`, `one-to-one-module` and `one-to-one-lesson` routes now connect the existing assigned-only curriculum service and lesson runner. Track/module selection validates the assigned hierarchy; lesson navigation carries the pinned revision. Scripture uses the existing Bible reference parser and Reader book/chapter boundary, highlights the requested verse, and returns to the exact lesson step through reload-safe, allowlisted route parameters without rewriting progress. Context hydration retries only after the shared owners provide an authenticated account and selected congregation.

Evidence: 281 V7 tests and 29 affected inherited Reader/router/bootstrap tests pass locally on Node 24.19.0; build, typecheck, lint, format and whitespace checks pass. Refreshed onto `04811b38` including both concurrent Lane B authoring recovery fixes. English/Tagalog/Cebuano pairing and navigation copy is included. Local Chromium is unavailable: actual browser/mobile/live-backend journey acceptance remains OPEN. Broader inherited V6 suite: 879/880 pass; the remaining preexisting toolchain-policy assertion expects `unit` to omit V7, contrary to the unchanged integration package script. No schema or production changes. Representative content review/import, pair-private communication and final release evidence remain incomplete; P2/P3 acceptance is not declared complete.

## Lane A — inherited test-command contract reconciliation (2026-10-05)

The inherited toolchain-policy test still asserted that `npm run unit` runs only V6, despite the already integrated V7 package script running both suites. Reconciled that stale assertion and explicitly checked both individual suite commands, preserving V6 coverage and requiring V7 coverage. No runtime, package, workflow or toolchain change. Combined `npm run unit`: all 880 V6 and 282 V7 tests pass locally on Node 24.19.0. This closes the baseline assertion recorded above; browser/live-backend and content acceptance gates remain OPEN.

Pairing/assigned routes integrated through PR #1212 at `87174c2e`; exact head `66445919` passed pinned V7 Build/PWA/Performance run [37272154341](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37272154341), including built-artifact Chromium parity, PWA acceptance and automated accessibility. This is regression evidence, not a live-backend ONE 2 ONE journey certification. Lane D's completed blank-translation fallback (#1207) then integrated at `6be271c5` after a clean combined merge and all 282 V7 tests passed. Both merges are reachable from the refreshed development head.

## Lane A — invitation retry recovery (2026-10-05)

Pair invitations now retain a stable client-generated UUID for the current member/role choice during a page session. An insert failure performs an existing participant/tenant-scoped read for that exact ID; recovery verifies the initiating participant, requested mentor/mentee direction, congregation, identity and current lifecycle stamps. It can display an invitation that advanced to accepted/closed while its acknowledgement was lost, without accepting it again or reopening it. Failed forms retain member/role selections. Changed choices get a new ID; account/congregation invalidation and disposal clear retry state. No new storage, schema, RPC or audit path.

Evidence: the eight focused regressions produce seven failures on integration baseline `d470ecd7` and all pass with the fix. All 880 V6 and 293 V7 tests pass together; build, typecheck, lint, format and whitespace checks pass locally on Node 24.19.0. Denials cover changed initiator, participant direction, tenant/identity, stale account/congregation, unreadable/uncommitted attempts and malformed lifecycle receipts. Pinned CI and real-browser/live-backend journey evidence remain separate; content and pair-private messaging phase gates remain OPEN.

Invitation recovery integrated through PR #1216 at `6c6b2fa1`. Refreshed exact head `20e4bf08` passed pinned [Build/PWA/Performance run 37290363462](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37290363462), including built-artifact Chromium, PWA and automated accessibility regression checks. Real invitation/backend journey evidence remains OPEN.

## Lane A — overview locale and hydration recovery (2026-10-05)

The ONE 2 ONE overview now uses the shared English/Tagalog/Cebuano dictionaries for introduction, loading/empty/ready/context-change states and navigation controls. Backend diagnostics are replaced by the existing localized recovery message. A shared account/congregation context notification clears the old list and automatically reloads only when those owners report a signed-in account and selected congregation; no tenant is inferred. Request generations prevent old-context results replacing the new list, and teardown prevents further reads/listeners.

Evidence: all 296 V7 tests and five affected inherited bootstrap/router tests pass after retaining concurrent Lane B/D fixes. New page tests cover guarded hydration, late old-congregation results, navigation/cleanup, actual locale switching in all three supported languages, and suppression of backend diagnostics. Combined unit command also passes all 880 V6 tests; build, typecheck, lint, format and whitespace checks pass locally on Node 24.19.0. Browser/live-data acceptance and the existing content/messaging phase gates remain OPEN.
