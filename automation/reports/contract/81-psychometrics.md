# A2 contract investigation — #81 Psychometrics suite

Agent: `BQ-A2-CONTRACT`

## Exact state observed

- Canonical branch: `feature/v3-psychometrics` at exact `8e40ff21d23432fe79b7f004cc94bc87a68f9d3e` on final pre-report resolution.
- Dedicated `agent/a1-work/081-*` candidate: not found during branch inspection.
- Frozen base: `release/v3.53-personality-profile` at exact `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Retained/v2 primary source snapshot inspected: `release/v2-parity-snapshot` at exact `825de10b36c7f9b511cc8cab88aa3a6ce79ef939`.
- `release/v3.54-psychometrics`: not established during this inspection.
- Exact workflow runs for canonical `8e40ff21d23432fe79b7f004cc94bc87a68f9d3e`: none found at inspection time.

This report becomes stale immediately if canonical, candidate, frozen release, authoritative inventory/contract, retained-source baseline, relevant owners, or workflow/test invocation changes.

## FACT — authoritative milestone boundary

The authoritative inventory says #81 Psychometrics suite is `Standalone old`, currently `Not started`, and requires exactly: **`complete assessment; result; persistence; mobile`**. #80 Personality profile is a separate milestone and is Verified at the inspected canonical state. #82 Avatar vault remains Not started and is not part of #81.

The milestone contract `PSYCHOMETRICS_V3.md` expands that inventory boundary using retained-source evidence without merging unrelated capabilities. It explicitly requires three retained assessments, deterministic scoring, private persistence/account isolation, mobile usability, interpretation safeguards, and accumulated exact-SHA verification. It explicitly excludes cloud synchronization, XP, Scripture/doctrine personalization from scores, Quick Transform/Profile ownership merging, legacy globals/direct storage ownership, and unrelated Avatar/Innovation/Tutorial/Admin/Moderation migration.

## FACT — retained/v2 primary evidence

The retained `psychometrics-suite.js` directly implements three assessments and device-local persistence: Deep Personality/IPIP-NEO-120, Character Strengths/IPIP-VIA-R, and Rosenberg Self-Esteem. It identifies local/device privacy, keeps psychometrics separate from clinical diagnosis and spiritual maturity, uses reverse-key scoring, and exposes the same basic response-quality signals now documented by the v3 contract.

The retained `psychometrics-data-neo.js` contains 30 facets x 4 items, including the historical `Liberalism / Values Openness` and `Depression` labels. The retained `psychometrics-data-via.js` contains 24 four-item constructs plus the 10 Rosenberg items, including `Spirituality / Religiousness`. These labels make the v3 interpretation boundaries material contract requirements rather than invented additions.

## FACT — current v3 owner boundaries

At the inspected lineage, `src/engines/psychometrics.js` owns deterministic normalization/scoring for `neo`, `via`, and `rse`; it has no persistence or navigation ownership. It requires complete responses before calculation, applies reverse-key scoring, computes the retained scale means/totals, and recalculates persisted derived results from normalized valid answers rather than trusting stored result values.

`src/app/psychometrics.js` owns assessment lifecycle/persistence and derives an owner key as `guest` or `account:<exact user id>` on each operation. It delegates persistence to the supplied storage owner and calculation to the engine.

`src/core/storage.js` already owns the `privateStorage` boundary. Private keys are prefixed separately and are explicitly excluded from ordinary portable export/import entries. Therefore #81 does not need a new cloud/database persistence owner to satisfy the recovered contract.

Comparison from frozen v3.53 to inspected implementation lineage showed additive #81 contract/app/engine/content/presentation work plus bounded bootstrap/progress composition; no #81 production schema, migration, RLS, grant, RPC, Edge Function, or Cloudflare migration was required by the recovered contract.

## FACT — permanent test/workflow evidence at inspected exact SHA

Between earlier observed `e4e126b988131620879d4a7bbf087be5f4f72160` and final inspected `8e40ff21d23432fe79b7f004cc94bc87a68f9d3e`, three permanent #81 files were added:

- `scripts/validate-v3-psychometrics.mjs`
- `tests/v3-psychometrics-edge.mjs`
- `tests/v3-psychometrics-smoke.mjs`

However, at exact `8e40ff21d23432fe79b7f004cc94bc87a68f9d3e`, `.github/workflows/v3-regression.yml` still does **not** invoke those #81 tests/validator in the accumulated validator, edge, or browser loops. The workflow remains `workflow_dispatch`-only and retains prior coverage through #80. GitHub Actions returned zero runs for exact `8e40ff21d23432fe79b7f004cc94bc87a68f9d3e` at inspection time.

Accordingly, there is no exact-SHA PASS for #81 and no evidence that its new permanent tests have yet participated in the accumulated gate. Presence of test files is not execution evidence.

## FACT — current implementation versus contract

Primary inspection found no contract-level reason to broaden #81 beyond the documented suite. Current owner structure is compatible with the recovered retained behavior and privacy boundary. The contract's politically/religiously/clinically sensitive interpretation constraints are directly justified by the retained item labels and must remain visible in the product acceptance path.

No evidence was found requiring #81 to award XP, perform cloud sync, alter production authorization/storage schema, merge with #80, or implement #82 Avatar Vault.

## INFERENCE / RECOMMENDATION

- Treat #81 as an implementation-stage milestone, not Verified, until the exact canonical/candidate SHA is run through a workflow that actually invokes all required #81 permanent tests while retaining the entire prior accumulated suite.
- Preserve `privateStorage` owner isolation; do not introduce a database/cloud path solely for parity because the retained behavior is local and the v3 privacy boundary deliberately makes the data non-portable.
- Preserve separation from #80 Quick Transform/Personality Profile. #81 is the deep psychometrics suite; #80 is not evidence to collapse their scoring or persistence owners.
- Preserve explicit interpretation safeguards for the historical Values Openness, Spirituality/Religiousness, and Depression labels. These are contract safety boundaries grounded in retained content, not additional scoring requirements.
- Do not pull #82 Avatar Vault or #83 Innovation into #81 absent new primary evidence.

## Missing evidence / promotion conditions

Missing at the final inspected SHA:

1. a dedicated A1 quarantine candidate, if required by the current control-plane state;
2. accumulated workflow wiring that invokes the new #81 validator, edge regression, and browser/mobile smoke;
3. a complete exact-SHA accumulated functional green for the exact candidate after that wiring;
4. changed exact bookkeeping-SHA accumulated green before any immutable `release/v3.54-psychometrics` freeze, as required by the recovered #81 contract;
5. any later primary evidence that materially changes the current contract or ownership interpretation.

## TRIAGE comparison (read only after provisional independent findings)

`automation/TRIAGE.md` was materially stale when finally read: it still described #79 as active, v3.51 as frozen, and #80/#81 as deferred. It was not used as evidence for this report. Live primary evidence has advanced through frozen v3.53 and active #81.
