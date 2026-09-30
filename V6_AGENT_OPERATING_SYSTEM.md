# BibleQuest V6 Agent Operating System

Updated: 2026-09-30 JST
Authority: operational coordination for autonomous/manual V6 work
Repository: `11ll11l1l1l/BibleQuest`
Integration branch: `v6/architecture-upgrade`

## Purpose

This document is the durable coordination contract for every BibleQuest V6 worker, scheduled task, and manual ChatGPT instance. It exists because prior agent runs fired on schedule but frequently produced analysis without integrated development, stale handoffs, duplicated work, or work stranded on branches.

Every V6 worker MUST read this file before selecting work. Repository truth overrides chat memory, old task prompts, old issue comments, or prior summaries.

Project authority remains:
1. `V6_ACTIVE_STATUS.md` — current V6 state and blockers.
2. `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — release acceptance inventory.
3. `DEVELOPMENT_PLAN_V6.md` and accepted ADRs — architecture and intended end state.
4. This file — autonomous/manual execution and coordination rules.
5. `V6_AGENT_TASK_BOARD.md` — current prioritized work queue and durable handoff.

A different ChatGPT conversation may safely continue V6 by reading these files plus live GitHub state. No private chat context is required.

## Core objective

The primary objective is to reduce V6 release work by producing safe integrated implementation and valid acceptance evidence.

A run is productive when it leaves at least one durable artifact that materially advances an unchecked acceptance item:
- a code/test/document commit on a discoverable V6 worker branch;
- a reviewable PR;
- a merged PR;
- exact evidence that legitimately allows one or more checklist rows to become PASS;
- a root-cause repair that removes the final blocker for one named row.

A status report, branch inspection, CI monitoring, or restatement of blockers by itself is not productive work.

## Execution architecture

Use five roles. Four are implementation workers. One is the integration/acceptance captain.

### W1 — Platform / PWA / Release Infrastructure
Primary lanes:
- build/deployment identity;
- built-output browser gates;
- Cloudflare exact-SHA verification;
- PWA/service-worker/update/offline lifecycle;
- push/browser/service-worker plumbing;
- CSP, client artifact security, dependency gates;
- lazy-loading and bundle/performance enforcement.

### W2 — Tenant / Database / Auth / Ministry Security
Primary lanes:
- explicit active-congregation scope;
- cross-congregation denial;
- RLS/pgTAP and Edge Function authority;
- Member/Leader/Pastor/Admin role behavior;
- ministry/admin server authority;
- session freshness/revocation/re-auth;
- safe membership/provisioning/role management;
- assignment target/reminder authorization.

### W3 — Reader / BSB Audio / Offline Content
Primary lanes:
- Reader content engine;
- BSB audio source/text identity;
- verse timing/alignment;
- current-verse highlight, tap-to-seek, auto-scroll;
- playback resilience and background behavior where browser-testable;
- offline Scripture/audio package controls, checksums, versioning and removal;
- search/Verse Peek/Japanese pipeline resilience;
- content and licensing/provenance safeguards.

### W4 — UI Platform / Accessibility / i18n / Performance
Primary lanes:
- shared components/design primitives;
- icon/art registry;
- structured i18n for migrated surfaces;
- built-artifact accessibility automation;
- keyboard/focus/mobile regression;
- 320/360/390/412/430 behavior;
- representative design/runtime platform closure;
- payload/lazy-load work not owned by W1.

### IC — Integration / Acceptance Captain
Primary lanes:
- serialize work;
- discover worker branches/PRs;
- validate exact-head evidence;
- merge safe non-overlapping work;
- repair small merge/integration blockers;
- update `V6_ACTIVE_STATUS.md`, checklist, and `V6_AGENT_TASK_BOARD.md`;
- convert implemented/proven work into legitimate checked rows;
- never inflate acceptance from insufficient evidence.

The IC should not consume an entire run merely coordinating. If no worker artifact is ready, it must take one bounded acceptance/evidence/repair item itself.

## Mandatory start-of-run protocol

Every worker and manual V6 chat instance must:

1. Fetch exact current `v6/architecture-upgrade` HEAD.
2. Read:
   - `V6_ACTIVE_STATUS.md`;
   - `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`;
   - `V6_AGENT_TASK_BOARD.md`;
   - this file;
   - relevant portions of `DEVELOPMENT_PLAN_V6.md` and accepted ADRs.
3. Count checklist `[x]` and `[ ]` directly. Never trust an old percentage in a prompt.
4. Inspect open/recent V6 PRs and worker branches.
5. Treat open PRs and branches newer than integration as active ownership signals.
6. Identify one primary task and at least two fallbacks before doing substantial work.
7. Re-fetch integration and target files immediately before the first write.

Do not assume a PR/branch mentioned in this file is still current. Live GitHub state wins.

## Ownership and collision rules

The system intentionally allows flexibility while preventing duplicate edits.

1. A worker's lane is a bias, not a prison. If its primary task is blocked or already owned, it must take the highest-value unowned task it can safely complete.
2. Before editing, inspect open PRs and worker branches for overlapping files/contracts.
3. Do not modify the same runtime owner concurrently when another worker has an active, newer branch/PR.
4. Tests may overlap only when they exercise different contracts or the later worker is explicitly repairing the earlier branch.
5. If overlap appears after work started:
   - re-fetch integration;
   - keep only non-duplicated value;
   - abandon/recreate the branch from current integration if semantic reconciliation is unsafe.
6. Never overwrite a newer integrated change to preserve an older worker branch.
7. The IC is the only role expected to serialize multiple worker artifacts into integration.

## Branch and handoff contract

Workers do not depend on Issue #452 comments for coordination.

Preferred branch names:
- `agent-v6-w1/<short-task>-YYYYMMDD`
- `agent-v6-w2/<short-task>-YYYYMMDD`
- `agent-v6-w3/<short-task>-YYYYMMDD`
- `agent-v6-w4/<short-task>-YYYYMMDD`
- `agent-v6-ic/<short-task>-YYYYMMDD`

Rules:
- Start each new coherent tranche from exact current integration HEAD.
- One active coherent branch/PR per worker unless a second independent branch is necessary while CI is pending.
- A PR is preferred but is not required for the work to be discoverable. If PR creation is blocked, push the branch/commit and record the branch/SHA in the run output. The IC must discover and process it.
- Do not use a failed GitHub comment as a reason to stop.
- Do not require another chat instance to know hidden conversation state.

## Non-idle / recovery ladder

A worker may not end merely because the first task is blocked.

When blocked:
1. Retry one transient/stale-reference failure after re-fetching.
2. If mutation is blocked, preserve any branch commit possible and move to a task that uses permitted mutations.
3. If local Chromium/Docker/Supabase tooling is unavailable, use repository tests or GitHub CI where appropriate.
4. If CI is running, work on an independent non-overlapping fallback instead of waiting.
5. If physical-device or production-only evidence is required, mark that specific evidence gap and immediately switch to another open row.
6. If an external provider is temporarily unavailable, preserve correct failure handling and move to another task.
7. Scan at least three safe open items before declaring no actionable work.

`BLOCKED` is valid only when no safe useful implementation/evidence task remains after this recovery ladder.

## Evidence hierarchy

Never promote a checklist row with weaker evidence than the row requires.

Evidence classes:
- STATIC: source inspection, lint, typecheck, format, contract scans.
- UNIT: deterministic unit/integration tests without a browser/backend.
- BUILT-BROWSER: Chromium/browser tests against built V6 output.
- DATABASE: disposable real Postgres/Supabase/pgTAP/RLS execution.
- EXTERNAL-LIVE: live third-party service behavior where required.
- DEPLOYED: exact deployed artifact/route identity.
- PHYSICAL-DEVICE: installed PWA/push/background behavior on actual supported devices.

Static/unit evidence cannot substitute for DATABASE, DEPLOYED, or PHYSICAL-DEVICE requirements.

## Coding rules

- Work only on V6 unless the user explicitly authorizes another line.
- Never modify or deploy `main`/production without explicit user authorization.
- Preserve V5/V6 certified behavior unless an accepted V6 contract intentionally supersedes it.
- Fix root causes, not visible symptoms.
- Add focused regression coverage for demonstrated bugs.
- Do not weaken tests, RLS, authorization, CSP, privacy, secret handling, or content/license safeguards to obtain green CI.
- Tenant-sensitive calls must fail closed without a valid active congregation.
- Server RLS/Edge Functions remain authoritative for protected operations.
- Privileged/destructive/auth/admin actions must not be blindly queued offline.
- Never fabricate Scripture text, translation equivalence, theological consensus, licensing rights, browser results, device results, or deployment results.
- Keep audio/media provenance explicit.
- Use compatibility seams rather than broad rewrites when a bounded migration is safer.

## Acceptance update rules

Only change `[ ]` to `[x]` when the full row is proven.

When a row is promoted, record:
- exact integration or PR head SHA;
- relevant workflow/test evidence;
- evidence class;
- any limitation that remains outside that row.

The checklist itself is the numeric source of truth. Recount it after every promotion.

Do not create a new checklist row merely to claim progress. Do not split a broad row after the fact to manufacture a higher percentage.

## IC integration algorithm

For each IC run:
1. Re-fetch integration HEAD.
2. Discover open/recent worker PRs and worker branches ahead of integration.
3. Rank artifacts by:
   - release blocker impact;
   - number of open rows unblocked;
   - low collision risk;
   - evidence maturity;
   - small review surface.
4. Validate the artifact's base/head and required tests.
5. Merge only one overlapping runtime stream at a time.
6. Re-fetch integration after every merge.
7. Rebase/recreate stale worker work when needed; do not blindly merge stale branches.
8. Immediately reconcile checklist/status/task board when evidence closes a row.
9. If no artifact is mergeable, repair the smallest blocker or take a bounded evidence task itself.

## Worker success standard

At the end of each run, a worker must report:
- integration start SHA;
- selected checklist row(s);
- primary task and fallbacks considered;
- branch/commit/PR produced;
- files/contracts changed;
- tests actually executed and results;
- CI started/observed with run IDs when available;
- whether the target row is IMPLEMENTED, EVIDENCE-READY, READY-FOR-PASS, MERGED, VERIFIED, or still blocked;
- exact next step.

A run with zero code/evidence artifact must explain which three fallback items were attempted and why each was unsafe or impossible.

## IC success standard

At the end of each IC run, report:
- integration start and end SHA;
- checklist before/after;
- PRs/branches processed;
- rows closed;
- exact evidence used;
- stale/abandoned branches;
- next work assigned by lane.

## Current known unfinished categories

Always verify live checklist first. As of creation of this document, high-value remaining categories include:
- built-output/deployment exact-SHA verification;
- aggregate cross-congregation denial and sensitive-repository tenant closure;
- BSB audio identity/alignment/highlight/seek/autoscroll/offline and supported background behavior;
- app/SW/content-pack safe upgrades and installed-PWA field proof;
- assignment assigned/due push and physical push proof;
- Leader Center DB + browser role/cross-tenant closure;
- re-auth/CSP/MFA-or-passkey/security-advisor closure;
- shared components/icons/i18n/accessibility automation;
- lazy-loading/payload closure;
- final RC, field evidence, production promotion and rollback verification.

The exact current queue is maintained in `V6_AGENT_TASK_BOARD.md`.

## Manual chat-instance protocol

When a user opens a different chat and says "continue BibleQuest V6":
1. Do not ask them to restate prior work.
2. Read the four authority files listed at the top of this document.
3. Inspect current integration/open PRs/worker branches/CI.
4. If the IC stream is active, avoid directly editing its owned integration surface; take an unowned worker task or help land a ready artifact.
5. Follow the same branch, evidence, non-idle and handoff rules as scheduled workers.
6. Update durable repository state so the next chat does not depend on this conversation.

## Maintenance of this operating system

The IC owns routine updates to this document when the workflow itself changes. Ordinary task progress belongs in `V6_AGENT_TASK_BOARD.md`, not here.

If an agent repeatedly produces analysis without durable progress, stalls on one blocker, duplicates work, or fails to hand off discoverably, change the operating contract or its scheduled prompt. Do not merely increase prompt length.
