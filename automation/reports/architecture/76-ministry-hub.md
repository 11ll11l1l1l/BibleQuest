# A3 architecture/security investigation — #76 Ministry Hub

Agent: `BQ-A3-ARCH-SECURITY`
Inspected: 2026-09-11 JST

## STATE / PROVENANCE

- Active milestone: **#76 Ministry Hub**.
- Canonical: `feature/v3-ministry-hub` @ exact `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Dedicated A1 quarantine candidate: `agent/a1-work/076-ministry-hub` **not found** at inspection.
- Frozen base: `release/v3.48-assignment-push` @ exact `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Functional candidate recorded by the milestone contract: `dfc6440cd7105c73107081dfb4fb16f8bfac2d71`.
- Exact functional verification: Actions run `34460593373` = `success`; isolated verifier head was `6df4d373153950aa8857632c571b8a7d90f623b9` and the milestone contract records that it checked out/asserted exact product SHA `dfc6440c...` before the accumulated suites.
- Canonical `e17d009...` is eight commits ahead of frozen v3.48. Its tip commit is docs-only: `docs(v3): close Ministry Hub functional contract`.
- No branch-native Actions runs were found for `feature/v3-ministry-hub`; I did not independently locate an exact complete accumulated gate for current canonical `e17d009...`.

No PASS is transferred from `dfc6440c...` to `e17d009...`.

## INSPECTED PRIMARY EVIDENCE — FACT

1. `MINISTRY_HUB_V3.md` defines #76 narrowly as a portal/navigation migration: existing congregation membership owner for role projection, existing router for destinations, existing Assignments/Journey Groups owners, and deferred/unavailable presentation for unfinished destinations.
2. `src/app/ministry-hub.js` at canonical `e17d009...` depends on the existing congregation owner, exposes Assignments/Journey Groups to readable members, exposes assignment-publishing presentation only when `congregation.can(id,'ministry')` is true, and keeps Live Room/Leader Dashboard unavailable.
3. `src/app/congregation-membership.js` recognizes `member | facilitator | leader | pastor | admin`, fails closed for unknown roles, derives `ministry` only for facilitator/leader/pastor/admin, and requires authenticated session state before loading memberships.
4. The Ministry Hub implementation does not itself perform privileged writes. The contract explicitly retains assignment publishing behind the existing Assignments owner and trusted `bq-assignment` server boundary.
5. Frozen-to-canonical comparison is ahead by eight commits. The canonical tree includes the dedicated Ministry Hub contract and application surface. Current inspected #76 service code introduces no second router, Supabase client, direct table/storage mutation path, RPC, Edge Function, schema migration, RLS/grant change, or Realtime owner.
6. Functional run `34460593373` completed successfully. The milestone contract states that accumulated architecture, edge/security and browser/mobile phases passed against exact functional product SHA `dfc6440c...`.

## REQUIRED OWNER / COMPOSITION

**FACT:** Existing ownership remains the correct boundary:
- composition/route registration: `src/app/bootstrap.js`;
- navigation/history: `src/app/router.js`;
- congregation membership and role capability projection: `src/app/congregation-membership.js`;
- Ministry Hub read-only portal projection: `src/app/ministry-hub.js`;
- Ministry Hub UI: `src/features/ministry-hub/index.js`;
- privileged mutations: existing trusted feature/server owners only.

**RECOMMENDATION:** Preserve this composition. #76 must not become a second role model, router, backend client, storage owner or generic ministry mutation gateway.

## SAFE DATA FLOW / AUTHORIZATION

**FACT:** Browser role visibility is convenience, not authority. `congregation.can(...,'ministry')` may decide whether ministry affordances are shown but must never authorize a privileged mutation.

Safe flow:
1. authenticated session -> existing congregation membership loader;
2. normalized active membership -> fail-closed `read` / `ministry` projection;
3. Ministry Hub renders available/deferred destinations;
4. navigation delegates to the existing router;
5. any privileged operation delegates to its established trusted owner, which authorizes again server-side.

For current #76 scope, **no new server/RPC/RLS path is required**.

## SERVER / TRUST BOUNDARY

The safe trust boundary is unchanged from the frozen base. Assignment publishing remains server-authorized by the existing assignment path. The Ministry Hub itself should remain read-only orchestration/navigation.

Must not be broadened into:
- direct browser privileged DML or storage writes;
- generic congregation write grants/RLS expansion;
- new trusted RPC/Edge authority merely to reproduce legacy hub CRUD;
- browser-role projection treated as authorization;
- absorption of #43 Live Rooms, #77 Notification Center, #78 Workspace or #79 Linked Activities;
- legacy message/poll/calendar/media mutation behavior without a separately recovered HIGH-RISK contract and server authorization design.

## RISK CLASSIFICATION

**INFERENCE / RECOMMENDATION:** Current inspected #76 implementation is **NORMAL-RISK architecturally** because it composes verified owners and does not change schema, RLS/grants, trusted server authority, dependencies or broad persistence/sync semantics.

Reclassify to **HIGH-RISK before further product writes** if any of those boundaries change.

## BLOCKERS

No architecture/security blocker is established in the inspected #76 product boundary.

However, current canonical `e17d009...` does not have independently located exact-SHA accumulated verification in this A3 pass. This is **missing verification evidence**, not an architecture defect. Release/bookkeeping promotion must not rely on the functional PASS from `dfc6440c...`.

## NON-BLOCKING OBSERVATIONS

- `automation/CURRENT.md` on the control branch is stale at v3.48/#75 closure even though live product evidence contains an implemented #76 canonical branch.
- `automation/TRIAGE.md`, read only after the independent primary-evidence pass, is materially stale: it describes #38/v3.70 as active and does not reflect live #76 evidence. It is not evidence for this report.
- The writer lease was FREE at inspection.

## MISSING EVIDENCE

- No dedicated `agent/a1-work/076-ministry-hub` branch was found.
- No independently located exact complete accumulated workflow run for canonical `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- No evidence in this pass that a v3.49 frozen release exists at current canonical.
- If current canonical is intended as bookkeeping/release candidate, exact-SHA accumulated verification remains required before freeze.

## ARCHITECTURE ACCEPTANCE

A3 architecture/security disposition at exact canonical `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`: **BOUNDARY ACCEPTABLE / NORMAL-RISK; exact current-SHA verification still required before release promotion.**

Acceptance remains contingent on: single-owner composition, fail-closed role projection, no client-side authority substitution, no backend/RLS/schema broadening, deferred milestones remaining unavailable, and complete exact-SHA accumulated verification.

## STALENESS CONDITIONS

This report becomes stale if canonical/candidate/frozen SHA changes; a #76 quarantine candidate appears; any schema/RLS/grant/trusted function/dependency/router ownership change enters #76; exact `e17d009...` workflow evidence appears; or #76 scope/contract changes.

A3 made no product/workflow/canonical/work branch/inventory/release/handoff/lease/CURRENT/TRIAGE/`main`/production-system change.