# V7 P0-B — Navigation and Information Architecture

Status: P0-B proposal; not integrated. Current route keys are mapped below; final navigation placement and discipleship scope remain open.
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
| Grow | Continue personal formation and individual discipleship curriculum | Grow overview with personal progress and available curriculum |
| Library | Find a book, devotional, or past teaching | Library browse with three explicit content types |
| Community | Participate in congregation and group journeys | Community overview, with active congregation and groups |

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

## Discipleship curriculum journey (scope pending)

Candidate entry is **Grow → Discipleship**. V7's P0-A/P0-D drafts propose a curriculum foundation with individual lesson progress and exclude mentor/mentee pairing, synchronized pair status, private responses, and review workflows. That proposal conflicts with the user's earlier ONE 2 ONE requirement for pairing and the later question about reducing V7 scope. P0-B keeps this as an explicit freeze decision; it does not silently include or defer pairing.

| Step | Learner screen | Completion action |
|---|---|---|
| 1 | Scripture | Read the assigned passage in the shared Reader |
| 2 | Understand | Review the lesson explanation |
| 3 | Discuss | Respond to guided discussion prompts |
| 4 | Reflect | Write a personal reflection |
| 5 | Apply | Choose a practical application |
| 6 | Pray | Use or write a prayer |
| 7 | Action | Record the next action and finish/resume the lesson |

A lesson can be resumed at its last saved step. Track → module → lesson remains the hierarchy; the learner sees progress at all three levels. Deep links and QR codes open the intended published track/module/lesson after required session state has loaded.

For the curriculum-only proposal, learner reflections, prayer text, discussion answers, and notes remain private to the learner. If V7 includes mentor pairing, the route and visibility rules must be explicitly ratified against P0-A and P0-C before implementation; do not infer mentor access from a route or pairing label.

The seven lesson steps remain a useful reusable curriculum structure regardless of whether paired mentoring is V7 or V8.

## Small-group journey

Entry is **Community → Groups → selected group**. The group home separates membership and schedule information from a live conversation session.

| Route | Leader view | Participant view |
|---|---|---|
| Groups | Create/join eligible groups; list active memberships | Join by valid invite and open memberships |
| Group home | Members, upcoming session, prepared conversation deck | Session details and group resources |
| Deck setup | Choose/order prompt cards; attach Scripture to a card; save a session flow | Not shown |
| Live conversation | Current card, previous/next navigation, broadcast action | Current prompt and Scripture only |
| Session wrap-up | Close session and retain approved shared next steps | Shared next steps, if the leader publishes them |

During a live conversation, left/right moves between prepared cards and up broadcasts the selected card. Participant phones show the prompt and Scripture, without leader controls or a free-form group chat surface. The deck is a facilitation tool, not a second messaging product.

Never expose private notes, reflections, lesson answers, or a member's unshared prayer content in the group route. Existing group membership, congregation, role, and trusted mutation boundaries remain authoritative; a visible route or invite code does not authorize access by itself.

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
- The track/module/lesson hierarchy and seven lesson steps are retained. V7 pairing scope remains an explicit product decision; the P0-B route map must match the ratified decision and P0-A/C data/security boundaries.
- Group membership, deck setup, live session, and wrap-up are distinct destinations with leader/participant presentation boundaries.
- Private reflection and group-content boundaries are explicit and consistent with P0-A/C.
- Route behavior states session/congregation hydration and destination-local loading/error/empty states.
- The approved central Drive media contract is reflected; the older ImageKit-first proposal is not treated as active.
- No runtime route, backend, schema, or content-policy change was introduced by this architecture deliverable.

## Next implementation boundary

P1 route implementation and P2/P3 feature lanes start only after the integration owner freezes the P0 contracts and resolves the V7 discipleship scope. P0-B does not mark feature implementation or user acceptance complete.
