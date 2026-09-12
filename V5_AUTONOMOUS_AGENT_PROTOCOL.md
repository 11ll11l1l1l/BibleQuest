# BibleQuest V5 Autonomous Coding Protocol

Updated: 2026-09-13 JST
Authority: `V5_ACTIVE_STATUS.md`
Program tracker: Issue #185
Integration branch: `v5/architecture-upgrade`

## Purpose

BibleQuest V5 may be developed by five scheduled autonomous coding agents running once per hour. The objective is high coding throughput without sacrificing repository correctness, privacy/security contracts, CI evidence, or recoverability.

This protocol replaces the old V4 read-only investigator model for these five agents. It does not authorize uncontrolled parallel edits, direct production changes, or direct writes to `main`.

## Operating model

There are four coding workers and one integration/dispatch captain.

- A1 — Build / Client Architecture / UI Platform
- A2 — Database / Security / Supabase CI
- A3 — PWA / Offline / Media / Notifications Platform
- A4 — Testing / Reliability / Refactor Safety
- A5 — Integration / Dispatch / Release-Control Captain

All five run hourly, staggered through the hour. Each run performs at most one coherent bounded coding tranche plus validation and handoff.

## Hard boundaries

1. Never commit runtime/database/workflow code directly to `main`.
2. Workers never commit directly to `v5/architecture-upgrade`; they use isolated branches and PRs targeting that integration branch.
3. A5 is the only scheduled agent allowed to merge worker PRs into `v5/architecture-upgrade`.
4. No scheduled agent may merge V5 runtime work to `main`, deploy production, change Cloudflare production settings, or mutate production Supabase data/configuration.
5. Repository migrations and Edge Function source may be developed, but production application/deployment is manual unless a later explicit authority document changes this rule.
6. Never weaken or delete a valid regression/security/privacy/database assertion merely to obtain green CI. Replace a test only when an accepted V5 ADR deliberately changes the contract and equivalent-or-stronger proof is added.
7. Never fabricate field/device/database evidence. A skipped or unavailable environment is not a PASS.
8. Secrets, privileged tokens, service-role keys, recovery credentials, private reflections, and sensitive user content must never be written to repo files, PR text, issue comments, test fixtures, logs, or task output.

## Hourly task lease

Before any code write, a worker must inspect:

- current `v5/architecture-upgrade` HEAD;
- open PRs targeting it;
- Issue #185 and recent comments;
- `V5_ACTIVE_STATUS.md`;
- `DEVELOPMENT_PLAN_V5.md`;
- this protocol;
- relevant accepted/proposed ADRs and tests.

The worker then claims exactly one bounded task by adding an Issue #185 comment in this form:

`V5-LEASE | agent=A# | task=<stable short id> | base=<integration SHA> | files=<expected ownership paths> | expires=<ISO timestamp about 70 minutes later>`

A lease is active until its expiry unless the same agent posts `V5-LEASE-DONE`, `V5-LEASE-BLOCKED`, or `V5-LEASE-RELEASED` for that task.

Workers must not claim a task whose expected files/ownership materially overlap an active lease or an open PR unless the existing owner explicitly handed it off.

If an old lease is expired, the next worker may reclaim only after re-checking whether a branch/PR/write actually exists.

## Branch and PR rules

Worker branch naming:

`agent-v5-a<agent-number>/<task-id>-<YYYYMMDDHH>`

Every worker branch starts from the latest verified `v5/architecture-upgrade` HEAD at claim time.

Every coding run should end in one of four states:

1. PR OPEN — coherent implementation + tests completed; PR targets `v5/architecture-upgrade`.
2. PR UPDATED — existing owned PR advanced safely after rebasing/reconciling current integration state.
3. BLOCKED — task cannot proceed safely; lease is released and exact blocker recorded.
4. NO SAFE TASK — no non-overlapping task fits the current phase; perform read-only triage and report why.

Do not leave uncommitted conceptual work represented as completed.

## Dynamic work selection

Each worker has a primary lane, but the pool uses controlled work stealing.

A worker selects work in this order:

1. finish or repair its own open PR if still the highest-priority safe work;
2. current active V5 phase exit-gate blockers;
3. primary-lane tasks for the active phase;
4. any unclaimed task from the current or immediately enabling next phase that does not overlap another owner;
5. characterization tests, architecture maps, migration harnesses, CI/reliability improvements that reduce risk for blocked work.

A worker must not jump ahead to a glamorous later feature if an earlier phase gate is still materially incomplete, unless the later task is explicitly independent and required to unblock the earlier phase.

External/manual blockers should not cause repeated no-op runs. Record the blocker once, release the lease, and take another safe task.

## Parallelism rule

Parallel work is allowed only when ownership is demonstrably non-overlapping.

Examples that may run concurrently:

- A1 building Vite/TypeScript shell while A2 adds local Supabase CI scaffolding;
- A4 adding characterization tests against untouched runtime areas while A3 inventories service-worker/media boundaries;
- separate documentation/ADR work that does not rewrite a shared authority file simultaneously.

Examples that must be serialized:

- two agents editing `bootstrap.js` or the same router/session owner;
- two agents changing the same migration chain or RLS policy family;
- service-worker and offline storage changes that depend on the same cache/version contract;
- Reader decomposition while another PR changes Reader state/data ownership;
- integration/status authority updates.

When uncertain, serialize.

## Validation minimum for every PR

A worker must run or inspect the strongest available validation relevant to its change. At minimum:

- syntax/type/build validation where applicable;
- focused tests for the changed contract;
- inherited architecture/security/privacy checks touched by the change;
- accumulated regression when the change crosses shared runtime boundaries;
- real database integration tests once Phase 2 introduces them;
- browser/PWA checks when routing, layout, service worker, offline, media, notifications, or session behavior changes.

PR descriptions must state exact base SHA, files/owners changed, root cause/goal, tests run, tests not run and why, known risks, migration/rollback notes, and whether any production behavior/configuration was intentionally untouched.

## Integrator A5 rules

A5 runs after the four coding workers each hour.

A5 must:

1. inspect current integration HEAD and all open worker PRs;
2. reject/hold overlapping or stale-base PRs until reconciled;
3. verify required checks and review diffs for contract/ownership violations;
4. merge at most the coherent set that can safely coexist, one PR at a time;
5. re-check integration HEAD and CI after each merge before merging a dependent/overlapping PR;
6. update `V5_ACTIVE_STATUS.md` only when a phase/blocker/candidate materially changes;
7. maintain Issue #185 queue/lease hygiene;
8. create narrowly scoped integration fixes when needed, but not compete with worker feature ownership;
9. never merge V5 runtime work to `main` or deploy production.

If integration becomes red, A5 stops merging new feature PRs and prioritizes rollback/revert/root-cause repair on the integration branch.

## Fail-closed conditions

An agent must stop that task and avoid code changes when it encounters:

- unresolved conflicting ownership or concurrent changes in the same files;
- a security/privacy interpretation that could expose cross-user or cross-congregation data;
- destructive or irreversible database action;
- missing credentials required for safe verification;
- need for production-only validation that cannot be reproduced safely;
- unclear licensing/copyright rights for Bible content;
- failing inherited tests whose root cause is not understood;
- a proposed workaround that bypasses authorization/RLS/session boundaries;
- a migration whose rollback/data-conversion behavior is not understood.

The agent should release the lease, record the blocker, and choose another safe task if possible.

## Automatic pause conditions

A5 should recommend pausing the five-agent program, and workers should perform only read-only diagnosis, if any of these occur:

- integration branch remains red for two consecutive captain cycles;
- repeated cross-agent conflicts affect the same owner twice within six hours;
- a worker merges or writes outside its allowed boundary;
- unexplained production/main drift appears;
- security/privacy regression is detected;
- more than three stale/abandoned worker PRs accumulate;
- CI infrastructure is unavailable long enough that changed contracts cannot be verified.

The human user may explicitly override/pause/resume at any time.

## Phase behavior

### Phase 0

Agents may finalize ADRs, ownership map, baseline characterization and automation infrastructure.

### Phase 1

Primary focus: Vite, package manager, TypeScript-capable build, source layout, tests, deterministic production artifacts and compatibility bridge.

### Phase 2

Primary focus: checked-in Supabase local config, migration replay, deterministic seed topology, real RLS/privilege/function assertions and generated DB types.

### Phase 3+

Agents continue through `DEVELOPMENT_PLAN_V5.md` in dependency order. A5 may dynamically rebalance lanes as architecture ownership becomes clearer, while preserving lease/non-overlap rules.

## Success metric for the trial

The five-agent model is considered effective when, over repeated hourly cycles:

- useful PR throughput increases without direct-main or production changes;
- merge conflicts remain rare and bounded;
- inherited gates stay green;
- Phase exit criteria close with exact evidence;
- stale/no-op cycles are minimized through work stealing;
- defects introduced by automation are caught before integration/production;
- repository authority files remain coherent.

Throughput is secondary to correctness. Five agents producing five conflicting patches is failure; five agents producing two safely merged, well-tested tranches plus three useful unblocking investigations is success.