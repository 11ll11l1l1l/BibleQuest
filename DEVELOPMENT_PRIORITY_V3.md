# BibleQuest v3 — Current Development Priority

Updated: 2026-09-11 JST after cumulative exact-SHA integration verification.

This is the cross-feature post-release task-selection authority. Read `RECONCILIATION_V3.md` immediately after this file for cumulative product and promotion/migration truth.

## Current product truth

- production/runtime: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- live `main` last recovered: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- cumulative exact-green development product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- verifier run: `34610903807` — success

The previous Line A / Line B divergence is resolved in `cf17f36...`. Do not repeat that integration merely because historical documents still describe it.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for cumulative product/integration truth;
4. current handoff/status;
5. feature contracts inside their feature;
6. exact-SHA workflow evidence;
7. historical inventory/release/agent evidence.

## Immediate Priority 1 gate

The current priority is to preserve the new cumulative truth and close controlled release prerequisites before branching more work from an older state:

1. freeze `cf17f36...` as the current cumulative exact-green checkpoint;
2. keep docs-only branch HEAD distinct from the product SHA;
3. refresh live `main` immediately before any selected promotion;
4. verify production migration state for Assignment response presence and Calendar;
5. define safe migration/application deployment ordering;
6. if main/production promotion is selected, use the cumulative candidate rather than either former parent line;
7. verify Cloudflare propagation and live privacy/authorization behavior independently after deployment.

After that production-integration gate is deliberately completed or deferred, resume the next dependency-safe Priority 1 product milestone from the newest cumulative exact-green base.

## Priority 1 development streams after integration

### 1A — functionality/correctness

Complete legitimate accepted functionality or verified defects. Confirm incompleteness first and do not rebuild already verified work.

### 1B — visual/artwork quality

Continue the approved visual/artwork upgrade without changing information architecture merely for aesthetics. Consult `docs/V3_ICON_ASSET_MAP.md` first. Verify/import actual PNG binaries before referencing documented asset paths.

For selected visual improvements requiring generated artwork:

`generate → choose → optimize → implement → test`

Do not ask for routine image approval. Do not invent functionality merely to consume artwork.

### 1C — Calendar

Calendar v1.5 is already implemented and included in `cf17f36...`. `CALENDAR_V3.md` is authoritative for Calendar behavior. Do not redo v1/v1.5. Any later Calendar milestone must be selected from current unmet requirements or verified defects.

## Migration gates

Assignment response presence:

- `supabase/migrations/20260911131000_assignment_response_presence.sql`
- reviewed blob `bbbceb057c631f08ec32826384ef6fcd61da4527`
- production state: `NOT APPLIED / UNKNOWN` until positively verified.

Calendar candidate migrations:

- `supabase/migrations/20260911_calendar_events.sql`
- `supabase/migrations/20260911140000_calendar_congregation_sharing.sql`
- production state: unknown until positively verified.

A committed migration is not proof of production execution.

## Priority firewall

- P0: severe production/security/privacy/data-loss/core outage.
- P1: major user-facing capability broken without reasonable workaround.
- P2: real defect/usability issue but not primary-use blocker.
- P3: cosmetic/speculative/low-impact issue.

Current credible P0/P1 can interrupt the roadmap. Historical findings must be revalidated against the current product SHA.

## Non-negotiable rules

- Rebuild-and-verify.
- One owner/source of truth per responsibility.
- Preserve `src/core/api.js` as the single browser backend/Supabase owner unless an intentional redesign is selected and verified.
- Every changed product SHA earns its own verification.
- Never transfer PASS.
- Never claim tests not executed.
- Docs-only commits are not product SHAs.
- Do not weaken tests to force green.
- Do not mutate production Supabase/data outside a selected release step.
- GitHub promotion is not Cloudflare propagation proof.
- Do not call the app bug-free.
