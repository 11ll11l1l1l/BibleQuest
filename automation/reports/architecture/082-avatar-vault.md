# A3 Architecture / Security Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A3-ARCH-SECURITY

## STATE / PROVENANCE
- Current canonical/bookkeeping head: `feature/v3-avatar-vault` at `dde924f86f83baf78659f303e442930b38749aca`.
- Exact product functional candidate: `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- The three commits from `37f1dc6...` to `dde924f...` change only development status/handoff/inventory bookkeeping; inspected product/API/migration semantics are unchanged.
- Functional run `34483151962` completed success against exact `37f1dc6...`, including #82 browser smoke. This does not prove untested data-integrity semantics.
- #82 remains HIGH-RISK because the lineage changes schema/RLS source, shared API/leaderboard ownership, workflow, and an existing accumulated validator.
- Stale if product/API/migration/workflow semantics or exact canonical state changes.

## LIVE BACKEND FACTS
- Production already has non-null JSONB `bible_congregation_members.avatar` with a structured default including `face`, `outfit`, `companion`, and `background`.
- Authenticated avatar column privileges already exist.
- Production already has an UPDATE policy `members update own public profile` requiring own user id plus current congregation membership.
- `bible_avatar_cosmetics` already exists with own-row SELECT/INSERT/UPDATE RLS.

The candidate migration premise that the live avatar column and member UPDATE policy were absent is false for the inspected live project.

## BLOCKER 1 — SHARED AVATAR DATA LOSS
Current `api.avatarVault.save` still constructs `{cosmetic:selectedStyle}` and replaces the complete `bible_congregation_members.avatar` JSON value. Retained behavior merged cosmetic into the existing avatar. Congregation Recognition consumes the full avatar object.

Counterfactual: equipping a cosmetic can erase unrelated avatar fields owned/used outside #82. Required fix is an authoritative merge/update of only cosmetic state while preserving every unrelated key.

## BLOCKER 2 — SPLIT CLOUD STATE / FALSE RETRY
Current save writes `bible_avatar_cosmetics` first and congregation avatar second. `load()` reads selected style but does not reconcile the second representation. UI promises failed sync will retry on reopen.

Counterfactual: first write succeeds, second fails; private selection is current but congregation-visible avatar remains stale indefinitely. Required fix is a single transactional/trusted operation or deterministic idempotent reconciliation, with a faithful partial-failure test.

## BLOCKER 3 — MIGRATION / POLICY MISMATCH
Candidate migration uses `add column if not exists avatar ... default '{}'` and adds a separate permissive `members self avatar update` policy scoped only by own user id. Live schema already has a structured avatar and a membership-qualified public-profile UPDATE policy.

Counterfactual: repository/fresh-install authorization semantics diverge from verified live semantics and a redundant broader policy becomes another authorization path. Reconcile migration history/live schema and preserve one intended membership-qualified authority; do not deploy a supposed fix for a permission gap not present in live evidence.

## TEST / WORKFLOW ASSESSMENT
- Dedicated #82 390px smoke is now present and was executed in functional run `34483151962`.
- Existing #82 edge tests still mock `api.avatarVault` as one unit and cannot detect full-avatar replacement or first-write-success/second-write-failure divergence.
- #82 validator still requires the `.update({avatar})` structural pattern and migration assumptions rather than semantic preservation/reconciliation.
- The existing #81 validator change is narrowly consistent with removing an obsolete future-state assertion, but it still triggers HIGH-RISK review under the guardrails.

## AUTHORIZATION / PRIVACY
No direct cross-user write exploit was demonstrated. Session identity and RLS protect own-row writes. Guest data remains device-only; cosmetics do not carry psychometric/private data or score/permission authority.

## ARCHITECTURE DECISION
**NOT READY** at `dde924f86f83baf78659f303e442930b38749aca`.

A green functional run does not supersede the three primary-evidence blockers above because the harness does not exercise them. Do not recommend bookkeeping/release promotion until shared-avatar preservation, cloud convergence, and migration/RLS semantics are corrected and then reverified on a new exact SHA.