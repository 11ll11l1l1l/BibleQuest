# A4 QA / Regression — #92 Admin Console

Generated: 2026-09-11 05:49 JST
Identity: `BQ-A4-QA`

## STATE / PROVENANCE
- Active milestone: **#92 Admin Console — HIGH-RISK**.
- Canonical: `feature/v3-admin-console` @ `298ebcdd9b34a9582cbe24c856ec256292acb7a8`.
- Dedicated quarantine candidate `agent/a1-work/092-admin-console`: **not found** at inspection time.
- Frozen base: `release/v3.62-content-review` @ `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`.
- Authoritative inventory at canonical: #91 Verified; #92 Not started; #93 Not started; totals 88 Regression-tested / 1 Verified / 0 Implemented / 11 Not started.
- Milestone contract: `ADMIN_CONSOLE_V3.md`; required acceptance is auth guard, Owner/Admin authorization, normalized reads, server-authoritative mutations with refresh, permission denial distinct from runtime/network failure, and strict exclusion of #93 Admin Operations.
- Durable `DEVELOPMENT_HANDOFF_V3.md` on canonical is stale: it still describes pre-freeze #91/v3.61 state and says #92 remains Not started until v3.62 freezes. Live refs and exact repository state supersede it.

## PRIMARY EVIDENCE INSPECTED
- Live branch/ref API for canonical, attempted `agent/a1-work/092-admin-console`, and frozen v3.62.
- `FEATURE_INVENTORY_V3.md` @ canonical.
- `ADMIN_CONSOLE_V3.md` @ canonical.
- `DEVELOPMENT_HANDOFF_V3.md` @ canonical.
- `supabase/functions/bq-admin/index.ts` @ canonical.
- `scripts/validate-v3-admin-console.mjs` @ canonical.
- `tests/v3-admin-console-edge.mjs` @ canonical.
- `tests/v3-admin-console-smoke.mjs` @ canonical.
- `.github/workflows/v3-regression.yml` @ canonical and frozen v3.62.
- Compare `b4a8826f...` → `298ebcdd...`.
- Actions runs `34528132854` and `34528237689`, including job-step evidence and verifier commits/workflows.
- `automation/TRIAGE.md` was read only after provisional QA findings were formed.

## FACTS
1. Canonical `298ebcdd...` contains permanent #92 validator, edge regression, browser/mobile regression, and accumulated workflow invocation for all three.
2. Comparing the canonical accumulated workflow to frozen v3.62 shows the prior architecture, edge/security, and browser/mobile lists retained; #92 adds `scripts/validate-v3-admin-console.mjs`, `tests/v3-admin-console-edge.mjs`, and `tests/v3-admin-console-smoke.mjs`. No unexplained prior-test deletion, skip, timeout reduction, or coverage removal was found.
3. The permanent workflow remains `workflow_dispatch`-only.
4. Run `34528132854` is **FAILURE**, not green. Its verifier commit `7ff3136620282747f3e4f3a02b82e90f457eb062` is parented directly on `298ebcdd...` and adds a temporary `push:` trigger to `.github/workflows/v3-regression.yml`. The job failed in accumulated architecture validators; all edge and browser/mobile phases were skipped.
5. Run `34528237689` is **SUCCESS** for a focused one-shot verifier commit `5f100fae64d74f20a00c2653ce9c8d13f150948c`, whose parent is exact canonical `298ebcdd...` and whose only change is adding `.github/workflows/v3-admin-console-one-shot.yml`. It passed the #92 validator, #92 edge regression, and #92 browser/mobile regression.
6. The focused one-shot is not the complete accumulated gate and is not the exact canonical SHA. It therefore cannot be promoted to an exact-candidate/full-suite PASS.
7. `tests/v3-admin-console-edge.mjs` uses a mocked Admin Console API. It proves service state/orchestration behavior but does not execute the retained `bq-admin` JWT/platform-role/service-role authorization boundary.
8. The browser/mobile smoke test exercises rendered Admin Console interactions at 390px, verifies action handoff, visible mutation error handling, 44px button height, horizontal-overflow protection, and standalone signed-out containment without legacy `admin.js` or a second Supabase runtime.
9. Primary backend source shows `bq-admin` authenticates the bearer JWT, checks active platform `owner/admin`, then performs privileged operations with the server-side admin client. This is a HIGH-RISK trusted boundary.
10. No dedicated `agent/a1-work/092-admin-console` exact candidate exists, so there is currently no quarantine candidate SHA on which A4 can issue the mandatory HIGH-RISK READY review.

## INFERENCE
- The architecture-phase failure in `34528132854` is consistent with the verifier changing the product regression workflow to add `push:` while the #92 validator explicitly requires that workflow to remain `workflow_dispatch`-only. Regardless of root cause, the run is incomplete and unusable as green evidence.
- Focused run `34528237689` is useful targeted evidence because its verifier commit is a direct child of `298ebcdd...` with only a separate one-shot workflow added, but exact-state policy still forbids treating it as the complete exact candidate PASS.

## ACCEPTANCE MATRIX
- Signed-out state/no admin calls: **covered by permanent edge and standalone smoke; focused run green**.
- Non-Owner/Admin denial: **covered only through mocked API behavior; trusted server boundary not executed**.
- Owner/Admin readiness before reads/mutations: **service behavior covered by mock; retained server source inspected; faithful end-to-end authorization evidence missing**.
- User/congregation/group read normalization: **covered by edge regression with representative data**.
- Mutation rejection unless ready: **covered by edge regression**.
- Existing server-authoritative mutation API + refresh path: **orchestration covered by edge/smoke; real trusted mutation boundary not executed**.
- Permission denial vs network/runtime error: **covered at service level through mocked errors**.
- #93 Admin Operations exclusion: **validator checks `bq-admin-ops` exclusion; permanent workflow invokes validator**.
- Mobile interaction/390px overflow/touch targets: **covered by focused browser/mobile run**.
- Legacy standalone runtime duplication: **covered by focused browser/mobile run**.
- Complete accumulated architecture + edge/security + browser/mobile suite on exact candidate: **MISSING**.

## FAILURES
- `34528132854`: accumulated functional attempt failed in architecture phase; remaining required phases skipped.
- No unexplained accumulated-regression weakening was found in canonical `298ebcdd...`.

## MISSING EVIDENCE
1. An authorized exact HIGH-RISK quarantine candidate under `agent/a1-work/092-admin-console`.
2. Complete accumulated functional green for that exact candidate; no PASS transfer from `298ebcdd...`, `5f100fae...`, or any later bookkeeping SHA.
3. Faithful trusted-boundary authorization regression against the real/faithfully executable `bq-admin` contract, including at minimum unauthenticated denial, active non-admin denial, inactive admin denial, active admin/owner allowance, owner-only role transition enforcement, self-demotion/owner protection, and proof browser clients cannot bypass the Edge Function to perform privileged platform/audit mutations.
4. Current same-candidate A3 architecture/security satisfaction for the HIGH-RISK boundary before A4 READY can authorize promotion.
5. If a candidate changes workflow/test semantics rather than merely adding #92 invocations, exact review of the changed harness and preserved semantic assertions.

## TRIAGE RECONCILIATION
`automation/TRIAGE.md` is stale for live product state: it still treats #91 corrective closure as active and says #92 is deferred, while canonical #92 development already exists at `298ebcdd...`. This report does not use TRIAGE as evidence for the QA finding.

## RECOMMENDATION
**NOT READY.** Do not perform autonomous #92 bookkeeping/promotion from the current state. Reconcile the live implementation into the required `agent/a1-work/092-admin-console` quarantine candidate without broadening scope; add faithful trusted-boundary authorization coverage; run the complete accumulated exact-candidate functional gate; then obtain fresh same-SHA A3 satisfaction and A4 review. If all exact requirements are green and prior accumulated coverage remains intact, A4 may mark that exact candidate READY.

## STALENESS
This report becomes stale immediately if `feature/v3-admin-console` moves, an `agent/a1-work/092-*` candidate appears or moves, frozen base changes, #92 product/backend/tests/workflow change, or new exact run evidence is produced.