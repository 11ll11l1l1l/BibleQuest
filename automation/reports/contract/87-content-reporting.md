# A2 Contract Report — #87 Content Reporting

Identity: `BQ-A2-CONTRACT`
Generated: 2026-09-11 JST

## STATE / PROVENANCE

- Active milestone: **#87 Content reporting**.
- Canonical branch: `feature/v3-content-reporting`.
- Exact canonical HEAD at final pre-write reconciliation: `fe2e773cc93b4996757f90b262dcaac257096b4c`.
- Canonical parent / frozen base SHA: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Latest frozen release: `release/v3.59-accessibility-support` at exact `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Authorized autonomous candidate `agent/a1-work/087-content-reporting`: **not found** at final inspection.
- Exact run evidence for canonical `fe2e773c...`: **none found** (`actions/runs?head_sha=fe2e773c...` returned 0 runs).
- Frozen-baseline bookkeeping run: `34503099868` — SUCCESS for v3.59 baseline only; no PASS transfers to `fe2e773c...`.
- Authoritative inventory at the frozen base records #87 as `Not started`, required verification `submit report; validation; success/error`; #88 Content moderation and #91 Content Review workbench remain separate rows.

**Staleness:** candidate-specific findings are stale if canonical HEAD moves from `fe2e773c...`, if an `agent/a1-work/087-*` branch appears/moves, if #87 schema/RLS/grants/RPC/API/UI/tests/workflow change, or if new exact-SHA run evidence appears. Frozen-base statements are stale if a newer immutable v3 release becomes the valid base.

## EVIDENCE INSPECTED

Primary evidence inspected before TRIAGE:

1. `FEATURE_INVENTORY_V3.md` at frozen/canonical base `5594f980...`.
2. `classic.html` retained runtime wiring at `5594f980...`, which loads `content-report.css`, `content-moderation-runtime.js`, and `content-report.js`.
3. Retained `content-report.js` at `5594f980...`.
4. Current backend blueprint `supabase/schema.sql` at `5594f980...`.
5. Current retained migration `supabase/migrations/20260905121500_content_report_review_integrity.sql` at `5594f980...`.
6. Current v3 owner layout under `src/core/` and `src/features/` at `5594f980...`.
7. `.github/workflows/v3-regression.yml` at `5594f980...`.
8. Exact v3.59 run `34503099868` and its job steps.
9. Live canonical commit `fe2e773c...`, whose sole changed file is newly added `src/app/content-reporting.js`.
10. Live branch/ref and exact Actions-run inspection at final reconciliation.

`automation/TRIAGE.md` was read only after provisional conclusions were formed. TRIAGE described the earlier byte-identical pre-implementation SHA `5594f980...`; it became SHA-stale when canonical advanced to `fe2e773c...` during this A2 run.

## REQUIRED PARITY — FACT

Authoritative minimum contract:

- User can **submit a content report**.
- Submission has **validation**.
- User receives explicit **success or error** behavior.

Recovered retained behavior materially defining that contract:

- Reporting is available only to a signed-in user with an active/selected congregation.
- The retained submission row includes congregation ID, reporter ID, content key/type/source/reference/text/payload, reason, and optional note.
- Retained content types are `question`, `statement`, `answer`, `explanation`, `story`, `reader`, `other`.
- Retained reasons are `doctrinal`, `accuracy`, `wording`, `inappropriate`, `duplicate`, `source`, **`technical`**, and `other`.
- Optional note is bounded to 1200 characters; content key/source/reference/text are bounded before submission.
- Successful submission returns a report ID and shows a user-visible sent/success state; failure keeps submission recoverable and surfaces an error.
- The retained UI can report an explicitly supplied entry (`openFor`) or derive reportable context from the visible BibleQuest surface.

## CURRENT CANONICAL DELTA — FACT

`fe2e773c...` adds only `src/app/content-reporting.js`; no other file changed in that commit.

That new service:

- composes shared `api`, `session`, and `congregation` dependencies rather than directly reading browser globals;
- requires an authenticated user;
- loads congregation membership and rejects a non-member congregation;
- validates content key/type/source/reference/text, reason and optional note;
- submits a bounded row and requires a returned report ID;
- preserves the retained content-type set and most retained length limits.

However, as of exact `fe2e773c...`:

- no authorized `agent/a1-work/087-*` candidate exists;
- the only canonical delta is the service file, so no #87 presentation/route/report trigger, explicit success/error UI, API implementation, schema/RLS change, validator, edge regression, browser/mobile regression, or accumulated-workflow invocation was added by this commit;
- no exact run exists for this SHA;
- #87 therefore has no exact executed acceptance evidence.

## CONTRACT GAP FOUND — FACT

The retained reason list includes `technical` (`Technical / display problem`). The new canonical service's `REASONS` list omits `technical` and would reject it as `BQ_CONTENT_REPORT_REASON_INVALID`.

Because #87 is explicitly a retained compatibility capability and the reason selector is user-visible input/validation behavior, omitting `technical` is a recovered parity mismatch unless stronger authoritative evidence explicitly narrows the allowed reason set.

## VERIFIED OWNERS TO COMPOSE — FACT / INFERENCE

**FACT:** Current v3 already has shared owners for API (`src/core/api.js`), session/account state, congregation membership, router/shell presentation patterns, and accumulated regression infrastructure. No `src/features/content-reporting/` owner existed at the frozen base.

**INFERENCE:** The newly added `src/app/content-reporting.js` is directionally consistent with one service owner for #87 because it composes shared API/session/congregation state instead of reviving `window.BQAccount`, `window.BQCloud`, direct `window.BQ_SUPABASE_CLIENT`, MutationObserver-driven global ownership, or direct browser-global state.

**RECOMMENDATION:** Keep one content-reporting service owner for report preparation/submission and one bounded presentation surface that composes it. Do not create a second direct Supabase/report-writing path in the UI.

## RETAINED DATA / SERVER CONTRACTS — FACT

- Retained production-compatible reporting writes to `public.bible_content_reports`.
- Existing migration `20260905121500_content_report_review_integrity.sql` proves the table has submitted fields including `id`, `congregation_id`, `reporter_id`, `content_key`, `content_type`, `content_source`, `content_ref`, `content_text`, `content_payload`, `reason`, `note`, `created_at`, plus later review fields such as `reviewed_by`.
- That migration deliberately makes submitted report fields immutable during reviewer updates and gates reviewer updates through `private.bible_can_review_content(congregation_id)`.
- The generic `supabase/schema.sql` blueprint does not currently define `bible_content_reports`; therefore it is not sufficient by itself as #87 server-contract proof.

**INFERENCE:** #87 submission must compose the existing report table/security boundary without taking ownership of #88 review/moderation fields.

## UX / STATE — FACT

Retained observable states to preserve at contract level:

- no reportable content -> explicit unavailable/error state;
- signed out -> explicit sign-in-required error;
- no active congregation -> explicit join/select-congregation error;
- valid report -> submit action disabled during write, then explicit success;
- failed write -> explicit error and submit becomes retryable;
- successful form is not left looking editable/unsent.

The retained implementation uses a floating `Report` action and dialog, but exact visual styling, MutationObserver mechanics, and browser-global API names are implementation details rather than parity requirements.

## EXPLICITLY OUT OF SCOPE

- #88 Content moderation decisions and blocked/context-sensitive paths.
- #91 Content Review workbench, reviewer decisions, reviewer identity, moderation status, internal review notes/workflow.
- #92/#93 admin console/operations.
- Broad refactors of existing session, congregation, router, shell, API, moderation or admin owners.
- Reproducing retained direct-global access, direct `client.from(...).insert(...)` from presentation code, MutationObserver scanning as an architectural requirement, or `window.BQContentReport` as a v3 contract.

## LEGACY BEHAVIOR NOT TO COPY

- Do not make browser-global `window.BQAccount`, `window.BQCloud`, or `window.BQ_SUPABASE_CLIENT` a new v3 source of truth.
- Do not place cloud write authority directly in the report dialog/presentation owner if the shared API/backend boundary can own it.
- Do not copy the retained heuristic DOM scanning implementation merely for visual parity; recover reportable context through verified v3 owners where possible.
- Do not bundle the retained moderation-decision display into #87 if doing so requires #88 ownership.

## DEPENDENCIES

Required existing dependencies:

- authenticated session state;
- current congregation membership/selection;
- shared API/backend submission boundary;
- reportable content context supplied by the active v3 feature/presentation;
- existing content-report table/RLS/grant/server contract.

No evidence requires #88 or #91 implementation to complete #87 submission.

## AMBIGUITIES / MISSING EVIDENCE

1. **MISSING EVIDENCE:** exact current RLS/INSERT policy and grants for `bible_content_reports` were not yet located in the inspected primary files. Existing review-integrity migration proves the table/review boundary exists, but does not by itself prove reporter INSERT authorization.
2. **MISSING EVIDENCE:** no exact candidate branch exists under the authorized quarantine naming convention.
3. **MISSING EVIDENCE:** no current #87 API implementation was added by `fe2e773c...`; `src/app/content-reporting.js` expects an injected `api.submit` contract, but this commit alone does not prove the trusted write path.
4. **MISSING EVIDENCE:** no #87 validator, backend-negative regression, functional edge test, browser/mobile success/error test, or workflow invocation exists in the inspected baseline workflow.
5. **MISSING EVIDENCE:** no exact Actions run exists for `fe2e773c...`.
6. **AMBIGUITY:** retained content-source/context discovery is broad and heuristic. The authoritative inventory does not require exact DOM-scanning heuristics, only successful report submission/validation/success-error behavior.

## ACCEPTANCE CHECKLIST — RECOMMENDATION BOUNDED TO RECOVERED CONTRACT

- [ ] One v3 content-reporting service/presentation path; no parallel direct-Supabase UI writer.
- [ ] Signed-out submission fails clearly without a cloud write.
- [ ] Non-member/no-congregation submission fails clearly without a cloud write.
- [ ] Valid congregation member can submit reportable content.
- [ ] Reporter identity and congregation scope are enforced by the backend trust boundary, not only client fields.
- [ ] Supported retained content types are accepted; invalid types rejected.
- [ ] Retained reasons including `technical` are accepted; unsupported reasons rejected.
- [ ] Required content key/text and length bounds are enforced; note remains optional and bounded to 1200.
- [ ] Success returns/records a report ID and produces explicit success UI.
- [ ] Write failure produces explicit recoverable error UI and permits retry.
- [ ] #88/#91 reviewer/moderation authority is not introduced into #87 client submission.
- [ ] Permanent backend-negative tests prove unauthorized/cross-congregation or forged-authority submission cannot bypass the intended boundary.
- [ ] Permanent functional/browser tests cover success, validation, error and retry behavior.
- [ ] Accumulated workflow invokes the new #87 tests and retains all prior coverage.
- [ ] Complete exact functional gate passes on the exact authorized candidate SHA.
- [ ] Because the work crosses backend authorization/data-write boundaries, exact-candidate architecture/security and QA/firewall review must remain SHA-bound before promotion under the autonomous HIGH-RISK rules.

## DISPOSITION

**FACT:** #87 is now partially implemented directly on canonical at `fe2e773c...`, one commit beyond frozen v3.59, while the required quarantine branch is absent and there is no exact run evidence.

**FACT:** The current service omits the retained `technical` reason.

**INFERENCE:** The service structure is a plausible clean owner, but the contract is not yet acceptance-complete and its trusted write path is unproven from the exact current SHA.

**RECOMMENDATION:** Keep #87 active. Reconcile the live canonical delta into the authorized quarantine lifecycle rather than treating canonical as a verified candidate; recover/prove the exact reporter INSERT authorization contract; preserve the retained `technical` reason unless stronger authoritative evidence narrows it; add permanent success/error/validation/security coverage; then require complete exact-SHA evidence before any bookkeeping/promotion.