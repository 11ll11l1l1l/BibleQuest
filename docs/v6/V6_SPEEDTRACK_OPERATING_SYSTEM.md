# V6 Speedtrack Operating System

Status: ACTIVE until Phase 12 production closeout  
Integration branch: `v6/architecture-upgrade`  
Production: released V5 until explicit V6 promotion

## Objective

Move V6 from the current evidence checkpoint to a certified release with five concurrent but non-colliding lanes. Optimize verified acceptance closure, not commit count or raw feature volume.

## Source-of-truth order

1. Repository branch/commit and completed CI evidence.
2. `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.
3. `V6_ACTIVE_STATUS.md`.
4. `DEVELOPMENT_PLAN_V6.md` and accepted ADRs.
5. This operating system and the live board below.
6. Chat reports, which are non-authoritative when stale.

## Agent lanes and protected ownership

| Lane | Primary outcomes | Protected paths / decisions | May not change alone |
|---|---|---|---|
| S1 Platform/CI/PWA | deterministic deployable app, PWA shell, build ownership, performance and observability | `package*.json`, `.nvmrc`, `vite.config.mjs`, `tsconfig.json`, `.github/workflows/**`, root PWA files, global assets/styles, service workers, build scripts | schema/RLS, feature data authority, Scripture licensing |
| S2 Data/Security/Tenant | executable DB safety, RLS, auth/admin and cross-tenant proof | `supabase/**`, generated database types, database security evidence | client UI ownership, global router/SW |
| S3 App Features | complete product workflows outside Reader; role-aware feature UX | feature/app modules for Games, Leader, Ministry, Admin, Assignments, Calendar, Community and their scoped styles/tests | schema/RLS, Reader internals, global build/SW |
| S4 Reader/Content/Delivery | Reader/offline Scripture, Media and notification delivery UX | Reader/content/media/notification modules, scoped styles/tests, content manifests and licensing evidence | schema/RLS, global build/SW, server authorization |
| S5 Integration/Reporter | one green integration stream and truthful release state | `V6_ACTIVE_STATUS.md`, acceptance checklist, speedtrack board, integration-only test plumbing and collision resolution | broad feature implementation or weakening gates |

When one deliverable requires two lanes, define the contract first. The producer lands before the consumer rebases. Examples: S2 database RPC before S3 UI; S1 service-worker contract before S4 offline/push client; S4 Reader event before S3 progress presentation.

## Work selection

Each lane selects work in this order:

1. Restore a red integration or release gate caused by current V6 work.
2. Finish and merge an already-started, current-head tranche.
3. Close a release-blocking checklist item in the active phase.
4. Close a dependency that unlocks multiple later checklist items.
5. Add missing exact-head evidence for implemented behavior.

Do not start attractive lower-priority features while a red integration gate or stale merge blocks the stream.

## Branch, claim and collision protocol

- Branch from the fetched exact `origin/v6/architecture-upgrade` head.
- Use one bounded branch and one PR per lane.
- Before the first edit and before every push, list open V6 PRs and compare changed paths.
- Shared files are serialized: bootstrap/router, global CSS, service workers, workflows, generated DB types and authoritative status files.
- A claim is valid only while the branch is active and updated. A stale branch must rebase and rerun its gates; old green CI is not transferable.
- Never merge two PRs based on the same old head without rebasing the later one and rerunning affected gates.
- S5 chooses merge order based on dependency, overlap and risk. Recommended default: regression repair → schema/server producer → platform contract → client consumers → documentation/evidence.

## Definition of done for a tranche

A tranche is merge-ready only when all are true:

- scope and owned paths are explicit;
- implementation is complete with no placeholder success states;
- focused unit/static tests pass;
- applicable build, DB, inherited regression and browser gates pass on the exact PR head;
- security, tenant, localization, accessibility and mobile implications are addressed;
- no privileged secret or copyrighted content is introduced improperly;
- the PR is current with the integration head and collision-free;
- acceptance impact cites exact evidence and does not overclaim device or authenticated coverage.

## Evidence levels

- **CODED:** implementation exists; no acceptance credit.
- **STATIC:** source/contract validation passed.
- **UNIT:** isolated executable behavior passed.
- **BUILD:** deployable artifact and build contract passed.
- **BACKEND-E2E:** disposable or controlled database behavior passed.
- **BROWSER:** rendered browser flow passed for the stated roles/viewports.
- **DEVICE:** physical installed-PWA/push/offline behavior passed.
- **RELEASE:** exact promoted SHA passed all required gates and post-deploy smoke.

An acceptance checkbox is checked only when its required evidence level is satisfied. Percent complete is `checked / total`; also report coded-but-uncertified work separately so progress never appears frozen or inflated.

## Mandatory agent handoff

Every agent update must include:

```text
Lane / task:
Base SHA -> head SHA:
PR:
Changed paths:
Completed behavior:
Evidence and run IDs:
Checklist items newly proven:
Collisions checked:
Remaining risks/blockers:
Next executable task:
```

After sending the update, continue the next executable task unless a stop condition in `AGENTS.md` applies.

## Release gates

S5 may create a release candidate only after:

1. all release-blocking checklist items are checked with exact evidence;
2. Phase-1 build, Database CI and inherited regression are green on one exact SHA;
3. Member, Leader, Pastor and Admin protected workflows have authenticated browser evidence;
4. required mobile widths, accessibility and supported languages pass;
5. installed PWA, offline Bible and push have required physical-device evidence;
6. security/advisor findings are triaged and no privileged secrets ship;
7. Cloudflare preview identity matches the candidate SHA;
8. rollback reference and post-deploy smoke plan are ready.

## Live five-lane queue

S5 updates this table after every merge or material failure. Other agents may update only their own `Current task` and `PR/head` cells without changing acceptance claims.

| Lane | Current task | Dependency | PR/head | State |
|---|---|---|---|---|
| S1 | Platform/build/PWA hardening integration | current integration head | PR #549 | IN REVIEW |
| S2 | Live Room tenant/RLS hardening integration | current integration head | PR #549 | IN REVIEW |
| S3 | Calendar/Notification account-switch isolation integration | current integration head | PR #549 | IN REVIEW |
| S4 | Reader/content/offline tranche integration | current integration head | PR #549 | IN REVIEW |
| S5 | Repair PR #549 inherited More icon regression; rerun all gates; merge only when green | PR #549 exact head | PR #549 | ACTIVE |

## Immediate post-#549 priorities

1. Reconcile authoritative status/checklist to the merged exact head and verified evidence.
2. Finish Reader download/storage controls and network-disabled restart/navigation proof.
3. Complete server/client push delivery use cases and physical-device certification.
4. Start Games engine characterization and shared deterministic contracts.
5. Start Media provider adapter, lifecycle and one-audible-session policy.
6. Migrate Leader/Ministry/Admin workflows with role and cross-tenant browser/database proof.
7. Add offline mutation allowlist/outbox/idempotency/conflict policy.
8. Complete multi-congregation switch, cache invalidation and domain isolation.
9. Finish design-system/i18n/accessibility and observability/performance gates.
10. Assemble one exact Phase-12 release candidate and perform promotion/post-deploy proof.

