# A3 architecture/security review — #82 Avatar Vault

Agent: `BQ-A3-ARCH-SECURITY`
Date: 2026-09-10 JST

## STATE / PROVENANCE

FACT:
- Active canonical branch: `feature/v3-avatar-vault`.
- Exact canonical HEAD at final live re-read: `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated `agent/a1-work/082-...` candidate: **not found**.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact corrected bookkeeping run `34484163108` completed `success`. Its isolated verifier included an explicit `Assert exact Avatar Vault bookkeeping candidate` step and then completed accumulated architecture validators, edge/security regressions, Playwright/Chromium setup and accumulated browser/mobile regressions.
- Current canonical `.github/workflows/v3-regression.yml` is back to normal `workflow_dispatch`-only and invokes `scripts/validate-v3-avatar-vault.mjs`, `tests/v3-avatar-vault-edge.mjs` and `tests/v3-avatar-vault-smoke.mjs` while retaining prior accumulated coverage.
- This report becomes stale on any canonical/candidate/frozen SHA change, Avatar Vault API/persistence/schema/RLS/grant/server change, or new exact workflow evidence.

## INSPECTED PRIMARY EVIDENCE

FACT:
- Control rules: `automation/MASTER_CONTROL.md`, `automation/AGENT_GUARDRAILS.md`, `automation/agents/A3_ARCHITECTURE_SECURITY.md`, `automation/CURRENT.md`, `automation/WRITE_LEASE.md`, `automation/SCHEDULE_AND_LOCKING.md`.
- Live refs for canonical `feature/v3-avatar-vault`, missing `agent/a1-work/082-*`, and frozen `release/v3.54-psychometrics`.
- `DEVELOPMENT_HANDOFF_V3.md` on exact canonical.
- `src/app/avatar-vault.js`, `src/core/api.js`, `tests/v3-avatar-vault-edge.mjs`, `.github/workflows/v3-regression.yml` at exact canonical.
- Repository migrations `20260905_congregation_member_column_hardening.sql` and `20260910_avatar_vault_visibility.sql`.
- GitHub Actions run `34484163108` and its job/step results.
- Read-only live Supabase catalog queries for policies, table/column grants and relevant functions/RPCs on project `zkfmgezvzugchcwppreq`.
- `automation/TRIAGE.md` was read only after provisional findings were formed.

## REQUIRED OWNER / COMPOSITION

FACT:
- `src/app/avatar-vault.js` is the #82 selection/persistence owner and consumes Progress rather than duplicating XP/streak ownership.
- It performs unlock checks locally before calling `api.avatarVault.save()` for authenticated users.
- `src/core/api.js` is the browser Supabase boundary for Avatar Vault persistence.
- Leaderboards read `bible_congregation_members.avatar`; the cosmetic projection is therefore cross-user-visible congregation presentation state.

RECOMMENDATION:
- Keep Progress as the sole current client progression owner.
- Do not add duplicate XP/streak/question/assignment/Journey counters to Avatar Vault merely to authorize cosmetics.

## SAFE DATA FLOW

FACT:
- Current browser save flow is sequential:
  1. upsert `bible_avatar_cosmetics(user_id, selected_style, updated_at)`;
  2. update every `bible_congregation_members` row matching `user_id` with `avatar = { cosmetic: selectedStyle }`.
- `avatarVault.load()` reads only `bible_avatar_cosmetics.selected_style`; it does not read/reconcile congregation avatar projection.
- Current app service catches cloud failure and leaves device state authoritative with `synced:false`.

INFERENCE:
- A successful cosmetics upsert followed by a failed congregation update can leave private selected state and leaderboard-visible avatar diverged indefinitely because reopen loads only the cosmetics row.
- Replacing the complete `avatar` JSON with `{cosmetic: ...}` is destructive to any existing non-cosmetic avatar fields.

RECOMMENDATION:
- Preserve unrelated avatar keys when changing only the cosmetic projection.
- Use one authoritative persisted selection with deterministic projection, or a trusted transactional/reconciliation path that cannot leave private and public representations permanently split.
- Add a regression that reproduces first-write-success/second-write-failure and proves reopen convergence/recovery.

## AUTHORIZATION / RLS / GRANTS

FACT:
- Live `bible_avatar_cosmetics` policies are permissive authenticated own-row SELECT/INSERT/UPDATE policies keyed to `user_id = auth.uid()`.
- Live `bible_congregation_members` has a permissive authenticated UPDATE policy `members update own public profile` whose USING and WITH CHECK require both `auth.uid() = user_id` and `private.is_bible_congregation_member(congregation_id)`.
- Live table-wide UPDATE on `bible_congregation_members` is not granted to `authenticated`; column privileges permit UPDATE only on `display_name` and `avatar`.
- Repository migration `20260910_avatar_vault_visibility.sql` adds a second permissive authenticated UPDATE policy `members self avatar update` with only `user_id = auth.uid()` in USING/WITH CHECK.
- The migration does not scope that new policy to the `avatar` column; RLS policies operate at row level, while the existing column grant permits both `display_name` and `avatar` updates.

INFERENCE:
- If the repository migration is applied as written, PostgreSQL permissive UPDATE policies combine additively. The new own-row policy would permit an authenticated user to update an inactive/stale own membership row even when `private.is_bible_congregation_member(congregation_id)` is false, because the new policy omits that membership condition.
- Because authenticated has UPDATE privilege on both `display_name` and `avatar`, this broadening is not confined to cosmetic state; it also weakens the live authorization condition for `display_name`.

RECOMMENDATION:
- Do not deploy `members self avatar update` as written.
- Preserve the existing active-membership requirement. If a new policy is necessary, it must not broaden row eligibility beyond the verified live policy and must account for the fact that RLS cannot by itself restrict which granted column is updated.
- Do not broaden authenticated UPDATE grants beyond current public-presentation columns.

## SERVER / TRUST BOUNDARY

FACT:
- Live read-only function inspection found no Avatar Vault-specific trusted RPC/function. `bible_leaderboard(p_congregation uuid, p_since timestamptz)` exists, is SECURITY INVOKER (`security_definer=false`) and executable by authenticated users.
- Current cosmetic unlock enforcement is browser/app logic. Database policies constrain row ownership but do not allowlist cosmetic IDs or validate XP/streak thresholds.
- Current Progress facts used by #82 are device/client state, not a server-authoritative progression source.

INFERENCE:
- A signed-in user can bypass `createAvatarVaultService.select()` and write an arbitrary `selected_style` to their own `bible_avatar_cosmetics` row, subject only to own-row RLS. The database cannot prove that a public cosmetic was earned.

RECOMMENDATION:
- Choose and document one of two safe trust models:
  1. **Untrusted self-presentation:** congregation-visible cosmetic is decorative user-controlled state only and must never grant score, rank, permissions, achievement authority, ministry status or other trusted semantics.
  2. **Earned authoritative cosmetic:** move mutation behind a narrow authenticated trusted RPC/Edge/server path that derives identity server-side, allowlists style IDs, verifies eligibility from authoritative server-side progression facts, and updates the canonical selection/public projection atomically or with explicit reconciliation.
- Because current Progress is device-local, do not pretend server eligibility verification exists. Establishing trusted progression would be separate architecture work, not something Avatar Vault should synthesize silently.

## PRIVACY / SCOPE

FACT:
- `bible_avatar_cosmetics` is own-row private state under current RLS.
- `bible_congregation_members.avatar` is congregation-visible through membership/leaderboard directory reads.

RECOMMENDATION:
- Public avatar cosmetic state must contain only presentation data intended for congregation peers.
- Do not expose private progression metrics, psychometrics, assignment content or other private owner data through avatar JSON.

## LIFECYCLE / CLEANUP

FACT:
- #82 has no subscriptions/timers/channels in the inspected persistence path, so no new Realtime cleanup concern was introduced here.
- Failure handling currently reports `synced:false` but does not repair a split remote write.

RECOMMENDATION:
- Treat `synced:false` as insufficient unless there is a deterministic retry/reconciliation path for the public projection.

## WORKFLOW / TEST EVIDENCE

FACT:
- Exact run `34484163108` is green for the exact corrected bookkeeping candidate assertion at `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`; all accumulated phases completed successfully.
- Current canonical workflow includes Avatar Vault validator, edge and browser smoke.
- `tests/v3-avatar-vault-edge.mjs` covers catalog parity, local unlock thresholds, deferred styles, malformed metrics, guest/account isolation and service-level cloud failure reporting.
- That edge test mocks `api.avatarVault.save()` as one operation; it does not execute the two real Supabase writes, destructive avatar replacement, partial-write divergence, live RLS semantics, or direct-table bypass of browser unlock logic.

INFERENCE:
- Exact green execution proves the exercised suite passes, but it does not negate architecture/security defects outside the suite's modeled boundary.

RECOMMENDATION:
- Add permanent regressions capable of failing when:
  - an existing multi-key avatar is reduced to cosmetic-only JSON;
  - cosmetics upsert succeeds but congregation projection fails and remains stale after reopen/retry;
  - repository RLS broadens update authority beyond active own membership;
  - a locked/earned cosmetic is treated as trusted authority without server authorization.

## WHAT MUST NOT BE BROADENED

- Do not broaden own-membership UPDATE eligibility beyond the existing active-membership contract.
- Do not broaden authenticated UPDATE columns beyond the existing presentation-field grant without a separate proven requirement.
- Do not broaden `bible_avatar_cosmetics` beyond own-row access.
- Do not make client-submitted cosmetic IDs, XP, streak or `unlocked=true` trusted authorization facts.
- Do not let Avatar Vault become a parallel Progress/Assignments/Journey/Couples/Community metric owner.
- Do not make cosmetic state affect scoring, permissions, congregation roles, doctrinal/spiritual status or achievement authority unless a separately verified trusted owner explicitly defines that contract.
- Do not deploy production Supabase changes from this review.

## BLOCKING CONDITIONS

FACT:
1. Repository `avatarVault.save()` destructively replaces the complete congregation avatar JSON rather than preserving unrelated fields.
2. Two remote writes are non-atomic and `load()` has no public-projection reconciliation path.
3. Repository migration `members self avatar update` is broader than the live verified `members update own public profile` policy because it omits active congregation membership; if deployed it would also affect `display_name` because both columns are granted for UPDATE.
4. Browser unlock checks are not a trusted authorization boundary for a cross-user-visible cosmetic; no server-authoritative unlock path exists.
5. No dedicated `agent/a1-work/082-*` quarantine candidate exists.

MISSING EVIDENCE:
- A corrected exact successor SHA proving preservation of existing avatar JSON.
- A deterministic partial-write reconciliation/transaction behavior and regression.
- A migration/RLS contract that preserves active-membership authorization and does not broaden granted public-profile mutation scope.
- Explicit product trust classification for public cosmetics, with tests ensuring downstream features do not interpret untrusted decoration as earned authority; or, alternatively, faithful trusted-server eligibility evidence.
- Fresh complete exact-SHA run for that corrected successor.

## DISPOSITION

RECOMMENDATION: **A3 HIGH-RISK — TRUST BOUNDARY NOT SATISFIED / NOT READY for promotion at exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.**

Run `34484163108` resolves the earlier exact-execution gap, so test execution is no longer the reason to block. The remaining blockers are primary-evidence architecture/data-integrity/security defects: destructive avatar replacement, unreconciled split writes, a repository RLS migration that would broaden the live active-membership authorization boundary, and the absence of trusted earned-cosmetic authorization if public cosmetics are intended to signal earned status.

`automation/TRIAGE.md` was read only after these provisional findings were formed. Its current state is consistent with the independently verified primary evidence, but agreement is not used as proof.
