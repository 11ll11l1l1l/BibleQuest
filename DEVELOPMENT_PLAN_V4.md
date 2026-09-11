# BibleQuest v4 — Modern UI/UX Overhaul Development Plan

Updated: 2026-09-12 JST
Status: Authoritative planning contract for the v4 overhaul branch
Tracking issue: #124

## 1. Purpose

BibleQuest v4 is a controlled major-version overhaul of the current verified v3 product. The objective is not merely to add more decoration. V4 should make the application feel modern, polished, coherent, useful, and intentionally designed while preserving the working functional, security, account-isolation, persistence, PWA, and backend contracts that v3 established.

The user has explicitly authorized v4 to adjust visual design **and structure** where doing so materially improves usability and polish. This is a new v4 authority and supersedes the old v3 restriction against structural visual changes **only inside v4 development**. Historical v3 evidence and release documents remain accurate for v3 and must not be rewritten as if those rules never existed.

## 2. Frozen baseline and safety boundary

Planning baseline:

- repository `main`: `4d1f5e471c420114ea5e9c339ae09cff9efb78f6`
- exact-green v3 product: `2c601b3289dba891f349801219f49804f85f63cc`
- v4 integration branch: `v4/modern-ui-overhaul`
- v4 tracking issue: #124

The verified v3 product and its production/rollback references remain the safety floor until a complete exact v4 candidate earns replacement status.

V4 work must not silently mutate the v3 release truth. Do not rewrite v3 status documents to claim v4 work is already part of v3. V4 gets its own development status, acceptance, and release evidence as implementation advances.

## 3. Mandatory user requirements

### 3.1 Home assignment notification and direct link

Home must surface assignments without requiring the user to discover the Community/Assignments path first.

Current architecture already has one Assignments service owner and one `assignments` route. V4 must reuse them. Do not create a second assignment cache, API client, table owner, or parallel progress model just to make Home easier to render.

Home should provide an actionable assignment summary capable of representing at minimum:

- signed out;
- offline/local preview;
- authenticated but no congregation;
- loading;
- API/load failure;
- no assignments;
- one open assignment;
- multiple open assignments;
- started assignment;
- due soon;
- overdue;
- all currently visible assignments complete.

The Home presentation should prioritize the most urgent relevant item while also communicating the pending count when useful. The primary action must navigate through the existing router into `assignments`. Any per-assignment deep-link behavior added later must still be owned by the current Assignments route/service rather than Home reimplementing assignment detail logic.

Assignment summary data must preserve current congregation/member/team/group/couple privacy boundaries. Home must never broaden visibility compared with the existing Assignments owner.

### 3.2 Home quick-shortcut slider / icon rail

Restore the useful interaction idea from the original BibleQuest Home design without importing legacy runtime/patch architecture.

V4 Home should include a horizontal quick-action rail with polished icon cards/tiles. It should be:

- obvious but compact;
- touch/swipe friendly;
- horizontally scrollable with sensible snap behavior;
- usable with mouse/trackpad;
- keyboard and focus accessible;
- readable with icon + text labels;
- responsive from 320 CSS px upward;
- incapable of causing document-level horizontal overflow;
- motion-safe under `prefers-reduced-motion`;
- implemented through current router destinations, not inline duplicate screens.

Initial high-value actions should normally include:

1. Daily Journey
2. Reader
3. Assignments
4. Calendar
5. Progress / Grow

Other actions can be included only when they improve the Home experience rather than turning the rail into another full More menu. Candidate additions include Bible World, Games/Play, Community, Mission, or media depending on the final information hierarchy.

Before visual implementation, inspect the legacy/original Home shortcut treatment for useful proportions, artwork language, discoverability, and interaction cues. Reuse the design idea, not obsolete architecture.

### 3.3 Modern polished visual overhaul

V4 is expected to look substantially more refined than v3. Design and page structure may change. The goal is a coherent product rather than a collection of individually patched pages.

Modern/polished is defined by measurable qualities:

- clear hierarchy at first glance;
- consistent page composition and spacing rhythm;
- deliberate typography scale and line lengths;
- coherent surface/elevation system;
- purposeful iconography and artwork;
- restrained visual density;
- strong status/feedback states;
- clearly interactive controls;
- consistent empty/loading/error states;
- polished responsive transitions between phone, tablet, and desktop;
- accessible contrast, text sizing, target sizes, focus states, and reduced motion;
- no generic placeholder-like areas on major user-facing screens;
- no visual improvement at the cost of route discoverability or working behavior.

## 4. V4 architecture principles

### 4.1 Preserve domain ownership

Structural UI change does not authorize architecture duplication.

- `src/core/api.js` remains the API boundary unless a separate architecture decision explicitly changes it.
- Existing app services remain the source of business state.
- Existing feature routes remain owners of their detailed workflows unless a planned migration explicitly moves ownership and tests the move.
- Home can summarize and navigate; it must not become a second implementation of Assignments, Calendar, Reader, Community, etc.
- Do not reintroduce MutationObserver patching, broad `window.BQ` globals, arbitrary direct storage writes, visual injectors, or duplicate legacy runtimes.

### 4.2 Presentation system before page-by-page patching

V4 should establish reusable design-system primitives before broad page conversion. Avoid another sequence of isolated `*-visual-polish.css` layers that accumulate conflicting presentation rules.

The preferred direction is:

- centralized tokens;
- reusable layout primitives;
- reusable action/card/list/status patterns;
- route-specific CSS only for genuinely route-specific composition;
- feature JavaScript concerned with semantics/state/actions rather than decorative duplication.

Existing v3 styles remain available while migration proceeds. Remove old styles only after the v4 replacement is verified.

### 4.3 Backend freeze by default

This overhaul is primarily UI/UX. Supabase schema, RLS, Edge Functions, migrations, and production data are frozen by default.

A backend change is permitted only when an actual v4 functional requirement cannot be satisfied safely through the existing contract and the root cause is demonstrated. Such a change becomes its own reviewed/tested tranche and must never be smuggled into a visual PR.

## 5. Target v4 information hierarchy

This is the starting architecture, not an instruction to force every screen into an identical template.

### Home — action dashboard

Priority order:

1. identity/context + concise greeting/status;
2. Daily Journey / continue action;
3. urgent assignment notification/action;
4. quick-shortcut slider/icon rail;
5. current progress / momentum;
6. contextual/recent content;
7. lower-frequency congregation/media/help entries.

Recordings, Media Library, and Tutorial should remain reachable but should not visually dominate daily core actions.

### Learn

Organize learning destinations around user intent rather than a flat feature dump. Reader and study flows should be obvious. Advanced/specialized learning tools can be grouped beneath clearer primary choices.

### Play

Present games/challenges as a polished discovery surface with progress/continue cues where available. Avoid card grids that feel like unstyled internal tools.

### Grow

Progress, habits, mission, reflection, avatar/rewards, and related growth signals should feel connected rather than independent feature islands.

### More

More remains the organized home for lower-frequency/community/account/ministry/support destinations. It should not become a dumping ground. Group sections by user mental model and role.

V4 may adjust bottom-navigation or top-level presentation only after an explicit route-reachability inventory proves that every existing destination remains discoverable and the change improves the product. Do not change primary navigation casually in the first tranche.

## 6. Implementation phases and gates

### Phase 0 — freeze, audit, and visual contract

Deliverables:

- confirm v3 baseline/rollback refs and exact product identity;
- inventory every current route and its owner;
- inventory feature entry points from Home/Learn/Play/Grow/More;
- inventory current design tokens, shell CSS, page-specific visual layers, artwork/icons, and responsive rules;
- inventory accumulated v3 tests that must remain a v4 floor;
- inspect original/legacy BibleQuest Home for shortcut/icon-slider reference;
- capture representative baseline screenshots at 320, 360, 390, 412, 430 px and tablet/desktop widths;
- identify the highest-value screens for v4 conversion order;
- create V4 design tokens and component conventions before broad implementation.

Gate to Phase 1:

- route/feature inventory complete;
- no unresolved question about state/API owner for Home assignments;
- v3 rollback remains intact;
- design contract is concrete enough that implementation is not random page-by-page restyling.

### Phase 1 — design system and shell foundation

Build a v4 presentation foundation:

- typography scale;
- spacing scale;
- semantic color/state tokens;
- surface/elevation model;
- radius/border treatment;
- responsive container/layout rules;
- icon sizing/alignment rules;
- motion durations/easing with reduced-motion behavior;
- reusable page-header/section-header components/patterns;
- cards, action tiles, badges, chips, notification banners;
- loading/empty/error/success states;
- horizontal rail/slider primitive;
- responsive grid/list primitives.

Modernize shell/topbar/navigation presentation only to the extent needed to support the new design system. Preserve current route reachability and five-destination behavior during the foundation phase unless a separately tested IA change is approved by the v4 plan.

Gate:

- no route loss;
- baseline shell/browser tests green;
- mobile widths fit;
- keyboard/focus/reduced-motion contracts pass;
- no backend changes.

### Phase 2 — Home action hub — highest functional/UI priority

This is the first major user-facing v4 tranche.

Implement:

- modern Home composition;
- retained/prominent Daily Journey;
- assignment summary/notification using existing Assignments service;
- direct Assignments action through router;
- horizontal icon shortcut rail;
- modern progress summary;
- rationalized lower-priority Tutorial/Recordings/Media placement;
- loading/error/empty/signed-out variants that remain visually coherent.

Preferred assignment integration pattern:

- extend the existing Home dependency injection in `src/app/bootstrap.js` with the current `assignments` owner and an `onAssignments` router action;
- derive a small read-only Home summary from the Assignments owner/service state or an owner-provided selector;
- if a new selector/helper is required, put it with the Assignments owner and unit-test it rather than reproducing due-state/business rules in Home;
- Home renders summary state and navigates; Assignments remains workflow owner.

Preferred shortcut pattern:

- data-driven route/action configuration in the Home feature or shared presentation owner;
- one reusable rail primitive;
- stable accessible labels;
- no icon-only inaccessible buttons;
- no duplicate router implementation.

Focused Phase 2 tests must cover:

- every Home assignment state listed in section 3.1;
- most-urgent/pending-count display semantics;
- click/tap to Assignments;
- route works after reload/re-login;
- no visibility broadening for unrelated accounts;
- shortcut order/labels/actions;
- swipe/scroll/snap behavior;
- tab/focus/keyboard behavior;
- reduced motion;
- 320/360/390/412/430 px fit;
- tablet/desktop behavior;
- no console/page errors;
- no document horizontal overflow;
- PWA/offline Home rendering.

Gate:

- exact Phase 2 SHA passes focused Home tests plus accumulated core v3 regression relevant to shell, routes, Assignments, mobile, accessibility, and PWA.

### Phase 3 — primary destination overhaul

Modernize as one coherent product family:

- Home (follow-up only if Phase 2 evidence justifies it)
- Learn
- Play
- Grow
- More

For each route:

1. inventory current actions and data;
2. define intended hierarchy;
3. map old entry points to new entry points;
4. implement using shared v4 primitives;
5. run focused route regression;
6. run accumulated shell/navigation/mobile/accessibility gates before merging.

Structural regrouping is allowed. Feature deletion is not.

Gate:

- every existing primary-route capability remains reachable;
- no duplicated feature/runtime owner;
- phone/tablet/desktop acceptance green;
- no meaningful accessibility regression;
- performance/assets remain within a documented budget.

### Phase 4 — secondary/workflow surface modernization

Suggested order based on visibility and workflow importance:

1. Reader
2. Assignments
3. Calendar
4. Daily Mission / Journey
5. Progress
6. Account
7. Avatar Vault
8. Bible World / Games
9. Community
10. Journey Groups / Teams
11. Couples
12. Ministry Hub / Workspace
13. Live Rooms / Recognition / Leaderboards
14. Recordings / Media
15. remaining maintained support/admin surfaces

Do not mechanically redesign stable specialized controls if doing so adds risk without improving clarity. Modernization can be lighter on low-frequency technical surfaces, but core user-facing visual consistency must remain.

Gate per tranche:

- focused workflow regression;
- route/navigation regression;
- widths/accessibility;
- relevant isolation/security tests;
- accumulated suite appropriate to risk.

### Phase 5 — interaction, artwork, responsive, accessibility, performance polish

Polish only after the structural migration is stable.

Tasks:

- replace remaining low-quality/generic/placeholder visual assets;
- harmonize iconography and illustration style;
- tune empty/loading/error states;
- refine micro-interactions and transition behavior;
- verify reduced motion;
- eliminate layout shifts and clipping;
- check long translations/text expansion where relevant;
- validate keyboard-only operation;
- screen-reader landmark/name/state checks;
- orientation and safe-area behavior;
- asset-size and performance review;
- PWA offline/recovery visual behavior.

Artwork generation/replacement is allowed when it fits the v4 visual system. Artwork must be integrated as presentation assets and must not become business logic.

### Phase 6 — v4 exact release candidate

Before any v4 production promotion:

- freeze exact v4 product SHA;
- run `bash build.sh` and architecture ownership validators;
- run full static/security/edge regression;
- run complete browser/mobile suite;
- explicit 320/360/390/412/430 widths;
- tablet/desktop checks;
- PWA install/offline/recovery;
- accessibility/reduced motion;
- Home assignment/shortcut acceptance suite;
- all changed feature focused regressions;
- multi-account assignments/groups/teams/couples/Live Room isolation scenarios;
- physical Android Chrome at 100% zoom;
- physical Android Brave at 100% zoom;
- genuinely installed PWA session;
- preview/staging smoke before production;
- independent production-byte/browser verification after promotion;
- preserve a documented rollback route to verified v3 until v4 production acceptance is complete.

No PASS transfers from v3 to changed v4 bytes. V3 tests are the floor, not evidence that an untested v4 candidate is safe.

## 7. Home assignment acceptance contract

The final v4 Home assignment surface must satisfy all of the following:

- An authenticated user with a relevant pending assignment can see that fact on Home without opening More/Community first.
- One clear action reaches Assignments in a single tap/click from the Home notice.
- Urgent/overdue state is distinguishable without relying only on color.
- Multiple pending assignments provide a useful count rather than arbitrarily hiding that more work exists.
- The Home summary never shows an assignment that the existing Assignments owner would deny or omit.
- Loading and network failure do not masquerade as “no assignments.”
- Signed-out/no-congregation states do not emit confusing false alerts.
- Completed/no-pending state is calm and non-intrusive.
- The surface survives route navigation, reload, and normal re-login behavior.
- The full Assignments route remains the owner of detailed actions and submissions.

## 8. Shortcut rail acceptance contract

The final Home quick actions must satisfy:

- useful at 320 px without requiring page zoom-out;
- no document-level horizontal scrolling;
- natural swipe on touch screens;
- pointer/trackpad scroll works;
- appropriate scroll snapping;
- visible focus states;
- keyboard navigation does not trap focus;
- icon plus readable label for every action;
- minimum practical touch target maintained;
- reduced-motion users do not receive forced animated scrolling;
- all actions use current router/service owners;
- no stale links after structural v4 changes;
- desktop presentation remains intentional rather than an oversized mobile carousel.

## 9. Regression firewall

A v4 tranche is rejected if it causes any of the following without an explicitly approved replacement behavior:

- missing existing route/feature;
- broken direct/deep navigation;
- assignment privacy/targeting regression;
- auth/session regression;
- PWA/offline regression;
- accessibility regression;
- document overflow at maintained phone widths;
- duplicate state/API owner;
- bypass of RLS/auth to simplify UI;
- console/page errors in normal workflows;
- destructive data/schema change unrelated to the visual goal;
- performance degradation severe enough to materially harm normal mobile use.

Do not “fix” a failing test by weakening the test when the test still represents intended v4 behavior.

## 10. Branch and PR strategy

Do not build v4 as one enormous unreviewable commit.

Recommended tranche branches from the v4 integration line:

- `v4/design-system-shell`
- `v4/home-action-hub`
- `v4/primary-destinations`
- `v4/workflows-<surface>` as needed
- `v4/final-polish`
- `v4/release-candidate`

Each tranche:

1. starts from the latest verified v4 integration point;
2. changes one coherent responsibility set;
3. adds/updates focused tests;
4. passes its required focused and accumulated regression;
5. records exact SHA/run evidence;
6. merges only after green;
7. updates v4 status without rewriting v3 history.

Avoid concurrent edits to the same shell/Home files by multiple implementation agents. Parallel work should be partitioned by independent routes or read-only analysis until shared foundations are merged.

## 11. V4 milestone definition

V4 is ready for final release consideration only when:

1. Home assignment notification/link is complete and verified.
2. Home quick-action slider/icon rail is complete and verified.
3. Primary destinations share the v4 design system and coherent information architecture.
4. Major secondary user workflows are visually modernized without functional loss.
5. No reproduced P0/P1 defect remains unresolved.
6. Complete exact-candidate automated regression is green.
7. Multi-account isolation/relationship workflows are field-verified for v4.
8. Physical Android Chrome/Brave and installed PWA acceptance is complete for v4.
9. Preview and production verification prove the intended exact bytes are live.
10. Verified v3 rollback remains available until final v4 acceptance.

## 12. Immediate execution order

When implementation begins, do not jump randomly between pages.

1. Complete Phase 0 route/style/legacy Home audit.
2. Establish v4 design tokens/primitives and shell foundation.
3. Implement Home assignment summary using the existing Assignments owner.
4. Implement Home shortcut icon rail.
5. Complete the Home dashboard composition and focused regression.
6. Modernize Learn/Play/Grow/More using the established system.
7. Migrate secondary surfaces in risk/value order.
8. Complete full polish and release validation.

The governing objective is: **modern and polished, structurally improved where valuable, but never at the expense of BibleQuest's working features, privacy boundaries, security architecture, or rollback safety.**
