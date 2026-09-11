# BibleQuest v3 — Current Development Priority

Updated: 2026-09-11 JST after repository reconciliation.

This is the **cross-feature post-release task-selection authority**. Read `RECONCILIATION_V3.md` immediately after this file for branch ancestry, exact-green lines and promotion/migration gates.

## Recovered production reference

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`

Recover these refs live before acting; they are reference anchors, not permission to skip repository recovery.

## Document authority

When documents disagree:

1. latest explicit user instruction;
2. this `DEVELOPMENT_PRIORITY_V3.md` for cross-feature priority/task selection;
3. `RECONCILIATION_V3.md` for branch graph, cumulative-product truth and integration gates;
4. current `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
5. feature-specific contracts for behavior inside their feature only;
6. exact-SHA workflow/test evidence;
7. `FEATURE_INVENTORY_V3.md` as historical/release-parity ledger;
8. historical release/visual/agent documents as evidence only.

Repository refs, ancestry, changed paths, exact SHAs and actually executed workflow results override stale prose.

A feature-specific contract cannot become global planning authority merely because it shares a filename with another branch. Diff conflicting files; preserve newer verified feature behavior within that feature and reconcile cross-feature status separately.

## Immediate Priority 1 — restore one cumulative product truth

There is currently **no single cumulative latest exact-green post-release product SHA**.

Verified lines include:

- Assignment Private Responses `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- Workspace schema compatibility `61ee54fac7d352312cef7ffd8010997fa8bc9e51`, cumulative on top of Assignment;
- Calendar v1.5 `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`, exact-green but divergent from the Assignment → Workspace line.

Do **not** select a global “latest” SHA by date.

### Required route

1. recover live refs and verify the branch graph again;
2. diff the divergent product lines and conflicting docs;
3. use `61ee54f...` as the dependency-preserving integration base unless newer evidence provides a verified cumulative successor;
4. replay/merge only the intended verified Calendar v1.5 product changes from `01ba15e...`;
5. resolve conflicts by feature ownership, verified contracts and tests, not chronology;
6. create one cumulative product candidate;
7. run focused Assignment, Workspace and Calendar verification;
8. run the complete accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility suite against that exact candidate SHA;
9. reject regressions and fix root causes rather than weakening validators;
10. only after exact-green cumulative verification may product promotion to `main` be selected.

Do not begin unrelated speculative feature work while this integration gap remains unresolved.

## Assignment response presence — production migration gate

The Assignment Private Responses migration is:

`supabase/migrations/20260911131000_assignment_response_presence.sql`

Canonical verified-line blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

Rules:

- repository presence is not proof of production application;
- treat production state as UNAPPLIED until positively verified;
- compare any supplied SQL against the committed reviewed file before use;
- before applying, compare the production definition of `private.bible_assignment_visible(...)` because the migration replaces that helper;
- do not apply the migration on an unrelated product line that does not contain/expect Assignment Private Responses;
- when compatible Assignment code is selected for production, apply the migration before or immediately after compatible code goes live;
- after application, run live authorization/privacy smoke and record the applied migration/version;
- do not call Assignment Private Responses fully production-live until the migration and live privacy checks are complete.

See `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md`.

## Main promotion gate

`main` product promotion is blocked until:

- divergent docs/contracts have been explicitly diffed and reconciled;
- selected verified feature work exists in one cumulative candidate;
- that candidate earns fresh exact-SHA accumulated verification;
- required migrations are reviewed against that exact candidate;
- production/rollback boundaries remain intact.

A documentation reconciliation branch may be merged as documentation, but that does not itself promote or validate product code.

## Priority 1 after cumulative integration

### Functional completion/correctness

Complete accepted/current functionality and reproduced defects while preserving established owners. Do not revive retired #39/#40 without explicit scope change.

### Visual/artwork Phase B

Visual Phase B remains required product-quality work after/alongside dependency-safe functional milestones:

- use real polished icons/backgrounds/illustrations where appropriate;
- preserve interface architecture, navigation, persistence and backend ownership;
- consult `docs/V3_ICON_ASSET_MAP.md` when present before generating/replacing icons;
- never invent a feature merely to use an available asset;
- if a selected visual improvement requires generated artwork, **generate → choose → optimize → implement → test** without routine image-approval interruption;
- maintain mobile readability, contrast, accessibility, performance and offline/PWA behavior.

### Calendar

Calendar v1.5 is already implemented and exact-green on its feature line. During cumulative integration, `CALENDAR_V3.md` is authoritative for Calendar behavior/ownership only. Preserve v1/v1.5 behavior before selecting new Calendar follow-ups.

## Production integration

Development green is not production-live. Production release evidence is separate:

1. exact cumulative candidate selected and verified;
2. required migrations reviewed/applied at the release boundary;
3. code promotion/deployment performed;
4. Cloudflare propagation confirmed independently;
5. live smoke + authorization/privacy checks passed;
6. handoff/status updated with exact evidence.

## Non-negotiable rules

- Rebuild-and-verify.
- One owner/source of truth per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim tests not executed.
- Documentation-only commits are not product SHAs.
- Chronological recency does not override branch ancestry.
- Do not mutate production Supabase/data outside an explicitly selected verified integration/release step.
- Do not weaken tests to make a candidate green.
- Do not call the app bug-free.
