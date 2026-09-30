# BibleQuest V6 Agent Task Board

Updated: 2026-09-30 JST
Integration branch: `v6/architecture-upgrade`
Operational contract: `V6_AGENT_OPERATING_SYSTEM.md`

## How to use this board

This is the durable priority queue for scheduled workers and manual ChatGPT instances.

At the start of every run:
- re-fetch current integration HEAD;
- recount the checklist directly;
- inspect open PRs and worker branches;
- remove/reword stale tasks as repository truth changes.

The numbers below are a snapshot, not an authority over the checklist.

## Current serialized checkpoint

Latest integrated runtime/evidence head before this documentation reconciliation: `0887bec6acf7ede4e7aff98fc1caf9b700b23ffe`.

Acceptance inventory after validated PR #845 reconciliation: **162 checked / 49 open / 211 total = 76.8%**.

Completed in this cycle:
- PR #842 integrated exact built-output browser acceptance evidence and closes `Whole-app/protected-route/browser gates run against built output.`
- PR #843 integrated safe app/service-worker/content-package upgrade regressions and closes `App/service-worker/content-pack versions can upgrade safely.`
- PR #845 integrated built-artifact accessibility automation and closes `Automated accessibility checks run on built artifacts.`
- stale draft PR #841 is superseded by the current reconciliation and must not be merged.

## P0 — work first

### W2-01 — Finish systemic explicit-tenant audit
Owner bias: W2
Checklist targets:
- Cross-congregation denial is tested for every sensitive migrated domain.
- Sensitive repository calls require explicit congregation context.
- Leader Center role/cross-congregation DB + browser rows.
Work:
- inventory sensitive domains from current source;
- identify remaining first-membership/default/unscoped reads or writes;
- implement smallest missing domain tranches;
- add two-congregation DATABASE evidence and relevant BUILT-BROWSER evidence;
- keep server authority primary.

### W3-01 — BSB audio text/chapter identity + alignment foundation
Owner bias: W3
Checklist targets:
- deterministic audio chapter identity to exact Reader BSB text;
- versioned timing/alignment manifest.
Work:
- define/complete deterministic book/chapter identity;
- version/checksum relation among text/audio/alignment;
- implement validation and tests;
- do not invent alignment data or rights.
This foundation should precede highlight/seek/autoscroll closure.

### W1-01 — Exact-SHA deployment identity
Owner bias: W1
Checklist targets:
- Cloudflare exact-SHA deployment identity from built artifacts;
- exact-SHA Cloudflare preview verification.
Work:
- inspect current fail-closed verifier and Pages configuration;
- implement repository-side build/deployment metadata seam if missing;
- add deterministic test/CI contract;
- if external Pages configuration is the only blocker, document it once and pivot to W1-02 in the same run.

## P1 — take when P0 item is owned/blocked

### W3-02 — BSB playback synchronization UX
Targets:
- current verse highlight during playback;
- tap verse -> seek;
- auto-scroll without blocking manual navigation/accessibility.
Prerequisite: W3-01 identity/alignment foundation.

### W3-03 — Offline content/audio safety
Targets:
- user-initiated removable offline downloads;
- exact-source checksum/version verification;
- bounded selective audio download;
- clear unavailable state for CORS/fetch limitations;
- safe app/SW/content-pack upgrade path.
Do not claim offline-copy rights until provenance permits it.

### W1-02 — Push assignment assigned/due path
Targets:
- assignment assigned/due push support;
- browser/service-worker push coverage.
Physical-device delivery remains a separate field gate.

### W2-02 — Privileged authorization hardening
Targets:
- privileged Owner/Admin re-auth review;
- session revocation/freshness;
- offline queue prohibition for privileged actions;
- relevant least-privilege checks.

### W2-03 — Security platform closure
Targets:
- leaked-password protection/equivalent decision with evidence;
- MFA/passkey evaluation with recovery implications;
- Supabase security-advisor triage.
Do not weaken custom auth or RLS merely to clear an advisor warning.

### W4-02 — Shared component/design primitives
Targets:
- common buttons/forms/dialogs/cards/status primitives;
- icon/art registry;
- structured i18n for migrated UI.
Choose bounded representative surfaces; V7 owns full redesign.

### W4-03 — Lazy loading / payload ownership
Targets:
- large Bible/game/media payloads not eagerly loaded;
- preserve route/bundle budgets.
Coordinate with W1 when CI/build tooling is involved.

## P2 — certification / field work after implementation is ready

- Physical installed-PWA offline acceptance.
- Physical-device push acceptance.
- Background/lock-screen media controls on actual supported devices.
- PiP provider/browser acceptance if not fully automatable.
- Critical physical/manual accessibility acceptance.
- Exact candidate field evidence.
- V4 -> V6 upgrade DB path and complete route/feature parity matrix.
- One exact V6 RC SHA across all gates.
- Exact candidate production promotion.
- Post-production exact-SHA route/PWA/offline/push smoke.
- Rollback reference verification.

Workers must not waste repeated runs on a P2 item that requires unavailable hardware or explicit production authorization. Record the dependency and pivot to an actionable P0/P1 item.

## Flexible fallback queue

If your lane's work is blocked or actively owned, select the highest-impact safe unchecked row you can materially advance. Priority:
1. release/security/tenant blockers;
2. implementation needed for an unchecked row;
3. missing strong evidence for already-implemented behavior;
4. regression/tooling that unlocks multiple rows;
5. release documentation reconciliation backed by exact evidence.

Avoid non-release-blocking polish while P0/P1 items remain.

## Integration discipline

The IC should keep this board current after meaningful merges:
- remove completed tasks;
- add newly exposed blockers;
- record exact new integration head and checklist count;
- note worker branch/PR waiting for integration.

Do not use this board as a substitute for the authoritative checklist.
