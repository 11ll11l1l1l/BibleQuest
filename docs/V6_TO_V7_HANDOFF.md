# BibleQuest V6 → V7 Handoff

Updated: 2026-10-04 JST  
Source branch: `v6/architecture-upgrade`  
Source integration SHA: `ca87ff5ea90bd9c409eb5ae2e8ba06adb7359288`

## Purpose

This is the concise handoff from the stabilized V6 codebase into future V7 development. It does not authorize a V6 production release, replace V6 release evidence, or change any acceptance result.

## Canonical V6 truth

Use these documents in this order:

1. `V6_ACTIVE_STATUS.md` — current V6 phase, exact candidate/evidence state, blockers and release boundary.
2. `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — release-blocking acceptance inventory.
3. `DEVELOPMENT_PLAN_V6.md` — V6 architecture and implementation contracts.
4. `docs/v6/` evidence and ADR material — durable certification, provenance and architecture evidence.

Historical checkpoints, agent task boards, chat handoffs and earlier starting-point documents are context only when they conflict with the sources above.

## V6 contracts V7 must preserve

- Server-side authorization remains authoritative. UI visibility is never authorization.
- Tenant-sensitive operations remain explicitly congregation-scoped and fail closed across congregation boundaries.
- Supabase migration history and shipped database contracts are append-only historical evidence; V7 must not rewrite shipped migrations.
- Offline/PWA behavior preserves safe version upgrades, bounded/selective downloads, conflict handling and fail-closed behavior for privileged mutations.
- Release identity remains exact-SHA based. Cloudflare/deployed-artifact verification and production verification remain separate from ordinary feature CI.
- Security, tenant-isolation, database-migration and release-certification tests are protected evidence, not cleanup targets.
- BSB audio provenance, source identity/checksums, timing/alignment manifests and Reader synchronization evidence are protected. V7 may extend presentation but must not silently replace these contracts.
- Existing V6 accessibility, localization, mobile, lazy-loading and performance contracts remain regression baselines unless V7 deliberately replaces them with equivalent or stronger evidence.

## V6 release boundary

V6 production promotion is outside V7 preparation. The frozen V6 candidate and remaining physical/human/post-production requirements are owned by `V6_ACTIVE_STATUS.md` and the acceptance checklist. Do not infer release authorization from this handoff and do not use a later documentation-only commit as a substitute release candidate.

## Approved V7 direction

`DEVELOPMENT_PLAN_V7.md` is the authority for V7 scope. Existing approved direction includes a product-wide UX transformation built on the V6 engine/contracts, plus the documented V7 media/file-storage direction. This handoff does not add feature decisions.

Implementation should begin from current integration only after V6 cleanup is complete enough to avoid carrying stale agent/status artifacts into V7.

## Known technical/documentation debt

- `DOCUMENTATION_INDEX.md` is stale and still describes older V4/V5 authority. It should be reconciled to point first to current V6 truth and then V7 planning.
- `docs/V6_STARTING_POINT.md` is a historical starting-state record and should be labeled as such rather than treated as current execution guidance.
- `V6_AGENT_TASK_BOARD.md` and historical status checkpoints contain useful execution history but may include superseded SHAs/counts. They must not override `V6_ACTIVE_STATUS.md`.
- Historical cleanup/agent branches and stale PRs should be removed or closed only after ancestry/unique-evidence checks.
- Documentation should consolidate into existing canonical files rather than creating additional rolling status documents.

## Repository conventions for V7

- Branch from the exact intended integration base and record that SHA in substantial handoffs.
- Keep changes bounded and reviewable; separate architecture/feature work from release evidence.
- Preserve fail-closed security and tenant boundaries.
- Never rewrite shipped migrations or provenance/evidence history to make a new implementation appear cleaner.
- Reuse or strengthen existing tests before deleting compatibility or regression coverage.
- Keep production deployment and release promotion explicitly authorized and separate from development integration.
- Prefer canonical plans/status/acceptance documents over agent-specific task logs.

## V7 activation checklist

Before broad V7 implementation:

- reconcile `DOCUMENTATION_INDEX.md`;
- label obsolete starting-point/task-board material as historical where appropriate;
- close or classify stale cleanup/agent PRs and branches without deleting unique evidence;
- retain V6 release/certification, BSB, security/tenant and migration evidence;
- start V7 work from one explicit, current base SHA and keep V6 release operations separate.

