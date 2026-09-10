# A2 Contract Report — #87 Content Reporting

Identity: `BQ-A2-CONTRACT`
Generated: 2026-09-11 JST

## STATE / PROVENANCE

- Active milestone: **#87 Content reporting**.
- Canonical branch: `feature/v3-content-reporting`.
- Exact canonical HEAD at final pre-write reconciliation: `17071432a815ef5cf53f5f4538df982285114bd0`.
- Latest frozen release: `release/v3.59-accessibility-support` at exact `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Canonical is 21 commits ahead of the frozen base.
- Authorized autonomous candidate `agent/a1-work/087-content-reporting`: **not found**.
- Durable handoff records exact functional candidate `72ef635a5322e715c293de489bf37a170f05729d`, targeted run `34509850415`, and complete accumulated functional run `34510669714` as green for that SHA only.
- Exact bookkeeping verification run `34511515241` completed SUCCESS through isolated verifier commit `6a21e8a4d83c8a58b87ec37dcff10f453cb7d6b0`, whose workflow explicitly checked out/asserted exact bookkeeping SHA `17071432a815ef5cf53f5f4538df982285114bd0` and ran accumulated architecture, edge/security, and browser/mobile phases.
- No `release/v3.60-content-reporting` was established by the inspected evidence.
- Authoritative inventory at canonical marks #87 **Verified**, with required verification `submit report; validation; success/error`; #88 Content moderation and #91 Content Review remain separate.

**Staleness:** candidate-specific findings are stale if canonical moves from `17071432...`, if an `agent/a1-work/087-*` branch appears/moves, if reporting API/schema/RLS/grants/tests/workflow change, or if a newer exact review/run appears. Frozen-base statements become stale only if a newer immutable v3 release becomes the valid base.

## EVIDENCE INSPECTED

Primary evidence inspected before TRIAGE:

1. `automation/MASTER_CONTROL.md`, `automation/AGENT_GUARDRAILS.md`, A2 role file, `automation/CURRENT.md`, `automation/WRITE_LEASE.md`, and `automation/SCHEDULE_AND_LOCKING.md` on `automation/v3-agent-control`.
2. Live canonical branch/ref and latest frozen release ref.
3. Frozen-to-canonical compare: 21 commits / #87 product, tests, workflow and bookkeeping delta.
4. `FEATURE_INVENTORY_V3.md` at `17071432...`.
5. `CONTENT_REPORTING_V3.md` at `17071432...`.
6. `src/app/content-reporting.js` and the `src/core/api.js` reporting insert path at `17071432...`.
7. `supabase/migrations/20260905_content_review_and_reports.sql` at `17071432...`.
8. Historical review-integrity migration commit `c05dbc939d67295628befb32839383dba41d4e2e`, adding `20260905121500_content_report_review_integrity.sql`.
9. `DEVELOPMENT_HANDOFF_V3.md` at `17071432...`.
10. Exact bookkeeping run `34511515241`, job steps, and isolated verifier workflow `6a21e8a4...`.

`automation/TRIAGE.md` was read only after the above provisional conclusions were formed.

## REQUIRED PARITY — FACT

Authoritative minimum contract:

- user can submit a content report;
- submission input is validated;
- user receives explicit success/error behavior.

The current recovered server contract defines accepted report fields and bounds:

- content types: `question`, `statement`, `answer`, `explanation`, `story`, `reader`, `other`;
- reasons: `doctrinal`, `accuracy`, `wording`, `inappropriate`, `duplicate`, `source`, `other`;
- content key 3–180 characters;
- source up to 120;
- reference up to 160;
- content text 1–4000;
- optional note up to 1200;
- report submission is congregation-scoped and reporter-scoped.

The old UI's briefly exposed `technical` reason is **not** a valid current parity requirement because the authoritative retained database constraint does not allow that value. The current v3 service correctly follows the database-accepted reason set rather than preserving a client option that could not satisfy the backend contract.

## CURRENT VERIFIED OWNERS — FACT

- `src/app/content-reporting.js` is the #87 orchestration/validation owner. It composes shared API/session/congregation owners, validates the bounded report context/reason/note, verifies a current user and congregation membership, submits, and requires a returned report ID.
- `src/core/api.js` remains the single Supabase implementation boundary for #87 and performs the direct `bible_content_reports` insert.
- Session and congregation membership remain existing owners; #87 does not create competing auth/membership state.
- `CONTENT_REPORTING_V3.md` records presentation ownership in `src/ui/content-reporting.js`, bounded reportable surfaces, and separation from #88/#91.

## RETAINED DATA / SERVER CONTRACTS — FACT

`20260905_content_review_and_reports.sql` creates `public.bible_content_reports`, enables RLS, revokes general table access, then grants authenticated `select, insert, update`. Its INSERT policy allows a row when:

- `reporter_id = auth.uid()`; and
- the authenticated user is a member of `congregation_id`.

The same table contains moderation/review columns `status`, `reviewed_by`, and `reviewed_at`. The inspected INSERT policy does not constrain those fields. The later review-integrity migration guards **UPDATE** immutability/reviewer identity and tightens reviewer UPDATE policy; it does not alter the initial INSERT contract.

`src/core/api.js` sends the caller-supplied report row through a direct browser `.from('bible_content_reports').insert(row)` call.

**FACT:** the normal #87 service currently constructs a row containing only submission fields and does not itself add moderation fields.

**FACT:** client payload shaping is not the database authorization boundary; a caller capable of invoking the table INSERT directly is governed by grants/RLS/constraints, not by `src/app/content-reporting.js` alone.

## UX / STATE — FACT

Current recovered contract requires:

- signed-out submission fails explicitly;
- missing/currently invalid congregation membership fails explicitly;
- invalid type/reason or out-of-bounds fields fail explicitly;
- success requires the backend to return a report ID before the UI reports success;
- backend/RLS/network failure remains a recoverable error and is not converted to success;
- reporting is limited to explicitly reportable content context and must not absorb private form/note/account/community/workspace/couples/admin data.

## EXACT VERIFICATION EVIDENCE — FACT

- Functional candidate `72ef635a5322e715c293de489bf37a170f05729d`: complete accumulated run `34510669714` recorded green in the durable handoff.
- Bookkeeping SHA `17071432a815ef5cf53f5f4538df982285114bd0`: run `34511515241` completed SUCCESS.
- Its isolated verifier workflow explicitly checked out and asserted `17071432...` before tests.
- The run completed accumulated architecture validators, accumulated edge regressions, and accumulated browser/mobile regressions.
- The isolated workflow visibly invokes `scripts/validate-v3-content-reporting.mjs`, `tests/v3-content-reporting-edge.mjs`, and `tests/v3-content-reporting-smoke.mjs` while retaining the prior accumulated invocation lists.
- The green bookkeeping run is valid for exact `17071432...`; it does not prove a different SHA.

## CONTRACT / ACCEPTANCE GAP — FACT

The remaining material gap is the trusted reporter INSERT boundary, not the user-facing reason list.

Authenticated users have direct INSERT privilege on `bible_content_reports`; the INSERT RLS rule verifies reporter identity and congregation membership but does not constrain the initial moderation fields `status`, `reviewed_by`, or `reviewed_at`. Because the API uses a direct browser table insert, the current server contract permits a client to bypass the normal service payload and attempt to author those review-state columns on initial INSERT.

This crosses the separation between #87 submission and later #88/#91 moderation/review authority. The existing UPDATE integrity trigger does not close initial INSERT authority.

## EXPLICITLY OUT OF SCOPE

- #88 moderation-policy application and decisions except the minimum authority separation required to keep #87 submission from authoring moderation state.
- #91 Content Review workbench/reviewer workflow.
- #92/#93 admin console/operations.
- broad auth/congregation/router/API refactors.
- legacy browser globals, MutationObserver ownership, unrestricted DOM scanning, or duplicated direct-Supabase presentation paths.

## LEGACY BEHAVIOR NOT TO COPY

- Do not restore `technical` merely because an old UI exposed it; the retained database contract rejects it.
- Do not reproduce global `window.BQ*` ownership or unrestricted DOM surveillance.
- Do not treat client-side payload omission as authorization enforcement.
- Do not absorb decision editing/review workflow into #87.

## DEPENDENCIES

Required composition remains limited to authenticated session, current congregation membership, shared API/backend submission boundary, reportable content context, and the existing reports table/security contract. No evidence requires implementation of #88 or #91 to deliver #87 submission itself.

## AMBIGUITIES / MISSING EVIDENCE

1. **MISSING EVIDENCE:** no faithful executed backend-negative regression was located proving an ordinary authenticated member cannot forge `status`, `reviewed_by`, or `reviewed_at` on initial INSERT.
2. **MISSING EVIDENCE:** the required `agent/a1-work/087-content-reporting` quarantine ref is absent; the historical functional candidate is documented by SHA/run but not represented by the required current autonomous work branch.
3. **MISSING EVIDENCE:** no fresh exact-candidate A3/A4 acceptance for canonical `17071432...` was established in this A2 role; HIGH-RISK review is outside A2 authority but remains relevant lifecycle evidence.
4. **AMBIGUITY:** the retained UI's broad context discovery changed over time. The authoritative acceptance does not require copying unrestricted legacy DOM scanning; the bounded v3 route/content selection is consistent with the minimum reporting contract unless stronger retained evidence proves a required omitted surface.

## ACCEPTANCE CHECKLIST — RECOMMENDATION

- [x] One v3 reporting orchestration owner composes existing session/congregation/API owners.
- [x] Accepted content types/reasons and field bounds match the retained database contract.
- [x] Signed-out/current-membership/invalid-input/backend-error/success-ID behavior is represented in the recovered contract and permanent #87 tests.
- [x] Exact complete functional green exists for `72ef635a...`.
- [x] Exact complete bookkeeping green exists for `17071432...` through isolated explicit checkout/assertion.
- [x] Accumulated workflow visibly invokes #87 validator/edge/browser coverage while retaining prior accumulated lists.
- [ ] Make reporter identity and moderation/review state backend-authoritative on initial INSERT; ordinary members must not be able to author #88/#91 state by bypassing the normal service payload.
- [ ] Add faithful negative trusted-boundary coverage for forged moderation/reviewer state, reporter identity, and cross-congregation scope.
- [ ] Reconcile the milestone into the required `agent/a1-work/087-content-reporting` quarantine lifecycle and obtain the exact HIGH-RISK review/provenance required by autonomous guardrails before freeze.

## FACT / INFERENCE / RECOMMENDATION

**FACT:** #87's current user-facing/service contract matches the authoritative database reason/type constraints; the previous A2 `technical`-reason parity finding is superseded.

**FACT:** exact bookkeeping SHA `17071432...` has complete accumulated green run `34511515241` through an isolated workflow that explicitly checks out/asserts that SHA.

**FACT:** the current database INSERT policy does not constrain initial `status`, `reviewed_by`, or `reviewed_at`, while authenticated users have direct INSERT and the browser API uses direct table insertion.

**INFERENCE:** the current clean v3 orchestration/UI design is contract-consistent for #87, but the backend authority separation is incomplete because a direct client can bypass the curated row shape.

**RECOMMENDATION:** keep #87 active and do not freeze v3.60 yet. Repair only the report-submission authority boundary, preserve the existing narrow #87 user-facing contract, add faithful permanent negative security coverage, restore authorized quarantine provenance, and rerun/review the resulting exact candidate under HIGH-RISK rules. Do not broaden into #88/#91 implementation.

TRIAGE was read only after independent findings. It independently identifies the same current canonical SHA and authorization/provenance concerns; that agreement was not used as proof.