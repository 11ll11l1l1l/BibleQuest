# V7 data architecture contract

Status: P0-A contract accepted in the serialized P0 freeze
Reviewed against `v7/development` at `00ecb3c3a46606a342b0c259d7ce97579dd9317d`; original Lane A task began at `cb484bc839f9874659f501a755d93ae78dbceed6`
Scope: logical entities, ownership, and relationships for Library content and structured ONE 2 ONE discipleship. This is a logical contract, not a migration or claim that physical tables already exist.

## V7 scope boundary

V7 includes the Library (Books, Devotionals, and Past Teachings) and structured ONE 2 ONE discipleship: mentor/mentee pairing and relationship state, Track → Module → Lesson curriculum, the seven-step lesson flow, individual progress, deep links/QR, and authorized direct communication scoped to an active pair.

Conversation Decks and broader group/realtime communication, the central Google Drive media pipeline and full media moderation, full Ilocano rollout, bulk content ingestion, expanded Books, Couples expansion, recommendations, and unrelated whole-app redesign are deferred to V8. Existing V6 group, congregation, Reader, media-reference, messaging, and Live Room authorities remain available to existing V6 features; this P0-A contract does not extend them with new V7 group or media-storage systems.

## Design rules

1. V7 extends released V6 identity, congregation, role, Reader, assignment, messaging, and service contracts where they fit. Do not clone existing authorities under new V7 names.
2. Keep authored content, pair relationships, assignments, learner activity, private responses, and pair messages as separate records with explicit links. Editing content must not rewrite historical completion evidence.
3. Make content provenance, licensing, locale, and revision explicit. Published content identifies the source and revision the learner saw.
4. Personal progress belongs to the learner. Pairing does not expose private reflections, prayer, notes, or responses without an explicit item-level share.
5. One backend authorization owner decides whether an actor can read or mutate a scoped record. P0-C owns role, scope, policy, retention, and denial behavior; a client-visible relationship or guessed ID never grants access.
6. Use stable IDs and explicit foreign-key relationships in the eventual schema. Names below are conceptual and may map to existing tables after the P1 inventory; do not create duplicate physical tables to match this vocabulary.
7. Deep links and QR codes resolve to canonical IDs and pass through the existing authorization path; they do not duplicate curriculum or create a second permission path.
8. Where an existing V6 capability already owns messaging or media references, V7 reuses its interfaces after inventory. Do not assume new storage, transport, or provider infrastructure.

## Shared identity and scope

Reuse BibleQuest's existing:

- **User** identity.
- **Congregation**, active-congregation context, membership, and role authorities.
- **Reader and Scripture reference** model.
- Existing assignment, notification, communication, and media-reference capabilities where their contracts fit; P1 must inventory them before adding storage or transport.

Pairing is a relationship between two existing users, not a congregation role. A pair retains its owning congregation where the program is congregation-scoped. A pair does not grant general access to either person's account or other relationships. The nullable/required tenant keys, permitted cross-congregation behavior, role capabilities, RLS, server enforcement, retention, and denial cases belong to P0-C.

## Library content

### Catalog and revisions

- **Library item** — stable identity and item type (Book, Devotional, or Past Teaching), publication state, audience/category metadata, provenance/licensing, and current published revision reference.
- **Content revision** — immutable snapshot of content and source metadata. A correction after publication creates a new revision rather than overwriting the revision already used by a learner.
- **Content translation** — locale-specific title/body attached to one revision, with translation provenance and review state. Missing translations remain explicit; fallback and presentation rules belong to P0-B/P0-D.
- **Category/tag links** — controlled taxonomy with ordered many-to-many links; do not encode tags as comma-separated strings.
- **Content source reference** — source title/URL or canonical identifier, attribution, rights/license basis, and source revision/checksum where applicable. Scripture references point to BibleQuest's existing Bible text/reference model instead of copying Scripture into catalog rows.
- **Lesson content link** — an optional relationship to a Library item/revision or existing V6 Scripture/media reference; it preserves source identity and does not copy or rehost the referenced material.

Books, Devotionals, and Past Teachings may use different body formats while sharing discovery metadata and provenance. Lessons may link to a Library item/revision without copying the source content.

## ONE 2 ONE discipleship

### Curriculum

- **Track → Module → Lesson** — ordered, versioned curriculum hierarchy. Audience or formation focus (for example Adult, Youth, Couple, Family, New Believer, or Leadership) is metadata, not a separate schema branch.
- **Lesson step** — ordered step with the controlled type Scripture, Understand, Discuss, Reflect, Apply, Pray, or Action. Scripture steps reference canonical passages; other step content is localized curriculum text.
- **Published lesson revision** — immutable lesson snapshot used for assignment and historical progress.

### Pair, assignment, and activity

- **Mentor pair** — one mentor and one mentee, with initiator, congregation scope where applicable, lifecycle state (invited, active, declined, suspended, ended), and timestamps. Activation follows the explicit mutual-acceptance workflow owned by the feature; P0-C defines allowed actors and denial behavior.
- **Pair event** — append-only record of invitation, acceptance, decline, suspension, authorized change, or termination. Preserve decision history without copying private content into audit records.
- **Pair assignment** — an active pair's mentee assigned a track, module, or lesson revision, with assigning actor, optional due date, and assignment state. It does not grant access to unrelated learner records.
- **Learner progress** — per-user progress against a specific published lesson revision, including current step, operational state, and completion time. The learner remains the owner; a mentor may see only the operational fields P0-C allows while the pair and assignment are active.
- **Lesson response** — learner-authored reflection, prayer, discussion answer, or action note attached to a lesson step. It is private to the learner by default.
- **Response share** — optional item-level relationship identifying one response, the named recipient, scope, and sharing lifecycle. Sharing one response does not expose other responses or the learner's journal; P0-C owns audience, revocation, and authorization semantics.

### Direct communication

- **Pair thread** — communication context scoped to one pair. It should map to the existing V6 communication capability after P1 inventory; do not create a second general chat or realtime transport system.
- **Pair message** — message authored by one participant and addressed to the other participant through that pair context. Message body is never copied into security/audit logs. If existing V6 storage is reused, its existing lifecycle remains authoritative unless a reviewed V7 contract changes it.
- A pair ID, route, or congregation role alone never authorizes reading or sending. Ending, declining, or suspending a pair blocks new sends. Access to retained thread history follows P0-C's rules and the existing V6 retention contract; this data model does not invent a new retention period.

### Links and history

Deep links and QR codes resolve to stable track/module/lesson IDs and pass through the same authorization checks as in-app navigation. They are not separate content copies or permission grants. Content edits do not rewrite learner progress or responses recorded against an earlier published revision.

## Relationships at a glance

- Library item 1 → many immutable content revisions; revision 1 → many locale translations.
- Library item many ↔ many controlled categories/tags; a lesson or step can reference a Library revision and canonical Scripture or existing media references.
- Track 1 → many ordered modules; module 1 → many ordered lessons; lesson 1 → many ordered steps.
- Mentor pair 1 → many assignments and pair lifecycle events; pair communication uses the existing V6 messaging owner.
- Learner progress belongs to one user and one published lesson revision; responses belong to one learner and one lesson step.
- A response share explicitly links one response to one authorized recipient/scope; it does not change ownership of the original response.
- Every tenant-scoped record must resolve to its authorized parent scope; P0-C defines and proves the enforcement rules.

## Deferred from V7

Do not create V7 data entities or migrations for:

- Leader Conversation Decks, deck cards/sessions, participant broadcast, or broad small-group/realtime communication.
- A central Google Drive media ingest/storage pipeline or full media moderation/provider workflow.
- Full Ilocano Bible or UI rollout, bulk content ingestion, expanded Books collection, Couples expansion, advanced recommendations, or unrelated whole-app redesign.

The older `docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` is historical planning input only. It is not an active V7 requirement and must not drive V7 schema or implementation.

## Ownership and freeze boundary

| Decision area | Owner | P0-A boundary |
|---|---|---|
| Logical Library, curriculum, pair, assignment, learner activity, response, and pair-message context | P0-A | Defined here |
| Navigation, routes, labels, user-visible fallback, and layout | P0-B | Not specified here |
| Pair acceptance, roles, tenant keys, server authorization, retention, and denial behavior | P0-C | Preserved for P0-C; no runtime policy asserted |
| Product acceptance, initial content inventory, language/source readiness, and evidence | P0-D | No source corpus or completion claims asserted |
| Cross-lane reconciliation and one frozen P0 contract | P0 integration owner | Required before P1 schema work |

### P0-A acceptance

- Logical entities and relationships cover the approved V7 Library and structured ONE 2 ONE scope, including pair lifecycle, assignment, progress, private-by-default responses with item-level sharing, and pair-scoped communication.
- V6 authority reuse and V8 exclusions are explicit.
- Content provenance, revisions, learner history, and private data ownership are preserved.
- P0-C remains the sole owner of role, tenant, authorization, retention, and denial policy.
- No runtime, migration, workflow, release, production, or existing acceptance evidence is changed by this lane.

This proposal is ready for P0 integration review. P0 as a whole remains open until P0-A/B/C/D are reconciled and frozen together.
