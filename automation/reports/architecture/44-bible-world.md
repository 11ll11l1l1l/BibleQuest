# A3 architecture/security — #44 Bible World

Identity: `BQ-A3-ARCH-SECURITY`

## Exact state
- Canonical: `feature/v3-bible-world` @ `0cd5107833ca191aa8807c584187538dd1c9a4d0`
- Candidate: no `agent/a1-work/044-*` ref found at inspection time
- Frozen base: `release/v3.67-live-rooms` @ `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`
- Canonical is 10 commits ahead of frozen base.

## Primary-evidence findings

**FACT — risk boundary:** Frozen-to-canonical changes are limited to Bible World application/presentation code, documentation/bookkeeping, tests, CSS/index composition and the accumulated workflow. The compare contains no schema, migration, RLS, grant, Supabase Edge Function, RPC/trusted-function, dependency, or backend/API implementation change. On that evidence #44 is architecture/security **NORMAL-RISK**.

**FACT — ownership:** `src/app/bible-world.js` reads mastery only through `adaptive.getProfile()`, requires the existing Reader owner, and hands Read navigation to `reader.setBook(...)`. Review returns the existing `open-review` route. It contains no persistence, Progress/XP mutation, remote fetch, Supabase client creation, direct storage, or global runtime. `ARCHITECTURE_V3.md` retains central ownership of browser persistence (`src/core/storage.js`), remote calls (`src/core/api.js`), Reader, Adaptive Learning and Open Review.

**FACT — security/trust boundary:** #44 introduces no server authorization path because it introduces no privileged or remote mutation. The safe boundary is a read-only projection of owner-supplied learning evidence plus routing into established Reader/Open Review owners. Scripture regions remain accessible; the 60% value affects journey/explored presentation only and is not an authorization gate.

**FACT — permanent tests:** `scripts/validate-v3-bible-world.mjs` rejects direct `localStorage`/`sessionStorage`, `window.BQ*`, Supabase-client/fetch, Progress and storage shortcuts. `tests/v3-bible-world-edge.mjs` covers the projection, accessibility, threshold behavior, Reader handoff, review non-mutation and invalid-region failure. The permanent `.github/workflows/v3-regression.yml` invokes the #44 validator, edge regression and browser/mobile smoke while retaining the accumulated preceding validators/tests observed in the workflow.

**FACT — exact execution evidence missing:** GitHub Actions queries for both `branch=feature/v3-bible-world` and exact `head_sha=0cd5107833ca191aa8807c584187538dd1c9a4d0` returned zero runs. Therefore no exact-SHA workflow PASS exists in the inspected primary evidence. The inventory nevertheless marks #44 `Verified` at this canonical HEAD; that status is not independently substantiated by exact run evidence available to A3.

**FACT — contract provenance caution:** `docs/V3_BIBLE_WORLD_CONTRACT.md` was introduced in the same #44 implementation lineage. It asserts nine regions, 60% explored threshold, Genesis split formulas and anchor passages. Those assertions are implementation-lineage evidence, not by themselves independent retained/v2 provenance. This does not create a new security boundary, but it should not be used as sole proof of historical parity.

## Required safe boundary
- Keep Bible World read-only over Adaptive Learning evidence.
- Keep Reader as Scripture state/navigation owner and Open Review as review owner.
- Keep Storage, Progress/XP, Bible-source loading and remote/API behavior in their current verified owners.
- Do not turn the 60% journey marker into an authorization/content-access restriction.
- Do not add direct Supabase/database calls, schema/RLS/grants, RPCs, cloud persistence, duplicated mastery state, direct storage, XP/reward writes, or a second Reader/review algorithm under #44 without new primary contract evidence and risk reclassification.

## Missing evidence / disposition

**RECOMMENDATION:** Architecture/security boundary is acceptable as NORMAL-RISK at exact `0cd5107833ca191aa8807c584187538dd1c9a4d0`, but #44 should not be treated as fully verified/promotable from A3 evidence until the complete accumulated workflow is executed and green against that exact SHA (or a later exact bookkeeping candidate, with no PASS transfer across SHAs). Contract investigators should independently substantiate the detailed recovered threshold/region/mapping values from retained/v2 evidence before describing them as historical parity facts.

No #44 server/trust-boundary test is required unless the implementation broadens into remote or privileged behavior; if that happens, reclassify HIGH-RISK and require the corresponding authorized server path plus faithful executable authorization tests.

## TRIAGE freshness check
`automation/TRIAGE.md` was read only after the provisional findings above were formed. It is materially repository-state stale: it still describes #43 as pre-write at v3.66, while primary refs now show frozen v3.67 and implemented/ledger-Verified #44. Its older #93/#94 firewall debt is not used as primary evidence for this #44 architecture finding.

## Staleness conditions
This report is stale immediately if `feature/v3-bible-world`, an `agent/a1-work/044-*` candidate, the latest frozen release, #44 workflow/tests, relevant owner boundaries, schema/RLS/grants/trusted functions, or exact workflow evidence changes.
