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
- `FEATURE_INVENTORY_V3.md`, `AVATAR_VAULT_V3.md`, `DEVELOPMENT_HANDOFF_V3.md` at exact `60100f0...`;
- exact functional-run workflow and jobs for run `34483151962`;
- exact failed-bookkeeping jobs for run `34483915685`;
- exact corrected-bookkeeping workflow and jobs for run `34484163108`;
- canonical `.github/workflows/v3-regression.yml` at `60100f0...`;
- `scripts/validate-v3-avatar-vault.mjs`, `tests/v3-avatar-vault-edge.mjs`, `tests/v3-avatar-vault-smoke.mjs`;
- `src/app/avatar-vault.js`, `src/core/api.js`;
- `supabase/migrations/20260904_assignments_presence_unlocks.sql`, `20260905_congregation_member_column_hardening.sql`, and `20260910_avatar_vault_visibility.sql`.

## EXACT RUN EVIDENCE

### FACT — functional run
Run `34483151962` completed success and its isolated verifier explicitly checked out/asserted exact functional candidate `37f1dc671804a1bb67ede2e5104002160b24c9dd`. Architecture, edge/security and browser/mobile steps completed green.

However, inspection of that exact verifier workflow shows its browser/mobile loop **did not invoke `tests/v3-avatar-vault-smoke.mjs`**. It invoked the new #82 validator and edge regression, but the permanent 390px Avatar Vault smoke was absent from the executed browser list. Therefore run `34483151962` is not evidence that the new #82 browser smoke itself passed.

### FACT — first bookkeeping run
Run `34483915685` checked/asserted first bookkeeping candidate `dde924f86f83baf78659f303e442930b38749aca` and failed in accumulated architecture validation. All edge/security and browser/mobile phases were skipped. The subsequent commit `b0aa6defc4870813cb337a94fdc5f252d7754199` changed only the inventory summary totals from 80→81 Regression-tested and 19→18 Not started, matching the promoted numbered rows.

### FACT — corrected bookkeeping run
Run `34484163108` completed success. Its isolated verifier explicitly checked out/asserted exact current candidate `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`. Accumulated architecture validators, edge/security regressions, Playwright/Chromium setup and accumulated browser/mobile regressions all completed green.

Critically, the exact executed workflow for `34484163108` **does include `tests/v3-avatar-vault-smoke.mjs`** in the browser/mobile loop. Thus the prior 390px execution-evidence gap is resolved for exact `60100f0...` even though it was not resolved by the earlier functional run.

The exact current canonical workflow is restored to `workflow_dispatch`-only and contains the #82 validator, edge regression and browser smoke while retaining the earlier accumulated suites. No unexplained removal/skip/narrowing of prior accumulated coverage was found in this final workflow snapshot.

## ACCEPTANCE / PERMANENT REGRESSIONS

### FACT — covered
- Catalog retains 15 styles.
- Five xp/streak-evaluable styles and ten explicitly unavailable/deferred styles are asserted.
- Exact xp/streak unlock thresholds and malformed metric fail-closed behavior are tested.
- Locked selection fails closed at the app-service layer.
- Guest/account private-storage isolation is tested.
- Local selection survives a simulated cloud save failure and returns `synced:false`.
- Real #82 presentation renders at 390px, has selection controls, can mark a selected card active, has back navigation, no horizontal overflow and no runtime console/page errors.
- Exact `60100f0...` accumulated execution includes all these current permanent test files and all prior accumulated coverage.

### FACT — harness weakness discovered
`scripts/validate-v3-avatar-vault.mjs` validates accumulated invocation of the #82 validator and edge regression but does **not** require accumulated workflow invocation of `tests/v3-avatar-vault-smoke.mjs`. This is why the earlier exact functional verifier could omit the new browser smoke without architecture validation failing. The current bookkeeping workflow does execute the smoke, so this is not a missing-execution blocker for exact `60100f0...`; it remains a permanent harness-integrity weakness that should be corrected before relying on future accumulated runs to guarantee #82 browser retention.

## REPRODUCED / PRIMARY-EVIDENCE DEFECTS

### FAILURE 1 — destructive shared-avatar replacement
`src/core/api.js` currently constructs `avatar = { cosmetic: selectedStyle }` and performs `bible_congregation_members.update({ avatar }).eq('user_id', userId)`.

The #82 contract says the congregation-member avatar is the cross-user-visible projection, and the existing schema treats `avatar` as JSONB/public-presentation state. Replacing the entire JSON object when only the cosmetic key is being changed is not a merge operation.

Counterfactual QA failure: if an existing member avatar contains any other valid keys, selecting an Avatar Vault cosmetic overwrites the whole JSON value with only `{cosmetic: ...}`. That violates `persist`/data-integrity behavior and can break other avatar-render consumers.

No current #82 permanent regression seeds an existing multi-key avatar object and proves non-cosmetic keys survive selection.

### FAILURE 2 — partial two-write cloud sync has no reopen reconciliation
`api.avatarVault.save()` performs two independent remote writes: first `bible_avatar_cosmetics.upsert(...)`, then `bible_congregation_members.update({avatar})`. If the first succeeds and second fails, `select()` catches the failure and returns `synced:false` while keeping local device state.

On a later `load()`, `src/app/avatar-vault.js` reads only `api.avatarVault.load()`, which reads `bible_avatar_cosmetics.selected_style`. It does not inspect/reconcile the congregation-visible `avatar` projection and does not retry the second projection write.

Counterfactual QA failure: cosmetics row becomes `crown`, congregation-visible avatar remains the prior cosmetic, reopen loads `crown` locally, but leaderboard/public projection remains stale indefinitely. This contradicts the current UI/contract concept that failed sync is recoverable/retried and violates the authoritative `persist` requirement across the two declared cloud representations.

The current edge regression simulates `save()` failing as one mocked operation; it cannot represent "first remote write succeeded, second failed" and therefore cannot fail on this split-state defect.

### MISSING TRUST-BOUNDARY EVIDENCE
The current RLS for `bible_avatar_cosmetics` proves own-row SELECT/INSERT/UPDATE, and congregation-member UPDATE privileges are column-limited to `(display_name, avatar)` with the added self-row UPDATE policy. Those are useful ownership constraints.

But the current permanent tests do not execute a faithful Supabase authorization scenario. `tests/v3-avatar-vault-edge.mjs` mocks `api.avatarVault`; `tests/v3-avatar-vault-smoke.mjs` also injects a fake API. Consequently the green exact workflow is not evidence that a signed-in browser below an unlock threshold cannot bypass the app-service unlock check and directly publish a locked `selected_style`/`avatar.cosmetic` value to its own allowed database row.

If the public cosmetic is intended to represent an earned unlock, this is missing authorization evidence/behavior. If it is intentionally untrusted self-presentation, that trust classification must be explicit and downstream score/permission/achievement logic must not treat it as proof of earning.

## TRIAGE CROSS-CHECK

`automation/TRIAGE.md` was read only after the provisional findings above were formed. Its current exact canonical SHA matches `60100f0...`, but its statement that the current SHA lacks an exact complete bookkeeping PASS is now stale: run `34484163108` is a complete exact green for `60100f0...` and includes the Avatar Vault smoke.

Its two persistence concerns are independently confirmed by direct inspection of current `src/core/api.js` and `src/app/avatar-vault.js`. This report does not adopt TRIAGE's separate live-production-schema claim because repository inspection alone does not establish live production schema state.

## A4 DISPOSITION

**NOT READY** for HIGH-RISK #82 at exact candidate `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.

The reason is no longer missing exact execution: run `34484163108` supplies a complete exact green and executes the permanent #82 browser smoke. The blocker is that the current harness does not exercise two concrete persistence/data-integrity counterfactuals that are visibly incorrect in the current implementation: destructive replacement of existing avatar JSON and unreconciled partial success across the two cloud writes. The exact green therefore does not establish complete `persist` acceptance.

For HIGH-RISK promotion, A4 READY should wait for an exact successor candidate that:
1. preserves existing non-cosmetic avatar JSON fields when updating cosmetic selection;
2. defines and tests recovery/reconciliation for first-write-success/second-write-failure;
3. adds permanent regressions capable of failing on both cases;
4. clarifies/tests whether cross-user-visible cosmetics are earned-authoritative or untrusted self-presentation, with faithful trusted-boundary evidence if earned status is claimed;
5. runs the entire accumulated suite against that exact SHA, including the #82 browser smoke and all prior coverage.

Any changed bookkeeping SHA after that still needs its own complete exact green before freeze.

## STALENESS CONDITIONS

This report becomes candidate-stale immediately if:
- `feature/v3-avatar-vault` moves from `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`;
- an `agent/a1-work/082-*` branch appears or moves;
- `src/core/api.js`, `src/app/avatar-vault.js`, Avatar Vault tests/validator/workflow, schema/RLS/grants, or the #82 contract changes;
- new exact candidate/workflow evidence appears;
- #82 freezes into a release;
- frozen base changes unexpectedly from `release/v3.54-psychometrics` / `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
