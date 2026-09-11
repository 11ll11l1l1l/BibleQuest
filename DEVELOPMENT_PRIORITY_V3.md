# BibleQuest v3 — Current Development Priority

Updated: 2026-09-11 JST after repository reconciliation.

This is the **cross-feature post-release task-selection authority**. Read `RECONCILIATION_V3.md` immediately after this file for branch ancestry, exact-green lines and promotion/migration gates.

## Production reference

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`

Recover these refs live before acting.

## Document authority

When documents disagree:

1. latest explicit user instruction;
2. this `DEVELOPMENT_PRIORITY_V3.md` for cross-feature priority/task selection;
3. `RECONCILIATION_V3.md` for branch graph, cumulative-product truth and integration gates;
4. current `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
5. feature-specific contracts inside their feature only;
6. exact-SHA workflow/test evidence;
7. `FEATURE_INVENTORY_V3.md` as historical release-parity ledger;
8. historical release/visual/agent documents as evidence only.

Repository refs, ancestry, changed paths, exact SHAs and actually executed workflow results override stale prose.

## Immediate Priority 1 — restore one cumulative product truth

There is currently **no single cumulative latest exact-green post-release product SHA**.

### Verified Line A — Assignment → Workspace

- Assignment Private Responses `73d39ce6fe0f9db20db62e25fd497a8711f921b0`, verifier `34588223163`.
- Workspace schema compatibility `61ee54fac7d352312cef7ffd8010997fa8bc9e51`, verifier `34594577664`, cumulative on Assignment.

### Verified Line B — Visual18 → Avatar Vault v2 → Calendar v1.5

- Visual tranche 18 `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`, verifier `34601602518`.
- Avatar Vault v2 `7ce6685a7383102f29797869a77eabcf7ab9c0c2`, verifier `34603004871`, descendant of Visual18.
- Calendar v1.5 `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`, verifier `34604370963`, descendant of Avatar Vault v2.

Line A and Line B diverge. Do **not** select a global “latest” SHA by date.

### Required route

1. recover live refs and verify the branch graph again;
2. diff the divergent product lines and conflicting docs;
3. use `61ee54f...` as the dependency-preserving Line A base unless newer evidence provides a verified cumulative successor;
4. reconcile the **whole intended Line B delta through `01ba15e...`**, preserving Visual18 + Avatar v2 + Calendar v1.5—not Calendar alone;
5. use merge-base/three-way evidence and feature ownership, not chronology, to resolve conflicts;
6. create one cumulative product candidate;
7. run focused Assignment, Workspace, Visual18, Avatar and Calendar verification;
8. run the complete accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility suite against that exact candidate SHA;
9. reject regressions and fix root causes rather than weakening validators;
10. only after exact-green cumulative verification may product promotion to `main` be selected.

Do not begin unrelated speculative feature work while this integration gap remains unresolved.

## Assignment response presence — production migration gate

Canonical migration:

`supabase/migrations/20260911131000_assignment_response_presence.sql`

Reviewed blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

Rules:

- repository presence is not proof of production application;
- treat production state as UNAPPLIED until positively verified;
- compare any supplied SQL against the committed reviewed file before use;
- before applying, compare the deployed definition of `private.bible_assignment_visible(...)` because the migration replaces that helper;
- do not apply the migration on an unrelated product line that does not contain/expect Assignment Private Responses;
- when compatible Assignment code is selected for production, apply the migration before compatible code when practical or immediately after it;
- a brief lag should mainly affect the leader/ministry completion-presence view, but it must be closed promptly;
- after application, run live authorization/privacy smoke and record the applied migration/version;
- do not call Assignment Private Responses fully production-live until the migration is `APPLIED + LIVE VERIFIED`.

See `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md`.

## Main promotion gate

`main` product promotion is blocked until:

- divergent docs/contracts have been explicitly diffed and reconciled;
- Line A and selected Line B work exist in one cumulative candidate;
- that candidate earns fresh exact-SHA accumulated verification;
- required migrations are reviewed against that exact candidate;
- production/rollback boundaries remain intact.

A documentation reconciliation branch may be merged as documentation, but that does not itself validate product code.

## Visual/artwork rule

`docs/V3_ICON_ASSET_MAP.md` is the canonical semantic assignment guide for the 70-PNG family. At reconciliation time the actual `assets/icons/v3/` binaries were not present on `main`, so future visual work must verify/import the exact asset set before wiring it.

For selected visual work:

- preserve information architecture, navigation, persistence and backend ownership;
- do not invent functionality just to consume artwork;
- use the mapped semantic role when the asset exists;
- if a replacement/new asset is needed, **generate → choose → optimize → implement → test** without routine image-approval interruption;
- verify mobile layout, touch targets, accessible names/state, performance and offline/PWA behavior.

## Calendar

Calendar v1.5 is implemented and exact-green on Line B. `CALENDAR_V3.md` is authoritative for Calendar behavior/ownership only. Preserve its v1/v1.5 contract during cumulative integration before selecting new Calendar follow-ups.

## Non-negotiable rules

- Rebuild-and-verify.
- One owner/source of truth per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim tests not executed.
- Documentation-only commits are not product SHAs.
- Chronological recency does not override ancestry.
- Do not mutate production Supabase/data outside an explicitly selected verified integration/release step.
- Do not weaken tests to make a candidate green.
- GitHub promotion is not Cloudflare propagation proof.
- Do not call the app bug-free.
