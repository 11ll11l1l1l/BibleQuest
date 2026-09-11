# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after post-release document reconciliation.

`DEVELOPMENT_PRIORITY_V3.md` is the current post-release task-selection authority. `FEATURE_INVENTORY_V3.md` remains the historical/release-parity ledger. Historical release-control documents no longer override active post-release development.

## Production/runtime baseline

- Production/runtime product baseline: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at that product SHA.
- Current `main` is a documentation-ahead descendant of that runtime product state; recover the live `main` HEAD before writing.
- The September 11 production release objective is complete.
- Historical applicable release-parity scope remains **98/98 complete**.
- #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.
- Production Supabase/data must not be changed merely because post-release development is green.

## Current exact-green post-release product

Recover live refs before acting. The newest known exact-green product checkpoint is:

- branch: `postrelease/v3-workspace-notes-schema-compat`;
- exact verified product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`;
- parent exact-green product: Assignment Private Responses SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- verifier run `34594577664`;
- job `103247250487`;
- conclusion: **success**.

That verifier checked out detached exact product SHA `61ee54fac7d352312cef7ffd8010997fa8bc9e51` and passed:

- exact-SHA and milestone-diff hygiene;
- Cloudflare deployment gate;
- focused Workspace Cloud Notes deployed-schema compatibility checks;
- accumulated visual static contracts;
- accumulated architecture validators;
- accumulated edge/security/static regressions;
- accumulated browser/mobile regressions;
- release-critical coverage-presence checks.

No PASS may be transferred to a changed product SHA.

## Completed/verified post-release checkpoints

### Visual Phase A

The replacement-level visual tranche program through tranche 16 reached exact-green SHA `406c34dcdf904b7483bf4381be774a908738e60c`.

This is now classified as **Visual Phase A: first-pass presentation polish complete**. It does not mean the user's desired final artwork quality is complete.

### Assignment Private Responses

Exact-green product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.

The source-controlled migration `supabase/migrations/20260911131000_assignment_response_presence.sql` was not applied to production during that development milestone. A later production integration requires migration review/deployment plus live authorization/privacy verification.

### Workspace / Cloud Notes schema compatibility

Exact-green product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.

This is the newest known exact-green post-release product checkpoint at the time of this update.

## Active Priority 1

Priority 1 now has three coordinated streams:

### 1A — Functional completion/correctness

Complete/correct accepted/currently planned functionality that remains unfinished, while preserving established owners and contracts.

### 1B — Visual Phase B

The user requires a further artwork-quality upgrade beyond the completed Phase A tranches:

- real polished icon artwork where current visuals remain generic/minimal/placeholder;
- background illustrations/decorative scene assets where useful;
- coherent art direction across major surfaces;
- actual implemented SVG/PNG/WebP or equivalent assets, not CSS/button decoration alone.

If an AI-generated visual asset is needed, generate it, select the best result, implement it directly, and verify it in the actual UI. Do **not** ask the user to approve the generated image first.

### 1C — Calendar

Calendar is active Priority 1 work. Recover any existing Calendar requirements/history first; if no authoritative contract exists, define `CALENDAR_V3.md`, then implement through existing architecture. Calendar must not be indefinitely deferred until all visual work is finished.

## Priority 2 — Integration/regression hardening

Use focused verification for each milestone and accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility verification at exact checkpoints. Fix root causes rather than weakening validators.

## Priority 3 — Production integration/promotion

Development milestones are not automatically production-live. A production integration step must separately handle exact candidate selection, migrations when required, exact-SHA verification, promotion, Cloudflare propagation and live smoke/authorization checks.

## Agent / triage status

Historical release-agent and `agent-analysis` findings are evidence only until revalidated against the current exact product checkpoint. A P0/P1 reported against an older SHA is not automatically a current blocker. Revalidate before interrupting Priority 1 work.

## Evidence rules

- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not verified product candidates.
- Distinguish branch HEAD from exact verified product SHA.
- Do not modify production Supabase/data without an explicit verified integration requirement.
- A GitHub promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.

## Defect / root-cause ledger

Historical release and milestone defect records remain in their focused evidence documents and commit history. Do not resurrect a historical defect as active unless it reproduces on the current product checkpoint.

## Next major milestone

Recover the live repository and newest exact-green checkpoint, revalidate any credible historical P0/P1 against that exact product state, then continue the highest-value dependency-safe Priority 1 milestone across functional completion, Visual Phase B, or Calendar according to `DEVELOPMENT_PRIORITY_V3.md`.
