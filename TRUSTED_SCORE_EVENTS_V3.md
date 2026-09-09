# BibleQuest v3 Trusted Score Events contract

Inventory #70 restores the retained congregation score-event submission boundary without making the browser a scoring authority.

## Ownership

- `src/app/trusted-score-events.js` is the sole v3 client owner for score-event claim normalization, authenticated congregation scope, stable event-ID normalization, and trusted response normalization.
- `src/core/api.js` remains the sole browser Supabase/Edge Function boundary and invokes `bq-score`.
- `supabase/functions/bq-score/index.ts` remains the trusted server authority for supported sources, derived points, category matching, delegated scoring, active-membership checks, daily/rate caps, database writes, duplicate detection, and badge evaluation.
- `public.bible_score_events` remains server-written. The v3 browser must not insert, update, delete, or upsert score rows directly.

## Submission contract

A submission contains one active congregation ID and 1–50 claims. Each claim requires:

- a stable `sourceEventId`;
- a retained activity `source`;
- optional category, metadata, claimed-points hint, or target user where the trusted server contract permits them.

The v3 owner trims and caps `sourceEventId` at 120 characters before the request. Empty IDs, empty sources, malformed metadata, non-numeric claimed-points hints, and duplicate canonical IDs in the same browser submission fail closed before network mutation. This matches the server/unique-index identity boundary and prevents whitespace or overlength retries from becoming different browser-side identities.

The browser deliberately does **not** calculate award points or maintain a duplicate ledger. Cross-request and concurrent duplicate authority remains on `bq-score` plus the database uniqueness constraint. A server duplicate is exposed as `accepted: false, duplicate: true` rather than converted into success.

## Authentication and scope

- A real authenticated session is required.
- Local preview, guest, and signed-out states cannot submit score events.
- The requested congregation must be one of the current user's active readable memberships before the request is sent.
- The trusted server independently rechecks active membership and any delegated target authority; browser membership checks are only an early fail-closed boundary.

## Response contract

The client accepts only a complete one-result-per-submitted-event response using the submitted canonical IDs. Unexpected, repeated, contradictory, missing, or non-numeric server results fail closed with `BQ_SCORE_EVENT_RESPONSE`.

The returned counters are recomputed from normalized per-event results rather than trusting aggregate counters supplied by the network response.

## Explicit exclusions

#70 does not rebuild Leaderboards (#71), recognition (#72), assignments, notifications, Team Center ownership, XP display, or activity-to-score wiring that has not yet been recovered. Existing verified learning/game owners keep their current progress behavior. Later milestones may call this owner only after their retained event-source mapping is recovered; they must not create another score authority.

No migration or production Edge Function deployment is required for #70 implementation. The retained live table/function contract is reused read-only during rebuild verification. Production v2, `main`, production Supabase, and production Cloudflare remain untouched.

## Verification

Permanent coverage for #70 is:

- `scripts/validate-v3-trusted-score-events.mjs` — ownership and trusted-server architecture boundary;
- `tests/v3-trusted-score-events-edge.mjs` — auth/scope, canonical IDs, same-batch duplicate rejection, server duplicate preservation, and malformed-response recovery;
- `tests/v3-trusted-score-events-smoke.mjs` — browser/390px ESM composition and fail-closed submission behavior.

The feature remains **Implemented** until its exact clean candidate passes the complete accumulated architecture, edge, and browser/mobile workflow. It becomes **Verified** only after that exact-SHA functional gate passes.
