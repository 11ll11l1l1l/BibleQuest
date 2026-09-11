# BibleQuest v3 Calendar Contract

Status: implemented feature contract through Calendar v1.5 on its verified feature line
Updated/reconciled: 2026-09-11 JST

> **Scope authority:** This file is authoritative for Calendar behavior, ownership and Calendar-specific deferred scope. It is **not** cross-feature priority/status/integration authority. Use `DEVELOPMENT_PRIORITY_V3.md` and `RECONCILIATION_V3.md` for whole-product decisions.

## Verified feature evidence and ancestry

- Calendar release branch: `release/v3-calendar-v1-5`
- Calendar v1.5 exact-green product SHA: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
- Calendar verifier branch: `verify/v3-calendar-v1-5-functional-01ba1-20260911`
- Calendar verifier run: `34604370963` — success

Calendar v1.5 is the tip of a verified Line B chain:

- Visual tranche 18 `524adb11cd7e5ad877b5dcdb8f5c28373ad84932` — verifier `34601602518` success;
- Avatar Vault v2 `7ce6685a7383102f29797869a77eabcf7ab9c0c2` — verifier `34603004871` success; descendant of Visual18;
- Calendar v1.5 `01ba15e7...` — descendant of Avatar v2.

This Line B chain diverges from the separate Assignment → Workspace exact-green line ending at `61ee54fac7d352312cef7ffd8010997fa8bc9e51`. Calendar PASS must not be transferred to a future cumulative merge SHA; the integrated SHA must be verified again.

## v1 scope

v1 delivered:

- personal reminders;
- read-only assignment due-date aggregation;
- 30-day agenda;
- device + account persistence.

Originally deferred from v1:

- congregation-shared/leader-visible entries;
- recurring events;
- Notification Center delivery integration;
- Calendar surface inside Ministry Hub.

## v1.5 implemented scope

### Congregation-shared entries

- Reuse Congregation Membership's existing ministry authorization (`can(congregationId,'ministry')` / `assert(...)`) rather than defining a second role model.
- Congregation events are separate server-authoritative rows with `congregation_id` set and `source:'congregation'`.
- Congregation events are never stored in `privateStorage` because visibility is shared rather than private.

### Weekly recurrence

- Narrow fixed-weekly recurrence only.
- `recurrenceWeeks` range: 0–52.
- Recurrence expansion belongs to the pure Calendar engine.
- Only congregation events may recur; personal events normalize recurrence to zero.
- No custom RRULE-style patterns in v1.5.

### Notification integration

- `private.bible_calendar_event_notify` is the database-side owner of Calendar-triggered notification creation.
- Migration: `supabase/migrations/20260911140000_calendar_congregation_sharing.sql` on the Calendar feature line.
- Trigger inserts `bible_notifications` rows for active congregation members except the creator when a congregation event is created.
- Calendar client code does not write directly to `bible_notifications`.
- Notification Center remains the sole notification storage/read-state owner.

## Still explicitly deferred

- Calendar surface inside Ministry Hub;
- editing/deleting an already-created congregation event;
- custom/non-weekly recurrence patterns.

These are follow-up scope, not silently missing v1.5 requirements.

## Ownership

- `src/engines/calendar.js` — sole owner of date grouping, agenda and recurrence expansion; pure functions only.
- `src/app/calendar.js` — lifecycle/persistence owner. Reads Session identity, Assignment due-date snapshots and Congregation Membership authorization. Network operations go through `src/core/api.js`.
- `src/features/calendar/index.js` — presentation/event forwarding only.
- `src/app/router.js` — navigation owner; Calendar route is `calendar`, reachable from More.
- `src/app/assignments.js` — remains Assignment data owner; Calendar reads due-date information only.
- `src/app/congregation-membership.js` — remains membership/role owner; Calendar consumes its established authorization surface.
- `src/core/api.js` — remains the single browser backend/Supabase owner.
- `private.bible_calendar_event_notify` — sole calendar-triggered notification creation owner at the database boundary.
- Notification Center remains owner of notification storage/read-state.

Calendar must not create a second Supabase client, competing membership role model, duplicate assignment owner or parallel notification-delivery system.

## Persistence and visibility

### Personal events

- `bible_calendar_events` rows with `congregation_id` null use own-row authorization scoped to `user_id = auth.uid()`.
- Guest events: device-local `privateStorage`, never synced.
- Signed-in personal events: `privateStorage` cache plus best-effort cloud sync.
- Personal events do not recur in v1.5.

### Congregation events

- `congregation_id` is set.
- Active congregation members may read under the Calendar migration's RLS contract.
- Only ministry roles may create congregation rows.
- No congregation update/delete policy was intentionally added in v1.5.
- Shared rows are server-authoritative and not cached in `privateStorage`.

### Assignment due dates

Assignment due dates are read-only Calendar inputs and are never persisted/owned by Calendar.

## Non-negotiable boundary

Calendar never takes ownership of Assignments, Progress, Congregation Membership, Notification Center, scoring, leaderboards or ministry roles.

## Recorded defects / root causes

- `normalizeEvent` initially failed idempotence because stored output used `date` while input normalization only read `eventDate`/`event_date`; fixed by accepting `raw.date` as fallback.
- The first functional candidate could abort boot because Calendar was instantiated before the `assignments` `const`, causing a temporal-dead-zone `ReferenceError`; fixed by moving Calendar instantiation after Assignments initialization.
- Corrected Calendar v1 candidate `d9364df5f17de2853beaee6a90be44614ca11c3b` passed accumulated verifier `34600387403` and was frozen as `release/v3-calendar`.
- Calendar v1.5 reached exact-green `01ba15e...`; verifier `34604370963` succeeded.

## Cumulative integration rule

Future whole-product integration must preserve the **full intended Line B chain**, not cherry-pick only Calendar files. Reconcile Visual18 + Avatar v2 + Calendar v1.5 with the separate Assignment → Workspace line using merge-base/three-way evidence, then run fresh focused Calendar verification plus the complete accumulated exact-SHA suite on the integrated candidate.

Calendar's own database migration state must also be checked during production integration; a migration committed on the feature line is not evidence that production applied it.
