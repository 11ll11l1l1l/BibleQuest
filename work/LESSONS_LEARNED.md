# BibleQuest consolidated lessons: V1–V6

Updated 2026-10-04 JST. Rules are maintained in [RULEBOOK.md](RULEBOOK.md), not repeated here. This ledger explains why they exist.

## Evidence limits

V1: no reliable detailed incident ledger was recovered. No V1-specific failure is invented.

V2: [clean rebuild record](../REBUILD_V2.md) documents an isolated local-first boot, explicit routes, lazy content and prohibition of global observers/runtime injection. It supports architectural lessons, not a complete V2 incident history.

V3–V6: repository release/handoff records support the incidents below. Earlier production incidents recovered from conversation history are explicitly marked **recovered report**: their historical PR identifiers are leads and were not independently re-certified during this documentation task. Some recovered timestamps/version labels conflict, so no invented release/date assignment is made.

## Consolidated issue ledger

| Issue or recurring failure | Evidence and scope | Applicable rulebook section |
|---|---|---|
| Feature-wide/global interception destabilized Transform and the shell; repeated patches did not resolve ownership. | Early-production recovered report; V2 rebuild independently mandates explicit isolated ownership. [V2 record](../REBUILD_V2.md) | 3 |
| Grow launcher could silently return Home when an optional API was absent. | Recovered early-production report; actual route-path verification was needed. | 3 |
| Stale/mismatched runtime and cache caused recurring Transform startup failures. | Recovered report identifying PR #83; bounded recovery and preserved storage were reported. | 3, 6 |
| Inline/external duplicate implementations and omitted offline assets disagreed with reliability guards. | Recovered report identifying PR #55; source/build/cache parity needed. | 3, 6, 8 |
| PWA manifest/worker existed but registration was absent; optional precache and 5xx handling could stall/break recovery. | Recovered reports identifying PR #16/#20. | 6 |
| Cache growth, stale generations and stalled downloads harmed update/offline reliability. | Recovered early-production reports; no current runtime timeout values prescribed from memory. | 3, 6 |
| Guest flow forced registration, onboarding changed semantics and Journey routed to the wrong feature/date basis. | Recovered reports; verify accepted guest behavior, intended route and local-day semantics when affected. | 3 |
| A PR reported ready was actually far behind main; parsing failures persisted. | Recovered report identifying PR #57; no current status asserted. | 1, 8 |
| Runtime doctrinal policy and generated active/quarantined content used different revisions. | Recovered reports identifying PR #5/#18/#53; deterministic reconciliation and preservation were required. | 5 |
| Imported Scripture references could have malformed/reversed ranges, missing endpoints or incorrect passages. | Recovered PR #32 report and owner-reported couples-reference issues; source claims require affected reference validation. | 5 |
| Recovery secrets leaked through a global account-created event. | Recovered issue #82 report. | 4 |
| A green static gate or feature inventory was mistaken for browser/release readiness. | [V3 handoff](../DEVELOPMENT_HANDOFF_V3.md); recovered early-production readiness reports. | 2, 9 |
| Stale field wording demanded behavior not actually in the released Live Rooms contract. | [V3 handoff](../DEVELOPMENT_HANDOFF_V3.md) explicitly preserves create/join/leave/reconnect without inventing a scoring loop. | 1, 2 |
| A wrong Cloudflare project could appear to prove production. | [V4 final status](../V4_ACTIVE_STATUS.md) names `mybiblequest` and rejects legacy project authority. | 8 |
| Main-only concurrent checklist/status changes conflicted with certified integration. | [V5 reconciliation](../docs/v5/V5_MAIN_RELEASE_RECONCILIATION_2026-09-18.md) records deliberate tree selection. | 1, 8 |
| English leaks, incomplete localized launchers/titles and missing visible assets remained after apparent completion. | Owner-reported V5 issues; [V5 status](../docs/archive/v5/records/V5_ACTIVE_STATUS.md) records V5.1 localization stabilization and language-switch regressions. | 5 |
| Notification deep-link rendered as guest before authenticated session hydration. | [V5 status](../docs/archive/v5/records/V5_ACTIVE_STATUS.md) records the field-discovered race and corrected runtime. | 4, 6 |
| Physical push evidence and later runtime evidence had distinct candidate identities. | [V5 status](../docs/archive/v5/records/V5_ACTIVE_STATUS.md) explicitly documents equivalence and the separately proven hydration fix. This does not authorize arbitrary V6/V7 evidence transfer. | 6, 9 |
| Scheduled agents produced analysis, stale handoffs, duplicate work and stranded branches. | [V6 operating record](../V6_AGENT_OPERATING_SYSTEM.md), purpose section; owner's repeated reports of unproductive agents. | 1, 7 |
| Shared writes and stale worker branches caused integration/serialization churn. | [V6 status](../V6_ACTIVE_STATUS.md), serializer checkpoints; [V5 historical protocol](../docs/archive/v5/records/V5_COORDINATED_AGENT_PROTOCOL.md). | 7, 8 |
| BSB long-running work repeatedly stalled; successful shards risked expensive reruns. | Owner reports; [V6 status](../V6_ACTIVE_STATUS.md) records deterministic disjoint regeneration and preservation of completed outputs. | 5, 7 |
| BSB finalization encountered a real text mismatch after alignment shards completed. | Recovered task history identifies 1 Chronicles 1:32 and PR #1096; retained as historical report, not a reopened blocker. | 5 |
| Upstream audio range request succeeded while browser media fetch failed. | [V6 status](../V6_ACTIVE_STATUS.md) records environment failure and unverified live playback; contract and media observations are distinct. | 5, 9 |
| Implicit first-membership scope and stale account/congregation contexts threatened tenant safety. | [V6 status](../V6_ACTIVE_STATUS.md) records explicit scope selection and cancellation/stale-context tests. | 4 |
| Assignment target/recipient ownership needed same-congregation authorization; test fixtures omitted legitimate same-tenant roles. | [V6 status](../V6_ACTIVE_STATUS.md) records backend denial fixes and fixture repair preserving cross-tenant denial. | 2, 4 |
| Backend activation with no eligible assignments did not prove assigned/due delivery. | [V6 checklist](../V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md) records activation versus actual canonical notification/ledger evidence. | 6, 9 |
| A generated verifier/build path existed while Cloudflare did not serve the expected V6 artifact metadata. | Recovered V6 release task history; [final production evidence](../docs/v6/evidence/RC_20261003/v6-production-promotion-evidence.json) records the corrected exact artifact outcome. | 8 |
| Production branch, integration source and documentation closeout were different references. | [V6 production status](../V6_ACTIVE_STATUS.md), [backup manifest](../BACKUP_MANIFEST.md), [V7 starting point](../docs/V7_STARTING_POINT.md). | 8, 10 |
| Physical background audio, installed-PWA, accessibility and push observations were deferred by the owner. | [V6 production status](../V6_ACTIVE_STATUS.md) retains 8 OPEN acceptance rows and records waiver separately; authenticated production session observation was unperformed. | 9 |
| Root entry documents described V4/V5 as current after V6 release. | [V7 cleanup baseline](../docs/V7_STARTING_POINT.md); entry points corrected. | 1, 10 |
| Historical names were not proof of dead code; some root documents remained executable dependencies. | [V7 cleanup baseline](../docs/V7_STARTING_POINT.md): 42 unreferenced documents archived, inherited static checks passed. | 2, 10 |
| Superseded PRs coexisted with one UI PR containing distinct unmerged changes. | [V7 cleanup baseline](../docs/V7_STARTING_POINT.md): #1120/#1109 closed, #1119 retained. | 7 |
| CLI write authentication failed despite a working connected GitHub writer. | Current cleanup/work-folder execution: connector publication succeeded and equivalent tree identities were checked where used. | 8 |
| Local Node version differed from the certified pinned runtime. | [V7 cleanup baseline](../docs/V7_STARTING_POINT.md) records actual environment rather than claiming toolchain certification. | 2, 8 |

## Consolidation decisions

Historical rules demanded full accumulated regression at every milestone, fixed teams, repeated authority reads and multiple status updates. Their safety intent remains, but new work uses task-scoped checks, one owner, one authority update and existing release boundaries. Independent work need not idle behind unrelated CI; frozen candidate inputs and shared writes still serialize.

No old regression coverage, gate, evidence or rollback was removed by this rulebook. New checks require a demonstrated gap. Unknown V1 details and recovered reports remain explicitly qualified instead of being presented as verified version-specific incidents.
