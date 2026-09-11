# BibleQuest v3 generic continue prompt

Use this in a new BibleQuest development chat.

---

Continue development of BibleQuest v3 from the **exact current repository state**.

Repository: `11ll11l1l1l/BibleQuest`

## Recover truth first

1. Read `DEVELOPMENT_PRIORITY_V3.md`.
2. Read `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, `DEVELOPMENT_STATUS_V3.md`.
3. Read `FEATURE_INVENTORY_V3.md` only as the historical release-parity ledger.
4. Read `ARCHITECTURE_V3.md` and feature contracts as needed.
5. Recover live `main`, production/rollback refs, relevant `postrelease/*`, `release/*`, verifier refs, exact product SHAs, recent commits/actions, unapplied migrations and current investigator results.
6. Repository evidence + latest explicit user instruction override stale prose.

## Do not confuse recency with cumulative product truth

A newer timestamp does not make a divergent feature branch the global latest product.

Known reconciled reference state (re-check live before acting):

- production/runtime: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`;
- Line A Assignment Private Responses: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`, verifier `34588223163`;
- Line A Workspace compatibility: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`, verifier `34594577664`, descendant of Assignment;
- Line B Visual tranche 18: `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`, verifier `34601602518`;
- Line B Avatar Vault v2: `7ce6685a7383102f29797869a77eabcf7ab9c0c2`, verifier `34603004871`, descendant of Visual18;
- Line B Calendar v1.5: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`, verifier `34604370963`, descendant of Avatar v2;
- recovered Line A / Line B merge base: `545b5b98d88ca04001d3675317c37cbcd3306955`.

Line A and Line B diverge. Therefore the known reconciled state has **no single cumulative latest exact-green post-release product SHA**.

Never report one until the intended lines are integrated and the resulting exact SHA passes the complete accumulated suite.

## Document authority / conflicting filenames

latest user instruction → `DEVELOPMENT_PRIORITY_V3.md` → `RECONCILIATION_V3.md` → current handoff/status → feature contract inside its feature only → exact-SHA evidence → historical ledgers/release records.

If documents differ across branches, actually diff them. Do not guess which whole file wins. Preserve newer verified feature behavior inside that feature while preserving cross-feature planning/integration authority in the global documents.

`CALENDAR_V3.md` is authoritative for Calendar behavior/ownership only. Its implemented v1/v1.5 contract supersedes old generic Calendar planning prose inside Calendar scope.

## Immediate integration route while divergence exists

Until newer repository evidence proves a better cumulative successor:

1. use Line A `61ee54f...` as the dependency-preserving base;
2. reconcile the **full intended Line B delta through `01ba15e...`**, preserving Visual tranche 18 + Avatar Vault v2 + Calendar v1.5—not Calendar alone;
3. use merge-base/three-way diff evidence and architecture/feature ownership to resolve conflicts;
4. preserve `src/core/api.js` as the single browser Supabase/backend owner unless an intentional architecture change is separately selected/verified;
5. create one cumulative candidate SHA;
6. run focused Assignment + Workspace + Visual18 + Avatar + Calendar checks;
7. run complete accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility verification against that exact SHA;
8. root-cause failures; never weaken tests to force green;
9. only after exact-green cumulative verification may product promotion to `main` be selected.

Do not detour into unrelated speculative feature work while the repository lacks a cumulative product checkpoint.

## Assignment response presence migration — required release gate

Canonical migration:
`supabase/migrations/20260911131000_assignment_response_presence.sql`

Reviewed Assignment-line blob:
`bbbceb057c631f08ec32826384ef6fcd61da4527`

Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before production integration.

Rules:

- committed migration != production-applied migration;
- treat production state as `NOT APPLIED / UNKNOWN` until positively verified;
- compare any pasted/supplied SQL against the committed reviewed migration; do not silently run an ad-hoc variant;
- because the migration replaces `private.bible_assignment_visible(...)`, compare the deployed helper/body/current production schema before applying;
- do not apply the migration on an unrelated product line that does not contain/expect Assignment Private Responses;
- when compatible code is selected for production, apply before compatible code when practical or immediately after it;
- a short lag should mainly break/degrade the leader/ministry “who completed this?” presence view, but it must be closed promptly;
- after application, run live authorization/privacy smoke and record the applied migration/version;
- do not declare Assignment Private Responses fully production-live until state is `APPLIED + LIVE VERIFIED`.

Privacy boundary must remain true: private answer/feedback text stays private; `bible_assignment_response_presence` exposes only safe completion presence; authenticated clients cannot write that projection; RLS limits reads; sync SECURITY DEFINER function is not callable by public/anon/authenticated roles.

## PNG/icon visual rebuild rule

Read `docs/V3_ICON_ASSET_MAP.md` before future icon work. It maps all 70 analyzed PNG semantics.

Important: at reconciliation time `assets/icons/v3/` was **not present on `main`**. The guide is a semantic/reference contract, not proof that binaries are imported. Before wiring icons:

1. verify/import the exact intended 70-PNG set;
2. recheck dimensions/alpha/uniqueness as appropriate;
3. preserve canonical semantic assignments;
4. do not invent functionality just to use an icon;
5. wire through existing feature/component owners;
6. verify mobile/accessibility/performance/offline behavior;
7. run focused + accumulated exact-SHA tests.

For a selected visual improvement requiring generated/replacement artwork: **generate → choose → optimize → implement → test**. Do not ask for routine image approval. Ask only for decisions that materially change information architecture, product behavior, core theme direction, ownership or another major product decision.

## Rebuild-and-verify

- one owner/source of truth per responsibility;
- no competing Supabase/API/state owners;
- reproduce defects before fixing;
- focused tests for changed surfaces plus complete accumulated verification at candidate checkpoints;
- never transfer PASS across changed product SHAs;
- never claim unexecuted tests;
- docs-only commits are not product candidates;
- GitHub promotion is not Cloudflare propagation proof;
- do not call the app bug-free.

## Priority firewall

P0: production unusable/severe security, privacy, data-loss/core availability issue.
P1: major user-facing capability broken with no reasonable workaround.
P2: real defect/usability issue but not primary-use blocker.
P3: cosmetic/theoretical/speculative/low impact.

Only current credible P0/P1 may interrupt the selected integration route.

## Execute, do not only report

Recover live state, identify the highest-value dependency-safe gate, execute safe work immediately, verify it, preserve exact evidence, update docs when truth changes, and continue while safe work remains. Do not repeatedly ask the user to type “continue”.

At the end report separately:

- production SHA;
- live `main` HEAD;
- active branch;
- relevant Line A / Line B exact-green SHAs;
- cumulative exact-green candidate SHA or `NONE`;
- work actually completed;
- tests/workflows actually executed;
- credible unresolved blocker;
- migration state;
- next gate;
- whether production/Supabase were touched;
- anything that truly requires user action.

Retired #39/#40 remain retired unless explicitly reopened.

---
