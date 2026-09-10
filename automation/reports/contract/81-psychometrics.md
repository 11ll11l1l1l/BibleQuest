# A2 contract investigation — #81 Psychometrics suite

Agent: `BQ-A2-CONTRACT`

## Exact state observed

- Canonical branch: `feature/v3-psychometrics` at exact `1bd77237de6b08f18794387bf5c1d9c8098a3e4a` on final resolution.
- Dedicated `agent/a1-work/081-*` candidate: not found during branch inspection.
- Frozen base: `release/v3.53-personality-profile` at exact `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Retained/v2 primary source snapshot inspected: `release/v2-parity-snapshot` at exact `825de10b36c7f9b511cc8cab88aa3a6ce79ef939`.
- `release/v3.54-psychometrics`: not established during this inspection.
- Exact workflow runs for canonical `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`: none found at final inspection time.

This report becomes stale immediately if canonical, candidate, frozen release, authoritative inventory/contract, retained-source baseline, relevant owners, or workflow/test invocation changes.

## FACT — authoritative milestone boundary

The authoritative inventory says #81 Psychometrics suite is `Standalone old`, currently `Not started`, and requires exactly: **`complete assessment; result; persistence; mobile`**. #80 Personality profile is separate and Verified. #82 Avatar vault remains Not started and is not part of #81.

`PSYCHOMETRICS_V3.md` recovers the retained behavior within that inventory boundary. It requires three retained assessments, deterministic scoring, private persistence/account isolation, mobile usability, interpretation safeguards, and exact-SHA accumulated verification. It explicitly excludes cloud synchronization, XP, Scripture/doctrine personalization from scores, Quick Transform/Profile ownership merging, legacy globals/direct storage ownership, and unrelated Avatar/Innovation/Tutorial/Admin/Moderation migration.

## FACT — retained/v2 primary evidence

Retained `psychometrics-suite.js` directly implements three device-local assessments: Deep Personality/IPIP-NEO-120, Character Strengths/IPIP-VIA-R, and Rosenberg Self-Esteem. It identifies local/device privacy, separates psychometrics from clinical diagnosis and spiritual maturity, uses reverse-key scoring, and implements the retained response-quality checks.

Retained `psychometrics-data-neo.js` contains 30 facets x 4 items, including historical `Liberalism / Values Openness` and `Depression` labels. Retained `psychometrics-data-via.js` contains 24 four-item constructs plus the 10 Rosenberg items, including `Spirituality / Religiousness`. The v3 interpretation safeguards around politics/theology/diagnosis are therefore grounded in retained primary content and are not invented parity additions.

## FACT — current v3 owner boundaries

`src/engines/psychometrics.js` owns deterministic normalization/scoring for `neo`, `via`, and `rse`; it has no persistence/navigation ownership. It requires complete responses before calculation, performs retained reverse-key scoring, computes the retained means/totals, and recalculates stored derived results from valid normalized answers instead of trusting persisted result values.

`src/app/psychometrics.js` owns assessment lifecycle/persistence. It derives the active owner as `guest` or `account:<exact user id>` on every operation and delegates persistence to the storage owner and scoring to the engine.

`src/core/storage.js` already owns `privateStorage`; private keys are separately namespaced and excluded from portable backup/export/import. No recovered #81 requirement needs a new cloud/database persistence owner.

Comparison from frozen v3.53 through inspected #81 lineage showed #81 contract/app/engine/content/presentation work plus bounded bootstrap/progress composition. No #81 production schema, migration, RLS, grant, RPC, Edge Function, or Cloudflare change is required by the recovered contract.

## FACT — permanent test/workflow evidence at current exact SHA

During this investigation the canonical advanced through `e4e126b988131620879d4a7bbf087be5f4f72160`, `8e40ff21d23432fe79b7f004cc94bc87a68f9d3e`, and finally `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`.

At `8e40ff21...`, three permanent #81 files were added:
- `scripts/validate-v3-psychometrics.mjs`
- `tests/v3-psychometrics-edge.mjs`
- `tests/v3-psychometrics-smoke.mjs`

The final `1bd77237...` then changed only `.github/workflows/v3-regression.yml` to add those three #81 checks to the accumulated architecture, edge/security, and browser/mobile loops. Prior accumulated invocations remain present and the workflow remains `workflow_dispatch`-only.

GitHub Actions returned zero runs for exact final SHA `1bd77237de6b08f18794387bf5c1d9c8098a3e4a` at final inspection time. Therefore there is still no exact-SHA PASS for #81. Test presence and workflow wiring are not execution evidence.

## FACT — current implementation versus recovered contract

Primary inspection found no contract-level reason to broaden #81 beyond the documented deep psychometrics suite. Current ownership is compatible with retained behavior and the intended private boundary.

No evidence requires #81 to award XP, cloud-sync psychometric data, alter production authorization/storage schema, merge with #80, or implement #82 Avatar Vault/#83 Innovation.

## INFERENCE / RECOMMENDATION

- Treat exact `1bd77237...` as an implementation/gate candidate, not Verified, until its complete accumulated workflow executes successfully against that exact SHA or a later exact successor.
- Preserve `privateStorage` owner isolation; do not introduce database/cloud persistence solely for parity.
- Preserve separation from #80 Quick Transform/Personality Profile.
- Preserve explicit interpretation safeguards for historical Values Openness, Spirituality/Religiousness, and Depression labels.
- Do not pull #82 Avatar Vault or #83 Innovation into #81 absent new primary evidence.

## Missing evidence / promotion conditions

Missing at final inspection:
1. a dedicated `agent/a1-work/081-*` candidate if the control-plane quarantine requirement applies to this active lineage;
2. a complete accumulated exact-SHA functional green for `1bd77237...` or its exact successor;
3. a changed exact bookkeeping-SHA accumulated green before immutable `release/v3.54-psychometrics`, as explicitly required by the #81 contract;
4. any later evidence needed if canonical/workflow/contract/owners move again.

## TRIAGE comparison

`automation/TRIAGE.md` was read only after provisional independent findings. It was materially stale: it still described #79 as active, v3.51 as frozen, and #80/#81 as deferred. It was not used as evidence. Live primary evidence has advanced through frozen v3.53 and active #81.
