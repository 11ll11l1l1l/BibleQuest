# V7 data architecture contract

Status: P0-A proposal for the P0 contract freeze
Baseline: `v7/development` at `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Scope: logical entities, ownership and relationships for Library, discipleship content, moderated media and groups. This is a logical contract, not a migration or claim that these physical tables already exist.

## Design rules

1. V7 extends the released V6 data and service contracts. Reuse the existing user, congregation, membership, role, group/team, event, assignment, progress, notification and Live Room authorities where they fit. Do not clone them under new V7 names.
2. Keep authored content, a user's learning activity, group collaboration, and uploaded binary objects as separate records with explicit links. A content edit must not rewrite a learner's historical completion evidence.
3. Make provenance and revision explicit for licensed or translated content. Published content identifies the source and revision that the reader saw.
4. Store only metadata, authorization scope and provider identifiers in Supabase for community media. Binary bytes and any provider credentials remain outside Supabase and outside the client.
5. One backend authorization owner decides whether an actor can read or mutate a scoped record. P0-C owns that policy; a client-visible relationship or guessed ID never grants access.
6. Use stable IDs and explicit foreign-key relationships in the eventual schema. The names below are conceptual and may map to existing tables after the assigned P1 implementation inventory; do not create duplicate physical tables to match this vocabulary.

## Shared identity and scope

Reuse existing BibleQuest identities and congregation structures:

- **User** — existing authenticated user identity.
- **Congregation** — existing tenant boundary and selected active congregation.
- **Membership / role** — existing relationship and authorization source.
- **Journey Group, Team, Couple, Family, Event and Post** — use existing records as media or group context where present.

Scoped records carry the owning congregation where required. Personal records carry the owning user. A legitimate global catalog item may have no congregation owner; that exception does not make it user-editable. Group, event, team, couple or family links must resolve to records in the same authorized congregation. The final nullable/required keys, roles, RLS, API enforcement and cross-tenant denial cases are P0-C decisions.

## Library and discipleship content

### Content catalog

- **Library item** — a versioned, publishable item of type Book, Devotional, or Past Teaching. Holds stable identity, publication state, audience/category metadata, provenance/licensing, and the current published revision reference.
- **Content revision** — immutable snapshot of the item's content and source metadata. Revisions are never overwritten after publication; a correction creates a new revision.
- **Content translation** — a locale-specific title and body attached to one revision, with translation provenance/review state. Missing translations remain explicitly missing; UI fallback rules belong to P0-B/P0-D.
- **Category / tag and item links** — reusable controlled taxonomy with ordered many-to-many links. Do not encode tags as comma-separated strings.
- **Content source reference** — source title/URL or canonical identifier, attribution, rights/license basis and source revision. Scripture references point to BibleQuest's existing Bible text/reference model instead of copying Scripture into catalog rows.

Books, devotionals and analyzed Past Teachings share discovery metadata, but their body formats and provenance may differ. A Library item can relate to a discipleship lesson without copying the source content.

### Discipleship curriculum

- **Track** → **Module** → **Lesson** — ordered, versioned curriculum hierarchy. Tracks identify intended audience or formation focus (for example Adult, Youth, Couple, Family, New Believer, or Leadership); those labels are metadata, not separate schema branches.
- **Lesson step** — ordered step with a controlled type: Scripture, Understand, Discuss, Reflect, Apply, Pray, or Action. Scripture steps reference canonical passages; other step content is localized lesson text.
- **Lesson content link** — optional relationship from a lesson or step to a Library item/revision. Reuse one approved source and preserve its provenance instead of duplicating lesson material.
- **Learner progress** — per-user progress against a specific published lesson revision, including state, current step and completion time. It must not contain another person's private reflection, prayer, or response in this V7 foundation.

V7 establishes reusable curriculum and individual lesson progress. Actual mentor/mentee pairing, shared status, private responses, prayer/action review and discipleship-chain oversight are later-stage work; do not add those entities to this V7 contract. Deep links and QR codes resolve to stable track/module/lesson IDs and are not separate copies of lesson content.

## Groups and leader conversation decks

Reuse existing congregation, group/team membership and Live Room authorities. The V7 deck model is:

- **Conversation deck** — named, ordered prompt set owned by its authorized leader and associated with an allowed congregation/group context.
- **Deck card** — prompt text plus an optional canonical Scripture reference and optional series/flow position.
- **Deck session** — a specific use of a deck in an existing group/Live Room context, tied to the current leader and group. It references the selected deck/card records; it does not duplicate them.
- **Session position** — the current card pointer for the active session, updated by the leader's broadcast action through the existing Live Room mechanism.

Members receive only the active prompt and Scripture needed for the session. The data model does not create a second chat, membership, presence, or realtime transport system. Arbitrary free-text responses are outside this deck contract.

## Media and moderation

### Binary and metadata boundary

One centralized BibleQuest-owned Google Drive account stores uploaded media bytes. Users never receive Drive credentials or direct Drive access. Supabase stores BibleQuest metadata and authorization state only, including:

- **Media asset** — stable BibleQuest ID, uploader, congregation/scope, Drive file ID, original and safe display names, MIME type, byte size, checksum, dimensions/duration where applicable, caption, lifecycle state, and created/deleted timestamps.
- **Media attachment** — relationship from an asset to an allowed product record such as a group, event, post, lesson, assignment or congregation resource. The attachment is distinct from the file, so one approved asset can be referenced without copying bytes.
- **Moderation event** — append-only review decision with reviewer, timestamp, action, reason/requested changes, and the asset revision reviewed. Current moderation state is a projection of these events, not a replacement for audit history.

### Lifecycle

New user-submitted assets start **Pending Review**. Authorized reviewers can **Approve**, **Reject**, or **Request Changes**. Only approved assets are publishable to their intended audience. A published asset can be **Removed After Publish**; removal blocks new delivery while retaining the audit record. Re-upload or material replacement creates a new asset revision and returns to review rather than inheriting approval.

The uploader and requested scope are immutable review context. A group/team/couple/family/event attachment cannot widen the asset's audience beyond the asset's approved scope. Delivery is authorized by BibleQuest on each request; storing a Drive file ID or knowing an asset URL is not authorization. Deletion must reconcile metadata and Drive object state without silently discarding review history.

The prior `docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` describes an ImageKit-first provider plan. It conflicts with the later approved centralized-Drive decision recorded in project context. This contract uses centralized Drive as the V7 decision; P0 integration must reconcile or mark the older provider plan superseded before P4 media implementation. Do not implement ImageKit/Cloudinary adapters from that older proposal in P0-A.

## Relationships at a glance

- Library item 1 → many content revisions; revision 1 → many locale translations.
- Library item many ↔ many categories/tags; revision or step may reference many canonical Scripture passages.
- Track 1 → many ordered modules; module 1 → many ordered lessons; lesson 1 → many ordered steps.
- Lesson progress belongs to one user and one published lesson revision.
- Deck 1 → many ordered cards; a deck session references one deck, one existing group/room context, and one current card.
- Media asset 1 → many moderation events and many explicit attachment links.
- Every tenant-scoped attachment must resolve to its owning congregation and target record under the same authorization scope.

## Ownership and freeze boundary

| Decision area | Owner | P0-A boundary |
|---|---|---|
| Logical entities, relationships, version/provenance and media moderation records | P0-A | Defined here |
| Navigation, routes, labels, user-visible fallback and layout | P0-B | Not specified here |
| RLS, roles, tenant keys, server authorization and denial behavior | P0-C | Preserve existing authority; no new policy asserted |
| Product acceptance, initial content inventory, language/source readiness and evidence | P0-D | No source corpus or completion claims asserted |
| Cross-lane reconciliation and one frozen P0 contract | P0 integration owner | Required before P1 schema work |

### P0-A acceptance

- Logical entities and their ownership/relationships cover Library, discipleship content, groups/decks, media and moderation.
- V6 reuse boundaries and V7 exclusions are explicit.
- Provenance, revision and review history are preserved.
- Centralized Drive is the single V7 media-storage decision, and the conflicting older provider plan is visible for reconciliation.
- No runtime, migration, workflow, release or existing acceptance evidence is changed by this lane.

P0-A's proposal is ready for review. P0 as a whole is not frozen until P0-B, P0-C and P0-D contracts are reconciled by the integration owner.
