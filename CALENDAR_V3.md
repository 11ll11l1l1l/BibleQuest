# BibleQuest v3 Calendar Contract

Calendar is new post-parity functionality, not a row in `FEATURE_INVENTORY_V3.md`'s 100-capability legacy ledger. This document is Calendar's own authoritative contract and status, tracked separately from that ledger the same way visual-polish tranches are tracked outside it.

## Scope investigation (recorded before coding)

No existing Calendar design, data model, or partial implementation was found anywhere in the repository (contract docs, `FEATURE_INVENTORY_V3.md`, schema, migrations, or source tree) as of this milestone. Calendar is a genuinely new feature.

## v1 scope decision (recorded, not silent)

v1 delivers: **personal reminders; read-only assignment due-date aggregation; 30-day agenda; device+account persistence.**

Explicitly deferred as follow-up sub-milestones, not built here:
- Congregation-shared/leader-visible calendar entries (needs its own authorization design, comparable to Assignments' target-scope/role model).
- Recurring events.
- Notification/reminder delivery integration with Notification Center.
- Any calendar surface inside Ministry Hub.

Building any of the above now would mean inventing authorization or notification-delivery behavior beyond what v1 needs; they are real product decisions for a later, explicitly scoped milestone.

## Ownership

- `src/engines/calendar.js` — sole owner of date-grouping/agenda logic. Pure functions; no storage, DOM, or network. Never writes to any other owner.
- `src/app/calendar.js` — lifecycle/persistence owner. Reuses Session (owner identity) and Assignments' existing `dueAt`/`dueState` (read-only aggregation; Calendar never writes to `bible_assignments` or `bible_assignment_progress`). All network access goes through `src/core/api.js` (`calendar.list/create/remove`) — no direct Supabase client calls in the app owner.
- `src/features/calendar/index.js` — presentation/event forwarding only.
- `src/app/router.js` remains the navigation owner (route: `calendar`, reachable from the More page). `src/app/assignments.js` remains the sole owner of assignment data; Calendar only reads its cached snapshot.

## Persistence and visibility

- `bible_calendar_events` (new table, own-row RLS only: select/insert/update/delete all scoped to `user_id = auth.uid()`) is the cloud source of truth for a signed-in account's personal events. No other user or congregation role can read another user's calendar events in v1 — there is no shared-visibility surface yet.
- Guests: `privateStorage` only, device-local, never synced.
- Signed-in accounts: `privateStorage` local cache plus best-effort cloud sync; if cloud sync fails, the local add/remove still applies and a retry happens next time Calendar opens (matches the Avatar Vault/Personal Mission fail-open-but-retry pattern already established).
- Assignment due dates are read-only and are never persisted by Calendar; they are recomputed from Assignments' own cache on every load.

## Non-negotiable boundary

Calendar never modifies Assignments, Progress, Notification Center, or any other owner. It has no authority over scoring, leaderboards, or ministry roles.

## Defect / root-cause ledger

- `normalizeEvent` was not idempotent: it read `raw.eventDate`/`raw.event_date` on input but its own output shape used `date`, so re-normalizing a stored event on the next load silently dropped it. Caught by the local edge-test run before any gate; fixed by accepting `raw.date` as a fallback input field.
- First functional candidate crashed app boot entirely (`tests/v3-shell-smoke.mjs` timed out waiting for the shell to render): `calendar` was instantiated in `bootstrap.js` referencing `assignments` before `assignments`'s own `const` declaration (temporal-dead-zone `ReferenceError`), which aborted `start()` before anything rendered. Root cause was purely instantiation order; no runtime/product logic was at fault. Fixed by moving `calendar`'s instantiation after `assignments`'s declaration. Corrected candidate `d9364df5f17de2853beaee6a90be44614ca11c3b` passed the complete accumulated suite (run `34600387403`) and is frozen as `release/v3-calendar`.
