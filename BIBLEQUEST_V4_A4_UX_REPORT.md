# BibleQuest v4 — A4 Functional UX Report

Agent: `BQ-A4-V4-UX-FLOWS`
Authority: analysis/reporting only
Central control: `BIBLEQUEST_V4_ANALYSIS_HUB.md`

A4 may update only this file. Do not modify product code, tests, workflows, branches, deployment, Supabase, Cloudflare, or the central hub.

## Latest inspected ref

- Branch: `main`
- Inspected product/document HEAD before this report update: `61c05482cd0275d7ddcfac9b19f122810c7ae747`
- Router owner: `src/app/router.js`
- Runtime composition / authoritative route table: `src/app/bootstrap.js`
- Primary shell/navigation owner: `src/ui/shell.js`
- This report treats v3 labels, panels and routing structure as current implementation evidence, not as a v4 design ceiling.

## Authoritative shipped route / surface inventory

Recovered from the `routes` table in `src/app/bootstrap.js` at inspected HEAD. Current shipped routes are:

`home`, `mission`, `learn`, `study`, `deep-questions`, `story-journey`, `wisdom-situations`, `adaptive-learning`, `bible-world`, `open-review`, `private-notes`, `cloud-notes`, `couples-family`, `couples-cloud`, `journey-groups`, `encouragements`, `community`, `live-rooms`, `ministry-hub`, `notification-center`, `workspace`, `team-center`, `leaderboards`, `recognition`, `assignments`, `content-review`, `reader`, `play`, `grow`, `transform`, `personality-profile`, `psychometrics`, `avatar-vault`, `my-mission`, `calendar`, `recordings`, `media`, `more`, `accessibility`, `backup`, `congregation`, `account`, plus `not-found`.

Primary shell destinations are `Home`, `Learn`, `Play`, `Grow`, and `More`. The account/session control is separate in the top bar.

## Flow / surface matrix

| Flow / surface | Current UX assessment | v4 redesign priority | Main UX seam / caution |
|---|---|---:|---|
| App boot / shell / primary navigation | Functional but structurally v3-like | CRITICAL | Keep router/session ownership; redesign shell/navigation hierarchy without duplicating navigation state |
| Home | Clear capabilities, weak task hierarchy | HIGH | Make “continue today” the dominant task; demote congregation media/tutorial/supporting metrics |
| Daily Journey (`mission`) | Dedicated flow exists and returns Home/Reader | MEDIUM | Preserve exactly-once progress behavior; redesign journey as staged task flow, not generic panels |
| Learn hub | Ten peer-level choices plus policy/source material create high cognitive load | HIGH | Group by intent and progressively disclose advanced/specialized tools |
| Reader / translation / context | Powerful but control-heavy; reading and tool configuration compete | HIGH | Reading-first composition; controls can move into contextual sheet/sidebar while Reader service stays owner |
| Guided Study / Deep Questions / Story / Wisdom | Separate feature owners with return paths to Learn | MEDIUM-HIGH | Give each a distinct learning-flow structure rather than another generic card stack |
| Adaptive Learning / Open Review | Purpose is valid but naming and relationship are not self-evident | MEDIUM | Clarify “practice now” vs “review due material” and preserve single learning/progress owners |
| Bible World | Strong conceptual destination but nested under Learn | MEDIUM | Treat as exploration destination with clear return/continue-to-Scripture handoff |
| Private Notes / Cloud Notes | Two distinct privacy/storage models are technically deliberate but conceptually easy to confuse | HIGH | Present one Notes entry experience with explicit Device vs Account scopes; do not merge storage owners |
| Play / Games / Kids | Dedicated primary destination | HIGH | Improve game selection, resume/return and post-game continuity while preserving launcher/progress lifecycle |
| Grow / Progress | Combines progress, transformation, psychometrics and avatar tools | HIGH | Separate “my progress” from “self-reflection tools”; avoid implying psychometrics are spiritual scoring |
| Transform / Personality / Psychometrics | Mature/private domain mixed beneath Grow | MEDIUM-HIGH | Strong privacy/trust framing and deliberate transitions; no hidden persistence changes |
| Avatar Vault | Current subtool of Grow | MEDIUM | Make achievement/avatar relationship legible without adding a second progress owner |
| More hub | Severe aggregation/dumping-ground behavior | CRITICAL | Replace long sequence of equally weighted panels with grouped IA: Personal, Community, Ministry, Settings/Device |
| Community bridge | Good fail-closed states but many destinations compete | HIGH | Turn into a community dashboard with status, top tasks and role-relevant destinations |
| Journey Groups / Encouragements / Live Rooms | Related social tools spread across separate routes | MEDIUM-HIGH | Show relationship and return paths clearly; do not collapse service/privacy boundaries |
| Leaderboards / Recognition | Community-adjacent reward surfaces | MEDIUM | Clarify relation to congregation and progress; avoid making ministry/private data appear competitive |
| Ministry Hub | Role-aware but milestone/deferred language dominates product experience | HIGH | Role dashboard should foreground available work; authorization still belongs to membership/server owners |
| Assignments | Feature-rich but dense member/leader modes share one surface | CRITICAL | Separate member task flow from ministry authoring/review composition while preserving one assignments service |
| Notification Center | Solid state coverage but currently isolated under More | HIGH | Inbox should support destination-aware continuity and unread priority without inventing a second notification state |
| Workspace | Clear privacy boundary but feels like a technical composition screen | HIGH | Make a true private study workspace while retaining Cloud Notes + Reader as data owners |
| Calendar | Functional agenda with mixed personal/assignment/congregation events | HIGH | Separate “my plan” from shared congregation event authoring visually; destructive shared actions need confirmation pattern |
| Couples device / Couples cloud | Two ownership/privacy models surfaced as separate products | HIGH | Provide one Couples entry with explicit local/shared journey modes; do not blend private/local and paired cloud state |
| Recordings / Media Library | Both exposed on Home despite being secondary | MEDIUM | Consolidate into a single Media destination or parent experience while preserving one player runtime |
| Account sign-in / signup / recovery | Security flow is substantially complete | HIGH | Refine lifecycle state transitions; fix signed-in shell → signed-out presentation mismatch described below |
| Tutorial | Accessible from Home/account | MEDIUM | Contextual onboarding should teach actual v4 navigation and be replayable without interrupting experienced users |
| Accessibility | Dedicated More route | MEDIUM | Keep persistent settings owner; also surface critical controls contextually where needed |
| Backup/reset | Correctly separated from cloud account state | MEDIUM | Reframe as Device Data with explicit destructive-action confirmation and consequences |
| Congregation membership / role | Separate permission surface | HIGH | Explain current role and next actions; maintain fail-closed role semantics |
| Content Review / Team Center / leader-admin tools | Shipped but buried in More/Ministry relationships | HIGH | Use role-aware leader workspace/navigation rather than adding more generic More cards |
| Offline / recovery / not-found | Global recovery exists; individual flows have varied local recovery | HIGH | Unify the mental model for offline vs auth-required vs permission-denied vs transient failure |

## Prioritized findings

### A4-01 — Primary navigation is stable but secondary navigation IA is overloaded

- Branch/SHA: `main` @ `61c05482cd0275d7ddcfac9b19f122810c7ae747`
- Surface/flow: global shell → all routes
- Evidence: `src/ui/shell.js` exposes only five primary destinations (`Home`, `Learn`, `Play`, `Grow`, `More`) plus Account. The route table contains roughly forty shipped destinations, with most secondary tools reachable through Learn, Grow, Community, Ministry, or a very large More hub.
- Category: NAVIGATION / IA
- Severity: CRITICAL
- User impact: the five-item shell is learnable, but the product’s true capability map is hidden behind overloaded hubs. Users must remember where a tool “belongs,” and unrelated utilities compete under More.
- Root cause: the current navigation was optimized for rebuild containment rather than final product information architecture.
- Recommended v4 direction: keep a small primary navigation, but redesign secondary navigation around clear domain hubs and contextual page headers. A likely model is Home, Learn, Play, Journey/Progress, Community, with Account/Settings as utility access; however, any primary-route change is a deliberate navigation contract decision for the captain. Contextual breadcrumbs/back labels should reflect the actual parent concept rather than merely the route that opened the page.
- Change class: UX-STRUCTURE; potentially FUNCTION-AFFECTING if primary route semantics change.
- True owner: `src/ui/shell.js`, `src/app/bootstrap.js` route composition; individual feature pages own contextual return controls.
- Dependencies: A1 shell design, A2 mobile navigation/ergonomics, A3 router/state boundary review.
- Validation: route reachability matrix; browser back/forward; deep-link entry; focus transfer; no duplicate navigation owner; mobile thumb-reach tests.
- Confidence: HIGH.

### A4-02 — `More` is a rebuild-era dumping ground and should be replaced by real IA

- Branch/SHA: same
- Surface: `#/more`
- Evidence: `src/features/more/index.js` renders separate full panels for Workspace, Notifications, Community, Ministry Hub, Content Review, two Couples modes, Journey Groups, Team Center, Accessibility, Install, Backup, My Mission, Calendar and Congregation, plus rebuild/deferred messaging.
- Category: IA / CONTENT-HIERARCHY
- Severity: CRITICAL
- User impact: users face a long linear stack of unrelated functions with nearly equal visual/action weight. Important recurring actions such as notifications or calendar are mixed with rare settings like backup and install.
- Root cause: More reflects implementation/recovery milestones, not end-user mental models.
- Recommended v4 direction: redesign More as a compact grouped hub: Personal & Planning; Community; Ministry/Leader tools when eligible; App & Device settings. Prefer summary rows/sections with status badges and recent/relevant actions instead of one promotional panel per route. If Community or Planning becomes a primary destination later, remove it from More rather than duplicating entry points.
- Change class: UX-STRUCTURE.
- True owner: `src/features/more/index.js`; shell changes only if captain promotes a domain to primary navigation.
- Dependencies: A1 component design; A2 mobile grouping; A3 role-based visibility review.
- Validation: all current routes remain reachable; role-conditional items do not imply authority; install/backup/accessibility remain discoverable; keyboard order and screen-reader headings remain logical.
- Confidence: HIGH.

### A4-03 — Learn presents ten peer-level choices before establishing user intent

- Branch/SHA: same
- Surface: `#/learn`
- Evidence: `src/features/learn/index.js` presents Reader, Guided Study, Deep Questions, Story Journey, Wisdom Situations, Bible World, Adaptive Learning, Open Review, Private Notes and Cloud Notes in one grid, followed by doctrinal-policy and source/provenance material.
- Category: IA / CONTENT-HIERARCHY
- Severity: HIGH
- User impact: a new or returning user must understand ten feature names and subtle distinctions before acting. Adaptive Learning vs Open Smart Review and Private vs Cloud Notes require product knowledge.
- Root cause: capability inventory is being used as navigation hierarchy.
- Recommended v4 direction: organize by jobs: Read Scripture; Study & Explore; Practice & Review; Reflect & Take Notes. Show one recommended/continue action from state, then progressively disclose specialized modes. Keep doctrinal/source transparency available but visually subordinate unless context requires it.
- Change class: UX-STRUCTURE.
- True owner: `src/features/learn/index.js`; recommendation state must come from existing learning/progress owners, not new duplicated state.
- Dependencies: A3 doctrinal/source-policy boundary; A1 page composition.
- Validation: every current Learn destination reachable; provenance remains accessible; no scored/interpretive mode mislabeling; return-to-Learn paths remain coherent.
- Confidence: HIGH.

### A4-04 — Reader should become reading-first, not control-first

- Branch/SHA: same
- Surface: `#/reader`
- Evidence: `src/features/reader/index.js` combines translation, book, chapter, previous/next, Hebrew/Greek context, Japanese furigana/vocabulary, search, source/license text, external links, Scripture, verse-peek dialogs and context dialogs in one page. Loading/error states are present, including explicit Japanese fallback and licensed NLT behavior.
- Category: UX / CONTENT-HIERARCHY / ERROR-RECOVERY
- Severity: HIGH
- User impact: the feature is powerful but the core task—reading Scripture—competes with many persistent controls and source/tool details. This will be especially cognitively heavy on mobile.
- Root cause: all legitimate Reader capabilities are exposed simultaneously rather than by frequency/context.
- Recommended v4 direction: reading-first composition. Keep passage selector and chapter navigation immediately available; move secondary tools (translation/source details, context lab, Japanese aids, external reader links) into an expandable tool sheet/sidebar. Verse interaction should expose a focused action sheet. Preserve explicit licensed-translation and Japanese failure recovery.
- Change class: UX-STRUCTURE, DESIGN-ONLY if only presentation hierarchy changes.
- True owner: `src/features/reader/index.js`; Reader service remains data/state owner.
- Dependencies: A2 responsive split-pane/bottom-sheet patterns; A3 no duplicate Reader state.
- Validation: translation/book/chapter persistence; search → result → highlighted verse; verse peek/context; Japanese failure → Retry/BSB; licensed NLT external handoff; keyboard/dialog focus.
- Confidence: HIGH.

### A4-05 — Home overweights secondary media and underuses “next best action” hierarchy

- Branch/SHA: same
- Surface: `#/home`
- Evidence: `src/features/home/index.js` renders hero, Daily Journey, tutorial, Live Recordings, Media Library and progress as sequential major sections. Daily Journey already has a strong “Continue My Journey” CTA when available.
- Category: CONTENT-HIERARCHY / UX
- Severity: HIGH
- User impact: repeat users must scan through promotional/supporting sections instead of immediately seeing the day’s next action and recent progress. Congregation media receives similar structural weight to the daily spiritual-learning loop.
- Root cause: Home is a feature showcase rather than a personalized launch surface.
- Recommended v4 direction: make Daily Journey / resume activity dominant, show concise progress/streak context and one secondary recommendation. Move Media into one compact media module or its own parent destination. Tutorial should become a small contextual help action after initial onboarding.
- Change class: UX-STRUCTURE.
- True owner: `src/features/home/index.js`; any recommendation logic must reuse existing progress/mission services.
- Dependencies: A1 Home composition, A3 state ownership if personalized recommendations expand.
- Validation: guest/new-user empty state, returning user with/without daily mission, media/recording reachability, tutorial replay.
- Confidence: HIGH.

### A4-06 — Account sign-out leaves a structurally stale signed-in shell until navigation/rerender

- Branch/SHA: same
- Surface/flow: `#/account` signed-in → Sign out
- Evidence/reproduction from code: `accountPage()` chooses `signedInShell(state)` or `guestShell(state)` once from the state captured when the page is created. On sign-out, the click handler executes `await session.signOut(); render('login')`. `render()` replaces only `[data-account-body]`; it does not replace the outer signed-in shell/profile hero. `bootstrap.js` store subscription updates the shell session chip/progress but does not rerender the active account route.
- Category: STATE / UX
- Severity: HIGH
- User impact: after successful sign-out, the page can visually retain the signed-in profile header while showing a login form inside it, creating trust/confusion problems in an auth-sensitive surface.
- Root cause: account page outer composition is derived from initial session state while inner-mode rendering is local mutable state.
- Recommended v4 direction: make Account render its entire guest/signed-in composition from the current session state through the existing Account/session ownership, or intentionally navigate/re-enter the route after sign-out. Do not add a cosmetic hide or independent auth flag.
- Change class: FUNCTION-AFFECTING / SECURITY-PRIVACY-AFFECTING presentation correctness; no new auth model required.
- True owner: `src/features/account/index.js` with session state from `src/app/session.js`; shell/store remains session indicator only.
- Dependencies: A3 auth lifecycle review.
- Validation: login, signup, recovery-code confirmation, sign-out, password change, recovery reset, remembered-device removal; assert no stale identity/profile content after sign-out.
- Confidence: HIGH (code-path FACT; runtime reproduction should confirm before implementation).

### A4-07 — Notes are technically separated correctly but product IA makes users choose storage architecture

- Branch/SHA: same
- Surface: `#/learn` → `#/private-notes` or `#/cloud-notes`; Workspace also exposes Cloud Notes
- Evidence: Learn presents “Private Notes” and “Cloud Notes” as separate peer features. Workspace explicitly composes Cloud Notes and Reader while retaining privacy boundaries.
- Category: IA / STATE
- Severity: HIGH
- User impact: users must understand “device-only” vs “account-based/cross-device” before they can simply write a note. This is technically transparent but interaction-heavy.
- Root cause: storage ownership boundaries are exposed directly as top-level navigation choices.
- Recommended v4 direction: create one Notes/Reflection entry experience that clearly presents scope at creation/list level (On this device vs Synced to my account) while continuing to delegate to the existing separate private/cloud services. Do not merge data stores or silently migrate notes.
- Change class: UX-STRUCTURE; ARCHITECTURE-AFFECTING if a new facade/controller is introduced.
- True owners: `src/app/private-notes.js`, `src/app/cloud-notes.js`, respective feature pages; Workspace may deep-link into the cloud scope.
- Dependencies: A3 storage/privacy seam; A1 notes visual trust model.
- Validation: device-only notes never call cloud; cloud signed-out state; create/edit/delete/export; Workspace handoff; explicit scope labels.
- Confidence: HIGH.

### A4-08 — Community should be a task/status dashboard rather than another destination grid

- Branch/SHA: same
- Surface: `#/community`
- Evidence: `src/features/community/index.js` loads congregation/group/encouragement summary, then renders a seven-button grid for Membership, Leaderboards, Recognition, Assignments, Live Rooms, Journey Groups and Encouragements. It correctly disables unavailable destinations and has signed-out/local-preview/error recovery.
- Category: UX / IA / STATE
- Severity: HIGH
- User impact: Community communicates capabilities but not priorities. A member with an overdue assignment, unread encouragement or active live room sees the same conceptual menu structure as one with nothing pending.
- Root cause: destination catalog dominates over current community state.
- Recommended v4 direction: keep the privacy-minimized bridge but redesign around “what needs attention” + “your congregation/group status” + secondary community tools. Surface counts/status only from existing service data; do not aggregate private study content.
- Change class: UX-STRUCTURE; potentially FUNCTION-AFFECTING if new aggregate state is requested.
- True owner: `src/features/community/index.js` and `src/app/community-bridge.js` for allowed aggregate state.
- Dependencies: A3 privacy boundary review; A1 community tone.
- Validation: signed-out, no-membership, membership with/without groups, disabled destinations, bridge load error, navigation to each bounded owner.
- Confidence: HIGH.

### A4-09 — Assignments needs distinct member-task and ministry-authoring/review compositions

- Branch/SHA: same
- Surface: `#/assignments`
- Evidence: `src/features/assignments/index.js` supports member assignment lists/details, linked activities, scheduled/open/overdue/completed states, required reflection/evidence, private member submissions, ministry responder-status review, private answer review, target loading and a large ministry publishing form with schedule/reminder/recurrence metadata.
- Category: UX / IA / STATE / CONTENT-HIERARCHY
- Severity: CRITICAL
- User impact: one route carries two very different jobs: “complete my task” and “author/review congregation assignments.” The ministry form has many advanced fields and privacy semantics, while members need a simple next-action flow.
- Root cause: service breadth is mirrored directly into one page composition.
- Recommended v4 direction: retain one assignments service, but provide role-aware compositions inside the same feature owner: Member inbox/task detail; Ministry overview with Published / Responses / Create Assignment. Progressive disclosure should hide advanced scheduling/evidence fields until requested. Response privacy language must remain explicit at review and submission boundaries.
- Change class: UX-STRUCTURE; SECURITY-PRIVACY-AFFECTING if visibility logic changes.
- True owner: `src/features/assignments/index.js`, `src/app/assignments.js`; permission truth remains congregation membership/API/RLS owners.
- Dependencies: A3 permission/privacy validation; A2 dense operational mobile patterns.
- Validation: ordinary member vs facilitator/leader/pastor/admin; scheduled task; linked activity handoff; reflection/quiz/confirmation; publish scopes; response status vs private response text; back/refresh/realtime behavior.
- Confidence: HIGH.

### A4-10 — Ministry Hub exposes rebuild/milestone language instead of acting as an operational role dashboard

- Branch/SHA: same
- Surface: `#/ministry-hub`
- Evidence: `src/features/ministry-hub/index.js` correctly gates signed-out/no-membership/member/ministry states, but the experience emphasizes “verified tools,” “deferred tools,” “milestone boundary,” and rebuild availability.
- Category: UX / CONTENT-HIERARCHY
- Severity: HIGH
- User impact: authorized leaders see implementation-status language rather than a concise workspace for current ministry tasks.
- Root cause: development safety communication has leaked into permanent product copy/hierarchy.
- Recommended v4 direction: preserve fail-closed behavior but present role, congregation context, pending work and available tools first. Deferred/unavailable features should be absent or quietly explained only when relevant—not promoted as a major section.
- Change class: DESIGN-ONLY / UX-STRUCTURE.
- True owner: `src/features/ministry-hub/index.js`; authorization remains `congregation-membership` + server.
- Dependencies: A3 permissions; A1 mature/serious design system.
- Validation: signed-out, unsupported role, member, ministry role; direct deep links cannot bypass authorization.
- Confidence: HIGH.

### A4-11 — Workspace has correct privacy boundaries but not yet a coherent workspace interaction model

- Branch/SHA: same
- Surface: `#/workspace`
- Evidence: `src/features/workspace/index.js` has Overview and Cloud Notes tabs, Reader context, note search, Open Scripture and Open Cloud Notes actions, role-boundary explanation and explicit legacy safety text.
- Category: UX / IA
- Severity: HIGH
- User impact: the screen behaves more like a verification/composition dashboard than an integrated study workspace. Repeated explanatory safety sections consume hierarchy that could be used for the user’s current passage, notes and recent work.
- Root cause: architecture recovery boundaries are surfaced directly as main product content.
- Recommended v4 direction: build a study-workspace composition around current Scripture context + private notes/results + quick resume actions. Keep privacy/storage boundaries visible in concise scope labels/help, not as dominant panels. A tablet/desktop two-pane view is appropriate if it still uses the same Reader/Cloud Notes owners.
- Change class: UX-STRUCTURE; ARCHITECTURE-AFFECTING only if shared state orchestration expands.
- True owner: `src/features/workspace/index.js`, `src/app/workspace.js`; Reader/Cloud Notes remain data owners.
- Dependencies: A2 split-pane responsive design; A3 single-owner state.
- Validation: signed-out/unavailable/error; persisted workspace view; search; open Scripture; open Cloud Notes; membership lookup failure never expands access.
- Confidence: HIGH.

### A4-12 — Calendar needs stronger scope separation and destructive-action clarity

- Branch/SHA: same
- Surface: `#/calendar`
- Evidence: `src/features/calendar/index.js` mixes personal events, assignment due dates and congregation events in a 30-day agenda. Leaders can share recurring congregation events. Personal events can be removed directly; owned shared congregation events expose Edit and Delete buttons with no explicit confirmation in the feature page.
- Category: UX / STATE / ERROR-RECOVERY
- Severity: HIGH
- User impact: users can conflate personal vs shared scope, and leaders can trigger a shared-event delete from the agenda with no feature-level confirmation step. Sync fallback messages exist for personal events, which is positive.
- Root cause: scope is encoded mainly by event source/icon and action availability rather than a deliberate planning/authoring model.
- Recommended v4 direction: distinguish My Plan, Assignments, and Congregation visually/filterably; make shared-event authoring an explicit leader mode. Add a durable confirmation pattern for destructive shared deletion in the true Calendar owner. Keep personal offline/cloud-sync feedback.
- Change class: UX-STRUCTURE / FUNCTION-AFFECTING for confirmation interaction only; BACKEND behavior should not change.
- True owner: `src/features/calendar/index.js`, `src/app/calendar.js`.
- Dependencies: A3 authorization/RLS review; A2 mobile agenda/editor composition.
- Validation: guest-local personal event, signed-in synced event, failed sync, member view, authorized shared create/edit/delete, recurrence occurrences, assignment due-date read-only display.
- Confidence: HIGH.

### A4-13 — Notification Center state handling is good, but destination continuity is underdeveloped

- Branch/SHA: same
- Surface: `#/notification-center`
- Evidence: `src/features/notification-center/index.js` covers signed-out, unavailable, error, loading, empty, unread/read, refresh, mark-all-read and route-opening states. Opening a notification asks the notification service for a verified route and navigates there.
- Category: NAVIGATION / STATE
- Severity: MEDIUM
- User impact: the inbox can send users into a destination, but there is no visible “return to inbox” continuity or grouping by actionable vs informational items. Relative timestamps are coarse and type names are raw.
- Root cause: notifications are rendered as a list of isolated items rather than a workflow inbox.
- Recommended v4 direction: prioritize actionable unread items, group lower-priority information, and carry a contextual return affordance where practical without creating a parallel history/state system. Preserve verified-route resolution in the notification service.
- Change class: UX-STRUCTURE; navigation-history changes require A3/captain review.
- True owner: `src/features/notification-center/index.js`; target validation stays in notification service.
- Dependencies: A3 safe route handoff.
- Validation: unread/read/all-read, invalid/unavailable target, opening assignment/community destination, browser Back behavior, offline/error refresh.
- Confidence: MEDIUM-HIGH.

### A4-14 — Grow conflates achievement tracking with introspective/psychometric tools

- Branch/SHA: same
- Surface: `#/grow`
- Evidence: `src/features/progress/index.js` combines XP/streak/activity/chapter stats, Transformation, Personality Profile, Psychometrics Lab, Avatar Vault, badges and an implementation-rule explanatory panel.
- Category: IA / CONTENT-HIERARCHY
- Severity: HIGH
- User impact: users may read personality/psychometric tools as part of scored spiritual progress because they sit directly beneath XP and achievements despite copy disclaimers.
- Root cause: “Grow” is carrying both progress/reward and private self-reflection domains.
- Recommended v4 direction: make progress/journey metrics the primary Grow experience and place Transformation/Personality/Psychometrics in a clearly separate “Reflection & self-understanding” section with mature trust language. Remove architecture-rule copy from normal product hierarchy.
- Change class: UX-STRUCTURE.
- True owner: `src/features/progress/index.js` and individual reflection feature owners.
- Dependencies: A1 tone; A3 privacy/persistence semantics.
- Validation: no changes to XP/badge ownership; psychometrics never displayed as spiritual grade; navigation remains reversible.
- Confidence: HIGH.

### A4-15 — Product recovery semantics should be unified across global and feature-local states

- Branch/SHA: same
- Surface: global recovery plus Reader, Community, Ministry, Workspace, Notifications, Account and other async features
- Evidence: `src/ui/shell.js` has a global “Feature could not open” recovery screen with Retry/Home and diagnostic classification. Individual features independently render signed-out, local-preview/unavailable, error and retry states with different language and action placement.
- Category: ERROR-RECOVERY / STATE
- Severity: HIGH
- User impact: similar-looking failures can mean very different things: sign in required, offline/local preview, insufficient permission, feature load failure, or route/render exception. Inconsistent presentation increases uncertainty.
- Root cause: recovery behavior is correctly owned by different layers but lacks a shared UX taxonomy.
- Recommended v4 direction: define a presentation taxonomy—not a global error-catching runtime—for `Auth required`, `Permission required`, `Offline/unavailable`, `Empty`, `Transient load failure`, and `Unexpected feature failure`. Features continue owning recovery actions; shared components only standardize language/status visual treatment.
- Change class: DESIGN-ONLY / UX-STRUCTURE; ARCHITECTURE-AFFECTING if someone attempts global interception (reject that approach).
- True owner: shared presentation component/token layer plus each feature’s actual recovery/state owner; `operational-recovery` remains unexpected-route failure owner.
- Dependencies: A1 state component design, A2 accessibility/live regions, A3 error-boundary safeguards.
- Validation: screen-reader announcement, keyboard focus, retry behavior, offline/online transition, auth/permission distinction, no swallowed exceptions.
- Confidence: HIGH.

## Lower-priority but meaningful opportunities

- Media/Recordings: merge the entry experience into one Media hub while preserving the existing single player/runtime; Home should link one media destination rather than two peer promotional panels.
- Couples: provide one Couples landing page that explains Device-only vs Paired Cloud Journey and then enters the correct owner. Never silently move local couple data to cloud.
- Bible World: strengthen cross-feature continuity—region → Scripture → return to region/progress—without adding duplicate Reader state.
- Study / Deep Questions / Story / Wisdom: each should have a distinct task progression model and explicit completion/return state rather than relying only on generic page chrome.
- Adaptive/Open Review: clarify which mode is automatic/due vs self-directed open recall; avoid exposing implementation terminology.
- Backup/reset: destructive reset requires unmistakable scope and confirmation; distinguish portable local learning state from private/auth/cloud data.
- Leaderboards/Recognition: keep celebration separate from private study/assignment response content and make congregation context explicit.
- Tutorial: v4 onboarding should be short, contextual and dismissible; avoid replaying a static tour whenever structure changes.

## Release-flow-style v4 redesign priority matrix

| Priority | Flow tranche | Why first | Safety boundary |
|---:|---|---|---|
| 1 | Global shell + navigation + contextual page header/back model | Every page depends on it; current hubs hide ~40 routes | Router/session remain single owners; deep links/back must survive |
| 2 | More → real domain IA | Current largest discoverability/cognitive-load problem | Role visibility must not become authorization |
| 3 | Learn + Reader + Notes | Core Bible/study experience; current Learn overload and Reader control density | Doctrinal/source and storage boundaries preserved |
| 4 | Assignments + Ministry + Notifications + Workspace | Highest operational complexity and privacy/role risk | Membership/RLS/API owners remain authoritative |
| 5 | Home + Daily Journey + Grow | Establish daily resume/next-action/product loop | Progress exactly-once and reflection privacy unchanged |
| 6 | Community + Groups + Live Rooms + Recognition | Can become a coherent community dashboard | No private-study aggregation across bridge |
| 7 | Calendar + My Mission | Planning continuity and cross-feature task visibility | Shared event permissions and assignment ownership preserved |
| 8 | Play/Games + Bible World | High delight opportunity after navigation foundation stabilizes | Games launcher/progress lifecycle stays single-owner |
| 9 | Couples + Media + remaining utilities | Important but less central to global IA | Local/cloud/private boundaries explicit |
| 10 | Unified empty/loading/error/offline presentation pass | Final coherence after page structures settle | Shared presentation only; no global catch-all behavior |

## Focused validation expectations after implementation

Any v4 tranche that changes structure should validate more than “page renders”:

1. Entry from every advertised parent surface and direct hash/deep link.
2. Contextual Back/close path plus browser Back/Forward behavior.
3. State continuity after leaving and returning.
4. Loading, empty, disabled, signed-out, permission-denied, offline/unavailable and transient-error states relevant to that feature.
5. Save/submit/delete feedback and retry semantics.
6. No stale identity/private content when auth or role changes.
7. No duplicate navigation/state/service owner introduced by responsive or redesigned compositions.
8. Mobile + tablet + desktop task completion, not merely visual fit.
9. Keyboard/focus/dialog behavior for every new sheet/modal/progressive-disclosure pattern.
10. Existing security/privacy/doctrinal boundaries remain explicit in tests where the changed UX crosses them.

## Cross-agent handoff

### To A1 — Design system

- Shell, Home, Learn, More, Assignments, Ministry and Workspace need genuine compositional redesign, not a new layer of panel styling.
- Define shared but flexible patterns for: page header/contextual back, dashboard summary, task list, role/status badge, empty/loading/error state, progressive-disclosure form, detail sheet/panel and destructive confirmation.
- Mature/private operational pages must visually distinguish scope and trust without covering the screen in implementation-policy copy.

### To A2 — Responsive / accessibility

- Reader needs a mobile reading-first composition and likely tablet/desktop split layout without duplicating state.
- More’s long linear stack should become compact grouped navigation with robust 320 px behavior.
- Assignments publisher/review, Calendar editor/agenda, Workspace and Account are the highest-value dense mobile-flow targets.
- Validate contextual back/sheets/dialogs, safe areas, focus restoration, text scaling and destructive confirmations.

### To A3 — Architecture / safety

- Review any proposed primary-navigation/domain-hub change for deep-link/history ownership but do not require v3 route hierarchy to stay visually unchanged.
- Account sign-out stale-shell issue should be verified as a real runtime state bug and corrected only in Account/session ownership.
- Notes unified entry must remain a facade over distinct private/cloud storage owners.
- Community dashboard aggregation must not pull private study data into the bridge.
- Assignments member/ministry split must remain one service with server/RLS authorization; UI role mode cannot grant authority.
- Calendar shared-delete confirmation is UX; shared-event authorization must remain existing backend/RLS truth.
- Reject any attempt to implement unified recovery through global fetch/error interception; standardize presentation only.
