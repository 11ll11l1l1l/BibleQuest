# A3 Architecture/Security — #87 Content reporting

Agent: BQ-A3-ARCH-SECURITY  
Disposition: **HIGH-RISK ACTIVE — TRUST BOUNDARY NOT SATISFIED; DO NOT PROMOTE**

## Exact state

- Canonical milestone branch: `feature/v3-content-reporting`
- Canonical SHA at final primary inspection: `19bd25dadd12ac1981675d5f153cfd018547c04a`
- Autonomous candidate `agent/a1-work/087-*`: **none found**
- Latest frozen release: `release/v3.59-accessibility-support`
- Frozen SHA: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`
- Exact Actions runs for canonical `19bd25d...`: **none found** at inspection time.
- Canonical has advanced beyond frozen v3.59 and now contains #87 implementation/tests. No PASS from another SHA is transferable.

## Authoritative scope and owners

**FACT:** `FEATURE_INVENTORY_V3.md` row 87 remains `Content reporting`, status `Not started`, required verification `submit report; validation; success/error`. #88 Content moderation and #91 Content Review remain separate capabilities.

**FACT:** `CONTENT_REPORTING_V3.md` defines `src/app/content-reporting.js` as orchestration owner, `src/core/api.js` as the Supabase implementation boundary, session/congregation services as existing identity/membership owners, and `src/ui/content-reporting.js` as presentation only.

**FACT:** Current `src/core/api.js` performs a direct authenticated browser insert with `client.from('bible_content_reports').insert(row)`; there is no #87 trusted RPC/Edge/server submission path.

## Primary backend evidence

**FACT:** `supabase/migrations/20260905_content_review_and_reports.sql` revokes table access and then grants authenticated users table-level `select, insert, update` on `public.bible_content_reports`.

**FACT:** Its INSERT RLS policy permits a row when only these authority conditions hold: `reporter_id = auth.uid()` and `private.is_bible_congregation_member(congregation_id)`. It does **not** constrain `status`, `reviewed_by`, `reviewed_at`, `updated_at`, or other report columns on INSERT.

**FACT:** The same table defines client-addressable review columns: `status` (`open|reviewed|closed`), `reviewed_by`, and `reviewed_at`.

**FACT:** The later `20260905121500_content_report_review_integrity.sql` adds a BEFORE UPDATE trigger and strengthens reviewer UPDATE policy. It protects submitted fields and requires `reviewed_by` to match the authenticated reviewer during UPDATE. It does **not** add an INSERT trigger, column-level INSERT privileges, forced INSERT defaults, or an INSERT policy check for review-state columns.

**FACT:** The migration inventory inspected through current canonical contains no later content-report migration that closes this initial-INSERT authority gap. Later unrelated migrations do not replace the #87 INSERT path.

## Security finding

**FACT:** Application code normally constructs a curated report row and does not intentionally send moderation fields. That is client behavior, not a database authorization boundary.

**INFERENCE:** The current direct-table design permits an authenticated congregation member to bypass the UI/API wrapper and submit a raw Supabase INSERT containing the member's valid `reporter_id` and `congregation_id` while also supplying privileged review-state values such as `status='closed'`, `reviewed_by=<uuid>`, and `reviewed_at=<timestamp>`. The current INSERT `WITH CHECK` does not reject those values, and table-level INSERT is not column-restricted. This allows reporter-controlled data to enter the moderation/review state as if it had server/reviewer authority.

**DISPOSITION:** **TRUST BOUNDARY NOT SATISFIED.** This is a HIGH-RISK authorization defect and must block #87 promotion regardless of UI/service correctness or green non-security tests.

## Existing tests and workflow

**FACT:** `tests/v3-content-reporting-edge.mjs` covers service-level auth/membership checks, reason/input bounds, successful submission shape, and propagation of simulated RLS errors. It uses a mocked API and does not attempt a direct authenticated database INSERT with forged moderation fields.

**FACT:** `tests/v3-content-reporting-smoke.mjs` covers 390px UI success/error/retry, signed-out recovery, excluded routes, and private-input snapshot filtering. Its submission backend is mocked for the functional UI path; it does not exercise the database authorization boundary.

**FACT:** `scripts/validate-v3-content-reporting.mjs` requires the table/RLS migration and checks that the accumulated workflow invokes the #87 validator, edge test, and browser smoke. It checks for the existing `content reports submit own` policy but does not prove that INSERT-time review authority is server-controlled.

**FACT:** `.github/workflows/v3-regression.yml` retains accumulated architecture, edge/security, and browser/mobile lists and invokes the three #87 checks. No unexplained deletion/weakening was observed in that workflow snapshot. However, no exact workflow run exists for canonical `19bd25d...` at inspection time.

## Safe trust boundary

**RECOMMENDATION:** Ordinary reporters may control only the bounded report content/reference/reason/note and selected congregation supported by the recovered #87 contract. Reporter identity and all moderation/review authority must be independently enforced by the backend.

**RECOMMENDATION:** `status`, `reviewed_by`, `reviewed_at`, resolution/internal moderation metadata, and any future #88/#91 authority must not be caller-authoritative during initial submission.

**RECOMMENDATION:** Use one of these bounded server-enforceable designs, without broadening unrelated access:

1. Keep direct INSERT only if authenticated INSERT is reduced to an explicit safe column set and database defaults/constraints/triggers make privileged review fields impossible for the reporter to author; or
2. Use a narrowly parameterized trusted RPC/Edge/server submission operation that derives `reporter_id` from `auth.uid()`, verifies congregation membership, validates bounded fields, fixes moderation defaults internally, and removes direct reporter INSERT authority on the table.

If a `SECURITY DEFINER` function is used, pin `search_path`, derive identity internally, validate every caller-controlled parameter, grant EXECUTE narrowly, and expose no moderation operation through #87.

**RECOMMENDATION:** Do not grant reporters broad report UPDATE/DELETE, reviewer role, other users' report visibility, moderation queues, decisions, or admin actions. Those remain #88/#91 boundaries.

## Required evidence before A3 satisfaction

1. Exact authorized `agent/a1-work/087-*` candidate SHA (or explicitly reconciled authorized candidate lifecycle) compared with frozen `5594f980...`.
2. Backend-enforced repair of initial INSERT authority.
3. Permanent database/security negative tests proving an ordinary authenticated member cannot forge `status`, `reviewed_by`, `reviewed_at` or equivalent review authority; cannot spoof reporter identity; cannot submit cross-congregation without membership; and cannot gain unauthorized report mutation/visibility.
4. Functional #87 success/error/validation tests retained.
5. Accumulated workflow must invoke the new security regression without weakening prior coverage.
6. Complete exact-candidate functional/accumulated green evidence.
7. Because #87 is HIGH-RISK, fresh A3 satisfaction and A4 READY must refer to the same exact candidate SHA before A5 can recommend promotion.

## Missing evidence / limitations

**FACT:** There is no `agent/a1-work/087-*` candidate at inspection time even though implementation exists directly on canonical.

**FACT:** There is no exact Actions run for canonical `19bd25d...` at inspection time.

**FACT:** Production Supabase was intentionally neither inspected nor modified. This review is against repository-defined schema/migrations and current application implementation; promotion still requires the authorized exact verification path.

## TRIAGE comparison — read only after provisional findings

**FACT:** `automation/TRIAGE.md` is now SHA-stale. It describes #87 as pre-implementation with canonical/frozen both at `5594f980...` and no blocker. Live canonical is `19bd25d...` and contains a HIGH-RISK implementation plus the INSERT-time review-authority defect above. TRIAGE was read only after this independent finding was established.

## Staleness conditions

This report becomes stale immediately if canonical `feature/v3-content-reporting`, any `agent/a1-work/087-*` candidate, or latest frozen release moves; if #87 schema/RLS/grants/triggers/RPC/Edge/API/tests/workflow change; or if new exact run evidence appears. Any repaired SHA requires a fresh A3 review; satisfaction does not transfer across SHAs.
