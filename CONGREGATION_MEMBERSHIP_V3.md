# BibleQuest v3 Congregation Membership Contract

## Recovery target

Inventory #66 restores the minimum congregation membership/role workflow required by later Community and Ministry features:

- authenticated users can see their active congregation memberships;
- an authenticated user can join a congregation with an existing invite code;
- the active congregation role is visible;
- client feature gates fail closed from the recovered role model;
- server/database authorization remains authoritative for every privileged action.

This milestone does not add congregation creation, role editing, team management, assignments, Ministry Hub, Admin, or new backend schema.

## Recovered production contract

The current repository establishes these congregation roles, separate from platform authority:

- `member`
- `facilitator`
- `leader`
- `pastor`
- `admin`

Platform `owner` and platform `admin` are not congregation roles. Legacy global pastor/leader rows are not a replacement for congregation membership.

The existing trusted join path is `bq-join`. It validates the authenticated user and invite, preserves an existing congregation role when rejoining, and creates a new membership as `member` otherwise.

Membership and congregation reads use the existing RLS-protected `bible_congregation_members` and `bible_congregations` tables through `src/core/api.js`. v3 does not write role or `active` fields directly.

## v3 ownership

- `src/core/api.js` owns Supabase table/function access.
- `src/app/congregation-membership.js` is the only v3 membership/role orchestration owner.
- `src/features/congregation/index.js` is presentation/event forwarding only.
- `src/features/more/index.js` exposes the recovered membership screen without pretending the later Ministry Hub is complete.

The membership owner keeps only an in-memory read cache. It does not create a browser persistence key, duplicate the database, or infer ministry authority from editable profile text.

## Permission gate

The v3 client exposes only coarse capability checks needed for safe composition:

- `read` — any active, recognized congregation membership;
- `ministry` — Facilitator, Leader, Pastor, or congregation Admin;
- `admin` — congregation Admin only.

Unknown or malformed roles fail closed and receive no capability. These client checks control presentation/orchestration only. They are never a security boundary; Edge Functions and RLS must re-check authenticated identity and current membership for privileged writes.

## Join boundary

1. Require an authenticated session.
2. Normalize invite input to uppercase A-Z/0-9 and reject fewer than five characters.
3. Call only the existing `bq-join` trusted function through `src/core/api.js`.
4. Reload active memberships from RLS-protected tables after success.
5. Never promote a user locally and never accept a role from the browser join form.

## Failure behavior

- Signed out: show a sign-in requirement; no membership read/join call.
- Local preview: show the existing cloud-action-disabled failure without fabricating membership.
- Invalid invite: keep the current page usable and show the server/validation error.
- Unknown role: display an unsupported-role warning and fail every client capability check.
- Empty membership list: show a valid no-membership state and invite form.

## Verification gate

Before #66 becomes Verified:

1. architecture validator confirms one owner and backend isolation;
2. edge regression covers role normalization, fail-closed permission checks, authentication, invite normalization, and reload after join;
3. browser regression covers signed-out route safety and a mocked mobile join/role workflow at 390 px;
4. the complete accumulated v3 regression suite passes on the exact functional SHA;
5. inventory/architecture bookkeeping is updated and the exact bookkeeping SHA passes the full suite before any release freeze.
