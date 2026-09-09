# BibleQuest v3 Team Center contract

## Scope

Feature inventory row **#69 Team Center** restores the retained congregation team list and member-management workflow without adding later community capabilities.

In scope:
- list active `game_team` teams for congregations where the signed-in account is an active member;
- show team members using the existing congregation member directory and congregation role labels;
- allow ministry-capable congregation roles (`facilitator`, `leader`, `pastor`, `admin`) to create teams, add active congregation members, remove non-creator members, and rename teams;
- allow only the team creator or congregation admin to archive a team;
- fail closed for signed-out/local-preview state, foreign congregation rows, malformed rows, unsupported team types, and unauthorized actions.

Out of scope:
- Presence display (#68 remains its own owner);
- trusted score events, leaderboards, recognition (#70–72);
- assignments, notifications, Ministry Hub and Workspace (#73–79);
- chat or arbitrary messaging;
- XP/progress awards;
- private study, Couples, transformation or psychometric data;
- inventing a per-team role model.

## Existing backend contract

No database migration is required.

Retained tables:
- `public.bible_teams`
- `public.bible_team_members`
- `public.bible_congregation_members`

Team Center owns only `team_type = 'game_team'`. Other retained team types (`couple`, `family`, `small_group`) belong to other workflows and must not be mutated by Team Center.

RLS remains authoritative for reads. Active congregation membership permits in-congregation reads of teams, team membership rows, and congregation member directory rows.

All management mutations use the existing authenticated Edge Function `bq-team`. The browser never directly inserts, updates, or deletes `bible_teams` or `bible_team_members` for Team Center management.

Trusted `bq-team` actions:
- `create` — `congregationId`, `name`; creates a `game_team` and adds its creator;
- `add` — `congregationId`, `teamId`, `targetUserId`; target must be an active congregation member;
- `remove` — `congregationId`, `teamId`, `targetUserId`; team creator cannot be removed while active;
- `rename` — `congregationId`, `teamId`, `name`;
- `archive` — `congregationId`, `teamId`; only creator or congregation admin.

The function independently derives the authenticated user, active congregation membership, and congregation role. Client capability checks improve UX and fail closed early but are not the security authority.

## Ownership

- `src/app/team-center.js` — sole Team Center normalization, congregation/team scope, roster projection, and management orchestration owner.
- `src/core/api.js` — sole browser Supabase/Edge Function boundary.
- `src/app/congregation-membership.js` — sole congregation membership and capability owner. Team Center reuses its `ministry` capability; it does not duplicate role policy.
- `src/features/team-center/index.js` — Team Center view only.

The Team Center owner must not directly import Supabase, invoke Edge Functions, access browser storage, award progress/XP, or depend on Presence.

## Role workflow interpretation

The inventory wording `member/role workflows` does **not** imply a missing per-team role column. The retained `bible_team_members` schema stores only `team_id`, `user_id`, and `joined_at`.

For v3 parity, role workflow means:
- display the member's existing congregation role;
- use the existing congregation role to determine whether Team Center management controls are available;
- leave authorization enforcement to `bq-team`/RLS.

No speculative team-role schema is introduced.

## Verification gate

#69 can become Verified only after the complete accumulated v3 suite passes with permanent coverage for:
- team list and congregation/member projection;
- ministry-role create/add/remove/rename;
- creator/admin archive restriction;
- creator-member removal rejection;
- signed-out and local-preview fail-closed behavior;
- foreign/malformed/unsupported-team data rejection;
- no direct remote/storage/progress ownership in Team Center;
- responsive browser workflow including retry/error state.
