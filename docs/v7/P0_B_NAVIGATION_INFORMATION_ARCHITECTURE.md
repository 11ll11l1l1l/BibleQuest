# V7 P0-B — Navigation and Information Architecture

Status: P0-B revised proposal; not integrated. Route families are mapped below; navigation ratification and cross-lane data/security/communication reconciliation remain open.
Owner: P0-B UX / information architecture
Baseline: `v7/development` at `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Scope: product-facing route and hierarchy decisions for Library, ONE 2 ONE, and small groups. This is a design contract; it does not change runtime routes or feature behavior.

## Goal

Make BibleQuest feel like one Bible companion with clear next steps. A first-time member should find Scripture, personal growth, trusted resources, and community without entering an administration-first surface. Preserve role-gated ministry tools and existing accepted V6 capabilities behind the same app shell.

This lane owns navigation hierarchy and the journeys below. It does not own schema, authorization policy, content approval policy, or runtime implementation. See [V7 Active Status](../../V7_ACTIVE_STATUS.md), [V7 starting point](../V7_STARTING_POINT.md), and the [rulebook](../../work/RULEBOOK.md).

## Proposed app shell

| Primary destination | User job | First screen |
|---|---|---|
| Today | Resume a daily or assigned journey | Today, with one prominent Continue action and a small set of relevant next steps |
| Bible | Read Scripture and open a passage in context | Reader at the selected/default passage |
| Grow | Continue personal formation, ONE 2 ONE pairing, curriculum, and learner-scoped communication | Grow overview with personal progress, active/pending pair state, and available curriculum |
| Library | Find a book, devotional, or past teaching | Library browse with three explicit content types |
| Community | Participate in congregation, group journeys, and authorized small-group communication | Community overview, with active congregation, groups, and upcoming sessions |

These labels are a proposed V7 hierarchy, not the current shell. At the baseline, `src/ui/shell.js` exposes `home`, `learn`, `play`, `grow`, and `more`. The table below shows a candidate regrouping for review; it is not yet ratified. Secondary destinations remain reachable from a clearly labeled More area, and no accepted capability becomes unreachable when a page is regrouped. The mobile/desktop presentation remains a P1 design decision.

Global route behaviors:

- Keep the current destination and a clear Back path when a Reader passage, lesson, teaching, or group prompt opens from a deep link.
- A Scripture reference opens the Reader at that passage; returning restores the originating lesson/card and its state.
- Protected Community and Ministry destinations wait for session and congregation context, then show the existing sign-in, select-congregation, or denial state as appropriate. Never infer the first congregation.
- Keep loading, empty, offline, error, and unauthorized states within the destination; do not silently send the user Home.
- Stable route IDs and URL syntax are implementation decisions for P1. This document specifies destinations and return behavior, not a new router.

## Current V6 route registry baseline

The route inventory below is read from `src/app/bootstrap.js` and the five shell links from `src/ui/shell.js` on the recorded baseline. These exact route keys are the current IDs; the family grouping is P0-B's proposed disposition for V7, not a claim that routes were changed.

| Current shell key | Current page-route keys tentatively grouped under the destination |
|---|---|
| `home` → Today | `home`, `bible-quest`, `mission` |
| `learn` → Bible / Study | `learn`, `reader`, `study`, `deep-questions`, `story-journey`, `wisdom-situations`, `adaptive-learning`, `bible-world`, `explorer`, `open-review`, `private-notes`, `cloud-notes` |
| `play` → Play | `play`, `challenges` |
| `grow` → Grow | `grow`, `my-journey`, `transform`, `personality-profile`, `psychometrics`, `avatar-vault` |
| `more` → Community / Utilities / Ministry | `more`, `community`, `journey-groups`, `encouragements`, `live-rooms`, `leaderboards`, `recognition`, `assignments`, `couples-family`, `couples-cloud`, `ministry-hub`, `leader-center`, `ministry-announcements`, `workspace`, `team-center`, `content-review`, `notification-center`, `calendar`, `recordings`, `media`, `my-mission`, `help`, `accessibility`, `backup`, `congregation`, `account` |
| System fallback | `not-found` |

This groups all 50 existing page-route keys. New Library, discipleship, and conversation-deck screens do not yet have route keys in the V6 registry, so this document does not invent any. P1 must add approved keys through the current router and retain existing IDs or explicit redirects. P0-C/D must supply route-specific session, congregation, role, evidence, and denial requirements before any protected route is implemented.

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

Entry is **Grow → ONE 2 ONE**. V7 includes mentor/mentee pairing, Track → Module → Lesson progress, the seven-step lesson flow, deep links/QR, and direct communication scoped to an active authorized pair.

| Route | Learner view | Mentor view |
|---|---|---|
| ONE 2 ONE overview | Pair status, next lesson, and communication entry for an accepted active pair | Assigned active mentees and their explicitly shared lesson progress |
| Pairing | Accept, decline, or view an authorized invitation and current pair status | Invite or manage a pairing only where the approved role/action permits |
| Track / module | Published tracks and module progress | Assigned track context only where the accepted sharing contract permits |
| Lesson | Current step, saved progress, and explicit sharing controls | Only progress or responses the learner explicitly shares under the approved contract |
| Pair communication | Private direct conversation with the active mentor/mentee | Conversation limited to the same active pair |
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

The P0-D product decision includes pairing and scoped direct communication in V7. P0-A's current draft omits pair/message relationships and P0-C must bind the pair visibility and denial cases, so those remain cross-lane reconciliation items before P0 freeze.

## Small-group journey

Entry is **Community → Groups → selected group**. The group home separates membership and schedule information, the Leader Conversation Deck, live sessions, and authorized small-group communication.

| Route | Leader view | Participant view |
|---|---|---|
| Groups | Create/join eligible groups; list active memberships | Join by valid invite and open memberships |
| Group home | Members, upcoming session, prepared deck, and group communication entry | Session details, group resources, and authorized group communication |
| Deck setup | Choose/order prompt cards; attach Scripture to a card; save a session flow | Not shown |
| Live conversation | Current card, previous/next navigation, and broadcast action | Current prompt and Scripture only |
| Group communication | Communicate within the selected authorized group/session audience | View and send only within the same authorized group/session audience |
| Session wrap-up | Close session and retain approved shared next steps | Shared next steps, if the leader publishes them |

During a live conversation, left/right moves between prepared cards and up broadcasts the selected card. Participant phones show the prompt and Scripture, without leader controls. The deck remains a facilitation surface; the separately scoped communication path must not turn deck display into an unrestricted chat or expose unrelated group/private content. Use an existing V6 communication capability where it meets the approved scope, or define a bounded V7 surface during P0 reconciliation.

Never expose private notes, reflections, lesson answers, or a member's unshared prayer content in group routes. Group communication is limited to authorized membership and the approved group/session audience; congregation, role, and server authorization remain authoritative. A visible route or invite code does not authorize access by itself. P0-A/C/D must reconcile message ownership, audience, retention, lifecycle, and denial behavior before implementation.

## Journey links and shared components

- Today may link to a daily devotional, ONE 2 ONE next lesson, group session, or assigned journey based on available state; each card has one clear action and returns to its source context.
- Library, lessons, and group cards use one Scripture handoff to the shared Reader.
- A lesson or group session can expose an explicit, shareable action/summary only where the feature contract permits it; private reflection content remains separate.
- Language selection follows the existing account/app preference. Shelf, lesson step, group prompt, and empty/error states all use the selected language when translations exist.
- Media attachments in Library or groups follow the approved centralized BibleQuest Google Drive model: Drive stores bytes; Supabase stores metadata, authorization, and moderation state. This route design does not create storage paths or weaken object-scope checks.

## P0-B acceptance and reconciliation

P0-B is not ready to integrate until the following are reconciled with P0-A/C/D and the current route registry:

- The five primary destinations and More hierarchy are reviewed against the complete V6 route/surface inventory. The inventory must use route keys from the live router/registry and assign each route a product family, canonical entry, session/congregation prerequisite, deep-link behavior, and disposition. The conceptual labels in this draft are not route IDs.
- Library has the three required content types, browse/detail paths, source attribution, and Reader handoff.
- The track/module/lesson hierarchy, seven lesson steps, mentor/mentee pairing, deep links/QR, and scoped direct communication are represented. P0-A must map pair/message relationships and P0-C must define visibility/denial boundaries before P0 freeze.
- Group membership, deck setup, live session, scoped small-group communication, and wrap-up are distinct destinations with leader/participant presentation boundaries and explicit message audience/lifecycle ownership.
- Private reflections, prayers, notes, and answers remain private unless explicitly shared; pair/group messages remain scoped to the authorized relationship or audience under P0-A/C/D.
- Route behavior states session/congregation hydration and destination-local loading/error/empty states.
- The approved central Drive media contract is reflected; the older ImageKit-first proposal is not treated as active.
- No runtime route, backend, schema, or content-policy change was introduced by this architecture deliverable.

## Next implementation boundary

The V7 product decision includes mentor/mentee pairing and scoped direct/small-group communication. P0-B remains open only for cross-lane reconciliation of route placement, P0-A pair/message modeling, P0-C visibility/denial rules, and the integration owner's serialized route/ownership freeze. P1 route implementation starts after that combined P0 freeze. P0-B does not mark feature implementation or user acceptance complete.
