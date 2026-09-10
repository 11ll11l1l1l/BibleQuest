# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-notification-center`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint: `release/v3.49-ministry-hub` at `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Exact v3.49 bookkeeping verification run: `34461171199`, complete accumulated architecture, edge/security and browser/mobile suite green against the frozen SHA.
- Safety refs remain untouched.

## Current progress represented by the #77 bookkeeping transaction

| State | Count |
|---|---:|
| Regression-tested | 76 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 23 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping transaction is **77/100**.
Official regression stability represented by this bookkeeping transaction is **76/100**.

These values are provisional until the exact final #77 bookkeeping SHA passes a new complete accumulated gate and is frozen. No PASS transfers from the functional SHA to a changed bookkeeping SHA.

Current leading rows:
- #75 Assignment push workflow — Regression-tested.
- #76 Ministry Hub — Regression-tested because it survived the complete #77 functional suite.
- #77 Notification Center/inbox — Verified by exact functional candidate `f911226f2121eb57a2d068ec43b577536328899e` in complete run `34463380194`.
- #78 Workspace — next non-deferred inventory row after #77 release closure.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #77 Notification Center/inbox — functional gate complete

The milestone is intentionally bounded to the authoritative inventory contract: **load; read/unread; open target; refresh**.

Recovered and verified behavior:
- one native `#/notification-center` route composed by the existing bootstrap/router;
- `src/app/notification-center.js` owns inbox normalization and state;
- `src/core/api.js` is the sole browser Supabase boundary for own-row `bible_notifications` read/update operations;
- signed-out and local-preview states fail closed without unauthorized remote activity;
- inbox rows are limited to the authenticated user and non-expired data, newest first;
- malformed user scope, expiry and timestamp data fail closed;
- unread count, per-row read/unread mutation, mark-all-read and manual refresh are verified;
- supported notification targets use a fixed allowlist: Assignments, Ministry Hub, Recognition and Media;
- unknown/legacy action kinds remain readable but cannot navigate to stored payload routes or URLs;
- opening an unread supported target persists read state before delegating navigation;
- Realtime subscription ownership, push notifications/preferences, arbitrary notification creation, #78 Workspace and #79 Linked Activities remain outside #77;
- no schema, migration, RLS, grant, RPC, Edge Function or production-system change was introduced.

Permanent #77 coverage:
- `scripts/validate-v3-notification-center.mjs` — architecture/API/RLS/action-allowlist/workflow contract;
- `tests/v3-notification-center-edge.mjs` — signed-out, own-row, timestamp/expiry, read-state, refresh, target and error boundaries;
- `tests/v3-notification-center-smoke.mjs` — real route plus 390px browser/mobile unread, refresh, routing, overflow and touch-target coverage;
- `.github/workflows/v3-regression.yml` invokes all three while retaining the complete prior accumulated suite.

Exact functional candidate `f911226f2121eb57a2d068ec43b577536328899e` passed run `34463380194`. The isolated verification workflow explicitly checked out and asserted that exact SHA; exact-SHA assertion, accumulated architecture validators, all edge/security regressions and the full browser/mobile regression suite all completed successfully.

## Defect / root-cause ledger

Two #77 development issues were resolved without weakening the application or regression gate:
- Missing required notification timestamps returned an Error object instead of throwing immediately. The required-null normalization path now throws `BQ_NOTIFICATION_DATA`, with permanent edge coverage.
- The first exact functional CI attempt failed because the new #77 architecture validator expected a stale/wrong literal inventory row name/classification. The authoritative inventory was unchanged; the validator was corrected and the complete exact-SHA suite reran green.

Earlier milestone defect regressions remain retained in the accumulated suite.

## Next major milestone

The immediate release gate is #77 bookkeeping and freeze; #78 must not be treated as verified early.

1. Complete only the #77 bookkeeping/status/handoff transaction on `feature/v3-notification-center`.
2. Treat its final branch tip as the exact clean bookkeeping candidate.
3. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated architecture, edge/security and browser/mobile suite.
4. If any phase fails, do not freeze; identify the exact root cause, preserve all prior coverage and rerun a corrected exact SHA.
5. If fully green, restore/remove temporary verification trigger state and create immutable `release/v3.50-notification-center` at that exact green bookkeeping SHA.
6. Only after v3.50 is frozen should #78 Workspace implementation begin from recovered retained behavior and proven data/security boundaries.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
