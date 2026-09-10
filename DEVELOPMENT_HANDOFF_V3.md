# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST during manual #77 development.

GitHub live refs and exact executed verification evidence are authoritative.

## Immutable / frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.49-ministry-hub` at `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Exact v3.49 bookkeeping verification run: `34461171199` — complete accumulated architecture, edge/security and browser/mobile suite green against that exact SHA.
- Previous frozen release: `release/v3.48-assignment-push` at `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- `main`, production v2, production Supabase and production Cloudflare remain untouched.
- BibleQuest autonomous A1–A5 scheduled agents are paused; current work is manual.

## #77 Notification Center exact functional state

- Active branch: `feature/v3-notification-center`.
- Frozen base: `release/v3.49-ministry-hub` at `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Exact functional candidate: `f911226f2121eb57a2d068ec43b577536328899e`.
- Exact functional verification run: `34463380194` — completed `success`.
- The isolated verification workflow explicitly checked out and asserted `f911226f2121eb57a2d068ec43b577536328899e` before executing the suite.
- Accumulated architecture validators: green.
- Accumulated edge/security regressions: green.
- Complete Playwright/browser-mobile regressions: green.
- Normal candidate workflow remains `workflow_dispatch` only.
- Temporary functional verification trigger has been restored to manual-only.

## #77 verified functional boundary

The recovered contract is exactly the inventory requirement **load; read/unread; open target; refresh**.

- `src/app/bootstrap.js` remains composition/route-registration owner.
- `src/app/router.js` remains navigation/history owner.
- `src/app/notification-center.js` owns inbox state, normalization, unread count and allowlisted target resolution.
- `src/features/notification-center/index.js` is presentation/event forwarding only.
- `src/core/api.js` remains the single browser backend boundary for `bible_notifications` own-row load/update operations.
- Signed-out/local-preview states fail closed.
- Cross-user, expired and malformed timestamp rows fail closed.
- Supported target kinds are fixed to Assignments, Ministry Hub, Recognition and Media; stored payloads never supply arbitrary URLs/routes.
- Opening a supported unread item persists read state before navigation.
- Manual refresh reloads authoritative remote state; Realtime remains outside #77.
- No schema/RLS/grant/RPC/Edge Function or production-system modification was introduced.

Permanent #77 evidence:
- `NOTIFICATION_CENTER_V3.md`;
- `scripts/validate-v3-notification-center.mjs`;
- `tests/v3-notification-center-edge.mjs`;
- `tests/v3-notification-center-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause record

- Manual review found missing required `created_at` returned an Error object instead of throwing. Root cause was the required-null branch of timestamp normalization. It now throws `BQ_NOTIFICATION_DATA` immediately and permanent edge coverage retains the case.
- The first exact functional CI attempt failed only because the new validator expected the wrong literal inventory row label/classification. The application was not weakened or changed to obtain green; the validator was corrected to match the authoritative ledger and the entire exact-SHA gate reran successfully.

## Bookkeeping transaction now prepared

The branch bookkeeping now represents:
- #76 Ministry Hub — **Regression-tested**, because the complete #77 suite retained it green;
- #77 Notification Center/inbox — **Verified**;
- **76 Regression-tested, 1 Verified, 0 Implemented, 23 Not started**;
- strict implemented-or-better parity **77/100**;
- regression stability **76/100**.

These values are provisional until the exact final bookkeeping SHA passes a new complete accumulated workflow. The green functional run does not automatically verify changed bookkeeping commits.

## Exact next executable sequence

1. Treat the final tip of `feature/v3-notification-center` after bookkeeping/status/handoff updates as the exact clean #77 bookkeeping candidate.
2. Create/use an isolated one-shot verification branch only to trigger GitHub Actions; its workflow must explicitly checkout and assert that exact bookkeeping candidate SHA.
3. Execute the complete accumulated architecture, edge/security and browser/mobile suite without removing or weakening prior coverage.
4. If any phase fails, leave v3.49 frozen/current, identify the exact root cause and verify a corrected new SHA.
5. If fully green, restore the temporary trigger state and create immutable `release/v3.50-notification-center` at exactly the verified bookkeeping SHA.
6. Only after v3.50 freeze, begin #78 Workspace implementation from retained evidence; do not copy the v2 global `BQWorkspace`/direct-client ownership model.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- Normal Actions remain `workflow_dispatch` only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
