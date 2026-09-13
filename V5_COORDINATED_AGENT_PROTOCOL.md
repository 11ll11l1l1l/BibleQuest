# BibleQuest V5 Coordinated Agent Protocol

Updated: 2026-09-13 JST
Authority: `V5_ACTIVE_STATUS.md`
Program tracker: Issue #185
Shared integration branch: `v5/feature-completion`

## Purpose

Five scheduled agents collaborate on one BibleQuest V5 product. V5 is **feature completion on the current proven architecture**. V6 owns the engine/architecture replacement. V7 owns the full overhaul using that engine.

The agents may work in parallel only where true ownership does not overlap. Integration remains serialized and auditable.

## Roles

- **A1 — Leader / Ministry / product flows**: Leader Center and composition over existing Assignments, Congregation, Journey Groups, Team Center and presence owners.
- **A2 — Admin / Supabase / security-sensitive completion**: Admin Console UI, account recovery/email-change action, security/authorization evidence and controlled test-account verification.
- **A3 — Notifications / offline / congregation context**: minimum Web Push, baseline offline Scripture behavior, second test congregation and active-congregation switcher.
- **A4 — Artwork / Reader / Couples / regression debt**: icon/artwork completion, dead Media Library cleanup, CEBOCB re-verification, Couples Journey verification, whole-app Sections E/G and supporting regression coverage.
- **A5 — Integration / dispatch / release-control captain**: reviews PRs, serializes merges, prevents overlap, tracks gates and coordinates exact-SHA checkpoints. A5 may make narrow integration-only fixes when no worker owns the problem.

## Work claiming

Before writing code, A1-A4 post one bounded claim on Issue #185:

`V5-CLAIM | agent=A# | phase=P# | task=<short-id> | base=<integration-sha> | owners=<files/symbols> | dependencies=<none-or-list> | expires=<~70m>`

Rules:

1. One active claim per worker.
2. Re-fetch `v5/feature-completion`, open PRs and recent claims immediately before writing.
3. Do not claim a true owner already covered by another active claim or unmerged PR.
4. If blocked, release the claim and choose another independent V5 task rather than waiting repeatedly.
5. Later-phase work may proceed early only when it is demonstrably independent and does not consume an owner needed by the active earlier phase.

## Branch and PR model

- Fresh short-lived branch from the current `v5/feature-completion` HEAD.
- Naming: `agent-v5-a#/p<phase>-<task>-<YYYYMMDDHH>`.
- PR base: `v5/feature-completion`.
- Workers do not commit runtime/database/workflow changes directly to `v5/feature-completion` or `main`.
- A5 merges at most one overlapping/dependent change at a time and re-fetches the integration state between merges.
- Stale branches are rebased/recreated rather than force-merging conflicting ownership.

## V5 scope firewall

Allowed: finish the already-scoped V5 features using established V4/current-architecture patterns.

Not allowed in V5:

- Vite/build-system migration;
- global state or router replacement;
- Reader or Games engine rewrite;
- broad TypeScript/platform conversion;
- new multi-instance media engine;
- full offline package/sync engine;
- general-purpose repository/data layer replacement;
- broad design-system engine replacement;
- app-wide overhaul, new navigation paradigm or full visual redesign.

If a V5 task exposes a real architecture limitation, record it for V6 instead of creating a temporary V5 architecture that will immediately be replaced.

## Validation

Every PR must identify exactly what evidence was run and what remains unexecuted.

Minimum expectations:

- focused tests for the changed behavior;
- current accumulated static/edge/architecture regressions for shared runtime or security-sensitive changes;
- browser smoke for user-visible routes;
- real backend/device evidence where the acceptance checklist explicitly requires it;
- no claim that a static/text match proves live RLS, push delivery or physical-device behavior.

Never weaken a valid test merely to obtain green status. If an old test legitimately encodes superseded intended behavior, replace it only with evidence for the new accepted V5 behavior.

## Integration controls

A5 holds a PR when any of these apply:

- active ownership overlap;
- stale base plus meaningful intervening changes;
- unexplained inherited regression;
- privacy/auth/RLS ambiguity;
- destructive or production-only operation without explicit necessity;
- pending required evidence;
- scope drift into V6 or V7.

If the shared integration branch becomes red, feature merges stop until root cause is identified and repaired or the responsible merge is reverted.

## Production boundary

Scheduled agents may prepare V5 and its release evidence, but must not independently promote V5 to `main`, publish production, or mutate production Cloudflare/Supabase configuration outside a narrowly required and explicitly governed field/release action. Production promotion remains a separate acceptance step.

## End of every run

Workers post one of:

- `V5-DONE` — coherent tranche finished/PR ready or updated;
- `V5-BLOCKED` — exact blocker and evidence;
- `V5-RELEASED` — claim released without code because another task is safer.

Include starting integration SHA, branch/PR, changed owners, tests/results, unresolved risk and next action.

A5 reports starting/ending integration SHA, merged/held PRs, active claims, current phase status and whether coordinated autonomous operation remains safe.

## Version handoff

V5 ends only after Phase 8 certification/promotion. At that point the exact accepted V5 production SHA becomes the mandatory starting baseline for V6. V6 must not begin from the old V4 cleanup SHA. V7 begins only after V6 engine certification.