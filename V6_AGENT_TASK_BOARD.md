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
- PR #931 is integrated at `1e481b12205718dd4b45ae1bfd53e0d8f7f2b461` from exact head `c634bf382b2f20eedc485550692756b0e5f37b68`; Client Artifact Security `36723086328`, Phase-1 `36723086331`, and inherited regression `36723086375` passed. Team Center is single-tenant at the repository boundary, and the deny-by-default inter-congregation sharing policy is now accepted. Acceptance target after reconciliation: **176 checked / 35 open / 211 total**. W2-01 continues with Live Rooms explicit scope and the complete sensitive-domain audit.

- PR #926 is integrated at `b92258a93140c06cc6f71c93ece487d711dbd6a5` from exact head `337e3f66a4cc172a50b95a8d4de51f9af66b6b8b`; Database CI `36721670165`, Phase-1 `36721669960`, and inherited regression `36721670124` passed. The Leader Center role-matrix and cross-congregation DB+browser rows are now counted. Current acceptance target: **175 checked / 36 open / 211 total**. W2-01 now continues with the broader all-sensitive-domain explicit-tenant audit rather than redoing Leader Center evidence.

- Captain reconciliation: merged #874 privacy evidence and #891 privileged-auth/MFA review evidence are now counted on current integration. Exact workflows: #874 Client Artifact Security `36707156920`, Phase-1 `36707156794`, inherited regression `36707156702`; #891 Phase-1 `36708011086`, inherited regression `36708010975`. Acceptance target after reconciliation: **172 checked / 39 open / 211 total**.


Latest integrated runtime/evidence head before this documentation reconciliation: `b2786b8c742220427f1d41fc343b84089a9130fa`.

Acceptance inventory after PR #867 and the PR #649 offline-replay evidence reconciliation: **164 checked / 47 open / 211 total = 77.7%**.

Completed in this cycle:
- PR #867 reconciled exact built-artifact accessibility and heavyweight lazy-loading evidence into the official checklist.
- PR #649 exact-head Phase-1 `36157859026` + inherited regression `36157858952` prove privileged/destructive/auth/admin operations are rejected from blind offline replay; the duplicate cross-cutting row is now counted.
- PR #842 integrated exact built-output browser acceptance evidence and closes `Whole-app/protected-route/browser gates run against built output.`
- PR #843 integrated safe app/service-worker/content-package upgrade regressions and closes `App/service-worker/content-pack versions can upgrade safely.`
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

### W4-01 — Built-artifact automated accessibility
Owner bias: W4
Checklist target:
- automated accessibility checks run on built artifacts.
Work:
- integrate a deterministic built-output accessibility gate for representative critical routes;
- preserve existing keyboard/focus tests;
- include mobile viewport coverage where practical;
- never substitute automation for the separate physical/manual row.

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
