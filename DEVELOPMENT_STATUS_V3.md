# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after exact-SHA verification of Workspace Cloud Notes schema compatibility and reconciliation of current post-release priorities.

`DEVELOPMENT_PRIORITY_V3.md` is the current post-release task-selection authority. `FEATURE_INVENTORY_V3.md` remains the historical/release-parity ledger. Historical release-control and release-agent documents are evidence only.

## Production/runtime baseline

- Production/runtime product baseline: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at that product SHA.
- Current `main` may contain later documentation-only descendants; recover its live HEAD before writing.
- The September 11 production release is complete.
- Historical applicable release scope remains 98/98 complete.
- #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.
- Production Supabase/data remains unchanged by the Workspace schema-compatibility development milestone.

## Current exact-green post-release product

- Branch: `postrelease/v3-workspace-notes-schema-compat`.
- Exact verified product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.
- Parent exact-green product: Assignment Private Responses SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
- Verifier run: `34594577664`.
- Job: `103247250487`.
- Conclusion: **success**.

The verifier checked out detached exact product SHA `61ee54fac7d352312cef7ffd8010997fa8bc9e51` and passed:

- exact-SHA and exact milestone-diff hygiene;
- Cloudflare deployment gate;
- focused Workspace Cloud Notes schema compatibility checks;
- accumulated visual static contracts;
- accumulated v3 architecture validators;
- accumulated edge/security/static regressions;
- accumulated browser/mobile regressions;
- release-critical coverage presence.

Documentation reconciliation commits after that SHA are evidence only and do not replace `61ee54f...` as the verified product checkpoint.

## Verified milestone lineage

1. Visual Phase A / tranche 16: `406c34dcdf904b7483bf4381be774a908738e60c`.
2. Assignment Private Responses: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
3. Workspace Cloud Notes deployed-schema compatibility: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.

## Visual status

The earlier replacement-level visual tranche program is **Visual Phase A: first-pass presentation polish complete**. It is preserved as verified evidence but does not mean the user's final visual-quality requirement is complete.

**Visual Phase B is active Priority 1 work** and targets real polished icon artwork, illustrations and backgrounds where the current product remains generic/minimal/placeholder. Generated visual assets should be selected and implemented directly without asking the user for an approval stop, then verified in the actual UI.

## Assignment Private Responses production boundary

Migration `supabase/migrations/20260911131000_assignment_response_presence.sql` remains a development/source-controlled migration until a separately selected production integration step applies/reviews it and performs live authorization/privacy verification. Do not claim the feature production-live from development verification alone.

## Workspace schema-compatibility milestone

The exact-green Workspace milestone aligns the Cloud Notes path with the deployed schema while preserving the established `src/core/api.js` backend ownership and existing Workspace/Cloud Notes contracts.

## Active Priority 1

### 1A — Functional completion/correctness

Continue accepted/currently planned work that remains incomplete, preserving architecture owners and verified behavior.

### 1B — Visual Phase B

Continue the real artwork/icon/background quality upgrade rather than treating Phase A CSS/presentation polish as final visual completion.

### 1C — Calendar

Calendar is active Priority 1 work. Recover existing requirements/history or define `CALENDAR_V3.md`, then implement through established architecture when dependencies permit. Do not defer Calendar until every cosmetic task is complete.

## Agent / triage status

Historical investigator findings are evidence only until revalidated against the current exact product checkpoint. A P0/P1 reported against an older SHA does not automatically interrupt current work.

## Evidence rules

- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not product candidates.
- Distinguish branch HEAD from exact verified product SHA.
- Do not introduce competing backend/Supabase/state owners.
- Do not modify production Supabase/data without an explicit verified integration requirement.
- A GitHub promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.

## Defect / root-cause ledger

Historical defects remain in their milestone evidence and commit history. Revalidate before treating an old defect as active on the current checkpoint.

## Next major milestone

Recover live refs and any newer verified product evidence, revalidate credible historical P0/P1 against the current exact product, then execute the highest-value dependency-safe Priority 1 milestone across functional completion, Visual Phase B or Calendar according to `DEVELOPMENT_PRIORITY_V3.md`.
