# BibleQuest v3 Presence contract

Inventory item: **#68 Presence** (`Compatibility`).

## Source of truth

Presence uses the existing `public.bible_presence` table. No new table or Supabase migration is introduced by v3. The table key is `(congregation_id, user_id)` and its compatibility fields are `last_seen_at` and `surface`.

Database RLS remains authoritative:

- congregation members may read presence rows for their congregation;
- a signed-in user may insert/update/delete only their own presence row;
- v3 does not bypass RLS with a privileged browser credential.

## Runtime owner

`src/app/presence.js` is the sole v3 presence lifecycle owner. `src/core/api.js` owns the Supabase table access boundary. Feature/UI code must not write `bible_presence` directly.

## Online/offline semantics

- An authenticated remote session refreshes its own row every **60 seconds** for every active congregation membership.
- A row is considered online while `last_seen_at` is no more than **150 seconds** old. This stale timeout is deliberately longer than two heartbeat intervals so one missed refresh does not immediately mark a user offline.
- Up to **30 seconds** of future timestamp skew is tolerated; larger future timestamps fail closed as offline.
- Explicit leave/dispose attempts to delete the current user's active rows for immediate offline cleanup.
- If cleanup cannot complete because the page crashes or connectivity disappears, the stale timeout is the fallback that prevents permanent false-online state.

## Lifecycle

Presence starts only after the shared session owner has booted. It observes the shared session state so later sign-in/sign-out/user changes reconcile without creating a second auth owner. Timers and subscriptions are removed during disposal. Signed-out and localhost/local-preview states do not perform cloud writes.

## Scope and privacy

Presence may load only congregations allowed by the verified congregation membership owner. Malformed or foreign-congregation rows fail closed with `BQ_PRESENCE_SCOPE`. The shared store receives lifecycle status/IDs only; the full congregation presence roster remains inside the Presence owner cache until requested by a future verified consumer such as Team Center.

## Verification gate

#68 is not promoted merely because code exists. It must pass:

- Presence architecture validator;
- deterministic edge regression for heartbeat, stale timeout, membership scope, auth switch, and cleanup;
- browser smoke regression for lifecycle/store integration;
- the complete accumulated v3 regression workflow on the exact bookkeeping candidate SHA.
