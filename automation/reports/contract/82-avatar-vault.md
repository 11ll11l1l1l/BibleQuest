# A2 Contract Investigation — #82 Avatar Vault

Identity: `BQ-A2-CONTRACT`
Date: 2026-09-11 JST

## STATE / PROVENANCE

- Active milestone: **#82 Avatar Vault**.
- Canonical branch: `feature/v3-avatar-vault`.
- Exact canonical HEAD independently re-read immediately before this report update: `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated autonomous candidate: **none found** under `agent/a1-work/082-*`.
- Valid known-good frozen base for #82: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- A newer immutable ref `release/v3.55-avatar-vault` exists at exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`, but current primary-evidence defects mean A2 does **not** treat it as a known-good recovery base.
- Authoritative inventory at canonical records #81 `Regression-tested`, #82 `Verified`, #83 `Not started`.
- Exact bookkeeping evidence for canonical/release SHA: Actions run `34484163108` completed `success`; its job includes successful exact-candidate assertion plus accumulated architecture, edge/security and browser/mobile phases.
- Separate non-canonical lineage `manual/v3.55-avatar-vault-integrity-fix` exists at exact `619b8031491e67f5997da263822715172164fa71`, eight commits ahead of canonical. It is not the required autonomous candidate and has no Actions run for that branch.

This report becomes stale if canonical HEAD, a dedicated `agent/a1-work/082-*` candidate, the manual integrity-fix HEAD, release refs, authoritative inventory/contract, retained source, #82 persistence/API/schema behavior, permanent tests/workflow, or exact run evidence changes.

## PRIMARY EVIDENCE INSPECTED BEFORE TRIAGE

1. Control rules and A2 role documents on `automation/v3-agent-control`.
2. Live canonical SHA, valid frozen v3.54 base, immutable v3.55 ref, absence of `agent/a1-work/082-*`, and the separate manual integrity-fix lineage.
3. `FEATURE_INVENTORY_V3.md` at exact canonical SHA.
4. Retained `avatar-vault.js` as compatibility evidence only.
5. `AVATAR_VAULT_V3.md` at canonical.
6. Current v3 owners including `src/core/api.js` and Avatar Vault/Leaderboard boundaries.
7. Exact Actions run `34484163108` and job-step evidence.
8. `DEVELOPMENT_HANDOFF_V3.md` after live state inspection.
9. Manual-lineage corrective evidence: its `AVATAR_VAULT_V3.md`, `src/app/avatar-vault.js`, `supabase/migrations/20260910_avatar_vault_integrity_reconcile.sql`, `tests/v3-avatar-vault-postgres-edge.sh`, and canonical→manual commit comparison.
10. `automation/TRIAGE.md` only after provisional findings were formed.

## REQUIRED PARITY — FACT

The authoritative #82 contract remains exactly **`browse; select; persist; render fallback`**. It does not require wholesale reproduction of legacy globals, storage layout or every historical backend write.

Retained source defines 15 styles and thresholds. Current v3 retains all 15 but exposes only the five whose metrics already have a verified owner in Progress: `starter`, `sakura` (7 streak), `lantern` (500 XP), `flame` (30 streak), `crown` (2500 XP). The other 10 are explicitly unavailable pending their real metric owners. That remains consistent with rebuild-and-verify because #82 must not invent duplicate progression counters.

## VERIFIED OWNERS TO COMPOSE — FACT

- Session owns account identity/authentication state.
- `privateStorage` owns owner-scoped local persistence.
- Progress owns XP/streak; Avatar Vault must not duplicate those counters.
- `src/engines/avatar-vault.js` owns catalog/unlock evaluation.
- `src/app/avatar-vault.js` owns selection/lifecycle/local persistence coordination.
- `src/core/api.js` is the browser Supabase/API boundary.
- Leaderboards remains ranking/directory owner and may consume cosmetic presentation data only.
- Router remains navigation/history owner.

## RETAINED UX / STATE CONTRACT — FACT

- `starter` is the safe fallback.
- Locked/unavailable styles must not equip silently.
- Guest selection may remain device-only.
- Signed-in state may combine local owner-scoped cache with cloud persistence.
- Cloud failure must not destroy a valid local equip.
- Retained cloud behavior merges `cosmetic` into an existing avatar object rather than intentionally deleting unrelated avatar fields.
- Reopening the retained Vault re-attempts cloud synchronization.
- Cosmetic state is presentation/reward state only; no retained evidence authorizes score, rank, permission, doctrinal or spiritual authority.
- Real Vault and affected leaderboard presentation must remain usable on the contracted mobile surface.

## CANONICAL PERSISTENCE SHAPE — FACT

At exact canonical `60100f0...`, `src/core/api.js` performs two sequential browser-originated writes:
1. upsert `bible_avatar_cosmetics { user_id, selected_style }`;
2. update `bible_congregation_members.avatar` with the complete object `{ cosmetic: selectedStyle }` for that `user_id`.

The retained implementation instead constructed an avatar base by merging existing avatar state with `cosmetic:selected`. Therefore preserving unrelated avatar fields is primary retained evidence, not an invented requirement.

Canonical `load()` reads the cosmetics selection; it does not establish a database-level atomic projection or independently prove repair of a private/public split created after only the first write succeeds.

## CONTRACT-RELEVANT DEFECT EVIDENCE

### FACT — destructive avatar persistence conflicts with retained `persist`

Canonical cloud save can replace the complete congregation avatar with a cosmetic-only object. The retained implementation explicitly preserved existing avatar fields while adding the cosmetic. If #82 ignores this, selecting a cosmetic can destroy unrelated presentation state. This is directly material to `persist` and `render fallback`.

### FACT — canonical split persistence lacks demonstrated convergence

Canonical selection persists private cosmetic state before updating the congregation-visible avatar projection. A first-write-success/second-write-failure can leave the two cloud representations inconsistent. The green canonical suite does not contain a faithful database regression capable of proving transactional rollback/projection for this counterfactual.

### INFERENCE

The inventory does not require a particular RPC, trigger or transaction mechanism. It requires coherent persistence. The smallest acceptable correction must preserve unrelated avatar payload and provide a bounded way for the selected-style authority and congregation-visible projection to converge.

### RECOMMENDATION

Do not broaden #82 into a new avatar/profile system. Correct only the demonstrated persistence semantics and any independently established authorization/trust requirement. Preserve existing owners.

## MANUAL INTEGRITY-FIX LINEAGE — FACT, NOT CANDIDATE STATUS

`manual/v3.55-avatar-vault-integrity-fix` at `619b8031491e67f5997da263822715172164fa71` contains material corrective work, but it is **not** an authorized `agent/a1-work/082-*` candidate and has no exact branch run.

Primary evidence on that lineage attempts to address the two contract defects without inventing #83 scope:
- `20260910_avatar_vault_integrity_reconcile.sql` merges cosmetic-only avatar updates into the prior JSON object, removes the redundant broad self-avatar policy, restores a membership-qualified own-profile policy, and projects `bible_avatar_cosmetics.selected_style` into active congregation-member avatar rows in the same database transaction.
- `src/app/avatar-vault.js` re-saves the normalized selected style when the Vault opens, providing an application-level retry/reconciliation attempt after uncertain cloud state.
- `tests/v3-avatar-vault-postgres-edge.sh` is designed to execute a PostgreSQL regression proving unrelated avatar fields survive cosmetic updates and that a forced projection failure rolls back the cosmetics source write instead of committing split private/public state.

These are evidence of a plausible bounded correction, **not proof that #82 is fixed**. The branch has `0` Actions runs in the inspected branch-run query, and no PASS transfers from canonical/v3.55.

## TEST / WORKFLOW EVIDENCE — FACT

Exact run `34484163108` remains valid executed evidence for exact canonical/release SHA `60100f0...`: exact-candidate assertion, accumulated architecture validators, edge/security regressions, and browser/mobile regressions all completed successfully.

That green is insufficient to erase the persistence defects because the canonical permanent Avatar Vault test shape does not faithfully execute the real two-table database failure mode or prove preservation of unrelated avatar JSON.

The manual lineage adds stronger PostgreSQL-level counterfactual coverage, but there is currently no executed exact-SHA workflow evidence for `619b8031...`.

## RELEASE / LIFECYCLE FACT

`release/v3.55-avatar-vault` now exists at exact `60100f0...`. Because immutable release refs must not move, it is historical evidence and must remain untouched. Its existence does not convert a known defective exact SHA into a known-good base. A corrected #82 closure, if achieved, requires a new immutable release ref/version after its own exact functional/review/bookkeeping gates.

The canonical handoff and `automation/CURRENT.md` are stale relative to the live v3.55 ref and current defect investigation; neither overrides live Git/ref/run/product evidence.

## MISSING EVIDENCE

- No authorized `agent/a1-work/082-*` corrective candidate exists.
- No exact complete accumulated workflow run exists for manual corrective SHA `619b8031491e67f5997da263822715172164fa71`.
- No exact-candidate A3/A4 review applies to the manual corrective SHA.
- Canonical/v3.55 lacks permanent faithful proof that unrelated avatar JSON is preserved and split cloud writes cannot commit divergent state.
- Signed-in public cosmetic persistence must satisfy the current A3 trust/authorization boundary; A2 does not infer server authorization from browser-side unlock checks.

## EXPLICITLY OUT OF SCOPE — FACT

- Do not implement the 10 deferred metric-gated styles by inventing new counters.
- Do not absorb #83 Innovation or later inventory rows.
- Do not recreate legacy `window.BQ*` monkey patches.
- Do not restore duplicate writes to `bible_profiles` merely because legacy code did so.
- Do not redesign Progress, Leaderboards, Session or global avatar ownership beyond a demonstrated #82 dependency.
- Do not treat decorative public cosmetics as trusted achievement proof without a separately established trusted progression authority.
- Do not modify production Supabase/Cloudflare as part of #82 investigation.

## ACCEPTANCE CHECKLIST

#82 is contract-complete only when the exact corrected promotion candidate proves:

- [x] All 15 retained catalog styles are represented without invented metric owners.
- [x] Available XP/streak unlocks use exact retained thresholds.
- [x] Deferred styles fail closed.
- [x] Locked selection fails closed in the normal app path.
- [x] Guest/account local owner isolation exists.
- [x] Exact canonical `60100f0...` accumulated workflow executed green.
- [ ] Corrective candidate is on the authorized autonomous quarantine lifecycle or otherwise explicitly authorized by the controller.
- [ ] Cosmetic persistence preserves unrelated avatar fields.
- [ ] Partial cloud-write behavior has a bounded convergence/transaction contract and permanent executable regression.
- [ ] Signed-in public cosmetic semantics satisfy the current trust/authorization boundary established by A3.
- [ ] Corrected HIGH-RISK successor receives its own complete exact-SHA functional gate; no PASS transfers from `60100f0...` or v3.55.
- [ ] Required fresh exact-candidate A3/A4/A5 review gates are satisfied.
- [ ] Exact corrected bookkeeping SHA passes the complete accumulated suite before a **new** immutable corrective release freezes.

## TRIAGE COMPARISON AFTER INDEPENDENT PASS

After the provisional findings above were formed, `automation/TRIAGE.md` was read. It is current for canonical `60100f0...`, records the immutable v3.55 ref and manual `619b8031...` lineage, and reaches the same practical conclusion that #82 remains active. That agreement is advisory only; A2's retained-contract and persistence findings were independently established from primary code, contract, ref and run evidence first.

## FINAL A2 DISPOSITION

**FACT:** #82 remains bounded to **browse; select; persist; render fallback**. Canonical/inventory is marked `Verified` at exact `60100f0...`, and run `34484163108` is genuinely green for that state.

**FACT:** `release/v3.55-avatar-vault` now immutably points to the same exact SHA, but primary retained/current evidence still shows material `persist` defects at that SHA. The release ref therefore cannot be treated as a known-good recovery base merely because it exists.

**FACT:** Manual corrective lineage `619b8031...` contains focused mechanisms and executable PostgreSQL regression design that appear directly aimed at the retained persistence defects, but it is not the authorized autonomous candidate and has no exact run evidence.

**RECOMMENDATION:** Keep #82 active. Reconcile the bounded corrective work into the authorized candidate lifecycle without moving v3.55, obtain faithful permanent regressions plus a complete exact-SHA green and current HIGH-RISK reviews, then freeze a new corrected release. Do not invent the 10 deferred metric owners or absorb #83.