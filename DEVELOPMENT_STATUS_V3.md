# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after verified branch/document reconciliation.

Read `RECONCILIATION_V3.md` for the authoritative branch graph and integration gates. `DEVELOPMENT_PRIORITY_V3.md` remains the cross-feature task-selection authority. Feature contracts govern only their feature behavior.

## Production/runtime baseline

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`
- documentation-ahead `main` recovered before this reconciliation: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- September 11 production release objective: complete
- historical applicable release-parity scope: **98/98 complete**
- #39 Hiragana Match and #40 Kids Bible Who Am I: retired unless explicitly reopened

Production Supabase/data must not be changed merely because a development branch is green.

## Critical state: no single cumulative latest post-release product SHA

The previous status incorrectly described Workspace SHA `61ee54f...` as the globally newest exact-green product. Repository ancestry now proves that later Calendar v1.5 work is on a divergent exact-green line.

Therefore:

**There is currently no single cumulative latest exact-green post-release product SHA.**

Chronological recency is not cumulative product truth. Whole-product status requires intentional integration plus fresh exact-SHA accumulated verification.

## Verified post-release feature lines

### Visual Phase A

- exact-green SHA: `406c34dcdf904b7483bf4381be774a908738e60c`
- classification: first-pass presentation polish complete; not final artwork quality

### Assignment Private Responses

- exact-green product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`
- verifier run: `34588223163`
- migration: `supabase/migrations/20260911131000_assignment_response_presence.sql`
- migration blob on verified Assignment line: `bbbceb057c631f08ec32826384ef6fcd61da4527`
- production migration state: **NOT RECORDED AS APPLIED; treat as UNAPPLIED until positively verified**

The peer-visible presence projection must remain physically separated from private answer/feedback text. See `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md`.

### Workspace / Cloud Notes schema compatibility

- exact-green product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`
- parent includes Assignment exact-green SHA `73d39ce...`
- verifier run: `34594577664`
- this is the cumulative Assignment → Workspace line

### Calendar v1.5

- exact-green product SHA: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
- release branch: `release/v3-calendar-v1-5`
- verifier branch: `verify/v3-calendar-v1-5-functional-01ba1-20260911`
- verifier run: `34604370963`
- verifier conclusion: success
- this is a divergent Calendar line, not a cumulative successor of Assignment → Workspace

`CALENDAR_V3.md` is the Calendar feature contract and must preserve the implemented v1/v1.5 behavior recovered from the verified Calendar line.

## Current blocker to main product promotion

Main product promotion is blocked by **integration divergence**, not by a known P0/P1 product failure:

1. Assignment → Workspace and Calendar v1.5 exact-green lines must be intentionally reconciled into one cumulative candidate.
2. Conflicting planning/status/feature-contract documentation must be reconciled by authority and feature ownership, not by timestamp.
3. The cumulative candidate must earn its own complete exact-SHA accumulated verification.
4. Required production migrations must be reviewed against that exact candidate.

A docs-only reconciliation commit is not a product candidate.

## Correct next development route

1. preserve production and rollback;
2. use the verified cumulative Assignment → Workspace line as the dependency-preserving integration base unless newer evidence proves a better cumulative successor;
3. diff/replay the verified Calendar v1.5 changes onto that line, resolving conflicts by established ownership/contracts;
4. create one cumulative product candidate;
5. run focused Assignment/Workspace/Calendar checks plus complete accumulated exact-SHA verification;
6. only then consider `main` product promotion;
7. for a selected production release containing Assignment Private Responses, verify/apply the response-presence migration before or immediately after compatible code and run live authorization/privacy smoke;
8. separately verify Cloudflare propagation/live product behavior.

## Active Priority 1 after reconciliation

### 1A — Reconciliation/integration correctness

This is the immediate dependency gate. Do not start unrelated feature work while the repository cannot name a cumulative exact-green product state.

### 1B — Functional completion/correctness

Continue accepted/current functionality after the integration base is coherent, preserving one owner per responsibility.

### 1C — Visual Phase B

Real polished icon/art/background work remains active. Follow `VISUAL_PHASE_B_V3.md` and, where present, `docs/V3_ICON_ASSET_MAP.md`. Generated visual assets selected for an active visual improvement should be generated, chosen, implemented and tested directly without routine user approval.

### 1D — Calendar follow-up

Calendar v1.5 itself is verified on its feature line. Preserve its contract during cumulative integration before adding further Calendar work.

## Evidence rules

- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not verified product candidates.
- Distinguish branch HEAD, feature exact-green SHA and cumulative product SHA.
- Do not call the app bug-free.
- GitHub promotion is not Cloudflare propagation proof.
- A migration committed in Git is not evidence that production ran it.
- Do not choose a global “latest” product by commit date when verified branches diverge.
