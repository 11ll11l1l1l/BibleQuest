# BibleQuest v3 — Product/Documentation Reconciliation

Status: required integration authority
Updated: 2026-09-11 JST

## Why this document exists

BibleQuest currently has verified post-release work on divergent branches while `main` contains newer documentation/planning commits. Chronological recency is therefore not the same thing as cumulative product truth. This document records the verified branch graph and the rules future development must use until a new cumulative product candidate is integrated and verified.

## Verified state recovered from repository evidence

### Production / rollback

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference branch: `release/v3-production-20260911-r3`
- current documentation-ahead `main` recovered before this reconciliation: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`

### Visual Phase A

- exact-green product SHA: `406c34dcdf904b7483bf4381be774a908738e60c`

### Assignment Private Responses

- exact-green product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`
- verifier run: `34588223163`
- required migration source: `supabase/migrations/20260911131000_assignment_response_presence.sql`
- migration blob on the verified Assignment line: `bbbceb057c631f08ec32826384ef6fcd61da4527`
- production migration state: not recorded as applied; treat as **UNAPPLIED until positively verified**

### Workspace / Cloud Notes schema compatibility

- exact-green product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`
- parent contains Assignment Private Responses exact-green product `73d39ce6fe0f9db20db62e25fd497a8711f921b0`
- verifier run: `34594577664`
- this line is cumulative for Assignment → Workspace

### Calendar v1.5

- release branch: `release/v3-calendar-v1-5`
- exact-green product SHA: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
- verifier branch: `verify/v3-calendar-v1-5-functional-01ba1-20260911`
- verifier run: `34604370963`
- conclusion: success
- this line is divergent from the Assignment → Workspace line; it is not a cumulative successor of `61ee54f...`

## Current global truth

**There is no single cumulative latest exact-green post-release product SHA at this point.**

Do not label a branch globally “latest” merely because its commit time is newer. Use ancestry, changed paths, feature ownership, milestone contracts and exact-SHA verification evidence.

Feature-level exact-green states are authoritative within their feature scope:

- Assignment Private Responses: `73d39ce...`
- Workspace schema compatibility: `61ee54f...` on top of Assignment
- Calendar v1.5: `01ba15e...` on its divergent Calendar line

A whole-product “latest exact-green” may be named only after intended feature lines are deliberately integrated into one candidate SHA and that exact SHA passes the required accumulated verification.

## Document authority and filename-collision rule

When documents disagree:

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection and priority;
3. this `RECONCILIATION_V3.md` for branch graph, integration truth and promotion gates;
4. `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md` for current summarized state;
5. feature-specific contracts for behavior **inside that feature only**;
6. exact-SHA workflow/test evidence;
7. historical ledgers/release/agent documents as evidence only.

A feature contract cannot overwrite cross-feature planning/status merely because it shares a filename with an older planning document. If the same filename diverges, diff both versions and preserve the newer verified feature behavior while keeping planning authority in the planning/status documents.

`CALENDAR_V3.md` is the Calendar behavior/ownership contract. It is not global priority or integration authority.

## Required reconciliation/integration route

Before any `main` product promotion:

1. recover live refs again; do not assume the SHAs above are still heads;
2. diff the intended feature lines and all conflicting docs rather than choosing by date;
3. use the cumulative Assignment → Workspace exact-green line (`61ee54f...`) as the dependency-preserving integration base unless newer repository evidence provides a verified cumulative successor;
4. replay/merge only the intended Calendar v1.5 product changes from its exact-green line, resolving conflicts by established owner contracts and verified behavior rather than chronology;
5. preserve `src/core/api.js` as the single browser backend/Supabase owner unless architecture is intentionally changed and separately verified;
6. create one cumulative candidate SHA;
7. run focused Assignment/Workspace/Calendar checks and the complete accumulated exact-SHA suite on that candidate;
8. reject and root-cause any regression; do not weaken validators;
9. only after the cumulative candidate is green may `main` product promotion be considered;
10. production deployment, Cloudflare propagation, database migration and live authorization/privacy smoke remain separate release evidence.

## Main promotion gate

`main` promotion is **BLOCKED** while verified feature work remains divergent and documentation claims a single latest product state that does not exist.

Promotion may proceed only when:

- conflicting docs have been explicitly reconciled;
- one cumulative candidate contains all selected product changes;
- the candidate's exact SHA passes the complete required accumulated suite;
- required migrations are reviewed against that exact candidate;
- rollback and production boundaries are preserved.

## Assignment response presence migration gate

The committed reviewed migration is `supabase/migrations/20260911131000_assignment_response_presence.sql` from the verified Assignment line. Detailed future-run instructions are in `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md`.

Rules:

- committed migration does not mean production-applied migration;
- compare production schema/migration state before deployment;
- compare any pasted/ad-hoc SQL to the committed reviewed migration; do not silently substitute a variant;
- do not apply this migration on a product line that does not contain/expect Assignment Private Responses simply because the SQL exists;
- when the compatible Assignment code is selected for production, apply the migration before or immediately after compatible code goes live;
- if migration briefly lags compatible code, expected blast radius is primarily the leader/ministry completion-presence view, but this is not permission to leave it unresolved;
- after migration, run live authorization/privacy smoke and record the applied migration/version;
- do not declare Assignment Private Responses fully production-live until this gate is complete.

## Testing rule

This reconciliation branch may contain documentation and contract tests, but it is **not** a product candidate. Its tests verify reconciliation invariants and the exact committed migration contract. Product integration must later earn a fresh complete exact-SHA verification of the integrated code.
