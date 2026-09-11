# BibleQuest v3 generic continue prompt

Use this in a future BibleQuest development chat. It is evergreen: recover live repository truth first and skip work already completed by then.

---

Continue development of BibleQuest v3 from the **exact current repository state**.

Repository: `11ll11l1l1l/BibleQuest`

## Recover truth first

1. Read `DEVELOPMENT_PRIORITY_V3.md`.
2. Read `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, and `DEVELOPMENT_STATUS_V3.md`.
3. Read `FEATURE_INVENTORY_V3.md` only as the historical release-parity ledger.
4. Read `ARCHITECTURE_V3.md` and relevant feature contracts.
5. Recover live `main`, production/rollback refs, active development/release/verifier branches, exact product SHAs, recent commits/actions, current migrations and investigator findings.
6. Repository evidence and my latest explicit instruction override stale prose.

Do not repeat a completed milestone merely because an older document describes it as pending.

## Known verified reference checkpoint — re-check live

At the time this prompt was updated:

- production/runtime SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`;
- live `main`: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`;
- cumulative exact-green post-release product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`;
- cumulative verifier run: `34610903807` — success;
- parent Line A: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`;
- parent full Line B: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`.

`cf17f36...` already reconciles Assignment Private Responses + Workspace compatibility with Visual tranche 18 + Avatar Vault v2 + Calendar v1.5. Do **not** redo the former Line A/Line B integration unless newer repository evidence proves another divergence.

A following documentation-only branch HEAD is not a new verified product SHA.

## Next-gate rule

If `cf17f36...` or a verified cumulative successor has not yet been promoted/released, first determine whether controlled main/production integration is still the correct dependency-safe gate. Refresh `main` before any write.

Do not automatically deploy or mutate production simply because a candidate is green. Main promotion, Cloudflare propagation and Supabase migrations are separate evidence-bearing steps.

## Assignment response-presence migration

Canonical migration:
`supabase/migrations/20260911131000_assignment_response_presence.sql`

Reviewed blob:
`bbbceb057c631f08ec32826384ef6fcd61da4527`

Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before production integration.

Rules:

- committed migration != applied migration;
- production state is `NOT APPLIED / UNKNOWN` until positively verified;
- compare supplied/pasted SQL with the committed reviewed file;
- compare deployed `private.bible_assignment_visible(...)` before applying because the migration replaces it;
- apply only with a compatible cumulative release;
- after application run live privacy/authorization smoke;
- do not mark it `APPLIED + LIVE VERIFIED` without evidence.

Private assignment answer/feedback text must remain physically separated from peer-visible completion presence.

## Calendar migrations

The cumulative candidate contains:

- `supabase/migrations/20260911_calendar_events.sql`
- `supabase/migrations/20260911140000_calendar_congregation_sharing.sql`

Repository presence is not evidence production executed them. Recover real production migration/schema state before release.

Calendar v1.5 is already implemented in the known cumulative candidate. Do not rebuild v1/v1.5 because of stale preimplementation prose. Read `CALENDAR_V3.md` for current Calendar behavior/ownership.

## Visual/icon rule

Read `docs/V3_ICON_ASSET_MAP.md` before icon work. The map assigns semantics to the analyzed 70-PNG family, but does not prove the binary files are present. Verify/import the exact binaries before wiring them.

Do not invent functionality to use an icon.

For an already-selected visual improvement requiring generated or replacement artwork:

**generate → choose → optimize → implement → test**

Do not ask me for routine image approval. Ask only if the decision materially changes product scope, information architecture, fundamental interaction behavior, privacy/security policy, or another major unresolved product decision.

## Development priority after integration/release gate

Unless my latest instruction changes it, Priority 1 remains coordinated:

- required functionality/correctness;
- planned visual/artwork quality upgrade;
- Calendar follow-up only where genuinely incomplete beyond the already-verified v1/v1.5 contract.

Select work by dependencies, ownership, user value, credible investigation evidence and verifiability—not old inventory order.

## Rebuild-and-verify

- one owner/source of truth per responsibility;
- preserve `src/core/api.js` as the single browser Supabase/backend owner unless intentionally redesigned;
- no competing state/backend systems;
- reproduce defects where applicable;
- run focused checks, then required accumulated verification;
- every changed product SHA earns its own PASS;
- never transfer PASS;
- never claim unexecuted tests;
- docs-only commits are not product candidates;
- never weaken validators merely to get green;
- GitHub promotion is not Cloudflare propagation proof;
- committed migration is not applied migration;
- do not call the app bug-free.

## Priority firewall

P0/P1 current credible failures may interrupt the roadmap. Revalidate historical findings on the current exact product SHA. P2 schedule intelligently. P3 must not derail higher-value milestones; planned visual quality work is not automatically P3 merely because it is visual.

## Execute, do not only report

Recover current truth, determine what is already complete, select the highest-value dependency-safe unfinished gate, execute safe work immediately, verify the exact SHA, preserve evidence, update documentation when truth changes, and continue while safe work remains. Do not repeatedly ask me to type “continue”.

Report separately:

- production SHA;
- live `main` HEAD;
- active branch;
- exact-green cumulative product SHA;
- branch HEAD if docs-only commits make it different;
- work actually completed;
- tests/workflows actually executed;
- migration states;
- credible unresolved P0/P1 blockers;
- next dependency-safe gate;
- whether production/Supabase were touched;
- anything that genuinely requires user action.

Retired #39/#40 remain retired unless explicitly reopened.

---
