# A3 architecture/security investigation — #76 Ministry Hub

Agent: `BQ-A3-ARCH-SECURITY`
Inspected: 2026-09-10 JST

## STATE / PROVENANCE

- Active target: **#76 Ministry Hub**.
- #76 canonical branch: **absent** at inspection (`feature/v3-ministry-hub` not found).
- #76 A1 quarantine candidate: **absent** at inspection (`agent/a1-work/076-ministry-hub` not found).
- Last canonical milestone branch: `feature/v3-assignment-push` at exact `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Residual designated #75 quarantine branch: `agent/a1-work/075-assignment-push` at the same exact `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Latest frozen release/base: `release/v3.48-assignment-push` at exact `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Previous frozen release: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact frozen-base verification: Actions run `34450088492`, completed `success`; job `102783621514` completed the exact-bookkeeping-SHA assertion plus accumulated architecture, edge/security and browser/mobile phases.
- Retained behavior reference independently inspected: `release/v2-parity-snapshot`, `ministry-hub.js`.

This is a **pre-implementation architecture/security recovery report**, not a #76 candidate PASS. No PASS transfers from v3.48 to a future #76 SHA.

## INSPECTED PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` at frozen v3.48 is authoritative and defines #76 as `Ministry Hub`, `Not started`, with required verification `open tools; role guard; navigation`. #77 Notification Center, #78 Workspace and #79 Linked Activities remain separate later rows; #43 Live Rooms also remains `Not started`.

2. `ARCHITECTURE_V3.md` defines existing single owners including `src/app/bootstrap.js` for composition/one boot, `src/app/router.js` for navigation/history, `src/core/api.js` for Supabase/remote calls, and `src/app/congregation-membership.js` for authenticated congregation membership/role orchestration and fail-closed client capability projection. It forbids competing runtimes, direct backend/storage shortcuts and duplicated ownership.

3. `src/app/congregation-membership.js` at v3.48 recognizes only `member | facilitator | leader | pastor | admin`, treats unknown roles as unsupported, and defines the client-side `ministry` convenience capability only for `facilitator | leader | pastor | admin`. `can()` fails closed for missing/unknown membership.

4. `MINISTRY_ROLES.md` explicitly separates platform authority from congregation ministry authority and states that UI visibility is convenience only. Privileged authorization must be enforced server-side from authenticated identity plus database-backed membership. Existing trusted functions include `bq-assignment`, `bq-invite`, and `bq-score` for ministry-authorized actions.

5. `src/core/api.js` is the sole current browser Supabase/function boundary. Its congregation membership load reads active membership + active congregation records; trusted mutations elsewhere invoke named Edge Functions rather than deriving authority from UI state.

6. `src/app/bootstrap.js` currently composes the verified congregation membership, Assignments and Journey Groups services and routes. It has no native Ministry Hub route/service at v3.48. It also has no native Live Rooms route, consistent with #43 remaining unimplemented.

7. `supabase/schema.sql` already has congregation/member tables, RLS and a `private.is_bible_congregation_member(uuid)` security-definer helper with empty `search_path`; congregation/member reads are scoped to authenticated membership/ownership. Existing comments explicitly reserve role-changing/joining operations for trusted-server paths. This blueprint also demonstrates the architectural principle that sensitive derived writes must not become direct browser DML merely because related rows are readable.

8. The frozen repository contains existing Supabase migrations and trusted functions including `bq-assignment`, `bq-admin`, `bq-invite`, `bq-join`, `bq-journey-group` and others. No #76-specific migration/function was present at the frozen base.

9. Retained v2 `ministry-hub.js` independently shows that the historical hub itself was readable by an active congregation member, while `facilitator | leader | pastor | admin` enabled privileged creation/archive/pin/close UI and Leader Dashboard access. It also used legacy direct browser Supabase/storage operations for ministry messages, polls, calendar and media signing/upload.

10. Exact baseline run `34450088492` and job `102783621514` are green for v3.48. This establishes a known-good frozen starting architecture only.

## REQUIRED OWNER / COMPOSITION

**FACT:** Current ownership already provides the correct reusable boundaries for the inventory-proven #76 path:
- composition/route registration: `src/app/bootstrap.js`;
- navigation/history: `src/app/router.js`;
- authenticated congregation role state: `src/app/congregation-membership.js`;
- remote/trusted calls: `src/core/api.js`;
- existing destination owners: Assignments and Journey Groups.

**RECOMMENDATION:** A bounded #76 implementation should add one Ministry Hub presentation/orchestration surface composed through these owners. It must not create another router, another congregation-role model, another Supabase client, a legacy `window.BQ*` authority object, or direct storage/backend shortcuts.

## SAFE DATA FLOW

For the currently proven `open tools; role guard; navigation` contract:

1. session/auth state loads through the existing session owner;
2. active congregation membership/role loads through `src/app/congregation-membership.js` using `src/core/api.js`;
3. Ministry Hub renders role-aware presentation from that normalized membership;
4. navigation delegates to the existing router and existing clean destination owners;
5. any privileged action exposed from the hub delegates to the already-authoritative trusted service for that action, which re-authorizes server-side.

No new schema, RLS, grant, RPC, Edge Function, storage bucket policy, Realtime contract or direct table mutation is required by the narrow inventory-proven portal/navigation interpretation.

## AUTHORIZATION / RLS

**FACT:** `congregation.can(id, 'ministry')` is a fail-closed **client capability projection**, not an authorization boundary.

**FACT:** Current policy requires server-side authorization for privileged ministry actions.

**FACT:** Retained v2 allowed an ordinary active congregation member to open/read the hub while hiding privileged leader controls. Therefore `role guard` should not automatically be interpreted as `deny all members from opening the hub` without stronger contract evidence.

**RECOMMENDATION:** For a portal-only #76 implementation:
- authenticated active congregation membership may govern whether congregation-specific hub context is available;
- ministry-only controls may be visually gated using the existing `ministry` capability;
- every privileged mutation must remain server-authorized by its existing trusted owner;
- unknown/missing/unsupported role state must fail closed for ministry-only controls.

## SERVER / TRUST BOUNDARY

### Safe boundary
The browser may decide what navigation/control affordances to show from already-loaded normalized membership, but it must never convert that role projection into authority. Trusted mutation remains behind the existing server/Edge path for each capability.

### Required server/authorization path
- Assignment publication/feedback: existing `bq-assignment` authority.
- Invite creation: existing `bq-invite` authority.
- Trusted score actions: existing `bq-score` authority.
- Any other privileged mutation must use an already-verified trusted owner or, if genuinely required by the recovered #76 contract, be separately designed/reviewed as HIGH-RISK before implementation.

### Must not be broadened
- Do **not** grant browser mutation rights merely to reproduce legacy Ministry Hub CRUD.
- Do **not** broaden congregation-member RLS from read/member scope into generic ministry write authority.
- Do **not** use `congregation.can(...,'ministry')` as proof of authorization.
- Do **not** absorb or expose unfinished #43 Live Rooms, #77 Notifications, #78 Workspace or #79 Linked Activities as though they are verified #76 destinations.
- Do **not** copy legacy direct `client.from(...).insert/update/delete`, storage upload/signing, or `window.BQ*` patterns into v3 without an independently recovered, trusted contract.

## LIFECYCLE / CLEANUP

A portal-only Ministry Hub should own no independent long-lived Realtime subscription, timer, storage cache or media player unless primary evidence proves such behavior is required. If later recovered scope adds subscriptions/uploads/calendar/poll state, lifecycle/cleanup ownership must be explicit and re-reviewed because that materially changes risk.

## PRIVACY / SCOPE

**FACT:** Retained v2 describes ministry content as congregation-scoped and used congregation IDs on message/poll/calendar operations.

**RECOMMENDATION:** Any future congregation content exposed through #76 must remain active-congregation scoped and must not leak directory/content across congregations. Signed/private media URLs, if reintroduced, require a dedicated storage-policy/trusted-path review rather than reuse by assumption.

## RISK CLASSIFICATION

**INFERENCE / RECOMMENDATION:** The inventory-proven portal/navigation implementation can remain **NORMAL-RISK** if it only composes verified owners, adds bounded presentation/navigation, and makes no authorization/RLS/grant/schema/trusted-function/global-router ownership changes.

It becomes **HIGH-RISK immediately** if implementation requires any of the following:
- schema or migration changes;
- RLS/grant changes;
- new/modified trusted Edge Function or RPC authority;
- direct browser privileged DML or storage writes;
- global router/shell ownership changes beyond normal additive route composition;
- reintroduction of retained messages/devotionals, poll creation/closing, calendar mutation or private media upload/signing where a current trusted contract has not already been verified.

A1 must reclassify before making such a change.

## BLOCKERS

No architecture/security BLOCKER is established for beginning a **bounded portal/navigation #76 implementation** from frozen v3.48.

There is, however, a contract/scope ambiguity: retained v2 contains messages/devotionals, polls, calendar and media behavior that exceeds the inventory's narrow `open tools; role guard; navigation` wording. Architecture must not resolve this ambiguity by copying legacy direct-client backend behavior. If those data workflows are later proven required for #76, they need a fresh HIGH-RISK trust-boundary design/review before product writes.

## NON-BLOCKING OBSERVATIONS

- `DEVELOPMENT_HANDOFF_V3.md` at the frozen product SHA is historically stale about #75 closure, but current control state and live refs prove v3.48 closure. This does not change the frozen product architecture.
- `automation/TRIAGE.md`, read only after the independent primary-evidence pass, is stale: it still treats #75 as active and v3.47 as frozen. It is not evidence for #76 and supplies no current #76 blocker.

## MISSING EVIDENCE

- No `feature/v3-ministry-hub` canonical branch/HEAD exists yet.
- No `agent/a1-work/076-ministry-hub` candidate exists yet.
- No exact #76 functional or bookkeeping Actions run exists.
- No permanent #76 architecture validator, edge/security test or browser/mobile smoke exists yet.
- No dedicated #76 milestone document currently resolves whether retained messages/devotionals, polls, calendar and media are part of #76 or intentionally deferred beyond the inventory-proven portal/navigation contract.
- No current primary evidence justifies new schema/RLS/grants/functions/storage policies for #76.

## ARCHITECTURE ACCEPTANCE CHECKS FOR FUTURE #76 CANDIDATE

1. Candidate SHA/ancestry is exact and based on frozen v3.48/canonical reconciled state.
2. Ministry Hub uses existing router/bootstrap composition; no competing navigation owner/global runtime.
3. Congregation role presentation uses the existing membership owner and fails closed for unknown/missing ministry role state.
4. Ordinary member behavior matches recovered contract evidence; ministry-only controls are distinct from hub readability unless stronger primary evidence changes the contract.
5. Privileged operations, if any, route through existing trusted server authority and are independently authorized there.
6. No new direct browser privileged DML/storage mutation is introduced.
7. No unexplained RLS/grant/schema/trusted-function broadening occurs.
8. Navigation opens only verified/current destinations or presents a controlled unavailable state for deferred destinations; #43/#77/#78/#79 are not silently absorbed.
9. Permanent tests prove role guard and real route/navigation behavior at the candidate SHA; source-string checks alone are insufficient for authorization claims.
10. Complete accumulated architecture, edge/security and browser/mobile suite passes against the exact candidate/bookkeeping SHA as applicable.

## STALENESS CONDITIONS

This report becomes stale if a #76 canonical/work candidate appears or advances; frozen v3.48 changes; authoritative inventory/contract changes; current router/bootstrap/congregation membership/API ownership changes; any schema/RLS/grant/trusted-function/storage-policy change enters the #76 candidate; retained-source evidence changes; or exact #76 test/workflow evidence appears.

A3 made no product, workflow, canonical/work branch, inventory, release, handoff, lease, CURRENT, TRIAGE, `main`, production Supabase or production Cloudflare change.