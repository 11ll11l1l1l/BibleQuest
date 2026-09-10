# BibleQuest v3 Notification Center contract — milestone #77

Recovered: 2026-09-10
Functional verification: 2026-09-10 JST

## Authoritative acceptance

`FEATURE_INVENTORY_V3.md` defines #77 Notification Center/inbox with required verification: **load; read/unread; open target; refresh**.

Retained v2 `notification-center.js` proves a signed-in user inbox backed by `public.bible_notifications`: load the user's current non-expired rows, show unread state/count, mark a row or all rows read, refresh, and route known notification actions into BibleQuest. Retained schema already restricts select/update to the authenticated user's own rows.

## Bounded v3 scope

Milestone #77 rebuilds the inbox through existing v3 owners:

- one `notification-center` route registered by the existing bootstrap/router;
- one application owner, `src/app/notification-center.js`, for inbox state and normalization;
- one core API boundary, `src/core/api.js`, for `bible_notifications` select/update;
- one presentation owner, `src/features/notification-center/index.js`;
- signed-out state fails closed and offers Account navigation;
- load at most 100 non-expired rows, newest first;
- expose read/unread status and unread count;
- allow own-row read/unread changes and mark-all-read through the existing own-row RLS boundary;
- manual refresh reloads authoritative remote state;
- known action kinds route only through an explicit allowlist to already verified v3 destinations.

## Safe action routing

Supported action kinds:

- `assignment` -> `assignments`;
- `ministry` -> `ministry-hub`;
- `recognition` -> `recognition`;
- `media` -> `media`.

Unknown, blank, malformed, or not-yet-migrated action kinds do not navigate. They remain readable inbox items and expose a controlled unavailable state. No stored notification field is treated as a raw URL, route name, HTML, or executable command.

Opening a supported target marks that notification read first, then delegates navigation to the existing router. A failed read-state write must not silently claim success or navigate as though the action completed.

## Backend/security boundary

Existing retained v3.49 schema is sufficient:

- `public.bible_notifications` already exists;
- RLS permits authenticated users to select/update only rows where `user_id = auth.uid()`;
- server-side notification trigger functions already have direct execute revoked from `public`, `anon`, and `authenticated` roles.

No schema/RLS/grant/RPC/Edge Function migration is required by #77.

`src/core/api.js` is the only browser Supabase owner. Feature/app code must not create another client or call `.from(...)` directly.

## Explicitly outside #77

- Realtime subscription ownership; manual refresh satisfies the inventory contract and avoids reviving the v2 global channel lifecycle.
- Creating arbitrary notifications from the inbox UI.
- Notification preferences, push permission, OS/web-push delivery or background service-worker notifications.
- #78 Workspace and #79 Linked Activities.
- Rebuilding legacy Ministry messages/polls/calendar merely because old notifications may reference them.
- Arbitrary deep links or external URLs from notification payloads.

## Normalization/fail-closed rules

A returned row is accepted only when:

- it has a non-empty `id`;
- its `user_id` exactly matches the current authenticated user;
- required title/type fields normalize safely;
- `created_at`, `read_at`, and `expires_at` are either null where allowed or valid timestamps;
- an expired row is rejected even if a mock/backend query mistakenly returns it.

Text is rendered through DOM text or escaped HTML only. `action_payload` is retained as inert structured metadata and never interpreted as code or a raw navigation destination.

## Permanent acceptance evidence

Permanent #77 evidence is:

1. `scripts/validate-v3-notification-center.mjs` — architecture/API/RLS/action-allowlist/workflow boundary;
2. `tests/v3-notification-center-edge.mjs` — signed-out, own-row, malformed timestamp, expiry, read/unread, mark-all, supported/unsupported action, refresh, remote-error and local-preview coverage;
3. `tests/v3-notification-center-smoke.mjs` — real route plus 390 px browser/mobile unread, refresh, allowlisted navigation, unsupported-target, overflow and touch-target coverage;
4. accumulated invocation of all three in `.github/workflows/v3-regression.yml` without removing prior coverage.

## Exact functional verification

Exact functional candidate `f911226f2121eb57a2d068ec43b577536328899e` passed GitHub Actions run `34463380194`.

The isolated one-shot verification branch explicitly checked out and asserted that exact candidate SHA before testing. The exact-SHA assertion, complete accumulated architecture validators, complete accumulated edge/security regressions, and complete accumulated browser/mobile regressions all completed successfully.

The earlier functional attempt failed only because the new #77 validator expected the wrong literal inventory row name/classification. The application was not changed to get that run green; the validator was corrected to match the authoritative ledger, and the corrected exact candidate was rerun through the complete gate.

The missing-required-timestamp defect found during manual review was corrected before the successful candidate: normalization now throws `BQ_NOTIFICATION_DATA` immediately rather than returning an Error object that could fail later during sort. Permanent edge coverage retains that root-cause regression.

## Release gate

Functional verification does not transfer to changed bookkeeping commits. Before `release/v3.50-notification-center` may be frozen, the final bookkeeping SHA must pass a separate complete accumulated exact-SHA workflow while normal candidate/release Actions remain `workflow_dispatch` only.
