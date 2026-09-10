# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-workspace`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint: `release/v3.50-notification-center` at `fd2409003443f29408342836ae4186a83ed4180b`.
- Exact v3.50 bookkeeping verification run: `34463982926`, complete accumulated architecture, edge/security and browser/mobile suite green against the frozen SHA.
- Safety refs remain untouched.

## Current progress represented by the #78 bookkeeping transaction

| State | Count |
|---|---:|
| Regression-tested | 77 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 22 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping transaction is **78/100**.
Official regression stability represented by this bookkeeping transaction is **77/100**.

These values are provisional until the exact final #78 bookkeeping SHA passes a new complete accumulated gate and is frozen. No PASS transfers from the functional SHA to a changed bookkeeping SHA.

Current leading rows:
- #76 Ministry Hub — Regression-tested.
- #77 Notification Center/inbox — Regression-tested because it survived the complete #78 functional suite.
- #78 Workspace — Verified by exact functional candidate `2d17dce1dbbe129cfd2470408bb7d4dd496918f3` in complete run `34465383981`.
- #79 Linked activities/challenges — next non-deferred inventory row after #78 release closure.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #78 Workspace — functional gate complete

The milestone is intentionally bounded to the authoritative inventory contract: **open; save state; role/session boundary**.

Recovered and verified behavior:
- one native Workspace route composed by the existing bootstrap/router;
- `src/app/workspace.js` is an orchestration owner, not a second Notes or database owner;
- verified Cloud Notes remains the sole cloud-note data owner and Reader remains the Scripture navigation owner;
- signed-out state fails closed and does not load private remote Workspace content;
- congregation membership and roles are projected through the existing verified membership owner; ministry roles do not gain cross-user Workspace access;
- persisted Workspace state is deliberately bounded to version/view UI context and excludes note text, search terms, account IDs, congregation IDs and authentication material;
- the retained v2 direct-table bookmark/highlight behavior was not copied because an authoritative retained schema/RLS contract for those writes was not established during recovery;
- the Workspace UI can open Cloud Notes, search the already loaded private note projection, and hand a Scripture-linked note to the existing Reader owner;
- no schema, migration, RLS, grant, RPC, Edge Function or production-system change was introduced.

Permanent #78 coverage:
- `scripts/validate-v3-workspace.mjs` — architecture, ownership, persistence and workflow boundary validation;
- `tests/v3-workspace-edge.mjs` — session, role, storage, private-note projection and Reader delegation boundaries;
- `tests/v3-workspace-smoke.mjs` — real route plus 390px browser/mobile opening, navigation, state and overflow coverage;
- `.github/workflows/v3-regression.yml` invokes all three while retaining the complete prior accumulated suite.

Exact functional retry candidate `2d17dce1dbbe129cfd2470408bb7d4dd496918f3` passed run `34465383981`. The isolated verification workflow explicitly checked out and asserted that exact SHA; exact-SHA assertion, accumulated architecture validators, all edge/security regressions and the full browser/mobile regression suite all completed successfully.

## Defect / root-cause ledger

The #78 functional gate had one verification-contract correction without weakening application behavior or regression coverage:
- The first exact functional run expected the literal phrase `Workspace UI/context state` in the new architecture validator, while the recovered contract expressed the same boundary as `only new persisted Workspace state`. The validator was corrected to assert the actual authoritative contract wording, and the complete suite reran green on a new exact candidate SHA.

Earlier milestone defect regressions remain retained in the accumulated suite.

## Next major milestone

The immediate release gate is #78 bookkeeping and freeze; #79 must not be treated as verified early.

1. Treat the final #78 bookkeeping/status transaction on `feature/v3-workspace` as a new exact clean candidate.
2. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated architecture, edge/security and browser/mobile suite.
3. If any phase fails, do not freeze; identify the exact root cause, preserve all prior coverage and rerun a corrected exact SHA.
4. If fully green, restore/remove temporary verification trigger state and create immutable `release/v3.51-workspace` at that exact green bookkeeping SHA.
5. Only after v3.51 is frozen should #79 Linked activities/challenges write work begin.
6. #79 must reuse the existing assignment visibility, start/completion-response and route owners rather than introducing a second authorization or completion path.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
