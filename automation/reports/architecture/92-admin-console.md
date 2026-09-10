# A3 Architecture/Security — #92 Admin Console

Agent: `BQ-A3-ARCH-SECURITY`
Generated: 2026-09-11 05:40 JST

## Exact state
- Canonical: `feature/v3-admin-console` @ `2d3d1b5467e24120f79dedfef762c1ebd6de9b06`.
- Candidate: no `agent/a1-work/092*` branch found at inspection time.
- Frozen base: `release/v3.62-content-review` @ `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`.
- Exact Actions evidence for canonical SHA: none found.
- Canonical moved during this inspection from `1a33a225b709e199cc50c69c1fd8724bd660dfe4` to `2d3d1b...`; all findings below were rebound to `2d3d1b...`.

## Provisional primary-evidence findings (formed before TRIAGE)

### FACT
1. #92 is a HIGH-RISK privileged administration surface. The browser uses the publishable Supabase client and the retained `bq-admin` Edge Function for privileged admin actions; the Edge Function owns the service-role client.
2. `bq-admin` authenticates the Bearer JWT with `auth.getUser()` and then requires an active `bible_app_access` row whose role is `owner` or `admin` before handling privileged actions.
3. Sensitive role transitions are additionally constrained server-side: an `admin` cannot grant/demote `admin`/`owner`, and an active owner cannot demote self. Congregation/group ownership transitions also carry server-side ownership checks in the retained function.
4. Direct browser privilege escalation through `bible_app_access` is blocked in source-controlled database permissions: RLS allows signed-in users to read only their own access row; `anon`/`authenticated` have all privileges revoked and `authenticated` receives SELECT only. `bible_admin_audit_log` has no browser privileges.
5. Existing `tests/v3-admin-console-edge.mjs` is a mocked service/orchestration test. It does not execute the real `bq-admin` JWT/role/service-role trust boundary.
6. At exact canonical `2d3d1b...`, permanent `.github/workflows/v3-regression.yml` still ends at #91 for architecture validators, edge/security regressions, and browser/mobile regressions. It does **not** invoke `scripts/validate-v3-admin-console.mjs`, `tests/v3-admin-console-edge.mjs`, or a #92 browser smoke. No exact canonical Actions run was found.
7. HEAD `2d3d1b...` changes only `scripts/validate-v3-admin-console.mjs`, aligning its source-token checks with the retained Edge Function implementation. That validator is not yet part of the permanent accumulated workflow.

## Trust boundary

### RECOMMENDATION
Keep privileged Admin Console mutations server-authoritative through `bq-admin` (or an equivalently trusted server function). The browser may carry the user's access token and request an operation, but must never receive the service-role/secret key or gain direct UPDATE/INSERT privileges on `bible_app_access`, admin audit state, or other server-only control tables.

Every privileged action must independently authenticate the JWT and authorize the current active platform role on the server before using service-role capabilities. Owner-only transitions and object-level ownership invariants must remain server-side; client UI hiding/validation is not an authorization control.

Do **not** broaden authenticated grants/RLS to make Admin Console writes easier, do not move platform-role decisions into browser state/app metadata alone, and do not weaken owner/admin transition protections.

## Missing promotion evidence

### FACT
- No authorized `agent/a1-work/092*` exact candidate exists.
- No exact functional/accumulated green exists for canonical `2d3d1b...`.
- The existing #92 edge test mocks the API and therefore does not prove member/inactive-user denial or owner/admin authorization against the real Edge Function/database boundary.
- The permanent accumulated workflow has not yet incorporated #92 validation/tests.

### RECOMMENDATION
Before #92 can be security-ready, add faithful permanent trusted-boundary evidence that exercises at least: unauthenticated denial; ordinary member/leader/pastor denial at the platform-admin boundary; inactive admin denial; active admin permitted operations; owner-only role transitions denied to admin and permitted to owner; forged/self-target role changes blocked as designed; and direct authenticated mutation of `bible_app_access`/audit state denied. Run this together with all accumulated prior regressions on the exact quarantine candidate, then obtain fresh same-SHA A3/A4 review.

## TRIAGE comparison (read after independent findings)
TRIAGE is materially stale for repository execution state: it still says #92 is deferred behind #91 corrective closure, while live canonical development has moved to `feature/v3-admin-console`. Its #91 governance concerns are not used as evidence for the findings above. The mismatch itself should be reconciled by A5/control-plane ownership; A3 does not edit TRIAGE.

## Disposition
**HIGH-RISK ACTIVE — NOT READY FOR PROMOTION.** The inspected architecture has a directionally sound server-side privilege boundary and source-controlled direct-table grant hardening, but #92 lacks a quarantine candidate, faithful trusted-boundary security regression, permanent accumulated workflow integration, and exact-SHA green evidence.

## Staleness
This report becomes stale immediately if `feature/v3-admin-console` moves from `2d3d1b5467e24120f79dedfef762c1ebd6de9b06`, an `agent/a1-work/092*` candidate appears/moves, a newer frozen release appears, `bq-admin`/admin API/database grants/RLS change, #92 tests/workflow wiring change, or new exact run evidence appears.