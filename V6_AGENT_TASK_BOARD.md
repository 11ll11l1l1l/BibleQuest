# BibleQuest V6 Agent Task Board

Updated: 2026-10-02 JST
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

- Integration is now `f88f9265922c82c631003f947d4a78f90ff65f3e` after the BSB speedtrack sequence through PR #1081. Direct acceptance remains **194 checked / 17 open / 211 total = 91.9%**; the new BSB work improves implementation/evidence readiness without upgrading rows that still require stronger external or physical evidence.
- BSB runtime/tooling already integrated: resumable exact-identity 1,189-chapter regeneration + strict upstream reuse audit (#1066); corrected built-Reader verified-alignment proof + timing acceptance guard (#1068); previous/stop Media Session + exact-candidate physical field gate (#1076); streaming-safe offline/CORS fallback (#1078); deterministic missing-work sharding across 1–16 workers (#1081).
- BSB evidence state: only **10 / 1,189** chapters are strictly reusable from the pinned upstream timing corpus; **1,179** require regeneration/reconciliation. The five BSB checklist rows remain OPEN for exact offline-file checksum/version + copy-policy review, the complete real timing manifest, highlight/seek on that manifest, autoscroll on that manifest, and physical background/lock-screen observations.
- Do not reassign seek/highlight/autoscroll runtime implementation, offline-download-unavailable fallback, Media Session previous/stop controls, or generic timing-manifest tooling. W3 should spend cycles on exact staged Hays identity, approved-copy evidence, executing the real regeneration/import, and physical-device evidence.
- Cross-congregation sensitive-domain denial and aggregate server-authority/RLS closure are complete. Assignment assigned/due push still requires a real eligible live due recipient plus canonical dispatch evidence. Cloudflare deployment identity remains external until Pages publishes `dist-v6` unchanged.

## Historical serialized checkpoints

- Integration is now `2730ab752394d8f16ca7d6bcbc325528f4a6e720`. PR #1010 replayed the six green stale tranches from #1009 onto live integration and passed exact-head serialization `36858421227`, Dependency Security `36858421305`, Client Artifact Security `36858421179`, Phase-1 `36858421168`, Database CI `36858421262`, and inherited regression `36858421145`. Because #1009 had first been rejected as stale by serialization run `36856769639`, the serialized/rebased/revalidated integration row is now evidence-complete. After checklist reconciliation: **189 checked / 22 open / 211 total = 89.6%**.
- The #1010 merge also integrates the W2 four-domain tenant DB matrix, W4 evidence-class/field-device fail-closed guards, emergency temporary-password screening, exact Hays inventory/alignment identity tooling, exact-SHA RC evidence collector, and assignment migration-history/release-target preflight. These are foundations only; do not promote their broader rows without the remaining required evidence class.

- Acceptance reconciliation from current integration `1d876e68d355ccfde339ea278f4a6919f3a29d8e`: #941 security-advisor triage, #951 V4→V6 route/feature parity, #950/#952 canonical V4-production→V6 database-upgrade proof, #976 immutable V4 rollback-reference guard, and #962 systemic explicit-congregation repository context are complete. After this reconciliation lands, official acceptance is **186 checked / 25 open / 211 total = 88.2%**. Do not reassign these rows. W2 should continue aggregate cross-congregation/server-authority DB evidence rather than reworking explicit client/repository context; other lanes continue leaked-password/equivalent, BSB exact-source alignment, exact-RC/release evidence, and genuine field/device acceptance.
- PR #939 is integrated at `5dc32d4b7660bd42040cac28b90cbb5bff9b14a9` from exact head `1640496e3a708e823d7c9725cf22276260aa3ae4`; Phase-1 `36792168865` and inherited regression `36792168887` passed. The protected feature-authority boundary is now accepted. After reconciliation: **180 checked / 31 open / 211 total = 85.3%**.

- PR #934 is integrated at `bb0e2251a74049e5309b4fb9ae0d1706de2a9507` from exact head `18a6306d790f6d6219c104ee0221c82c17a8a6e3`; Phase-1 `36790797552` and inherited regression `36790797547` passed, including exact built-artifact report-only and enforcing CSP Chromium gates. CSP is now accepted. After reconciliation: **179 checked / 32 open / 211 total = 84.8%**.

- PR #912 is integrated at `de1ee50c9d25f8a3dcc8507b2f59c2f2e00d7e35` from exact head `5e1b99f674648e83ab6141ee810deec6ee055194`; its green Phase-1/inherited/artifact-security evidence closes the explicit removable permission-gated offline-download and selective-audio/no-silent-full-cache rows. Alignment-dependent Reader behavior remains fail-closed.

- PR #935 is the current W1 deployment-verifier artifact. Exact-preview discovery and exact-head rebuild work; deployed verification run `36790979893` fails because Cloudflare returns HTML for `bq-artifact-integrity.json`. This is now an external Pages publish-root/output blocker: configure Pages to publish `dist-v6` unchanged, then rerun #935. Do not duplicate the verifier.

- PR #936 is the active W3 Reader/audio tranche. It records that pinned `bsb-align` text is not exact-equivalent to the current BibleQuest BSB text and therefore must not drive verse timing/highlight/seek/autoscroll; keep those acceptance rows open until exact source-matched timing exists.

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

### W2-01 — Exact-RC security evidence integrity
Owner bias: W2
Checklist targets:
- One exact V6 RC SHA passes all applicable automated/security/tenant/regression gates.
Work:
- consume the integrated #1053 exact-candidate dispatch contract rather than duplicating it;
- verify collectors/orchestration bind workflow evidence to the actual checked-out candidate SHA;
- repair only demonstrated mismatches;
- keep native leaked-password status truthful even though the temporary first-party-equivalent residual risk is accepted;
- never weaken Auth, RLS, role, or tenant isolation evidence.

### W3-01 — Produce the exact real BSB/Hays timing artifact
Owner bias: W3
Checklist targets:
- exact-source checksum/version evidence for staged Hays files;
- complete versioned timing/alignment manifest for the exact Reader BSB text/audio revision.
Current state:
- exact chapter/text/audio/alignment identity contracts are integrated;
- strict reuse audit shows 10 reusable / 1,179 regenerate;
- resumable regeneration and deterministic 1–16-worker shard planning are integrated.
Work:
- use only an approved exact Hays staging set; do not fetch/copy audio merely to clear acceptance;
- run `npm run audit:v6-bsb-reuse -- <pinned-bsb-align-dir> [report.json]`;
- prepare the exact regeneration workspace, then use `npm run plan:v6-bsb-shards -- <regeneration-plan.json> <1-16>` when approved multi-worker hardware is available;
- execute disjoint shard commands without `--force`, then finalize with `npm run run:v6-bsb-alignment -- --resume-plan <regeneration-plan.json>`;
- review scores/provenance and place `data/v6-audio/bsb-hays-alignment.json` only when all 1,189 chapters and exact source identities validate.

### W1-01 — Exact-SHA deployment identity
Owner bias: W1
Checklist targets:
- Cloudflare exact-SHA deployment identity from built artifacts;
- exact-SHA Cloudflare preview verification.
Current state:
- repository verifier and automatic exact-preview discovery are consolidated in PR #935;
- external blocker is Cloudflare Pages serving HTML instead of `dist-v6/bq-artifact-integrity.json`.
Work:
- do not duplicate verifier code;
- after Pages publish root is corrected to `dist-v6`, rerun #935 and attach exact deployed-byte evidence;
- while external configuration remains blocked, pivot to W1-02.


## P1 — take when P0 item is owned/blocked

### W3-02 — Certify synchronization against the real manifest
Targets:
- current verse highlight during playback;
- tap verse -> seek;
- auto-scroll without blocking manual navigation/accessibility.
Current state:
- runtime behavior and built-browser verified-alignment proof are integrated through #1068;
- do not add another synthetic UX implementation tranche.
Work:
- after W3-01 produces the real exact manifest, run exact-head built acceptance against it and promote only with that real provenance-bound evidence.

### W3-03 — Close exact-source offline evidence
Targets:
- exact-source checksum/version verification;
- approved local-copy policy for the exact selected files.
Current state:
- user-initiated/removable bounded downloads, upgrade safety, and explicit CORS/fetch unavailable-state with direct-stream fallback are already integrated;
- do not rework those completed behaviors.
Work:
- bind exact staged Hays bytes to the integrated SHA-256/size/duration inventory;
- record the approved copy-rights decision for those exact source files;
- keep offline copy fail-closed until both evidence classes exist.

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
