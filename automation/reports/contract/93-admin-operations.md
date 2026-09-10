# A2 Contract Report — #93 Admin Operations

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-11 JST

## STATE / PROVENANCE

- Active canonical branch: `feature/v3-admin-operations`
- Canonical exact HEAD observed at final refresh: `8bcc780d1e903e04f3bae07a5576778b7adf08c2`
- Prior exact green functional SHA: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`
- Dedicated autonomous candidate `agent/a1-work/093-*`: **not found**
- Bookkeeping branch `work/v3.64-admin-operations-bookkeeping-20260911` was also observed at `8bcc780d1e903e04f3bae07a5576778b7adf08c2` before canonical advanced to that same SHA.
- Latest frozen release: `release/v3.63-admin-console`
- Frozen exact SHA: `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- Intended next release: `release/v3.64-admin-operations` — **not present** at final inspection.
- This report is stale if canonical moves from `8bcc780d...`, a v3.64 release appears, or new exact-run evidence appears.

## EVIDENCE INSPECTED

Primary evidence inspected before TRIAGE:

1. `FEATURE_INVENTORY_V3.md` at `8bcc780d...`.
2. `ADMIN_OPERATIONS_V3.md` at `8bcc780d...`.
3. `DEVELOPMENT_HANDOFF_V3.md` on the Admin Operations lineage.
4. Retained standalone `admin-operations.js` at functional SHA `2e93349e...`.
5. Clean v3 owner `src/app/admin-operations.js` at `2e93349e...`.
6. Live refs for canonical, bookkeeping, latest frozen release and `agent/a1-work/093-*`.
7. Exact workflow evidence: targeted runs `34531083463`, `34531492122`, `34531588788`; complete functional run `34531751123`; bookkeeping writer run `34532182063`; bookkeeping exact-verification run `34532442314`.
8. Commit `8bcc780d...`, whose direct change is milestone chronology in `TIMELINE_V3.md` on top of earlier bookkeeping changes.

`automation/TRIAGE.md` was read only after provisional findings were formed.

## AUTHORITATIVE CONTRACT

**FACT** — Inventory row #93 is `Admin operations`, old-version capability `Yes`, v2 availability `Standalone old`, with required verification `operational actions; role guard; error recovery`.

**FACT** — At `8bcc780d...`, inventory is 90 Regression-tested / 1 Verified / 0 Implemented / 9 Not started. #92 is Regression-tested, #93 is Verified, #94 remains Not started.

**FACT** — `ADMIN_OPERATIONS_V3.md` narrows #93 to the retained Owner/Admin Ministry Operations dashboard plus Owner account deletion introduced with that surface. It explicitly excludes #94 reset/recovery, password/recovery-code workflows, redesign of #92 ownership, new moderation tools, production deployment and unrelated destructive operations.

## REQUIRED PARITY

- Signed-out state performs no Admin Operations request.
- Signed-in access is accepted only after server-authoritative platform `owner`/`admin` status.
- Permission denial fails closed and remains distinguishable from network/runtime failure.
- Dashboard supports all-congregation and one-congregation filtering.
- Operational dashboard includes retained system-health, current presence, assignment/progress aggregates, devotionals/announcements, persistent poll aggregates, curated media and live-room aggregates.
- Individual poll voter identity is not rendered.
- Privileged client-error user/congregation identifiers are not projected into rendered state.
- Explicit refresh plus safe empty/error states are retained.
- 390px mobile behavior must avoid horizontal overflow.
- Owner account deletion is #93 parity: Admin cannot delete; active Owner cannot delete self; exact `DELETE <email-or-name>` confirmation is required; successful deletion refreshes #92's existing user list.
- Existing backend remains authority for active-Owner protection, outstanding congregation/group ownership, room cleanup, audit and final Auth deletion.

## VERIFIED OWNERS TO COMPOSE

**FACT** — Session remains the authenticated-user/session owner.

**FACT** — `src/core/api.js` remains the browser network/Supabase boundary and exposes the #93 Admin Operations facade.

**FACT** — `src/app/admin-operations.js` owns authorization projection, normalization, refresh/error state and Owner-only delete orchestration.

**FACT** — `src/features/admin-operations/index.js` owns standalone rendering/filter interaction.

**FACT** — #92 Admin Console remains user/congregation/group administration owner; #93 deletion composes onto its user cards without making #92 a direct `bq-admin-ops` owner.

**FACT** — Existing `supabase/functions/bq-admin-ops/index.ts` remains final server authority. Production deployment/schema change is out of scope.

## RETAINED / UX EVIDENCE

**FACT** — Retained `admin-operations.js` directly invoked `bq-admin-ops`, loaded frontend health, rendered health/presence/assignments/messages/polls/media/live rooms and supported congregation filtering.

**FACT** — The clean v3 owner replaces retained direct-client/global ownership with Session + central API composition while preserving the user-visible operational categories.

**FACT** — Retained surface exposed explicit refresh, congregation filtering, summary counts, operational lists, safe empty states and access/unavailable failure states.

## LEGACY BEHAVIOR NOT TO COPY

**FACT** — Retained `admin-operations.js` created its own Supabase client and performed direct browser fetches. This is implementation history, not parity, because current verified ownership requires Session plus `src/core/api.js` as the single browser network boundary.

**RECOMMENDATION** — Do not revive direct-client/global ownership, broaden #92 into #93 authority, or absorb #94/#100 reset scope.

## EXACT WORKFLOW EVIDENCE

**FACT** — Targeted exact-SHA run `34531588788` passed #92/#93 architecture, edge/security and browser/mobile checks against `2e93349e...`.

**FACT** — Complete accumulated functional run `34531751123` passed against exact `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.

**FACT** — Bookkeeping writer run `34532182063` first asserted the bookkeeping branch still equaled that green functional SHA, then changed lifecycle/bookkeeping state.

**FACT** — Exact bookkeeping run `34532442314` asserted exact SHA `8bcc780d1e903e04f3bae07a5576778b7adf08c2` and passed bookkeeping-state validation, but **failed during accumulated architecture validators**. Edge/security and browser/mobile phases were skipped.

**FACT** — Canonical subsequently advanced to the same failed bookkeeping SHA `8bcc780d...`. Therefore current canonical is not a complete exact-gate PASS, and PASS from `2e93349e...` cannot transfer.

## AMBIGUITIES / MISSING EVIDENCE

- **MISSING EVIDENCE** — Accessible run metadata did not expose the exact architecture assertion that failed in `34532442314`; A2 cannot assign root cause.
- **MISSING EVIDENCE** — No dedicated `agent/a1-work/093-*` quarantine branch was found. This is governance provenance, not a basis to invent product parity requirements.
- **MISSING EVIDENCE** — No immutable `release/v3.64-admin-operations` existed at final inspection.
- **MISSING EVIDENCE** — No production deployment/field evidence is claimed; production is explicitly out of scope.

## ACCEPTANCE CHECKLIST

- [x] retained operational categories recovered without later-row scope invention;
- [x] signed-out no-call and Owner/Admin role guard represented;
- [x] denial vs runtime-error distinction represented;
- [x] dashboard filtering/refresh/empty/error/mobile behavior represented;
- [x] Owner-only deletion with exact confirmation and self-delete refusal represented;
- [x] #92/#93 ownership separation documented;
- [x] complete accumulated functional run green at exact `2e93349e...`;
- [ ] complete accumulated bookkeeping run green at exact current canonical `8bcc780d...` or a later corrected exact SHA;
- [ ] immutable v3.64 release exists at an exact green bookkeeping SHA.

## FACT / INFERENCE / RECOMMENDATION

**FACT** — #93 product parity contract was complete-functional-green at exact `2e93349e...`.

**FACT** — Current canonical `8bcc780d...` is not release-ready because exact run `34532442314` failed accumulated architecture and skipped later phases.

**INFERENCE** — Because the direct `8bcc780d...` commit changes milestone chronology only, the failure may be bookkeeping/document/validator interaction rather than runtime behavior; this remains unproven without the failing assertion/log.

**RECOMMENDATION** — Keep #93 in release closure until the exact architecture failure is identified and a final canonical/bookkeeping SHA passes the complete accumulated gate. Do not begin #94 implementation before v3.64 freezes.

## TRIAGE COMPARISON

After independent inspection, TRIAGE was read. It is materially stale: it still identifies #92 Admin Console as active, frozen base v3.62, and #93 as deferred. Primary evidence now shows frozen v3.63 at `8a759218...`, #93 complete functional green at `2e93349e...`, and canonical/bookkeeping at `8bcc780d...` with failed exact bookkeeping verification.

A2 does not adopt stale TRIAGE as evidence. Current conclusion: **#93 contract satisfied at the exact functional SHA, but current canonical/release bookkeeping closure is incomplete and cannot inherit PASS across SHAs.**