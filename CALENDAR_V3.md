# BibleQuest v3 Calendar Contract

Status: implemented feature contract through Calendar v1.5 on its verified feature line
Updated/reconciled: 2026-09-11 JST

> **Scope authority:** This file is authoritative for Calendar behavior, ownership and Calendar-specific deferred scope. It is **not** cross-feature priority/status/integration authority. Use `DEVELOPMENT_PRIORITY_V3.md` and `RECONCILIATION_V3.md` for whole-product decisions. The implemented verified Calendar contract below supersedes the older generic pre-implementation Calendar prose within Calendar scope.

## Verified feature evidence

- release branch: `release/v3-calendar-v1-5`
- exact-green Calendar v1.5 product SHA: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
- verifier branch: `verify/v3-calendar-v1-5-functional-01ba1-20260911`
- verifier run: `34604370963`
- conclusion: success

This Calendar line is currently divergent from the cumulative Assignment → Workspace line. Calendar PASS must not be transferred to a later cumulative integration SHA; the integrated SHA must be verified again.

## Scope investigation

Calendar is post-parity functionality, not a row in the historical 100-capability legacy ledger. No prior Calendar design/data model/partial implementation was found before its initial implementation milestone.

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

Three v1-deferred areas are implemented on the verified Calendar v1.5 line:

### Congregation-shared entries

- Reuse Congregation Membership's existing ministry authorization (`can(congregationId,'ministry')` / `assert(...)`) rather than defining a second role model.
- Congregation events are separate server-authoritative rows with `congregation_id` set and `source:'congregation'`.
- Congregation events are never stored in `privateStorage` because visibility is shared rather than private.

### Weekly recurrence

- Deliberately narrow fixed-weekly recurrence only.
- `recurrenceWeeks` range is 0–52.
- Recurrence expansion belongs to the pure Calendar engine.
- Only congregation events may recur; personal events normalize recurrence to zero.
- No custom RRULE-style patterns in v1.5.

### Notification integration

- `private.bible_calendar_event_notify` is the database-side owner of Calendar-triggered notification creation.
- Migration: `supabase/migrations/20260911140000_calendar_congregation_sharing.sql` on the Calendar feature line.
- The trigger inserts `bible_notifications` rows for active congregation members except the creator when a congregation event is created.
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
- `src/app/congregation-membership.js` — remains membership/role owner; Calendar only consumes its established authorization surface.
- `src/core/api.js` — remains the single browser backend/Supabase owner, including Calendar list/create/remove/listCongregation/createCongregation APIs.
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
- The first functional candidate could abort application boot because Calendar was instantiated before the `assignments` `const` declaration, causing a temporal-dead-zone `ReferenceError`; fixed by moving Calendar instantiation after Assignments initialization.
- Corrected Calendar v1 candidate `d9364df5f17de2853beaee6a90be44614ca11c3b` passed its accumulated verifier run `34600387403` and was frozen as `release/v3-calendar`.
- Calendar v1.5 later reached exact-green SHA `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`; its smoke coverage explicitly checks congregation sharing and recurrence toggle behavior, and verifier run `34604370963` succeeded.

## Cumulative integration rule

Because Calendar v1.5 is on a divergent line, future integration must not simply promote it by timestamp. Diff/replay its intended Calendar changes onto the chosen cumulative base, preserve this feature contract, resolve architecture conflicts explicitly, then run fresh focused Calendar verification plus the complete accumulated exact-SHA suite on the integrated candidate.

Calendar's own database migration state must also be checked during any production integration; a migration committed on the feature line is not evidence that production applied it.
