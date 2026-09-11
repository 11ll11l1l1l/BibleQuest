# BibleQuest v3 — Product/Documentation Reconciliation

Status: required integration authority
Updated: 2026-09-11 JST

## Purpose

BibleQuest has verified post-release work on divergent branches while `main` contains newer documentation/planning commits. **Chronological recency is not cumulative product truth.** This file records the verified branch graph and the rules future development must use until one cumulative exact-green product candidate exists.

## Production / rollback

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`
- documentation-ahead `main` recovered before this reconciliation: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`

Recover all refs live before acting; these SHAs are evidence anchors, not a substitute for repository recovery.

## Verified post-release branch graph

### Line A — Assignment → Workspace

1. **Assignment Private Responses**
   - exact-green product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`
   - verifier run: `34588223163`
   - required migration: `supabase/migrations/20260911131000_assignment_response_presence.sql`
   - reviewed migration blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`
   - production application state: not recorded; treat as **UNAPPLIED until positively verified**
2. **Workspace / Cloud Notes schema compatibility**
   - exact-green product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`
   - verifier run: `34594577664`
   - parent is Assignment exact-green `73d39ce...`; therefore this line is cumulative for Assignment → Workspace.

### Line B — Visual tranche 18 → Avatar Vault v2 → Calendar v1.5

1. **Visual game polish tranche 18**
   - release branch: `release/v3-visual-game-polish-tranche18`
   - exact-green product SHA: `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`
   - verifier branch: `verify/v3-visual-tranche18-functional-524ad-20260911`
   - verifier run: `34601602518`
   - conclusion: success
2. **Avatar Vault v2**
   - release branch: `release/v3-avatar-vault-v2`
   - exact-green product SHA: `7ce6685a7383102f29797869a77eabcf7ab9c0c2`
   - verifier branch: `verify/v3-avatar-vault-v2-functional-7ce66-20260911`
   - verifier run: `34603004871`
   - conclusion: success
   - `524adb...` is an ancestor of `7ce6685...`.
3. **Calendar v1.5**
   - release branch: `release/v3-calendar-v1-5`
   - exact-green product SHA: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
   - verifier branch: `verify/v3-calendar-v1-5-functional-01ba1-20260911`
   - verifier run: `34604370963`
   - conclusion: success
   - `7ce6685...` is an ancestor of `01ba15e...`; therefore Calendar v1.5 already contains the verified Visual18 → Avatar v2 chain.

### Why the lines cannot be collapsed by timestamp

`61ee54f...` and `01ba15e...` are **diverged**. Their recovered merge base is `545b5b98d88ca04001d3675317c37cbcd3306955`.

Therefore there is **no single cumulative latest exact-green post-release product SHA** at this point.

Do not call `01ba15e...` the whole-product latest merely because it is newer: it contains Line B but not Line A. Do not call `61ee54f...` the whole-product latest: it contains Line A but not later verified Line B work.

A whole-product exact-green SHA may be named only after the intended Line A and Line B work is deliberately reconciled into one candidate and that exact candidate passes the complete accumulated verification.

## Document authority and filename-collision rule

When documents disagree:

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection;
3. this `RECONCILIATION_V3.md` for branch graph/integration/promotion truth;
4. `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md` for summarized current state;
5. feature-specific contracts inside that feature only;
6. exact-SHA workflow/test evidence;
7. historical ledgers/release/agent documents as evidence only.

A feature contract cannot overwrite cross-feature planning/status merely because another branch used the same filename differently. Diff both sides. Preserve verified feature behavior inside its feature while keeping cross-feature priority/integration authority explicit.

`CALENDAR_V3.md` is the Calendar behavior/ownership contract. It is not global priority authority.

## Required cumulative integration route

Before any `main` product promotion:

1. refresh live refs, ancestry, changed paths and current workflow evidence;
2. re-confirm that the intended verified lines still correspond to Line A and Line B above;
3. use `61ee54f...` as the dependency-preserving Line A base unless newer evidence provides a verified cumulative successor;
4. integrate the **entire intended Line B delta**, not only the final Calendar files: preserve Visual tranche 18, Avatar Vault v2 and Calendar v1.5 behavior from `01ba15e...`;
5. use three-way diff/merge evidence from the recovered merge base rather than blindly cherry-picking by commit date;
6. resolve conflicts by architecture owner, feature contract and verified behavior;
7. preserve `src/core/api.js` as the single browser backend/Supabase owner unless an intentional architecture change is separately selected and verified;
8. produce one cumulative candidate SHA;
9. run focused Assignment + Workspace + Visual18 + Avatar v2 + Calendar checks;
10. run the complete accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility suite on that exact SHA;
11. reject regressions and fix root causes rather than weakening validators;
12. only after the cumulative candidate is exact-green may product promotion to `main` be selected.

## Main promotion gate

`main` promotion is **BLOCKED** while verified Line A and Line B remain divergent.

Promotion may proceed only when:

- conflicting docs/contracts have been explicitly reconciled;
- one cumulative candidate contains all selected verified product changes;
- that candidate earns fresh complete exact-SHA verification;
- required migrations are reviewed against that candidate;
- production/rollback boundaries are preserved.

A docs-only reconciliation commit does not make a product candidate green.

## Assignment response presence migration gate

Canonical reviewed migration: `supabase/migrations/20260911131000_assignment_response_presence.sql`, blob `bbbceb057c631f08ec32826384ef6fcd61da4527` from the verified Assignment line.

Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before production integration.

Rules:

- committed migration != production-applied migration;
- compare production schema/migration state before deployment;
- compare any pasted/ad-hoc SQL to the committed reviewed migration; do not silently substitute a variant;
- because the migration `create or replace`s `private.bible_assignment_visible(...)`, compare the deployed helper definition before applying;
- do not apply it on a product line that does not contain/expect Assignment Private Responses;
- when compatible Assignment code is selected for production, apply it before compatible code when practical or immediately after it;
- a short lag is expected mainly to affect the leader/ministry completion-presence view, but must be closed promptly;
- after migration, run live authorization/privacy smoke and record the applied migration/version;
- do not declare Assignment Private Responses fully production-live until migration state is `APPLIED + LIVE VERIFIED`.

## PNG icon-map reconciliation

The canonical 70-PNG assignment guide was recovered from `visual/v3-icon-asset-map` (branch head `df02e1d43d6b9c14d43de3212baf9b50c09f83d0`, guide blob `e42b7b5314e6581f00633290ecac84ff738c8002`) and is carried into this reconciliation as `docs/V3_ICON_ASSET_MAP.md`.

Important availability rule: at reconciliation time, `assets/icons/v3/` was **not present on current `main`**. Therefore the guide is the semantic/reference contract, not proof that the 70 PNG binaries are already committed. Before any future visual wiring, verify/import the exact assets, validate the 70-file set, and only then reference `assets/icons/v3/<filename>.png`.

Do not invent functionality merely to consume an icon. During an already-selected visual milestone, generated/mapped artwork should be chosen, implemented and tested without routine user approval.

## Testing rule

This reconciliation branch contains documentation/contract tests only and is **not** a product candidate. Its verifier must check:

- branch-change hygiene;
- cross-document branch-graph invariants;
- exact reviewed Assignment migration bytes/security contract;
- icon-map presence/semantic contract;
- unchanged-product deployment gate;
- existing Assignment authorization edge regressions available on the reconciliation base.

Later product integration must earn a fresh complete exact-SHA product verification.
