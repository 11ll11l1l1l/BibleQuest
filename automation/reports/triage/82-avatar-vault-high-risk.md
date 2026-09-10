# A5 firewall reconciliation — #82 Avatar Vault

Identity: `BQ-A5-FIREWALL`
Date: 2026-09-10 JST

## Exact state
- Canonical `feature/v3-avatar-vault`: `f097411c395e65494cc383526aa0371bd925ac35`.
- Dedicated `agent/a1-work/082-*`: not found.
- Frozen base `release/v3.54-psychometrics`: `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact current-SHA workflow runs: none found.
- Lease observed: FREE.

## Primary evidence
The frozen-to-current compare is 8 commits ahead and includes new Avatar Vault engine/service code, changes to shared `src/core/api.js` and `src/app/leaderboards.js`, and migration `20260910_avatar_vault_visibility.sql`.

The migration adds `bible_congregation_members.avatar` and an authenticated UPDATE policy constrained by `user_id = auth.uid()` in both USING and WITH CHECK.

Current `avatarVault.save(userId, selectedStyle)` in `src/core/api.js` directly upserts `bible_avatar_cosmetics` and directly updates `bible_congregation_members.avatar` filtered by the caller-supplied `userId`. This is a browser Supabase path, not a trusted Edge/RPC operation.

The durable handoff itself says the implementation is in progress/not gated and lists bootstrap/UI/permanent tests/full functional verification as still outstanding.

## Report freshness
- A2 #82: missing at inspection.
- A3 #82: stale at `7f3a9a81...`; it predates all current product/schema/API changes and explicitly says schema/RLS/API introduction requires fresh HIGH-RISK review.
- A4 #82: stale at `7f3a9a81...`; it predates implementation and execution.

## Classification
### BLOCKER
1. No exact accumulated functional green exists for `f097411c...`.
2. Current schema/RLS/shared-API changes make #82 HIGH-RISK; fresh A3 trust-boundary review is required.
3. Exact-candidate A4 READY and A5 promotion recommendation are required after functional green.
4. No autonomous quarantine branch exists; further A1 writes must not continue directly on canonical.

Counterfactual: ignoring these items would permit an unverified HIGH-RISK canonical implementation with account/congregation persistence authority to advance without the required trust-boundary and regression barriers.

### MILESTONE
- Preserve only `browse; select; persist; render fallback`.
- Prove correct owner/auth boundary for account-backed cosmetic persistence and congregation-visible avatar state.
- Add meaningful permanent #82 coverage and complete the exact accumulated functional gate.

### DEFER
- Unsupported legacy metric unlocks remain deferred unless authoritative contract recovery proves they are required now.
- #83 remains separate.

### IGNORE
- Old #81 triage blockers are obsolete after frozen v3.54.
- Stale A3/A4 preflight conclusions cannot authorize current candidate.

## Disposition
**4 BLOCKER; 3 MILESTONE; NO PROMOTION RECOMMENDATION.**

Stale on any movement of canonical/candidate/frozen refs, appearance of an A1 work branch, new exact run evidence, or fresh A2/A3/A4 report.