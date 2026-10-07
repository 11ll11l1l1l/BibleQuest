# P1-A V6 reuse and schema inventory

Status: **inventory complete; additive V7 schema work remains active**
Baseline: `v7/development` at `361d7d8ffeea5860b83200a60a3455966b842929`
Date: 2026-10-04 JST

This is a bounded P1-A inventory against the accepted P0 contracts, the integrated P1-D content foundation, the V6 migrations, and the connected BibleQuest database. It records what can be reused and where V7 needs an additive schema. It does not claim runtime or RLS implementation.

## Verified V6 reuse

| Capability | Existing owner | P1-A decision |
|---|---|---|
| Account identity and congregation membership | Supabase Auth, `bible_profiles`, `bible_congregations`, `bible_congregation_members`, and existing private membership/role helpers | Reuse these authorities. V7 rows must identify and validate their resource scope; do not copy membership or trust a role string from the client. |
| General leader assignments | `bible_assignments` with `target_scope` = all/member/team; `bible_assignment_progress` stores status, submission, and leader feedback | Keep existing V6 behavior. It has no mentor-pair assignment scope, and leader visibility of submission data conflicts with V7 private-by-default lesson responses. It is not the V7 progress/response store. A future V6 bridge must be an explicit adapter and cannot relax either contract. |
| Congregation ministry messages | `bible_ministry_messages` has a congregation owner, a broadcast message type, and published/expiry visibility for congregation members | Not a pair thread. The table has no pair or recipient key and its read policy is congregation-wide. Never use it for private mentor/mentee messages. |
| Couples pairing/challenges | `bible_couple_pairs`, `bible_couple_shared`, and Couples challenge records | Keep Couples-specific; do not repurpose for mentor/mentee relationships. |
| Groups and live sessions | `bible_groups`, group membership, shared sessions, participants, room responses and Live Rooms | Keep their group/session semantics; they are not private pair communication. |
| Media references | V6 media-library tables and Reader/Scripture references | Reuse stable references where a V7 item or lesson needs them. Do not treat the media library as the Library catalog or create a V7 storage pipeline. |

The current live public-table inventory confirms that RLS is enabled on the existing BibleQuest tables. The V6 migration history and database inventory show no V7 Library, curriculum, mentor-pair, private-response, or pair-thread table yet. The integrated repository also has no committed `supabase/database.types.ts`; `supabase/database.types.sha256` currently names that missing generated file.

The integrated P1-D contract at `docs/v7/V7_CONTENT_IMPORT_FORMAT.md` is the content interchange authority: Books, Devotionals and Past Teachings share explicit source, rights, publication, revision, translation and taxonomy fields. The P1-C service boundary owns the consumer-facing discipleship API; P1-A will bind it to the physical schema without moving authorization into the client.

## Additive V7 schema surface

P1-A should implement the accepted contracts as a separate V7 table family, with stable foreign keys and immutable published revisions:

- Library item identity and type; content revisions; localized translations; controlled taxonomy and item links; source/provenance and licensing; publication/review state.
- Track → Module → Lesson ordering; immutable published lesson revisions; seven ordered step types and Scripture/media references.
- Mentor/mentee pair lifecycle and append-only pair events; pair assignment to curriculum; learner-owned operational progress.
- Learner-owned lesson responses and a separate item-level share record. A mentor can see only the operational fields allowed by P0-C; response text remains private unless the learner deliberately shares that item with the named recipient.

Every new table in exposed `public` needs RLS, least-privilege grants, and policies that validate current user, parent ownership, active congregation/pair, and resource capability. UPDATE policies require both `USING` and `WITH CHECK`. Child-row policies must verify the referenced parent and cannot treat a null congregation as global. Private response text must not enter audit or telemetry payloads. These requirements follow the accepted P0-C contract and the current [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Contract gap: pair communication

The accepted P0-A/P0-C contracts say pair communication must use an existing V6 communication capability. The inventory found no V6 pair-private message store: `bible_ministry_messages` is a congregation broadcast, assignments are not chat, and group/session tables are broader group features. Reusing any of these would violate the stated privacy boundary.

Do not add a pair-message table or route adapter on the strength of the current inventory alone. Resolve this exact contract mismatch before implementing that part of the schema: either identify a real V6 pair-private backend capability, explicitly authorize a bounded pair-only persistence path that does not introduce group/realtime chat, or defer pair messages and reconcile the route/acceptance contracts. Other P1-A schema work is independent and can proceed.

## Database verification boundary

The connected BibleQuest project has no Supabase development branches. Do not apply V7 DDL to it: its migration history is the live V6 baseline. No database writes were made for this inventory. Before migration verification, establish an isolated disposable database target through the existing project/CI workflow, replay append-only migrations there, and run the focused positive/denial pgTAP cases plus the existing tenant regression checks. Generate the TypeScript DB contract from that verified schema, commit it, and refresh the checksum marker.

## Sources checked

- `docs/v7/V7_DATA_ARCHITECTURE.md`
- `docs/v7/V7_SECURITY_TENANCY_CONTRACT.md`
- `docs/v7/V7_CONTENT_IMPORT_FORMAT.md`
- `supabase/migrations/20260904_assignments_presence_unlocks.sql`
- `supabase/migrations/20260905_bible_ministry_messages_and_scoped_polls.sql`
- Live public schema inventory and migration history (read-only)
