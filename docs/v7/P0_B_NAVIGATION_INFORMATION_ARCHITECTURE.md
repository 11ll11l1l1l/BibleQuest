# V7 P0-B — Navigation and Information Architecture

Status: P0-B route and journey contract accepted in the serialized P0 freeze; runtime routes remain unimplemented.
Owner: P0-B UX / information architecture
Baseline: `v7/development` at `cb484bc839f9874659f501a755d93ae78dbceed6`
Scope: minimum navigation and journey decisions for Library and structured ONE 2 ONE. Preserve the existing V6 shell and other V6 routes; no unrelated product redesign or runtime change.

## Goal

Make BibleQuest feel like one Bible companion with clear next steps. A first-time member should find Scripture, personal growth, trusted resources, and community without entering an administration-first surface. Preserve role-gated ministry tools and existing accepted V6 capabilities behind the same app shell.

This lane owns navigation hierarchy and the journeys below. It does not own schema, authorization policy, content approval policy, or runtime implementation. See [V7 Active Status](../../V7_ACTIVE_STATUS.md), [V7 starting point](../V7_STARTING_POINT.md), and the [rulebook](../../work/RULEBOOK.md).

## Existing app shell and minimum V7 entry points

Preserve the V6 primary shell keys and order: `home`, `learn`, `play`, `grow`, and `more`. V7 adds only the minimum entry points needed to expose Library and structured ONE 2 ONE; it does not replace the shell with a new five-destination navigation or redesign unrelated V6 surfaces.

| Existing shell key | V7 entry placement | V7 behavior |
|---|---|---|
| `home` | No shell change | Preserve existing Home/Today behavior and V6 assignments. |
| `learn` | Library entry alongside existing Learn/Study routes | Open Library browse and return to the originating Reader/Study context. |
| `play` | No V7 change | Preserve existing V6 play routes and behavior. |
| `grow` | ONE 2 ONE entry alongside existing Grow journeys | Open pairing overview, assigned track/module/lesson, and learner progress. |
| `more` | Preserve existing V6 secondary destinations | Keep existing Community, ministry, account, utility, and administration routes reachable; no V7 group/media project is added. |

P0-B proposes the following new page-route keys, all distinct from the 50 registered V6 keys. They use the existing kebab-case route-key convention and remain proposals until the P0 integration owner ratifies them. P1 wires them through the current router.

| Proposed route key | Canonical entry | Purpose and return behavior |
|---|---|---|
| `library` | Existing `learn` shell / Library entry | Browse Books, Devotionals, and Past Teachings; return to the prior Learn/Study context. |
| `library-item` | `library` or an approved Library deep link | Show one published item/revision; Reader handoff returns to the same item and position. |
| `one-to-one` | Existing `grow` shell / ONE 2 ONE entry | Show the learner's relationship state, next assigned lesson, and progress. |
| `one-to-one-pair` | `one-to-one` or an authorized pairing link | Show/invoke the authorized invitation or active pair workflow; return to the prior ONE 2 ONE context. |
| `one-to-one-track` | `one-to-one` or an authorized assignment/deep link | Show the selected track and progress; return to ONE 2 ONE. |
| `one-to-one-module` | Track or authorized deep link | Show the selected module and progress; return to the parent track. |
| `one-to-one-lesson` | Module or authorized assignment/deep link | Run/resume the assigned lesson; Scripture handoff returns to the same lesson step. |
| `one-to-one-thread` | Active pair context only | Open the pair's existing V6 communication thread; return to the active pair/lesson context. |

The route key selects a page, not an authorization scope. Resource IDs are resolved by the existing assignment/pair/Library services and must be validated server-side; guessed IDs and query parameters do not grant access. The current V6 router reduces hashes to a route key and discards query/path suffixes, so P1 must add only the minimum safe resource-context handoff needed by these approved routes while retaining that router. No global shell key is renamed or reordered.

Global behavior for the two V7 journeys:

- Preserve a clear Back path for Reader handoffs, lessons, pairing, and approved deep links; returning restores the originating item and position.
- A Scripture reference opens the existing V6 Reader at the canonical passage and preserves the originating lesson/Library context.
- Protected pair/lesson destinations wait for session and active-congregation context, then use existing sign-in/selection/denial behavior. Never infer the first congregation.
- Loading, empty, offline, error, and unauthorized states stay local to the V7 destination.
- Reuse V6 assignment, deep-link, notification, Reader, localization, and messaging services where their contracts fit; do not create duplicate engines.

## Current V6 route inventory

The route inventory below is read from `src/app/bootstrap.js` and the five shell links from `src/ui/shell.js` on the recorded baseline. These exact route keys are the current IDs; the groupings below document the existing V6 shell and route inventory only; they are not a V7 redesign or request to move existing features.

| Current shell key | Existing page-route keys in this shell family |
|---|---|
| `home` | `home`, `bible-quest`, `mission` |
| `learn` | `learn`, `reader`, `study`, `deep-questions`, `story-journey`, `wisdom-situations`, `adaptive-learning`, `bible-world`, `explorer`, `open-review`, `private-notes`, `cloud-notes` |
| `play` | `play`, `challenges` |
| `grow` | `grow`, `my-journey`, `transform`, `personality-profile`, `psychometrics`, `avatar-vault` |
| `more` | `more`, `community`, `journey-groups`, `encouragements`, `live-rooms`, `leaderboards`, `recognition`, `assignments`, `couples-family`, `couples-cloud`, `ministry-hub`, `leader-center`, `ministry-announcements`, `workspace`, `team-center`, `content-review`, `notification-center`, `calendar`, `recordings`, `media`, `my-mission`, `help`, `accessibility`, `backup`, `congregation`, `account` |
| System fallback | `not-found` |

This inventory contains all 50 current page-route keys from the recorded baseline. Preserve every existing V6 route and its behavior. V7 adds only Library and ONE 2 ONE entry paths; it does not retire or regroup Play, Community, Couples, ministry, administration, or utility routes. Any new route key is introduced through the existing router after P0 ratification, with session, congregation, role, and denial requirements from P0-C/D.

## Library journey

Library is an organized resource home, not a second feature launcher. Its first screen exposes three named shelves:

1. **Books** — authored books and structured learning material.
2. **Devotionals** — short readings discoverable by life topic, Scripture, and language.
3. **Past Teachings** — coherent articles derived from reviewed sermon/teaching material, with source attribution.

Browse and detail hierarchy:

| Route | Main content | Primary action |
|---|---|---|
| Library | Books / Devotionals / Past Teachings; search and topic/category filters | Open a shelf or item |
| Shelf | Items in the selected content type; language and topic context stays visible | Open an item |
| Book detail | Description, author, language, contents and reading progress | Start or resume a chapter |
| Devotional detail | Scripture, reflection, prayer and a practical response | Read Scripture or mark complete |
| Teaching article | Edited article, Scripture references, topic tags and source attribution | Read or open referenced passage |

Use topic/category tags to help people browse by need, while retaining the three content types as the stable top-level structure. Keep original source and attribution visible for Past Teachings. Any content that is not approved for publication remains absent from member browse results under the existing moderation contract.

### Reader handoff

Opening a Scripture reference from any Library item uses the shared Bible destination with the exact reference and translation context available to that item. Back returns to the item and reading position. Do not create an independent Scripture renderer inside Library.

## ONE 2 ONE journey

Entry is **Grow → ONE 2 ONE**. V7 includes mentor/mentee pairing, Track → Module → Lesson progress, the seven-step lesson flow, and approved deep-link/QR entry. Pair-thread communication reuses the existing V6 messaging capability; V7 does not build a new messaging system.

| Route | Learner view | Mentor view |
|---|---|---|
| ONE 2 ONE overview | Pair status, next lesson, and communication entry for an accepted active pair | Assigned active mentees and their explicitly shared lesson progress |
| Pairing | Accept, decline, or view an authorized invitation and current pair status | Invite or manage a pairing only where the approved role/action permits |
| Track / module | Published tracks and module progress | Assigned track context only where the accepted sharing contract permits |
| Lesson | Current step, saved progress, and explicit sharing controls | Only progress or responses the learner explicitly shares under the approved contract |
| Pair communication | Existing V6 pair-scoped messaging capability, when available to the active pair | Existing V6 pair-scoped messaging capability, when available to the active pair |
| Pair closure | End or leave a pairing and see its closed state | Closed-pair state; no ongoing access from the former relationship |

| Step | Learner screen | Completion action |
|---|---|---|
| 1 | Scripture | Read the assigned passage in the shared Reader |
| 2 | Understand | Review the lesson explanation |
| 3 | Discuss | Respond to guided discussion prompts |
| 4 | Reflect | Write a personal reflection |
| 5 | Apply | Choose a practical application |
| 6 | Pray | Use or write a prayer |
| 7 | Action | Record the next action and finish/resume the lesson |

Learners can resume the last saved lesson step. Deep links and QR codes open the intended published track, module, lesson, or authorized pair entry after session state has loaded; Back restores the originating context. Pairing does not itself reveal a learner's private reflection, prayer, notes, or answers. Any sharing is explicit and limited to the approved audience. Pair state, visible progress, message access, and pair termination must follow the P0-A data model and P0-C authorization contract; a route or pairing label grants no authority.

P0-A maps pair relationships and pair-scoped messages using existing V6 communication. P0-C defines active-pair access and privacy rules. P0-B route placement and handoff behavior must match those contracts before P0 freeze.

## Existing group features and V8 boundary

V6 group, congregation, team, and Live Room features remain available under their existing routes and authorization. V7 does not add or redesign those journeys.

The Leader Conversation Deck, participant broadcast/realtime small-group sessions, and new group chat are explicitly deferred to V8. Do not add group-chat links to V7 navigation, reuse ONE 2 ONE pair messaging as group communication, or change existing V6 group behavior in this lane.

## Journey links and shared components

- Existing Home/Today and V6 notification/assignment surfaces may link to a Library item or ONE 2 ONE lesson using their current contracts; each link returns to its source context.
- Library items and ONE 2 ONE lesson steps use one Scripture handoff to the shared Reader.
- A learner may explicitly share a lesson response only where the approved V7 feature contract permits it; private reflection remains separate. Group-session sharing is unchanged V6 behavior and outside this lane.
- Language selection follows the existing account/app preference. Library shelves, lesson steps, pair-thread states, and empty/error states all use the selected language when translations exist.
- Any media or Scripture attachment uses existing V6 capabilities within their current contract. Central Drive media ingest and expanded moderation are V8 scope.

## P0-B acceptance and reconciliation

The following P0-B criteria are accepted in the serialized freeze; P1 runtime implementation and evidence remain open:

- The existing shell keys/order and all 50 current page-route keys are retained; the proposed Library and ONE 2 ONE entry placements are ratified as minimum V7 additions, with no whole-app redesign.
- Library has the three required content types, browse/detail paths, source attribution, and Reader handoff.
- Track/module/lesson, seven lesson steps, pairing, deep links/QR, and reuse of V6 pair communication match P0-A/C. Pair access and private-response boundaries remain explicit.
- Conversation Deck, realtime group sessions, and new group chat are excluded from V7 and recorded for V8; existing V6 group routes remain intact.
- Private reflections, prayers, notes, and answers remain private unless explicitly shared; ONE 2 ONE messages are visible only to current pair participants under P0-A/C/D. Existing V6 group messaging remains unchanged and outside V7.
- Route behavior states session/congregation hydration and destination-local loading/error/empty states.
- Central Drive/media pipeline, bulk ingestion, and full Ilocano rollout are V8 deferrals; V7 content uses existing V6 capabilities.
- No runtime route, backend, schema, or content-policy change was introduced by this architecture deliverable.

## Next implementation boundary

P0-B's route and journey contract is accepted with the narrowed V7 objective: Library plus structured ONE 2 ONE. It preserves existing V6 shell/routes and reuses V6 pair messaging; Conversation Deck, new group chat/realtime sessions, central Drive media pipeline, and full Ilocano rollout remain V8. The P0 freeze records agreement across A/B/C/D. P1 implementation and user acceptance remain open.
