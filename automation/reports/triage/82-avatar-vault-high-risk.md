# A5 firewall reconciliation — #82 Avatar Vault

Identity: `BQ-A5-FIREWALL`
Date: 2026-09-10 23:58 JST

## Exact state
- Active milestone: **#82 Avatar Vault — HIGH-RISK**.
- Canonical `feature/v3-avatar-vault`: exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Required `agent/a1-work/082-*`: **not found**.
- Valid frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- `release/v3.55-avatar-vault` now exists at `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Exact run `34484163108`: SUCCESS for explicit checkout/assertion of `60100f0...` and complete accumulated phases including Avatar Vault smoke.
- Lease: FREE.
- Manual corrective branch: `manual/v3.55-avatar-vault-integrity-fix` at `619b8031491e67f5997da263822715172164fa71`, eight commits ahead of canonical.

## Primary-evidence firewall findings

### BLOCKER 1 — destructive avatar replacement
FACT: canonical save writes `{cosmetic:selectedStyle}` as the complete congregation avatar object.

Counterfactual: any valid unrelated avatar keys are erased when cosmetic selection persists. This violates the active `persist` contract and data integrity.

### BLOCKER 2 — split persistence without convergence
FACT: canonical save performs cosmetics-table write before congregation-avatar projection; reopen loads only cosmetics selection.

Counterfactual: first write succeeds and second fails, leaving public/leaderboard presentation stale after reopen with no demonstrated repair path.

### BLOCKER 3 — authorization broadening
FACT: repository #82 migration adds a permissive own-row UPDATE policy lacking the verified active-membership condition. Authenticated UPDATE column grants include `display_name` and `avatar`.

Counterfactual: an inactive/stale own membership row can pass the new policy even where the existing active-membership policy rejects it, broadening public-profile mutation authority.

### BLOCKER 4 — premature immutable release checkpoint
FACT: A3 is current for exact `60100f0...` and reports trust boundary NOT SATISFIED; A4 is current for the same exact SHA and reports NOT READY. Nevertheless `release/v3.55-avatar-vault` now exists at that SHA. Master control requires A3 satisfaction and A4 READY before HIGH-RISK promotion, and frozen release refs must never be moved/repurposed/deleted.

Counterfactual: accepting v3.55 as known-good permits #83 to start from a release containing independently verified persistence/RLS defects. Therefore v3.55 must remain immutable but must not be used as the recovery/next-milestone base; corrected #82 must later freeze under a new release ref/version after all gates pass.

## Investigator freshness
- A2: current for `60100f0...`; independently identifies destructive persistence and split-write convergence gaps.
- A3: current for `60100f0...`; trust boundary NOT SATISFIED.
- A4: current for `60100f0...`; NOT READY despite exact green run.
- Agreement is not proof; A5 verified live canonical/release refs and exact run state before applying these reports.

## MILESTONE
- Keep contract bounded to `browse; select; persist; render fallback`.
- Correct avatar merge/preservation, partial-write convergence, and RLS authorization without broadening active-membership authority.
- Resolve public cosmetic trust as either explicitly untrusted presentation or earned state protected by a real trusted authorization path.
- Add meaningful permanent regressions for the demonstrated counterfactuals and preserve accumulated coverage.
- Reconcile corrective work into the required `agent/a1-work/082-*` lifecycle; do not promote the manual branch directly merely because it exists.
- Require exact complete green, fresh A3 satisfaction, exact-candidate A4 READY and then A5 promotion recommendation before creating a new corrected release checkpoint.

## DEFER
- Ten cosmetics lacking verified metric owners remain unavailable.
- Manual branch `619b803...` is potentially useful corrective lineage but is not current promotion evidence until exact candidate lifecycle/reviews exist.
- #83 remains blocked.

## IGNORE
- Earlier lack-of-exact-run concern: obsolete because run `34484163108` is green for exact checkout/assertion of `60100f0...`.
- Stale CURRENT/handoff wording does not override live refs or exact evidence.

## Disposition
**4 BLOCKER; NO PROMOTION RECOMMENDATION. `release/v3.55-avatar-vault` is immutable but not acceptable as a known-good base.**

## Staleness
Stale on canonical/work/release movement, #82 implementation/API/schema/RLS/test/workflow change, new exact run evidence, or new exact-candidate A3/A4 review.