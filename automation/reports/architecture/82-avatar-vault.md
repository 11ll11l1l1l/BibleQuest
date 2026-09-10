# A3 architecture/security review — #82 Avatar Vault

Agent: `BQ-A3-ARCH-SECURITY`
Date: 2026-09-10 JST

## STATE / PROVENANCE

FACT:
- Active canonical branch: `feature/v3-avatar-vault`.
- Exact canonical HEAD at final live re-read: `7f3a9a81e714fe37ac7d6ec54f9b65752898da39`.
- Dedicated `agent/a1-work/082-...` candidate: **not found**.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- The current #82 branch delta from the frozen base is milestone/handoff documentation only; no #82 product implementation, schema/RLS/grant/RPC/Edge/API change or #82 permanent executable test was established at this SHA.
- #82 remains `Not started` in the authoritative inventory at the inspected lineage.
- No exact #82 functional accumulated-workflow PASS exists at this SHA. #81 run `34474642839` belongs to exact frozen #81 and must not be transferred to #82.
- This report is stale on any canonical/candidate/frozen SHA change, appearance of an `agent/a1-work/082-...` branch, or introduction of Avatar Vault product/schema/RLS/grant/RPC/API/storage/router code.

## PRIMARY RETAINED EVIDENCE

FACT:
- Retained v2 `avatar-vault.js` models cosmetic styles unlocked from BibleQuest progress metrics and persists selected/unlocked state locally.
- The retained implementation also performs direct client database access: it reads `bible_avatar_cosmetics` and `bible_assignment_progress`, upserts selected cosmetic state, and updates avatar fields in `bible_profiles` and `bible_congregation_members` for the authenticated user.
- Legacy unlock predicates depend on progression facts including streak, answered/correct counts, XP, recall-card activity, couples/group activity, Journey mastery, and completed leader assignments.
- The retained UI explicitly describes these rewards as cosmetic and not score/spiritual-rank authority.

INFERENCE:
- The retained direct-client persistence/query pattern is recovery evidence, not a safe architecture prescription for v3. Copying its broad cross-owner data access would reintroduce duplicated authority across progression, assignments, profile/congregation and cosmetic state.
- Because current #82 has no product implementation yet, absence of an implementation is a preflight/missing-evidence condition, not itself an architecture/security defect.

## SAFE TRUST BOUNDARY

RECOMMENDATION:
- Treat cosmetic presentation/equipped selection separately from authoritative unlock eligibility and progression facts.
- Consume progression/assignment/account facts through their existing verified owners rather than re-reading their backing tables directly from Avatar Vault.
- If equipped selection is intentionally device-local only, keep that low-sensitivity preference in an existing owner-scoped local storage path and do not invent remote persistence.
- If cross-device cosmetic ownership/equipped state is required by authoritative recovery evidence, use an authenticated trusted server path. The server must derive the user identity from authentication, constrain rows to that user, allowlist cosmetic IDs, and independently validate any unlock condition from authoritative progression data rather than accepting browser-supplied eligibility.
- The client must never be able to grant itself arbitrary unlocks, forge progression, mutate another user's cosmetic/profile state, or turn cosmetics into score/permission authority.

## WHAT MUST NOT BE BROADENED

- Do not copy legacy direct client Supabase ownership over `bible_profiles`, `bible_congregation_members`, assignments, progression or cosmetics merely for parity convenience.
- Do not broaden #82 into XP/scoring authority, assignment completion, congregation-role state, auth/session changes, leaderboard authority, or new progression ownership.
- Do not add schema/RLS/grants/security-definer functions/RPCs/Edge authority without treating the exact candidate as HIGH-RISK and performing a fresh A3 review.
- Do not change shared storage, router/shell or API semantics unless the exact milestone contract requires it; such changes are HIGH-RISK control triggers.

## REQUIRED SERVER / AUTHORIZATION PATH

FACT:
- There is no new server path to approve at current `7f3a9a81...` because #82 product implementation has not landed.

RECOMMENDATION:
- A server path is required only if #82 introduces cross-device/account-backed cosmetic ownership or selection. In that case, authorization must be authenticated-user scoped and unlock eligibility must be server-validated from trusted source owners.
- If #82 remains purely local presentation/selection over already-authoritative read-only facts, do not invent a server write path.

## MISSING EVIDENCE

- Exact implemented v3 owner/module and data flow for #82.
- Exact authoritative persistence requirement: local-only selection versus cross-device/account-backed state.
- Any proposed schema/migration/RLS/grants/trusted RPC/Edge path.
- Permanent #82 architecture/security and browser/mobile tests.
- Exact accumulated workflow run for an implemented #82 candidate.
- Dedicated A1 quarantine candidate.

## DISPOSITION

INFERENCE/RECOMMENDATION: **A3 PRE-FLIGHT / NOT YET REVIEW-READY for #82 at exact `7f3a9a81e714fe37ac7d6ec54f9b65752898da39`.** No current architecture/security defect is established because the branch contains no #82 product implementation yet. The principal security constraint for implementation is to avoid reviving legacy direct-client cross-owner database authority; any account-backed unlock/equip persistence must be server-authorized and progression eligibility must remain owned by trusted existing sources.

TRIAGE was read only after the independent primary-evidence findings were formed and was not used as evidence.