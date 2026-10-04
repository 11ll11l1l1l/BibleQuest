# V7 P0-B — Navigation and Information Architecture

Status: DRAFT FOR P0 INTEGRATION  
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
| Grow | Continue personal formation or a mentor-led plan | Grow overview, including personal progress and ONE 2 ONE when paired |
| Library | Find a book, devotional, or past teaching | Library browse with three explicit content types |
| Community | Participate in congregation and group journeys | Community overview, with active congregation and groups |

On narrow screens these are the five primary destinations. On wider screens the same hierarchy can use a persistent rail or header. Secondary destinations remain reachable from a clearly labeled More area: Play, Calendar, Progress details, Notifications, Account, and role-authorized Ministry/Admin. No accepted capability becomes unreachable when a page is regrouped.

Global route behaviors:

- Keep the current destination and a clear Back path when a Reader passage, lesson, teaching, or group prompt opens from a deep link.
- A Scripture reference opens the Reader at that passage; returning restores the originating lesson/card and its state.
- Protected Community and Ministry destinations wait for session and congregation context, then show the existing sign-in, select-congregation, or denial state as appropriate. Never infer the first congregation.
- Keep loading, empty, offline, error, and unauthorized states within the destination; do not silently send the user Home.
- Stable route IDs and URL syntax are implementation decisions for P1. This document specifies destinations and return behavior, not a new router.

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

## ONE 2 ONE discipleship journey

Entry is **Grow → ONE 2 ONE**. A user with an active mentor/mentee pairing sees the current track and next lesson. A user without a pairing sees the appropriate pairing invitation or join path; no private lesson content is exposed by a guessed URL.

| Step | Learner screen | Completion action |
|---|---|---|
| 1 | Scripture | Read the assigned passage in the shared Reader |
| 2 | Understand | Review the lesson explanation |
| 3 | Discuss | Respond to guided discussion prompts |
| 4 | Reflect | Write a personal reflection |
| 5 | Apply | Choose a practical application |
| 6 | Pray | Use or write a prayer |
| 7 | Action | Record the next action and finish/resume the lesson |

A lesson can be resumed at its last saved step. Track → module → lesson remains the hierarchy; progress is visible at all three levels. Deep links and QR codes open the intended track/module/lesson after required session and pairing state has loaded.

Learner reflections, prayer text, discussion answers, and notes are private by default. The route model must not imply that a mentor or group can read them. Any future sharing control needs explicit product and data authorization; progress status alone may be shown to a paired mentor where the accepted pairing contract allows it.

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
- Media attachments in Library or groups follow the approved V7 media/storage contract; this route design does not create a storage path or weaken object-scope checks.

## P0-B acceptance

P0-B is ready for integration when:

- the five primary destinations and More hierarchy are explicit, and accepted capabilities remain reachable;
- Library has the three required content types, browse/detail paths, source attribution, and Reader handoff;
- ONE 2 ONE has the pairing entry, track/module/lesson hierarchy, all seven agreed lesson steps, resume behavior, and deep-link return behavior;
- group membership, deck setup, live session, and wrap-up are distinct routes with leader/participant presentation boundaries;
- private reflection and group-content boundaries are explicit;
- route behavior states session/congregation hydration and destination-local loading/error/empty states;
- no runtime route, backend, schema, or content-policy change was introduced by this architecture deliverable.

## Next implementation boundary

P1 may map these destination IDs to the existing V6 shell/router and build the shared navigation foundation. P2 Library and P3 Discipleship can then proceed in independent feature lanes. Group session implementation belongs in P4 and must consume the P0-B route and presentation contract. P0-B does not mark feature implementation or user acceptance complete.
