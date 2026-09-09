# BibleQuest v3 Encouragements contract

Inventory row #65 restores preset-only, group-wide encouragements on top of verified Journey Group membership.

## Recovered source of truth

- Retained `journey-groups.js` supplies the five old presets and group feed behavior.
- `src/app/encouragements.js` is the sole v3 normalization and permission-orchestration owner.
- `src/core/api.js` is the only browser Supabase boundary.
- `bq-journey-group` authenticates sends; the database trigger is the sole duplicate-bucket owner.
- Existing group-member RLS remains authoritative for reads.

## Exact #65 scope

- active Journey Group members can read recent encouragements for their own groups;
- members can send one of the five retained presets to the whole group;
- one sender cannot send the same preset to the same group more than once per UTC day;
- the owner rejects foreign groups, targeted rows, unknown presets and malformed timestamps;
- signed-out and local-preview states fail closed.

The trusted send path requires current active membership. Historical encouragements remain readable after their sender leaves, because membership changes must not invalidate an otherwise authorized group history.

The duplicate guard is additive: retained v2 rows remain readable and are not rewritten or deleted. A `BEFORE INSERT` trigger assigns the UTC `dedupe_bucket` to every new insert, including retained v2/direct REST callers, and a partial unique index makes concurrent duplicates fail consistently. The client-side check remains an early user-experience guard, not the data-integrity authority.

## Explicit exclusions

#65 does not add free-text chat, direct messages, notifications, presence, daily completion sharing, assignments, rankings, XP, moderation, or access to private study notes and answers. It does not deploy the migration or Edge Function to production as part of the isolated rebuild milestone.
