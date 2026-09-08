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

The #66 functional verification gate completed with:

1. architecture validator confirms one owner and backend isolation;
2. edge regression covers role normalization, fail-closed permission checks, authentication, invite normalization, and reload after join;
3. browser regression covers signed-out route safety and a mocked mobile join/role workflow at 390 px;
4. the complete accumulated v3 regression suite passes on the exact functional SHA;
5. inventory/architecture bookkeeping is updated and the exact bookkeeping SHA passes the full suite before any release freeze.

## Functional verification evidence

- Clean functional candidate: `87ed099fb9b0a18f0f5b85b9476a16af6bbb5349`.
- Isolated verification-only commit: `406f1856fe128634c6313174f67b5a2df4064806`; it explicitly checked out and asserted the clean candidate before testing.
- Complete accumulated run: `34185569051` — fully green, including architecture, edge, authenticated/signed-out behavior, the 390px join/role workflow, and every prior v3 regression.
- The development workflow remains manual-only. The temporary trigger exists only on the isolated verification commit and is not eligible for release.

#66 is Verified in the authoritative inventory only through the functional evidence above. It does not become Regression-tested until a later feature milestone passes the complete accumulated suite with #66 still green. The v3.29 bookkeeping candidate must pass the complete suite before `release/v3.29-congregation-membership` may be frozen.
