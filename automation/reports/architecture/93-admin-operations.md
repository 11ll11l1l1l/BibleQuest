# A3 Architecture / Security — #93 Admin Operations

STATE/PROVENANCE
- Agent: `BQ-A3-ARCH-SECURITY`
- Inspected: 2026-09-11 JST.
- Active canonical: `feature/v3-admin-operations` @ `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`.
- Required autonomous quarantine candidate `agent/a1-work/093-*`: not found.
- Latest frozen base: `release/v3.63-admin-console` @ `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
- Exact green functional product SHA: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7` from isolated run `34531751123`.
- Current canonical is later bookkeeping/documentation/validator state. No complete Actions run was found whose asserted product SHA is current canonical `56fe2469...`.
- This report is stale immediately if canonical/candidate/frozen SHA changes, `bq-admin-ops`, `src/core/api.js`, Admin Operations ownership, accumulated workflow/tests, platform-role authority, or exact run evidence changes.

INSPECTED EVIDENCE
FACT:
- Control requires HIGH-RISK work touching trusted server authority, destructive account operations, workflow/test changes, or authorization boundaries to remain quarantined until exact-candidate independent review.
- `ADMIN_OPERATIONS_V3.md` assigns browser networking to `src/core/api.js`, Admin Operations state/orchestration to `src/app/admin-operations.js`, rendering/filtering to `src/features/admin-operations/index.js`, Session as auth/session owner, and `supabase/functions/bq-admin-ops/index.ts` as final server authority.
- `bq-admin-ops` authenticates the supplied bearer token with `auth.getUser`, then looks up `bible_app_access` and accepts only active platform `owner`/`admin` before returning privileged operational data.
- `delete_user` is additionally owner-only, rejects active self-delete, rejects another active owner, blocks targets that still own congregations or active groups, ends target-created active rooms, audits the deletion, and finally performs `auth.admin.deleteUser`.
- Service-role/secret material remains server-side inside `bq-admin-ops`; no browser secret was found in the inspected #93 contract/implementation boundary.
- The permanent accumulated workflow at canonical includes `validate-v3-admin-operations.mjs`, `v3-admin-operations-edge.mjs`, and `v3-admin-operations-smoke.mjs` while retaining earlier accumulated suites.
- `tests/v3-admin-operations-edge.mjs` injects a mocked `api` object. It validates client/service orchestration and presentation guards but does not execute the real JWT -> platform-role -> service-role trust boundary or destructive backend handler.
- Run `34531751123` completed successfully. The isolated verifier commit was a direct child of product SHA `2e93349e...`, explicitly checked out/asserted `2e93349e...`, then passed accumulated architecture, edge/security, and browser/mobile phases.
- The durable handoff records bookkeeping run `34532442314` as failing after bookkeeping assertions because retained #92 validation still pinned #93 to `Not started`; canonical later changed to correct that lifecycle assertion/documentation.

REQUIRED OWNER/COMPOSITION
FACT:
- Current single-owner composition is coherent: Session owns user/session state; `src/core/api.js` owns browser network calls; Admin Operations service owns client projection/orchestration; `bq-admin-ops` owns privileged authorization and destructive account deletion; #92 Admin Console remains the user/congregation/group administration owner.

RECOMMENDATION:
- Preserve these boundaries. Do not create a second browser or RPC owner for Admin Operations. Do not move destructive account authority into #92 client code.

SAFE DATA FLOW
RECOMMENDATION:
- Browser -> `src/core/api.js` -> authenticated `bq-admin-ops` -> server validates JWT -> server reads active platform role -> server executes service-role reads/deletion -> bounded response -> `src/app/admin-operations.js` strips privileged identifiers before UI projection.
- Owner deletion should remain server-authoritative even when the browser performs typed-confirmation and role checks.

AUTHORIZATION / SERVER TRUST BOUNDARY
FACT:
- `bq-admin-ops` currently enforces active platform `owner/admin` for status/health/dashboard and exact `owner` for account deletion.
- Browser-side owner checks are not security authority.

MISSING EVIDENCE:
- No faithful permanent regression was found that executes the production `bq-admin-ops` handler (or an equivalent real trusted-boundary harness) and proves:
  1. missing/invalid JWT denied;
  2. signed-in non-platform user denied;
  3. inactive platform admin/owner denied;
  4. active admin allowed dashboard but denied `delete_user`;
  5. active owner allowed authorized operations;
  6. self-delete rejected server-side;
  7. another active owner rejected;
  8. congregation/group ownership blocks deletion;
  9. authorization cannot be forged by client-provided role/target metadata;
  10. successful deletion audits and invokes Auth deletion only after all server guards pass.
- No current exact-canonical complete green was found for `56fe2469...`.
- Required `agent/a1-work/093-*` quarantine provenance is absent.

PRIVACY/SCOPE
FACT:
- The #93 contract requires privileged client-error user/congregation identifiers not be projected into rendered dashboard state and poll voter identity not be rendered. The client edge test checks identifier stripping in normalized state.

RECOMMENDATION:
- Do not broaden Admin Operations into editing operational records, password/recovery, #92 ownership mutation, moderation tooling, production deployment, or schema work.

UNSAFE APPROACHES
- Direct browser service-role access or exposing service credentials.
- Trusting a browser-provided role instead of server-side `bible_app_access` lookup.
- Allowing `admin` to invoke account deletion.
- Duplicating server ownership checks as the only enforcement in the browser.
- Treating mocked client API success as proof of backend authorization.
- Promoting current canonical/bookkeeping state by transferring PASS from `2e93349e...`.

BLOCKERS
1. HIGH-RISK lifecycle evidence is incomplete: no required `agent/a1-work/093-*` candidate exists, so there is no exact quarantine candidate on which A3/A4/A5 can perform mandatory promotion review.
2. Trusted-boundary authorization evidence is insufficient for destructive #93 authority: the permanent #93 edge regression mocks the API and does not execute `bq-admin-ops`. A defect in JWT/platform-role/owner-delete enforcement could therefore survive the current #93 client suite.
3. Current canonical `56fe2469...` has no complete exact-SHA accumulated green found during this inspection. The valid complete PASS belongs only to product SHA `2e93349e...`.

NON-BLOCKING OBSERVATIONS
- The inspected production handler itself is directionally conservative: authentication and platform role are server-derived, deletion is owner-only, ownership dependencies are checked, and service credentials stay server-side.
- Current canonical changes after `2e93349e...` appear primarily bookkeeping/documentation/validator related; this does not permit PASS transfer.

ARCHITECTURE ACCEPTANCE CHECKS
- Restore/establish governance-compliant `agent/a1-work/093-*` candidate lineage from an authorized reconciled state.
- Retain current single-owner client/server composition and no browser secret exposure.
- Add meaningful permanent faithful trusted-boundary tests for the authorization/destructive scenarios above without weakening prior regressions.
- Run the complete accumulated functional gate against the exact final candidate SHA.
- Obtain fresh same-SHA A3 trust-boundary satisfaction and A4 READY before HIGH-RISK bookkeeping/promotion.
- Run a separate complete exact bookkeeping-SHA gate after bookkeeping changes; do not transfer the functional PASS.

TRIAGE COMPARISON (read only after provisional findings)
FACT:
- `automation/TRIAGE.md` is stale. It still identifies #92 Admin Console as active at `8a759218...` and defers #93, while live primary evidence shows frozen v3.63 and active `feature/v3-admin-operations` at `56fe2469...`.
- TRIAGE was not used as evidence for the findings above.
