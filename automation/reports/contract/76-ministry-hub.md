# A2 contract investigation — #76 Ministry Hub

Agent: `BQ-A2-CONTRACT`
State inspected: 2026-09-10 JST

## Exact state

- Active #76 canonical branch: **absent** (`feature/v3-ministry-hub` does not exist at inspection time).
- Designated/likely #76 A1 candidate: **absent** (`agent/a1-work/076-ministry-hub` does not exist at inspection time).
- Predecessor canonical / latest frozen baseline: `feature/v3-assignment-push` and immutable `release/v3.48-assignment-push` both at `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Previous frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Retained v2 reference inspected independently: `release/v2-parity-snapshot` at `825de10b36c7f9b511cc8cab88aa3a6ce79ef939`.
- Control branch before this report write: `automation/v3-agent-control` at `f4941f1cd63920ed69820d7045d6aa1cd0dcf703`.

Because no #76 candidate exists, this is a **contract-recovery / pre-implementation report**, not an implementation PASS and not exact-candidate acceptance evidence.

## Primary evidence — FACT

1. `FEATURE_INVENTORY_V3.md` at exact frozen v3.48 SHA is the authoritative parity ledger. Row #76 is `Ministry Hub`, v2 availability `Compatibility`, v3 status `Not started`, with required verification exactly: **`open tools; role guard; navigation`**. Rows #77 Notification Center, #78 Workspace and #79 Linked Activities are separate later milestones. Row #43 Live Rooms is also independently `Not started`.

2. Retained v2 `bq2-parity.js` identifies `Ministry Hub` under `Assignments & Ministry` as `Ministry-focused tools`; compatibility items were explicitly preserved through `classic.html` while migration proceeded.

3. Retained v2 `classic.html` loads a dedicated `ministry-hub.js`, after assignment modules and before media/leader-dashboard modules. This establishes that Ministry Hub was a distinct retained surface rather than ownership of all neighboring capabilities.

4. Retained v2 `ministry-hub.js` shows concrete behavior:
   - the hub is readable by an ordinary active congregation member;
   - ministry-role convenience is `facilitator | leader | pastor | admin`;
   - privileged create/archive/pin/close controls are hidden from ordinary members;
   - navigation actions include Assignments, Journey Groups and Live Room for ordinary members, while Leader Dashboard is shown only to ministry roles;
   - the retained hub also contains congregation messages/devotionals, polls and calendar surfaces, with legacy direct client data/storage operations.

5. Current v3 `MINISTRY_ROLES.md` at v3.48 defines the same congregation role set and explicitly states that UI visibility is convenience only: authorization must be enforced server-side from authenticated identity plus database-backed membership. The documented privileged ministry set is Facilitator, Leader, Pastor or congregation Admin.

6. Current verified v3 owner `src/app/congregation-membership.js` owns normalized congregation roles and fail-closed client capability checks. Its `can(congregationId, 'ministry')` returns true only for `facilitator | leader | pastor | admin`; unsupported/unknown roles fail closed. This owner should not be duplicated by a new Ministry Hub role model.

7. Current verified v3 `src/app/bootstrap.js` owns route composition/navigation and already exposes clean routes/services for Assignments and Journey Groups. No native #76 Ministry Hub route/service is present at frozen v3.48. A clean Live Rooms route is also not present in the current route table, consistent with inventory row #43 remaining Not started.

8. Exact frozen v3.48 evidence is run `34450088492`. The successful job ran the exact-SHA assertion plus accumulated architecture, edge/security and browser/mobile phases. The isolated workflow explicitly checked out/asserted `e725e5dee5a46fcaebf05200301efdb93f868b22`. This proves the baseline only; it does **not** transfer a PASS to any future #76 SHA.

## Contract interpretation — FACT vs INFERENCE

**FACT:** The only authoritative #76 acceptance phrase currently recovered is `open tools; role guard; navigation`.

**FACT:** The retained Ministry Hub was broader than a pure link page: it rendered messages/devotionals, polls and a congregation calendar as well as tool navigation and role-gated leader controls.

**FACT:** The authoritative inventory does not explicitly enumerate those retained message/poll/calendar workflows in row #76, and no separate dedicated milestone contract for #76 was found before this report.

**INFERENCE:** A1 must not silently treat the legacy direct-client CRUD implementation as the required v3 architecture. The retained source is behavior evidence, while current verified ownership/security boundaries are authoritative for implementation structure.

**INFERENCE:** The minimum non-invented #76 behavior is a Ministry Hub surface that opens through current v3 navigation, uses the existing congregation membership owner for role-aware UI behavior, and navigates to supported ministry tools without creating a second router or role model.

**INFERENCE / CONTRACT RISK:** It is not yet proven whether #76 is intended to migrate the retained messages/devotionals + polls + calendar data surfaces in this milestone, or whether the deliberately narrow inventory acceptance (`open tools; role guard; navigation`) defines a portal-only migration. Implementing either interpretation as though it were proven would overstate primary evidence.

## Bounded requirements that are directly supported

- Provide one clean Ministry Hub entry/surface owned through existing v3 routing rather than a competing navigation owner.
- Preserve member access to the hub itself unless stronger current evidence says otherwise; do not equate `member` with ministry-authorized.
- Use the existing congregation membership role owner. Ministry-role UI convenience is limited to Facilitator, Leader, Pastor and congregation Admin; unknown/no membership must fail closed.
- Keep privileged authority server-backed. A Ministry Hub UI role guard is not authorization and must not create a new trust boundary.
- Tool navigation must not falsely claim a clean destination that does not exist. Assignments and Journey Groups already have current v3 owners; Live Rooms remains inventory #43 Not started, so #76 must not absorb/rebuild #43 merely to make a retained button work.
- Do not absorb #77 Notification Center, #78 Workspace or #79 Linked Activities into #76 without new primary evidence.
- Do not copy the retained hub's legacy direct client table/storage writes merely because they exist in v2.

## Missing evidence / acceptance still required

- No #76 canonical SHA exists.
- No #76 candidate SHA exists.
- No exact #76 accumulated workflow run exists.
- No permanent #76 validator/edge/browser acceptance evidence exists yet.
- No dedicated #76 milestone document was found that resolves the retained message/poll/calendar scope versus the inventory's narrow `open tools; role guard; navigation` acceptance.
- No evidence currently justifies implementing Live Rooms (#43), Notification Center (#77), Workspace (#78), Linked Activities (#79), broad admin/leader-dashboard work, schema changes, new RLS, or broad refactors as part of #76.

## Recommendation

Before A1 writes #76 product code, treat the unresolved retained-surface breadth as a contract question to be settled only by additional primary repository evidence. If no stronger contract exists, implement and test only the inventory-proven Ministry Hub boundary (`open tools; role guard; navigation`) against current owners, while preserving future separations and documenting any retained message/poll/calendar functionality as unproven rather than silently deleting or claiming it.

For the future exact candidate, acceptance evidence should at minimum demonstrate the actual Ministry Hub route/open path, ordinary-member versus ministry-role presentation, fail-closed unknown/unauthenticated membership behavior as applicable to the existing owner, navigation to each supported current-v3 destination, safe behavior for unavailable/not-yet-migrated destinations, and retention of the complete accumulated regression harness. Exact PASS cannot be transferred from v3.48.

## TRIAGE reconciliation

`automation/TRIAGE.md` was read only after the independent inspection above. It is stale for current milestone state: it still describes #75 as active and v3.47 as frozen, and says #76 must not begin until #75 release closure. Primary current state and refs show #75 is now closed/frozen at v3.48 and #76 is the next permitted recovery target. TRIAGE therefore supplies no current #76 evidence or blocker by itself.

## Staleness conditions

This report becomes stale if any of the following changes: a #76 canonical or `agent/a1-work/076-...` branch appears or advances; the v3.48 baseline/ref moves (which should not happen for frozen refs); the authoritative inventory/contract changes; a dedicated #76 contract is added; current congregation-role or router ownership changes; retained-source reference changes; or any #76 candidate/test/workflow evidence appears.

A2 made no product, workflow, canonical/work branch, inventory, release, handoff, lease, CURRENT, TRIAGE, `main`, or production-system change.