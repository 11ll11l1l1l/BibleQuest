# BibleQuest v3 — Current Development Priority

Updated: 2026-09-11 JST after production release closeout.

This is the cross-feature task-selection authority. Read `RECONCILIATION_V3.md` next for exact release/product ancestry and evidence.

## Current product truth

- live `main` / deployed release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- release branch: `release/v3-cumulative-20260911-r1`
- cumulative verifier `34610903807` — success
- production verifier `34612873935` — success on both Cloudflare hosts
- production Supabase release migrations: **APPLIED + LIVE VERIFIED**
- previous rollback: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

The former Line A / Line B integration and the production-release gate are complete. Do not redo them because older documents describe them as pending.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for product/release ancestry and integration truth;
4. current handoff/status;
5. feature contract inside that feature;
6. exact-SHA workflow/live evidence;
7. historical inventory/release/agent evidence.

## Priority 1 now — coordinated product completion and polish

Resume development from the current cumulative production base. Priority 1 remains coordinated across three streams, selected by dependency, user value and verifiability rather than old inventory order.

### 1A — functionality/correctness

Complete genuinely unfinished accepted functionality and reproduced defects. Confirm incompleteness before coding. Current credible P0/P1 may interrupt other work; stale or minor findings may not.

Calendar v1/v1.5 is already complete. Known Calendar follow-ups remain candidates, not automatic requirements:

- Ministry Hub calendar surface;
- congregation-event edit/delete UI/owner flow;
- custom recurrence beyond fixed weekly.

Select one only when it is the highest dependency-safe Priority 1 milestone.

### 1B — visual/artwork quality

Continue the approved visual/artwork upgrade while preserving information architecture, navigation, persistence and backend ownership.

Before icon wiring:

1. inspect `VISUAL_PHASE_B_V3.md` and current visual status;
2. verify whether the actual `assets/icons/v3/` binary set exists on the current base;
3. use `docs/V3_ICON_ASSET_MAP.md` for semantic assignments;
4. do not invent features just to consume assets;
5. run mobile, accessibility, performance/offline and accumulated regressions.

For selected visual work needing generated/replacement artwork: **generate → choose → optimize → implement → test**. Routine image approval is not a development gate.

### 1C — release hardening

The cumulative release is live. Release hardening now means reproduced post-release defects, current security/privacy regressions or evidence gaps—not repeating green release work.

## Production migration state

Assignment response presence and Calendar migrations are now `APPLIED + LIVE VERIFIED`. Do not apply them again.

Production history includes:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Read the migration guide for privacy details, but treat its historical pre-apply instructions as completed for this release.

## Priority firewall

- P0 — severe production/security/privacy/data-loss/core outage.
- P1 — major user-facing capability broken without reasonable workaround.
- P2 — real defect/usability issue but not primary-use blocker.
- P3 — cosmetic/speculative/low-impact issue.

Planned visual quality work is not automatically P3 simply because it is visual. Unplanned tiny cosmetic defects remain low priority.

## Non-negotiable rules

- Rebuild-and-verify.
- One owner/source of truth per responsibility.
- Preserve `src/core/api.js` as the single browser backend/Supabase owner unless an intentional redesign is selected and verified.
- Every changed product SHA earns its own verification.
- Never transfer PASS.
- Never claim unexecuted tests.
- Docs-only commits are not product SHAs.
- Do not weaken tests to force green.
- Production changes remain separately selected evidence-bearing steps.
- GitHub promotion is not Cloudflare propagation proof.
- Do not call the app bug-free.
