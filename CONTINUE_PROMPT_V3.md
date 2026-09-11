# BibleQuest v3 generic continue prompt

Use this in a future BibleQuest development chat. Recover live repository truth first and skip milestones already completed by then.

---

Continue development of BibleQuest v3 from the **exact current repository state**.

Repository: `11ll11l1l1l/BibleQuest`

## Recover truth first

1. Read `DEVELOPMENT_PRIORITY_V3.md`.
2. Read `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, and `DEVELOPMENT_STATUS_V3.md`.
3. Read `FEATURE_INVENTORY_V3.md` only as the historical release-parity ledger.
4. Read `ARCHITECTURE_V3.md` and the relevant feature contracts.
5. Recover live `main`, release/rollback refs, active development/verifier branches, exact product SHAs, recent actions, current Supabase migration state and current investigator findings.
6. Repository evidence and my latest explicit instruction override stale prose.

Do not repeat a completed milestone merely because an older branch/document describes it as pending.

## Known released reference checkpoint — re-check live

At the time this prompt was updated:

- live `main` / deployed release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`;
- release branch: `release/v3-cumulative-20260911-r1`;
- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`;
- cumulative verifier run: `34610903807` — success;
- production Cloudflare verifier run: `34612873935` — success on both production hosts;
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.

`cf17f36...` already integrates Assignment Private Responses + Workspace compatibility with Visual tranche 18 + Avatar Vault v2 + Calendar v1.5. The former Line A/Line B divergence is resolved and released. Do not redo it unless newer ancestry proves another divergence.

A documentation-only HEAD after this release is not a new product SHA.

## Production Supabase state — re-check before any later schema work

Production project: `zkfmgezvzugchcwppreq`.

The following release migrations were applied and live verified on 2026-09-11:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do **not** reapply them.

Assignment response presence was verified for safe projection shape, RLS/grants, all/member/team/group audience behavior, ministry visibility, backfill parity and trigger lifecycle. Calendar was verified for ministry creation, congregation-member shared visibility and private-event isolation. Smoke data was rollback-only.

If future repository evidence contains a deliberate superseding migration, evaluate that new migration separately rather than replaying the old release set.

## Development priority after release

Unless my latest instruction changes it, Priority 1 remains coordinated:

- required functionality/correctness;
- planned visual/artwork quality upgrade;
- Calendar follow-up only where genuinely incomplete beyond already-released v1/v1.5.

Select by dependencies, ownership, user value, credible investigation evidence and verifiability—not old inventory order.

Before choosing the next milestone:

1. inspect current `VISUAL_PHASE_B_V3.md` and visual status;
2. verify the actual current asset tree, including whether `assets/icons/v3/` binaries exist;
3. inspect current credible P0/P1 investigator findings;
4. inspect genuine accepted functionality gaps;
5. select the smallest dependency-safe high-value milestone.

Calendar v1/v1.5 is complete. Known follow-up candidates include Ministry Hub calendar surface, congregation-event edit/delete UI and custom recurrence, but none should be rebuilt/added automatically without priority evidence.

## Visual/artwork rule

Read `docs/V3_ICON_ASSET_MAP.md` before icon work. A semantic map is not proof that binary assets exist.

Do not invent functionality merely to consume artwork.

For a selected visual improvement requiring generated/replacement artwork:

**generate → choose → optimize → implement → test**

Do not ask me for routine image approval. Ask only if the decision materially changes product scope, information architecture, fundamental interaction behavior, privacy/security policy, ownership or another major unresolved product decision.

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
- production promotion, Cloudflare propagation and Supabase changes are separate evidence-bearing steps;
- do not call the app bug-free.

## Priority firewall

P0/P1 current credible failures may interrupt the roadmap. Revalidate historical findings on the current exact product SHA. P2 schedule intelligently. P3 must not derail higher-value milestones. Planned visual quality work is not automatically P3 merely because it is visual.

## Execute, do not only report

Recover current truth, determine what is already complete, select the highest-value dependency-safe unfinished gate, execute safe work immediately, verify the exact SHA, preserve evidence, update documentation when truth changes, and continue while safe work remains. Do not repeatedly ask me to type “continue”.

Report separately:

- live `main` / deployed release commit;
- exact-green product SHA;
- active development branch/HEAD;
- work actually completed;
- tests/workflows actually executed;
- migration state;
- credible unresolved P0/P1 blockers;
- next dependency-safe gate;
- whether production/Supabase were touched;
- anything that genuinely requires user action.

Retired #39/#40 remain retired unless explicitly reopened.

---
