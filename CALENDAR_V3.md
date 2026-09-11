# BibleQuest v3 Calendar Contract

Calendar is new post-parity functionality, not a row in `FEATURE_INVENTORY_V3.md`'s 100-capability legacy ledger. This document is Calendar's own authoritative contract and status, tracked separately from that ledger the same way visual-polish tranches are tracked outside it.

## Scope investigation (recorded before coding)

No existing Calendar design, data model, or partial implementation was found anywhere in the repository (contract docs, `FEATURE_INVENTORY_V3.md`, schema, migrations, or source tree) as of this milestone. Calendar is a genuinely new feature.

## v1 scope decision (recorded, not silent)

v1 delivers: **personal reminders; read-only assignment due-date aggregation; 30-day agenda; device+account persistence.**

Explicitly deferred at v1 as follow-up sub-milestones, not built then:
- Congregation-shared/leader-visible calendar entries (needs its own authorization design, comparable to Assignments' target-scope/role model).
- Recurring events.
- Notification/reminder delivery integration with Notification Center.
- Any calendar surface inside Ministry Hub.

## v1.5: congregation-shared entries + weekly recurrence + notifications (Priority 1A follow-up)

Three of the four v1-deferred items are now implemented, reusing existing owners rather than inventing new authorization or notification-delivery mechanisms:

- **Congregation-shared entries** — reuse Congregation Membership's existing `can(congregationId,'ministry')`/`assert(...)` exactly as Assignments does; Calendar adds no new role model. A congregation event is a genuinely separate row (`congregation_id` set, `source:'congregation'`) from personal events — it is never cached in `privateStorage` and is always server-authoritative, since its visibility is shared, not private.
- **Recurring events** — deliberately narrow: fixed-weekly only (`recurrenceWeeks`, 0–52), owned entirely by the pure engine (`expandRecurring`). No custom RRULE-style patterns. Only congregation events may recur; personal events cannot (`normalizeEvent` forces `recurrenceWeeks:0` for any non-congregation source).
- **Notification integration** — a new Postgres trigger (`private.bible_calendar_event_notify`, in `20260911140000_calendar_congregation_sharing.sql`) inserts one `bible_notifications` row per active congregation member (excluding the creator) when a congregation event is created. This keeps Notification Center as the sole notification-delivery owner: Calendar's client code never writes to `bible_notifications` itself, and the trigger is the only thing that does.

Still not built, and still explicitly deferred (a genuine follow-up, not silently dropped):
- Any calendar surface inside Ministry Hub.
- Editing or deleting a congregation event once created (only creation is implemented; a leader who makes a mistake must ask an admin/direct-DB fix today).
- Custom (non-weekly) recurrence patterns.

## Ownership

- `src/engines/calendar.js` — sole owner of date-grouping/agenda/recurrence-expansion logic. Pure functions; no storage, DOM, or network. Never writes to any other owner.
- `src/app/calendar.js` — lifecycle/persistence owner. Reuses Session (owner identity), Assignments' existing `dueAt`/`dueState` (read-only), and Congregation Membership's existing `load()`/`can()`/`assert()` (read-only role check; Calendar never writes membership or role data). All network access goes through `src/core/api.js` (`calendar.list/create/remove/listCongregation/createCongregation`) — no direct Supabase client calls in the app owner.
- `src/features/calendar/index.js` — presentation/event forwarding only.
- `src/app/router.js` remains the navigation owner (route: `calendar`, reachable from the More page). `src/app/assignments.js` remains the sole owner of assignment data; `src/app/congregation-membership.js` remains the sole owner of membership/role data; Calendar only reads their cached snapshots/getters.
- `private.bible_calendar_event_notify` (database trigger) is the sole owner of calendar-triggered notification delivery; Notification Center (`bible_notifications`, `src/app/notification-center.js`) remains the sole owner of notification storage/read-state, unmodified.

## Persistence and visibility

- `bible_calendar_events` — personal rows (`congregation_id` null) keep v1's own-row RLS (select/insert/update/delete scoped to `user_id = auth.uid()`). Congregation rows (`congregation_id` set) add: any active congregation member may `select`; only a ministry role (`facilitator`/`leader`/`pastor`/`admin`, via `private.bible_role_in_congregation`) may `insert`. No new update/delete policy was added for congregation rows in this pass (see deferred list above).
- Guests: `privateStorage` only, device-local, never synced. Guests cannot share with a congregation (no session to authorize against).
- Signed-in accounts: personal events use `privateStorage` local cache plus best-effort cloud sync (fail-open-but-retry, matching Avatar Vault/Personal Mission). Congregation events are never cached locally and are always fetched fresh from `listCongregation`.
- Assignment due dates remain read-only and are never persisted by Calendar.

## Non-negotiable boundary

Calendar never modifies Assignments, Progress, Congregation Membership, or Notification Center. It has no authority over scoring, leaderboards, or ministry roles — it only reads the role check Congregation Membership already computes.

## Defect / root-cause ledger

- `normalizeEvent` was not idempotent: it read `raw.eventDate`/`raw.event_date` on input but its own output shape used `date`, so re-normalizing a stored event on the next load silently dropped it. Caught by the local edge-test run before any gate; fixed by accepting `raw.date` as a fallback input field.
- First functional candidate crashed app boot entirely (`tests/v3-shell-smoke.mjs` timed out waiting for the shell to render): `calendar` was instantiated in `bootstrap.js` referencing `assignments` before `assignments`'s own `const` declaration (temporal-dead-zone `ReferenceError`), which aborted `start()` before anything rendered. Root cause was purely instantiation order; no runtime/product logic was at fault. Fixed by moving `calendar`'s instantiation after `assignments`'s declaration. Corrected candidate `d9364df5f17de2853beaee6a90be44614ca11c3b` passed the complete accumulated suite (run `34600387403`) and is frozen as `release/v3-calendar`.
