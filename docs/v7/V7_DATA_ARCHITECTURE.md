# V7 data architecture contract

Status: P0-A proposal revised to the approved V7 scope; pending P0 integration freeze
Baseline: `v7/development` at `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Scope: logical entities, ownership, and relationships for Library content and structured ONE 2 ONE discipleship. This is a logical contract, not a migration or claim that physical tables already exist.

## V7 scope boundary

V7 includes the Library (Books, Devotionals, and Past Teachings) and structured ONE 2 ONE discipleship: mentor/mentee pairing, Track → Module → Lesson curriculum, the seven-step lesson flow, individual progress, deep links/QR, and direct communication scoped to an active authorized pair.

Conversation Decks and broader group/realtime communication, user-uploaded media and moderation, expanded bulk content, Couples, and full Ilocano Bible/UI support are deferred to V8. Existing V6 group, congregation, Reader, messaging, and Live Room authorities remain available to V6 features; this P0-A contract does not extend them with new V7 group/media surfaces.

## Design rules

1. V7 extends released V6 identity, congregation, role, Reader, and service contracts where they fit. Do not clone existing authorities under new V7 names.
2. Keep authored content, pair relationships, assignments, learner activity, private responses, and pair messages as separate records with explicit links. Editing content must not rewrite historical completion evidence.
3. Make content provenance, licensing, locale, and revision explicit. Published content identifies the source and revision the learner saw.
4. Personal progress belongs to the learner. Pairing does not expose private reflections, prayer, notes, or responses without an explicit item-level share.
5. One backend authorization owner decides whether an actor can read or mutate a scoped record. P0-C owns role, scope, policy, and denial behavior; a client-visible relationship or guessed ID never grants access.
6. Use stable IDs and explicit foreign-key relationships in the eventual schema. Names below are conceptual and may map to existing tables after the P1 inventory; do not create duplicate physical tables to match this vocabulary.
7. Deep links and QR codes resolve to canonical IDs; they do not duplicate curriculum or create a second permission path.

## Shared identity and scope

Reuse BibleQuest's existing:

- **User** identity.
- **Congregation**, active-congregation context, membership, and role authorities.
- **Reader and Scripture reference** model.
- Existing notification, assignment, and messaging capabilities where their contracts fit; P1 must inventory them before adding new storage or transport.

Pairing is a relationship between two existing users, not a congregation role. Pair records retain their owning congregation where the program is congregation-scoped. A pair does not grant general access to either person's account or other relationships. The nullable/required tenant keys, permitted cross-congregation behavior, role capabilities, RLS, server enforcement, and denial cases belong to P0-C.

## Library content

### Catalog and revisions

- **Library item** — stable identity and item type (Book, Devotional, or Past Teaching), publication state, audience/category metadata, provenance/licensing, and current published revision reference.
- **Content revision** — immutable snapshot of content and source metadata. A correction after publication creates a new revision rather than overwriting the revision already used by a learner.
- **Content translation** — locale-specific title/body attached to one revision, with translation provenance and review state. Missing translations remain explicit; fallback and presentation rules belong to P0-B/P0-D.
- **Category/tag links** — controlled taxonomy with ordered many-to-many links; do not encode tags as comma-separated strings.
- **Content source reference** — source title/URL or canonical identifier, attribution, rights/license basis, and source revision/checksum where applicable. Scripture references point to BibleQuest's existing Bible text/reference model instead of copying Scripture into catalog rows.

Books, devotionals, and analyzed Past Teachings may use different body formats while sharing discovery metadata and provenance. Lessons may link to a Library item/revision without copying the source content.

## ONE 2 ONE discipleship

### Curriculum

- **Track → Module → Lesson** — ordered, versioned curriculum hierarchy. Audience or formation focus (for example Adult, Youth, Couple, Family, New Believer, or Leadership) is metadata, not a separate schema branch.
- **Lesson step** — ordered step with the controlled type Scripture, Understand, Discuss, Reflect, Apply, Pray, or Action. Scripture steps reference canonical passages; other step content is localized curriculum text.
- **Lesson content link** — optional relationship from a lesson or step to a Library item/revision. Reuse the approved source and preserve provenance.
- **Published lesson revision** — the immutable lesson snapshot used for assignment and historical progress.

### Pair, assignment, and activity

- **Mentor pair** — one mentor and one mentee, with explicit initiator, congregation scope where applicable, lifecycle state (invited, active, ended/declined), and timestamps. Pair activation requires the agreed acceptance workflow; details and denial behavior belong to P0-C.
- **Pair event** — append-only record of invitation, acceptance, decline, role-authorized change, or termination. Preserve decision history without copying private content into audit records.
- **Pair assignment** — an active pair's mentee assigned a track, module, or lesson revision, with assigning actor, optional due date, and assignment state. It does not itself grant access to unrelated learner records.
- **Learner progress** — per-user progress against a specific published lesson revision, including current step, state, and completion time. The learner remains the owner; a mentor may see only the explicitly approved assignment/progress fields while the pair and assignment are active.
- **Lesson response** — learner-authored reflection, prayer, discussion answer, or action note attached to a lesson step. It is private to the learner by default. If shared, a separate share record identifies the specific response, recipient, scope, and time; sharing one response does not expose other responses or the learner's journal.

### Direct communication

- **Pair thread** — conversation identity scoped to one active mentor pair. It is not a general chat room or a group/realtime conversation system.
- **Pair message** — message authored by one participant and addressed only to the other participant in that pair, with sent/edited/deleted lifecycle metadata as approved by P0-C. Message body is not copied into security/audit logs.
- Pair termination blocks new communication and access through the ended relationship according to P0-C's retained-history rule. A pair, assignment, or thread ID alone never authorizes access.

### Links and history

Deep links and QR codes resolve to stable track/module/lesson IDs and pass through the same authorization checks as in-app navigation. They are not separate content copies or permission grants. Content edits do not rewrite learner progress or responses recorded against an earlier published revision.

## Relationships at a glance

- Library item 1 → many immutable content revisions; revision 1 → many locale translations.
- Library item many ↔ many controlled categories/tags; a lesson or step can reference a Library revision and canonical Scripture passages.
- Track 1 → many ordered modules; module 1 → many ordered lessons; lesson 1 → many ordered steps.
- Mentor pair 1 → many assignments and one pair-scoped thread; pair 1 → many lifecycle events.
- Learner progress belongs to one user and one published lesson revision; responses belong to one learner and one lesson step.
- A response share explicitly links one response to one authorized recipient/scope; it does not change ownership of the original response.
- Every tenant-scoped record must resolve to its authorized parent scope; P0-C defines and proves the enforcement rules.

## Deferred from V7

Do not create V7 data entities or migrations for:

- Leader Conversation Decks, deck cards/sessions, or broad small-group/realtime communication.
- User-uploaded Drive media, media attachments, or moderation queues. The approved centralized Drive decision is recorded for later V8 planning; it is outside this V7 implementation scope.
- Expanded bulk devotional/Past Teachings ingestion, expanded Books collection, Couples, recommendations, or full Ilocano Bible/UI support.

The older ImageKit-first media proposal is outside V7 and must not drive V7 schema or implementation. If media returns to scope in V8, reconcile the provider decision there before implementation.

## Ownership and freeze boundary

| Decision area | Owner | P0-A boundary |
|---|---|---|
| Logical Library, curriculum, pair, assignment, learner activity, response, and pair-message entities | P0-A | Defined here |
| Navigation, routes, labels, user-visible fallback, and layout | P0-B | Not specified here |
| Pair acceptance, roles, tenant keys, server authorization, retention, and denial behavior | P0-C | Preserved for P0-C; no runtime policy asserted |
| Product acceptance, initial content inventory, language/source readiness, and evidence | P0-D | No source corpus or completion claims asserted |
| Cross-lane reconciliation and one frozen P0 contract | P0 integration owner | Required before P1 schema work |

### P0-A acceptance

- Logical entities and relationships cover the approved V7 Library and structured ONE 2 ONE scope, including pair lifecycle, assignment, progress, item-level private response sharing, and pair-scoped communication.
- V6 authority reuse and V8 exclusions are explicit.
- Content provenance, revisions, learner history, and private data ownership are preserved.
- P0-C remains the sole owner of role, tenant, authorization, and denial policy.
- No runtime, migration, workflow, release, production, or existing acceptance evidence is changed by this lane.

This proposal is ready for cross-lane review. P0 as a whole remains open until the integration owner reconciles P0-A/B/C/D and freezes the combined contract.
