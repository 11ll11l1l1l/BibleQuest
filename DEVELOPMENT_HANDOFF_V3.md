# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST during manual #76 development.

GitHub live refs and exact executed verification evidence are authoritative.

## Immutable / frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.48-assignment-push` at `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Exact v3.48 bookkeeping verification run: `34450088492` — complete accumulated architecture, edge/security and browser/mobile suite green against that exact SHA.
- Previous frozen release: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- `main`, production v2, production Supabase and production Cloudflare remain untouched.
- BibleQuest autonomous A1–A5 scheduled agents are paused; current work is manual.

## #76 Ministry Hub exact functional state

- Active branch: `feature/v3-ministry-hub`.
- Frozen base: `release/v3.48-assignment-push` at `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Exact functional candidate: `dfc6440cd7105c73107081dfb4fb16f8bfac2d71`.
- Exact functional verification run: `34460593373` — completed `success`.
- The isolated verification workflow explicitly checked out and asserted `dfc6440cd7105c73107081dfb4fb16f8bfac2d71` before executing the suite.
- Accumulated architecture validators: green.
- Accumulated edge/security regressions: green.
- Complete Playwright/browser-mobile regressions: green.
- Normal candidate workflow remains `workflow_dispatch` only.

## #76 verified functional boundary

The recovered contract is exactly the inventory requirement **open tools; role guard; navigation**.

- `src/app/bootstrap.js` remains composition/route-registration owner.
- `src/app/router.js` remains navigation/history owner.
- `src/app/congregation-membership.js` remains congregation membership and role projection owner.
- `src/app/ministry-hub.js` is a read-only Ministry Hub portal projection.
- `src/features/ministry-hub/index.js` is presentation/event forwarding only.
- `src/core/api.js` remains the browser backend boundary.
- Valid ordinary members can open existing Assignments and Journey Groups destinations.
- Facilitator, Leader, Pastor and Admin roles receive bounded ministry-role convenience UI only.
- Unknown/unsupported roles fail closed.
- Assignment publishing delegates to the existing Assignments owner; privileged mutation authorization remains server-side.
- Live Room (#43) and Leader Dashboard remain unavailable/deferred.
- Notification Center (#77), Workspace (#78), Linked Activities (#79), legacy messages/devotionals, polls, calendar and media CRUD are not claimed by #76.
- No schema/RLS/grant/RPC/Edge Function/storage-policy/Realtime or production-system modification was introduced.

Permanent #76 evidence:
- `MINISTRY_HUB_V3.md`;
- `scripts/validate-v3-ministry-hub.mjs`;
- `tests/v3-ministry-hub-edge.mjs`;
- `tests/v3-ministry-hub-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Bookkeeping transaction now prepared

The branch bookkeeping now represents:
- #75 Assignment push workflow — **Regression-tested**, because the complete #76 suite retained it green;
- #76 Ministry Hub — **Verified**;
- **75 Regression-tested, 1 Verified, 0 Implemented, 24 Not started**;
- strict implemented-or-better parity **76/100**;
- regression stability **75/100**.

These values are provisional until the exact final bookkeeping SHA passes a new complete accumulated workflow. The green functional run does not automatically verify changed bookkeeping commits.

## Exact next executable sequence

1. Treat the final tip of `feature/v3-ministry-hub` after bookkeeping/status/handoff updates as the exact clean #76 bookkeeping candidate.
2. Create/use an isolated one-shot verification branch only to trigger GitHub Actions; its workflow must explicitly checkout and assert that exact bookkeeping candidate SHA.
3. Execute the complete accumulated architecture, edge/security and browser/mobile suite without removing or weakening prior coverage.
4. If any phase fails, leave v3.48 frozen/current, identify the exact root cause and verify a corrected new SHA.
5. If fully green, remove/restore the temporary trigger state and create immutable `release/v3.49-ministry-hub` at exactly the verified bookkeeping SHA.
6. Only after v3.49 freeze, recover #77 Notification Center/inbox from retained evidence before implementation.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- Normal Actions remain `workflow_dispatch` only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.