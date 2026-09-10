# BibleQuest v3 Workspace contract — milestone #78

Recovered: 2026-09-10

## Authoritative acceptance

`FEATURE_INVENTORY_V3.md` defines #78 Workspace with required verification: **open; save state; role/session boundary**.

Retained `workspace.js` proves the old user-visible intent: a signed-in, private Bible study workspace that brings saved study material and Reader context together. The retained script directly queried `bible_notes`, `bible_bookmarks`, and `bible_highlights` through a global Supabase client and injected a global `BQWorkspace`. That ownership model is not carried into v3.

## Rebuild boundary

Milestone #78 rebuilds Workspace as an orchestration surface over already verified owners:

- `src/app/workspace.js` owns Workspace presentation state only;
- `src/app/cloud-notes.js` remains the sole application owner of cloud-note load/CRUD/cache behavior;
- `src/app/reader.js` remains the sole Reader passage-state owner;
- `src/app/congregation-membership.js` remains the sole congregation membership/role projection owner;
- `src/core/storage.js` remains the sole local persistence boundary;
- `src/features/workspace/index.js` is presentation/event forwarding only;
- `src/app/bootstrap.js` remains route composition owner.

Workspace must not create a Supabase client, query tables, persist cloud-note copies locally, mutate congregation roles, or duplicate Reader storage.

## Open behavior

- Workspace is exposed as one native `workspace` route from More.
- Signed-out users see a deterministic account-required state and no Cloud Notes or congregation loads occur.
- Local preview / remote-disabled sessions fail closed for private cloud content.
- Authenticated remote sessions load Cloud Notes through the verified Cloud Notes owner.
- Congregation memberships may be displayed only as boundary context. A role never broadens private Workspace data access or creates a sharing permission.
- Missing/unsupported congregation roles fail closed and do not unlock shared actions.

## Save-state behavior

The only new persisted Workspace state is low-sensitivity UI state owned through `src/core/storage.js` under `workspace-state`:

- schema version;
- active Workspace view (`overview` or `notes`).

Workspace must not persist note text, search terms, account IDs, congregation IDs, auth tokens, or copied cloud rows into local portable state.

Cloud study notes continue to persist only through Cloud Notes. Reader passage state continues to persist only through Reader.

## Search and navigation

Workspace may search the already loaded Cloud Notes cache in memory. Search text is not persisted.

A note Scripture reference may be opened only by delegating book/chapter state to the existing Reader owner, then returning the fixed `reader` route. Editing or creating notes delegates to the fixed `cloud-notes` route. Workspace does not interpret stored fields as arbitrary routes or URLs.

## Legacy bookmark/highlight boundary

The retained Workspace script contained direct browser DML for `bible_bookmarks` and `bible_highlights`. The tracked retained v2 database blueprint inspected for #78 does not provide a corresponding authoritative table/RLS/grant contract that can be safely reintroduced from evidence available in the rebuild.

Therefore #78 does **not** invent bookmark/highlight schema, RLS, grants, RPCs, Edge Functions, or direct browser writes. Those dormant legacy calls are not allowed to weaken the v3 ownership/security model. If a later authoritative contract is recovered, that behavior must enter through a separately verified bounded owner before it can be exposed.

## Role/session boundary

Workspace is account-private. Congregation role is informational boundary context only:

- valid roles may be shown using the existing membership owner;
- unsupported roles remain visibly unsupported;
- no role, including pastor/admin, receives Workspace sharing or cross-user access in #78;
- signed-out and remote-disabled users never receive private cloud content.

This preserves the old private-workspace intent instead of inventing congregation sharing.

## Permanent acceptance evidence

1. `scripts/validate-v3-workspace.mjs` — ownership/storage/route/workflow boundary.
2. `tests/v3-workspace-edge.mjs` — signed-out, remote-disabled, state persistence, cloud-note delegation, role fail-closed, search and Reader delegation.
3. `tests/v3-workspace-smoke.mjs` — real route plus 390px browser/mobile open, saved-view, role/session and fixed navigation behavior.
4. All three are accumulated in `.github/workflows/v3-regression.yml` without weakening prior coverage.

## Release gate

#78 remains incomplete until the exact functional candidate passes the complete accumulated suite, then the final bookkeeping SHA separately passes the complete accumulated suite before `release/v3.51-workspace` may be frozen.
