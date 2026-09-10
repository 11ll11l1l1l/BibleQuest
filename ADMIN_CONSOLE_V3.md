# BibleQuest v3 Admin Console contract

Capability: #92 Admin console
Baseline: `release/v3.62-content-review` / `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`

## Recovered retained behavior

The retained `admin.html`, `admin.js`, `admin-link.js`, and `supabase/functions/bq-admin/index.ts` establish the Admin Console as a platform Owner/Admin surface. Authentication comes from the shared signed-in account. Authorization is server-authoritative through `bq-admin`; active `owner` and `admin` platform roles are allowed and other roles fail closed.

The console owns platform user and ministry-structure administration: list users, inspect platform/congregation/small-group memberships, change platform access, assign/remove congregation membership, change congregation ministry role, create congregations, create small groups, assign/remove group members, change group role, and transfer group ownership. The server remains the final authority for owner-only and conflict protections.

## Explicit boundary

Capability #93 Admin operations is not part of this milestone. Its retained surface uses `bq-admin-ops` for system health, online presence, assignments, devotionals/announcements, polls, media, and live rooms. Those concerns remain untouched.

Password recovery is also not reintroduced here. The retained `bq-admin` endpoint rejects admin-issued password reset actions and the inventory tracks reset/recovery separately.

## v3 ownership

- `src/app/session.js`: only authenticated-user/session owner.
- `src/core/api.js`: only browser Supabase/Edge Function boundary.
- `src/app/admin-console.js`: Admin Console state, normalization, validation, orchestration, and fail-closed readiness owner.
- `src/features/admin-console/index.js`: Admin Console rendering and interaction owner once wired.
- `supabase/functions/bq-admin/index.ts`: server authorization and mutation authority; no schema or production deployment change is required for #92.

## Acceptance contract

1. Signed-out users receive a signed-out state without admin calls.
2. Signed-in non-Owner/Admin accounts receive an unauthorized state and no console data.
3. Owner/Admin status must be verified before user data or mutations are accepted.
4. Admin user/congregation/group reads normalize into one stable console state.
5. Admin mutations are rejected unless the console is currently ready with verified Owner/Admin access.
6. Mutations call the existing server-authoritative endpoint and refresh the console after success.
7. Network/runtime failure remains distinct from permission denial.
8. #93 operations data/actions are not imported into this milestone.
9. No production branch, deployment, schema, data, or Supabase mutation is performed by rebuild verification.
