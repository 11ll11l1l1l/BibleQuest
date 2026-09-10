# A2 Contract Investigation — #82 Avatar Vault

Identity: `BQ-A2-CONTRACT`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#82 Avatar Vault**.
- Canonical branch: `feature/v3-avatar-vault`.
- Exact canonical/bookkeeping HEAD independently re-read: `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated autonomous candidate: **none found** under `agent/a1-work/082-*`.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Authoritative inventory at this SHA records #81 `Regression-tested`, #82 `Verified`, #83 `Not started`.
- Exact bookkeeping evidence: Actions run `34484163108` completed `success`; its job includes a successful `Assert exact Avatar Vault bookkeeping candidate` step and successful accumulated architecture, edge/security and browser/mobile phases.
- Normal canonical workflow at this SHA remains `workflow_dispatch`-only and includes `validate-v3-avatar-vault.mjs`, `v3-avatar-vault-edge.mjs`, and `v3-avatar-vault-smoke.mjs` additively.

This report becomes stale if canonical HEAD, a dedicated `agent/a1-work/082-*` candidate, frozen base, authoritative inventory/contract, retained source, #82 persistence/API/schema behavior, permanent tests/workflow, or exact run evidence changes.

## PRIMARY EVIDENCE INSPECTED BEFORE TRIAGE

1. `FEATURE_INVENTORY_V3.md` at exact canonical SHA.
2. Retained `avatar-vault.js` on `main` as compatibility evidence only.
3. `AVATAR_VAULT_V3.md` at exact canonical SHA.
4. Current v3 owners: `src/engines/avatar-vault.js`, `src/app/avatar-vault.js`, `src/core/api.js`, leaderboard integration, Session/Progress/private-storage boundaries.
5. `tests/v3-avatar-vault-edge.mjs` and current `.github/workflows/v3-regression.yml`.
6. Live Git refs for canonical, frozen v3.54 and `agent/a1-work/082-*`.
7. Exact Actions run `34484163108` and its job/step evidence.
8. `DEVELOPMENT_HANDOFF_V3.md` as durable context after live evidence inspection.
9. `automation/TRIAGE.md` only after provisional findings were formed.

## REQUIRED PARITY — FACT

The authoritative #82 contract remains exactly **`browse; select; persist; render fallback`**. It does not require wholesale reproduction of legacy globals, storage layout or every historical backend write.

Retained source defines 15 styles and thresholds. Current v3 retains all 15 but exposes only the five whose metrics already have a verified owner in Progress: `starter`, `sakura` (7 streak), `lantern` (500 XP), `flame` (30 streak), `crown` (2500 XP). The other 10 are explicitly unavailable pending their real metric owners. That is consistent with rebuild-and-verify because #82 must not invent duplicate progression counters.

## VERIFIED OWNERS TO COMPOSE — FACT

- Session owns account identity/authentication state.
- `privateStorage` owns owner-scoped local persistence.
- Progress owns XP/streak; Avatar Vault must not duplicate those counters.
- `src/engines/avatar-vault.js` owns catalog/unlock evaluation.
- `src/app/avatar-vault.js` owns selection/lifecycle/local persistence coordination.
- `src/core/api.js` is the browser Supabase boundary.
- Leaderboards remains ranking/directory owner and may consume cosmetic presentation data only.
- Router remains navigation/history owner.

## RETAINED UX / STATE CONTRACT — FACT

- `starter` must remain the safe fallback.
- Locked/unavailable styles must not equip silently.
- Guest selection may remain device-only.
- Signed-in state may combine local owner-scoped cache with cloud persistence.
- Cloud failure must not destroy a valid local equip.
- Cosmetic state is presentation/reward state only; no retained evidence authorizes score, rank, permission, doctrinal or spiritual authority.
- Real Vault and affected leaderboard presentation must remain usable on the contracted mobile surface.

## CURRENT PERSISTENCE SHAPE — FACT

`src/app/avatar-vault.js` writes local owner-scoped state first and delegates signed-in cloud sync to `api.avatarVault.save(userId, styleId)`. `load()` reads the remote `selected_style` and updates the local selected style when present.

`src/core/api.js` currently implements cloud save as two sequential browser-originated writes:
1. upsert `bible_avatar_cosmetics { user_id, selected_style }`;
2. update `bible_congregation_members.avatar` with the complete object `{ cosmetic: selectedStyle }` for that `user_id`.

The retained v2 implementation did **not** replace the entire avatar object with a cosmetic-only object: it constructed `base={...existingAvatar, cosmetic:selected}` before writing profile/congregation avatar state. Therefore preserving unrelated avatar fields is supported by primary retained evidence, not an invented requirement.

## CONTRACT-RELEVANT DEFECT EVIDENCE

### FACT — destructive avatar persistence conflicts with retained `persist`

Current API save overwrites `bible_congregation_members.avatar` with `{cosmetic:selectedStyle}`. Retained v2 explicitly merged the cosmetic into an existing avatar object. If the v3 avatar contains other retained/rendered fields, the current save path can discard them. This is directly material to #82 `persist` and `render fallback`; preserving unrelated avatar state is the smallest retained-compatible behavior.

### FACT — cloud state has two representations but no reconciliation path

The cloud flow persists both `bible_avatar_cosmetics.selected_style` and the congregation-visible avatar projection. These writes are sequential. `load()` reads only `bible_avatar_cosmetics`; it does not inspect or repair the congregation-visible projection. A first-write-success/second-write-failure can therefore leave private/local selected state newer than leaderboard-visible state after reopen.

### INFERENCE

The inventory does not require a particular transaction mechanism, RPC, or broad refactor. It does require persistence to behave coherently. The smallest valid correction is one that preserves the non-cosmetic avatar payload and defines a bounded retry/reconciliation or single-authority path for the public projection.

### RECOMMENDATION

Do not broaden #82 into a new profile system. Preserve existing avatar fields when applying a cosmetic, and ensure the public cosmetic projection can converge after a partial cloud failure. Exact mechanism belongs to A1/A3 architecture decisions.

## TEST / WORKFLOW EVIDENCE — FACT

Current permanent edge tests cover catalog parity, exact XP/streak thresholds, deferred-style fail-closed behavior, fallback icon behavior, guest no-cloud behavior, locked selection, local persistence, cloud failure retaining local equip, and guest/account isolation.

Exact run `34484163108` is valid executed evidence for exact `60100f0...`: the exact-candidate assertion, accumulated architecture validators, accumulated edge/security regressions, and accumulated browser/mobile regressions all completed successfully. Current canonical workflow also explicitly contains `tests/v3-avatar-vault-smoke.mjs`.

However, the permanent edge test mocks `api.avatarVault.save()` as one operation. It cannot fail when the real API erases unrelated avatar JSON or when the first cloud write succeeds and the second fails. A green current workflow therefore does not negate these primary-evidence persistence defects.

## MISSING EVIDENCE

- No permanent regression was found that proves cosmetic save preserves existing non-cosmetic avatar fields.
- No permanent regression was found for first-write-success / second-write-failure followed by reopen/reconciliation.
- No dedicated `agent/a1-work/082-*` autonomous candidate exists for a corrected successor.
- Authorization/trust-boundary sufficiency for earned/public cosmetic semantics remains an A3 concern; A2 does not infer server authorization from browser-side unlock checks.

## EXPLICITLY OUT OF SCOPE — FACT

- Do not implement the 10 deferred metric-gated styles by inventing new counters.
- Do not absorb #83 Innovation or later inventory rows.
- Do not recreate legacy `window.BQ*` monkey patches.
- Do not restore duplicate writes to `bible_profiles` merely because legacy code did so.
- Do not redesign Progress, Leaderboards, Session or global avatar ownership beyond what a demonstrated #82 dependency requires.
- Do not touch production Supabase/Cloudflare as part of this read-only investigation.

## ACCEPTANCE CHECKLIST

#82 is contract-complete only when the exact promotion candidate proves:

- [x] All 15 retained catalog styles are represented without invented metric owners.
- [x] Available XP/streak unlocks use exact retained thresholds.
- [x] Deferred styles fail closed.
- [x] Locked selection fails closed.
- [x] Guest/account local owner isolation exists.
- [x] Exact `60100f0...` accumulated architecture/edge/browser-mobile workflow executed green, including current Avatar Vault smoke.
- [ ] Cosmetic persistence preserves unrelated avatar fields rather than replacing the avatar object.
- [ ] Partial cloud-write behavior has a bounded convergence/recovery contract and permanent regression.
- [ ] Signed-in public cosmetic persistence satisfies the current trust/authorization boundary established by A3.
- [ ] A corrected HIGH-RISK successor, if product/API/schema/tests change, receives its own exact complete gate; no PASS transfers from `60100f0...`.
- [ ] Exact bookkeeping SHA passes the complete accumulated suite before `release/v3.55-avatar-vault` freezes.

## TRIAGE COMPARISON AFTER INDEPENDENT PASS

`automation/TRIAGE.md` is current for canonical `60100f0...` and agrees that the exact bookkeeping run is green but persistence/trust defects remain. That agreement is advisory only; A2's persistence findings above were independently established from retained `avatar-vault.js`, current `src/app/avatar-vault.js`, current `src/core/api.js`, tests and exact run evidence before TRIAGE was read.

## FINAL A2 DISPOSITION

**FACT:** #82 remains bounded to **browse; select; persist; render fallback** and is inventory-marked `Verified` at exact `60100f0...`, with a genuine complete green accumulated run `34484163108`.

**FACT:** Primary retained and current implementation evidence shows the current cloud persistence path can replace an existing avatar object with a cosmetic-only object and can split the private selected-style record from the congregation-visible projection without reopen reconciliation. Those are material `persist` defects even though the current suite is green.

**RECOMMENDATION:** Keep #82 active. Correct only those demonstrated persistence semantics plus any independently established trust-boundary requirement; add permanent regressions capable of failing on the destructive-write and partial-write counterfactuals; rerun the complete accumulated suite on the exact corrected successor. Do not invent the 10 deferred metric owners or absorb #83.