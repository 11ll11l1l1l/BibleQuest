# A2 Contract Report — #93 Admin Operations

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-11 JST

## STATE / PROVENANCE

- Active canonical branch: `feature/v3-admin-operations`
- Canonical exact HEAD observed: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`
- Dedicated autonomous candidate `agent/a1-work/093-*`: **not found**
- Current bookkeeping branch: `work/v3.64-admin-operations-bookkeeping-20260911`
- Bookkeeping exact HEAD observed: `8bcc780d1e903e04f3bae07a5576778b7adf08c2`
- Latest frozen release: `release/v3.63-admin-console`
- Frozen exact SHA: `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- Intended next release: `release/v3.64-admin-operations` — **not present** at inspection time.
- Canonical-specific conclusions become stale if `feature/v3-admin-operations` moves. Bookkeeping conclusions become stale if `work/v3.64-admin-operations-bookkeeping-20260911` moves or new exact-run evidence appears. Frozen-base conclusions become stale only if a later immutable v3 release is created.

## EVIDENCE INSPECTED

Primary evidence inspected before TRIAGE:

1. `FEATURE_INVENTORY_V3.md` at bookkeeping SHA `8bcc780d...`.
2. `ADMIN_OPERATIONS_V3.md` at bookkeeping SHA `8bcc780d...`.
3. `DEVELOPMENT_HANDOFF_V3.md` on `feature/v3-admin-operations`.
4. Retained standalone `admin-operations.js` at canonical functional SHA `2e93349e...`.
5. Clean v3 owner `src/app/admin-operations.js` at `2e93349e...`.
6. Live refs for canonical, bookkeeping branch, latest frozen release and `agent/a1-work/093-*`.
7. Exact workflow evidence: targeted runs `34531083463`, `34531492122`, `34531588788`; complete functional run `34531751123`; bookkeeping writer run `34532182063`; bookkeeping exact-verification run `34532442314`.
8. Commit `8bcc780d...`, whose direct change is milestone chronology in `TIMELINE_V3.md` on top of earlier bookkeeping changes.

`automation/TRIAGE.md` was read only after these provisional findings were formed.

## AUTHORITATIVE CONTRACT

**FACT** — Inventory row #93 is `Admin operations`, old-version capability `Yes`, v2 availability `Standalone old`, with required verification: `operational actions; role guard; error recovery`.

**FACT** — At bookkeeping SHA `8bcc780d...`, inventory state is 90 Regression-tested / 1 Verified / 0 Implemented / 9 Not started. #92 is Regression-tested, #93 is Verified, and #94 Reset/recovery remains Not started.

**FACT** — `ADMIN_OPERATIONS_V3.md` narrows #93 to the retained Owner/Admin Ministry Operations dashboard plus Owner account deletion introduced with that operational surface. It explicitly excludes #94 reset/recovery, password/recovery-code workflows, redesign of #92 Admin Console ownership, new moderation tools, production deployment and unrelated destructive data operations.

## REQUIRED PARITY

The smallest evidence-supported #93 parity contract is:

- Signed-out state performs no Admin Operations request.
- Signed-in access is accepted only after server-authoritative platform `owner`/`admin` status.
- Permission denial fails closed and remains distinguishable from network/runtime failure.
- Dashboard supports all-congregation and one-congregation filtering.
- Operational dashboard includes retained system-health, current presence, assignment/progress aggregates, devotionals/announcements, persistent poll aggregates, curated media and live-room aggregates.
- Individual poll voter identity is not rendered.
- Privileged client-error user/congregation identifiers are not projected into rendered v3 state.
- Explicit refresh plus safe empty/error states are retained.
- 390px mobile behavior must avoid horizontal overflow.
- Owner account deletion is #93 parity: Admin cannot delete; active Owner cannot delete self; exact `DELETE <email-or-name>` confirmation is required before destructive request; successful delete refreshes the existing #92 user list.
- Existing backend remains authority for active-Owner protection, outstanding congregation/group ownership protection, room cleanup, audit and final Auth deletion.

## VERIFIED OWNERS TO COMPOSE

**FACT** — Session remains the authenticated-user/session owner.

**FACT** — `src/core/api.js` remains the browser network/Supabase boundary and exposes the #93 Admin Operations facade.

**FACT** — `src/app/admin-operations.js` owns client authorization projection, normalization, refresh/error state and Owner-only delete orchestration.

**FACT** — `src/features/admin-operations/index.js` owns standalone rendering/filter interaction.

**FACT** — #92 Admin Console remains the user/congregation/group administration owner; #93 deletion is composed onto its existing user cards rather than making #92 a direct `bq-admin-ops` owner.

**FACT** — Existing `supabase/functions/bq-admin-ops/index.ts` remains final server authority. No production deployment or schema change is part of #93.

## RETAINED DATA / SERVER CONTRACTS

**FACT** — Retained `admin-operations.js` directly invoked `bq-admin-ops`, loaded frontend health, rendered system health, online presence, assignments, messages, polls, media and live rooms, and supported congregation filtering.

**FACT** — The clean v3 owner replaces retained direct-client/global ownership with Session + central API composition while preserving the same user-visible operational categories.

**FACT** — Clean service authorization only reaches dashboard loading after accepted Owner/Admin status; delete orchestration additionally requires verified Owner state and refuses self-delete client-side before invoking the backend.

## UX / STATE

**FACT** — Retained surface exposed explicit refresh, congregation filtering, summary counts, operational lists, safe empty states and an unavailable/access-required failure surface.

**FACT** — The clean contract preserves those states and additionally codifies privacy boundaries rather than exposing privileged identifiers in rendered dashboard state.

## LEGACY BEHAVIOR NOT TO COPY

**FACT** — Retained `admin-operations.js` created its own Supabase client and performed direct browser fetches. This is historical implementation detail, not required parity, because current verified ownership requires Session plus `src/core/api.js` as the single browser network boundary.

**RECOMMENDATION** — Do not revive the retained direct-client/global architecture, do not broaden #92 into #93 backend ownership, and do not absorb #94 or #100 reset/backup scope.

## EXACT WORKFLOW EVIDENCE

**FACT** — Final targeted exact-SHA run `34531588788` passed #92/#93 architecture, edge/security and browser/mobile checks against functional candidate `2e93349e...`.

**FACT** — Complete accumulated functional run `34531751123` passed against the same exact functional candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.

**FACT** — Bookkeeping writer run `34532182063` first asserted the bookkeeping branch still equaled the green functional SHA, then changed lifecycle/bookkeeping state.

**FACT** — Exact bookkeeping verification run `34532442314` asserted exact bookkeeping SHA `8bcc780d1e903e04f3bae07a5576778b7adf08c2` and passed bookkeeping-state validation, but **failed during accumulated architecture validators**. Edge/security and browser/mobile phases were skipped. Therefore `8bcc780d...` is not a complete exact bookkeeping green and PASS from `2e93349e...` cannot transfer.

## AMBIGUITIES / MISSING EVIDENCE

- **MISSING EVIDENCE** — The exact architecture assertion that failed in run `34532442314` was not available from the accessible run metadata. A2 can establish that the failure occurred after exact-SHA and bookkeeping validation and before all later phases, but cannot truthfully assign root cause from current evidence.
- **MISSING EVIDENCE** — No dedicated `agent/a1-work/093-*` quarantine branch was found. This is governance provenance, not a reason to invent additional product parity requirements.
- **MISSING EVIDENCE** — No immutable `release/v3.64-admin-operations` existed at inspection time.
- **MISSING EVIDENCE** — No independent field/production deployment evidence is claimed; production is explicitly out of scope for this rebuild milestone.

## ACCEPTANCE CHECKLIST

Contract-level acceptance is satisfied at functional candidate `2e93349e...` only if the already-recorded exact functional run evidence remains valid and unchanged:

- [x] retained operational categories recovered without inventing later-row scope;
- [x] signed-out no-call and Owner/Admin role guard represented in contract/tests;
- [x] permission-denial vs runtime-error distinction represented;
- [x] dashboard filtering/refresh/empty/error/mobile behavior represented;
- [x] Owner-only account deletion with exact typed confirmation and self-delete refusal represented;
- [x] #92/#93 ownership separation documented;
- [x] complete accumulated functional run green at exact `2e93349e...`;
- [ ] complete accumulated bookkeeping run green at exact current bookkeeping SHA;
- [ ] immutable v3.64 release exists at an exact green bookkeeping SHA.

## FACT / INFERENCE / RECOMMENDATION

**FACT** — Product parity contract for #93 is materially implemented and complete-functional-green at exact `2e93349e...` according to primary run evidence and the authoritative inventory/contract lineage.

**FACT** — Current bookkeeping SHA `8bcc780d...` is not release-ready because exact run `34532442314` failed in accumulated architecture and skipped all later regression phases.

**INFERENCE** — Because the direct `8bcc780d...` commit changes milestone chronology only, the bookkeeping failure may be a bookkeeping/document/validator interaction rather than a #93 runtime defect; this is not proven without the failing assertion/log and must not be treated as fact.

**RECOMMENDATION** — Keep #93 as the active closure target until the exact bookkeeping failure is reproduced/identified and a corrected final bookkeeping SHA passes the complete accumulated gate. Do not infer or begin #94 implementation from this report before v3.64 freezes.

## TRIAGE COMPARISON

After independent inspection, `automation/TRIAGE.md` was read. It is materially stale: it still identifies #92 Admin Console as active, frozen base v3.62, and #93 as deferred. Live primary evidence instead shows immutable `release/v3.63-admin-console` at `8a759218...`, #93 functional candidate `2e93349e...` with complete functional green, and active v3.64 bookkeeping at `8bcc780d...` with a failed exact bookkeeping run.

A2 does not adopt the stale TRIAGE conclusion as evidence. The current contract conclusion is: **#93 contract satisfied at the exact functional candidate; bookkeeping/release closure remains incomplete and must not inherit PASS across SHAs.**