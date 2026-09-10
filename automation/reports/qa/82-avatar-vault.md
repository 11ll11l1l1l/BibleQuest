# A4 QA / Regression — #82 Avatar Vault

Identity: `BQ-A4-QA`
Date: 2026-09-10 JST
Disposition: **NOT READY — exact bookkeeping suite is green, but current candidate has uncovered persistence/data-integrity failures**

## STATE / PROVENANCE

### FACT
- Active canonical branch: `feature/v3-avatar-vault`.
- Exact canonical/bookkeeping candidate HEAD at final re-read: `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated `agent/a1-work/082-*` candidate: **not found**.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- No frozen `release/v3.55-avatar-vault` was established during this audit.
- Authoritative #82 contract: **`browse; select; persist; render fallback`**.
- Inventory at the exact current candidate records #81 `Regression-tested`, #82 `Verified`, totals 81 Regression-tested / 1 Verified / 18 Not started.
- #82 is HIGH-RISK because this lineage changes schema/RLS and cross-feature cloud/API persistence plus existing leaderboard directory behavior.

Primary evidence inspected before reading TRIAGE:
- exact canonical and frozen refs;
- `FEATURE_INVENTORY_V3.md`, `DEVELOPMENT_HANDOFF_V3.md` and repository tree at exact `60100f0...`;
- exact corrected-bookkeeping run `34484163108`, its job results, and its executed verifier workflow;
- canonical #82 API persistence path in `src/core/api.js`;
- `tests/v3-avatar-vault-edge.mjs`;
- existing A4 report only after primary-evidence findings were re-established.

## EXACT RUN EVIDENCE

### FACT — corrected bookkeeping run
Run `34484163108` completed success. Its isolated verifier explicitly checked out and asserted exact current candidate `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`. Accumulated architecture validators, edge/security regressions, Playwright/Chromium setup and accumulated browser/mobile regressions all completed green.

The exact executed verifier workflow includes `scripts/validate-v3-avatar-vault.mjs`, `tests/v3-avatar-vault-edge.mjs`, and `tests/v3-avatar-vault-smoke.mjs`; it also retains the prior accumulated validator, edge and browser/mobile lists. The verifier uses only a temporary push trigger on its isolated `verify/v3.55-avatar-vault-bookkeeping-60100-20260910` branch and checks out the exact candidate SHA before execution.

No ordinary Actions run is attached directly to head SHA `60100f0...`; that is expected for this evidence model because the isolated verifier's own trigger commit is `246537850...` while its checkout/assertion pins `60100f0...`. The exact checkout/assertion plus successful phases are the relevant evidence.

## ACCEPTANCE / PERMANENT REGRESSIONS

### FACT — covered
- Catalog retains 15 styles.
- Five xp/streak-evaluable styles and ten explicitly unavailable/deferred styles are asserted.
- Exact xp/streak unlock thresholds and malformed metric fail-closed behavior are tested.
- Locked selection fails closed at the app-service layer.
- Guest/account private-storage isolation is tested.
- Local selection survives a simulated cloud save failure and returns `synced:false`.
- Exact `60100f0...` accumulated execution invokes the permanent #82 browser smoke as well as all prior accumulated coverage.

### FACT — harness weakness retained
The #82 edge suite mocks `api.avatarVault.save()` as a single operation. It therefore cannot represent the concrete split-cloud counterfactual in which the cosmetics-table write succeeds and the congregation-avatar projection write fails. A green edge run cannot establish convergence across those two real remote writes.

## PRIMARY-EVIDENCE FAILURES / MISSING COVERAGE

### FAILURE 1 — destructive shared-avatar replacement
`src/core/api.js` constructs `avatar = { cosmetic: selectedStyle }` and then performs `bible_congregation_members.update({ avatar }).eq('user_id', userId)`.

Counterfactual QA failure: if an existing congregation member avatar contains any valid non-cosmetic fields, selecting a cosmetic replaces the entire JSON object with only `{cosmetic: ...}`. This is a destructive write rather than a cosmetic-field update and violates the authoritative `persist` requirement/data-integrity expectation.

No permanent #82 regression seeds an existing multi-key avatar object and proves those unrelated fields survive cosmetic selection.

### FAILURE 2 — partial two-write cloud sync has no demonstrated convergence
`api.avatarVault.save()` performs two independent writes in order: `bible_avatar_cosmetics.upsert(...)`, then `bible_congregation_members.update({avatar})`. The current permanent edge suite substitutes a single mocked `save()` call and therefore cannot test partial success between the two remote operations.

Counterfactual QA failure: the first database write succeeds, the second fails, and the application reports failed sync while cloud representations disagree. The existing permanent suite provides no executable proof that reopen/retry reconciles that split state.

### MISSING TRUST-BOUNDARY EVIDENCE
The permanent #82 tests exercise application unlock logic through mocks/local state, not a faithful Supabase authorization boundary. Therefore exact workflow green is not evidence that a below-threshold authenticated browser cannot bypass client unlock logic and directly write an otherwise locked cosmetic to rows it is permitted to mutate.

If public cosmetics are intended only as untrusted self-presentation, that must remain non-authoritative for achievement, scoring, rank and permissions. If they are intended to prove an earned unlock, a faithful trusted-boundary test is still required.

## TRIAGE CROSS-CHECK

`automation/TRIAGE.md` was read only after the provisional findings above were independently re-established from primary evidence.

Current TRIAGE is fresh for the same exact canonical candidate `60100f0...` and correctly recognizes run `34484163108` as exact green including Avatar Vault smoke. Its persistence concerns and HIGH-RISK promotion barrier agree with this audit, but that agreement is not used as proof; the destructive replacement and split-write limitations were independently verified from `src/core/api.js` and the permanent test design.

The earlier A4 report text saying TRIAGE still claimed the exact SHA lacked a complete bookkeeping PASS was stale control-report wording and is corrected here. This correction changes no product conclusion.

## A4 DISPOSITION

**NOT READY** for HIGH-RISK #82 at exact candidate `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.

### FACT
Run `34484163108` supplies a complete exact green for the exercised accumulated suite and executes the #82 browser smoke.

### FACT
The exercised suite still cannot fail on two material persistence/data-integrity counterfactuals visible in the implementation: destructive replacement of existing avatar JSON and partial success across the two independent cloud writes.

### RECOMMENDATION
A4 READY should require an exact successor candidate that:
1. preserves existing non-cosmetic avatar JSON fields when cosmetic selection is persisted;
2. defines and permanently tests recovery/reconciliation or an authoritative atomic path for first-write-success/second-write-failure;
3. adds permanent regressions capable of failing on both cases;
4. resolves/tests whether cross-user-visible cosmetics are earned-authoritative or explicitly untrusted self-presentation, with faithful trusted-boundary evidence if earned status is claimed;
5. passes the entire accumulated suite on that exact SHA, including #82 smoke and all prior coverage.

Any later bookkeeping SHA requires its own complete exact green before release freeze.

## MISSING EVIDENCE
- Executable regression preserving pre-existing non-cosmetic avatar JSON through selection.
- Executable regression for first remote write success + second remote write failure + subsequent convergence/recovery.
- Faithful authorization evidence if public cosmetic selection is claimed to represent an earned unlock rather than untrusted presentation.
- Exact complete green for whatever successor SHA resolves those issues.

## STALENESS CONDITIONS

This report becomes candidate-stale immediately if:
- `feature/v3-avatar-vault` moves from `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`;
- an `agent/a1-work/082-*` branch appears or moves;
- Avatar Vault API/app/tests/validator/workflow or schema/RLS/grants change;
- new exact candidate/run evidence appears;
- `release/v3.55-avatar-vault` is created;
- frozen base changes unexpectedly from `release/v3.54-psychometrics` / `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
