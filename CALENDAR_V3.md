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

- **Congregation-shared entries** — reuse Congregation Membership's existing `can(congregationId,'ministry')`/`assert(...)` exactly as Assignments does for creation; Calendar adds no new role model. A congregation event is a genuinely separate row (`congregation_id` set, `source:'congregation'`) from personal events — it is never cached in `privateStorage` and is always server-authoritative, since its visibility is shared, not private.
- **Recurring events** — deliberately narrow: fixed-weekly only (`recurrenceWeeks`, 0–52), owned entirely by the pure engine (`expandRecurring`). No custom RRULE-style patterns. Only congregation events may recur; personal events cannot (`normalizeEvent` forces `recurrenceWeeks:0` for any non-congregation source).
- **Notification integration** — a Postgres trigger (`private.bible_calendar_event_notify`, in `20260911140000_calendar_congregation_sharing.sql`) inserts one `bible_notifications` row per active congregation member (excluding the creator) when a congregation event is created. This keeps Notification Center as the sole notification-delivery owner: Calendar's client code never writes to `bible_notifications` itself, and the trigger is the only thing that does.

## v1.6: owner-only edit/delete for congregation events

The previously deferred correction path for a mistakenly created congregation event is now implemented without adding a new authorization model or migration:

- **owner-only edit/delete** — only the authenticated account whose `user_id` created the stored congregation row receives edit/delete controls and may invoke the corresponding service operations. Other congregation members continue to see the shared event read-only, including other leaders.
- `normalizeEvent` preserves the stored creator as `ownerId`; generated weekly occurrences inherit that identity, but presentation controls are shown only on the stored base event, never on synthetic `:occurrence-N` rows.
- The API boundary scopes both mutations by the event `id`, creator `user_id`, and `congregation_id`. A missing row returns `null` and the service fails closed rather than treating the mutation as successful.
- The existing v1 own-row RLS already authorizes `UPDATE`/`DELETE` only when `user_id = auth.uid()`. Those policies apply to creator-owned congregation rows as well as personal rows, so no new RLS migration is required. The client-side owner check and the database policy are intentionally independent layers.
- Update and delete do not insert replacement rows. The congregation-event notification trigger remains a **creation-only notification** path, so editing or deleting an event does not send a duplicate creation notification.
- After a successful mutation, congregation rows are fetched again from the server-authoritative source; shared events are still never written into `privateStorage`.

Still explicitly deferred:
- Any calendar surface inside Ministry Hub.
- Custom (non-weekly) recurrence patterns.

## Ownership

- `src/engines/calendar.js` — sole owner of date-grouping/agenda/recurrence-expansion logic and normalized event identity. Pure functions; no storage, DOM, or network. Never writes to any other owner.
- `src/app/calendar.js` — lifecycle/persistence owner. Reuses Session (owner identity), Assignments' existing `dueAt`/`dueState` (read-only), and Congregation Membership's existing `load()`/`can()`/`assert()` (read-only role check for shared-event creation; Calendar never writes membership or role data). All network access goes through `src/core/api.js` (`calendar.list/create/remove/listCongregation/createCongregation/updateCongregation/removeCongregation`) — no direct Supabase client calls in the app owner.
- `src/features/calendar/index.js` — presentation/event forwarding only. It may expose creator controls using normalized `ownerId` versus the signed-in account ID, but it never decides database authorization.
- `src/app/router.js` remains the navigation owner (route: `calendar`, reachable from the More page). `src/app/assignments.js` remains the sole owner of assignment data; `src/app/congregation-membership.js` remains the sole owner of membership/role data; Calendar only reads their cached snapshots/getters.
- `private.bible_calendar_event_notify` (database trigger) is the sole owner of calendar-triggered notification delivery; Notification Center (`bible_notifications`, `src/app/notification-center.js`) remains the sole owner of notification storage/read-state, unmodified.

## Persistence and visibility

- `bible_calendar_events` — personal rows (`congregation_id` null) keep v1's own-row RLS (select/insert/update/delete scoped to `user_id = auth.uid()`). Congregation rows (`congregation_id` set) add: any active congregation member may `select`; only a ministry role (`facilitator`/`leader`/`pastor`/`admin`, via `private.bible_role_in_congregation`) may `insert`. Creator edit/delete deliberately reuse v1's existing own-row `UPDATE`/`DELETE` RLS, so another member cannot mutate the row even if the client is bypassed.
- Guests: `privateStorage` only, device-local, never synced. Guests cannot share with or manage congregation events (no authenticated owner identity).
- Signed-in accounts: personal events use `privateStorage` local cache plus best-effort cloud sync (fail-open-but-retry, matching Avatar Vault/Personal Mission). Congregation events are never cached locally and are always fetched fresh from `listCongregation`.
- Assignment due dates remain read-only and are never persisted by Calendar.

## Non-negotiable boundary

Calendar never modifies Assignments, Progress, Congregation Membership, or Notification Center. It has no authority over scoring, leaderboards, or ministry roles — it only reads the role check Congregation Membership already computes for congregation-event creation. Shared-event edit/delete authorization is creator ownership, enforced first in the Calendar service and again by the existing own-row RLS.

## Defect / root-cause ledger

- `normalizeEvent` was not idempotent: it read `raw.eventDate`/`raw.event_date` on input but its own output shape used `date`, so re-normalizing a stored event on the next load silently dropped it. Caught by the local edge-test run before any gate; fixed by accepting `raw.date` as a fallback input field.
- First functional candidate crashed app boot entirely (`tests/v3-shell-smoke.mjs` timed out waiting for the shell to render): `calendar` was instantiated in `bootstrap.js` referencing `assignments` before `assignments`'s own `const` declaration (temporal-dead-zone `ReferenceError`), which aborted `start()` before anything rendered. Root cause was purely instantiation order; no runtime/product logic was at fault. Fixed by moving `calendar`'s instantiation after `assignments`'s declaration. Corrected candidate `d9364df5f17de2853beaee6a90be44614ca11c3b` passed the complete accumulated suite (run `34600387403`) and is frozen as `release/v3-calendar`.
- During the v1.6 API-boundary edit, a full-file repository write accidentally removed one closing brace from the unrelated password-reset call. The defect was detected from the commit diff before any PR/test claim, corrected immediately on the isolated release branch, and the correction commit was verified to alter only that single character. The net branch diff against `main` contains no password-reset change.