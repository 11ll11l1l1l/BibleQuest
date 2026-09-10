# A3 Architecture / Security — #91 Content Review

STATE: **HIGH-RISK ACTIVE — NOT READY FOR PROMOTION**

## STATE / PROVENANCE
- Investigator: `BQ-A3-ARCH-SECURITY`.
- Canonical branch at final re-read: `feature/v3-content-review` @ `68516bdbdb651dd144270bd5bc615909967130a8`.
- Earlier same-run canonical observations: `fe1dc77640ea3f36f5ba56bbd57a3067bafb58ed` then moved to `68516bdb...`; findings below are bound to the final SHA unless explicitly historical.
- Authorized A1 quarantine candidate: **not found** under `agent/a1-work/091-*` at final inspection.
- Frozen base: `release/v3.61-content-moderation` @ `dfbbb690c814a514714967f240262eec39b6e3ee`.
- Exact Actions evidence for final canonical SHA `68516bdb...`: **none found** (`head_sha` query returned zero runs).
- Stale if canonical/candidate/frozen SHA changes, Content Review API/service/schema/RLS/grants/tests/workflow changes, or exact candidate execution evidence appears.

## INSPECTED PRIMARY EVIDENCE
- `CONTENT_REVIEW_V3.md` at the live canonical lineage.
- `src/app/content-review.js`.
- `src/core/api.js` Content Review methods.
- `supabase/migrations/20260905_content_review_and_reports.sql`.
- `supabase/migrations/20260905121500_content_report_review_integrity.sql`.
- `supabase/migrations/20260905_content_reviewer_member_read.sql`.
- `supabase/migrations/20260905_admin_auth_schema_parity.sql`.
- `tests/v3-content-review-edge.mjs`.
- `.github/workflows/v3-regression.yml`.
- live refs, commit history/diffs and Actions run queries.
- `DEVELOPMENT_HANDOFF_V3.md`.
- `automation/TRIAGE.md` was read only after provisional findings were formed.

## FACT — REQUIRED OWNER / COMPOSITION
- Session remains the authenticated-user owner; Congregation Membership remains the membership/role projection owner; `src/core/api.js` is the browser Supabase boundary; Recall owns quarantine loading; Content Review service owns queue/decision orchestration.
- The service accepts reviewer scope only from active congregation roles `leader|pastor|admin` or active platform roles `owner|admin`; member/facilitator and unknown roles fail closed.
- The final UI-only commit `68516bdb...` changes only the Content Review browser smoke expectation after an include decision; it does not change the trust boundary.

## FACT — SAFE DATA FLOW / AUTHORIZATION
- `private.bible_can_review_content(congregation_id)` is the database authorization primitive. It returns true for an active platform `owner|admin`, or an active congregation `leader|pastor|admin` in the target congregation.
- `bible_content_decisions` INSERT/UPDATE is RLS-gated by `private.bible_can_review_content(...)`; INSERT requires `reviewed_by = auth.uid()`, and UPDATE likewise requires the resulting `reviewed_by = auth.uid()`.
- `bible_content_reports` reviewer UPDATE is RLS-gated by `private.bible_can_review_content(...)`; the integrity trigger rejects mutation of submitted report payload fields and requires `reviewed_by = auth.uid()` for authenticated updates.
- Reviewer member-directory/congregation reads are RLS-gated by membership/ownership or `private.bible_can_review_content(...)`.
- `bible_app_access` client lookup is limited by the `app access read own` SELECT policy, so supplying another user id to the browser query does not itself create platform-role authority.

## FACT — SERVER / TRUST BOUNDARY
- #91 currently performs authorized review mutations through direct browser Supabase calls in `src/core/api.js`: decision `upsert` to `bible_content_decisions`, then report status `update` on `bible_content_reports`.
- This is not inherently an authorization bypass because database RLS, not the UI/service, is the final write authority.
- The service additionally derives reviewer identity from Session and writes only `include|exempt|remove`; however these client validations are defense-in-depth, not the trusted authorization boundary.

## INFERENCE — CURRENT SECURITY ASSESSMENT
- I did **not** reproduce a privilege escalation from an ordinary member/facilitator into reviewer writes from the inspected primary policies. The active RLS path appears capable of enforcing the intended role/congregation boundary.
- Authorized reviewers can directly author decision metadata/snapshots/timestamps through the browser table API. This is an integrity/design limitation, but on the inspected contract it does not grant authority to an otherwise unauthorized user. Do not broaden it further; if audit-grade server-authored timestamps/snapshots become a later requirement, recover that requirement from primary evidence rather than inventing it inside #91.

## MISSING EVIDENCE — PROMOTION CRITICAL
1. No authorized `agent/a1-work/091-*` exact candidate exists, despite #91 being HIGH-RISK.
2. No exact-SHA Actions run exists for final canonical `68516bdb...`; no functional or accumulated PASS can be claimed for this SHA.
3. `tests/v3-content-review-edge.mjs` uses a mocked API. It proves service orchestration but does **not** execute the real RLS/grant boundary.
4. No faithful executable trusted-boundary regression was found that attempts reviewer decision/report writes as unauthorized member/facilitator, authorized congregation reviewer, platform owner/admin, and cross-congregation attacker against the actual SQL policy semantics.
5. Because the canonical branch moved during this A3 inspection, any evidence tied to `fe1dc776...` is stale for final `68516bdb...` unless unchanged by ancestry and independently revalidated.

## RECOMMENDATION — REQUIRED TRUST-BOUNDARY PROOF
For this HIGH-RISK milestone, retain the existing narrow RLS architecture and add faithful permanent security proof rather than replacing it with weaker mocks. The exact candidate should demonstrate at minimum:
- member/facilitator cannot INSERT/UPDATE `bible_content_decisions`;
- congregation leader/pastor/admin can write only for congregations they are authorized to review;
- cross-congregation writes fail;
- platform owner/admin path works only through active own `bible_app_access` authority;
- forged `reviewed_by` is rejected on decision/report writes;
- report submitted-content fields remain immutable during reviewer update;
- a reviewer decision write failure does not resolve reports, and report-update failure remains an explicit partial save.

## WHAT MUST NOT BE BROADENED
- Do not grant member/facilitator reviewer mutation rights.
- Do not weaken `bible_can_review_content`, `reviewed_by = auth.uid()`, report immutability, congregation scoping, or `bible_app_access` own-row visibility.
- Do not move Supabase access into the UI or add a parallel client.
- Do not absorb #92 Admin Console/#93 Admin Operations, bulk moderation, editor/revision operations or production deployment into #91.
- Do not weaken accumulated tests/workflow to obtain green.

## LIFECYCLE / CLEANUP / PRIVACY
- No new Realtime subscription, global listener or long-lived resource is introduced by the inspected Content Review service.
- `clear()` resets in-memory reviewer state only; it does not mutate decisions.
- Queue reads are congregation-scoped; reports are capped to 500 and decisions to 4,000 at the API boundary.
- Reporter directory exposure is limited to reviewer-authorized congregation/member reads under RLS.

## BLOCKING ARCHITECTURE DISPOSITION
**NOT READY.** The inspected SQL presents a plausible safe authorization path, but HIGH-RISK promotion requires an exact quarantine candidate plus faithful trusted-boundary verification and exact functional/accumulated green on that same candidate. Canonical-only implementation with zero exact-SHA run evidence cannot satisfy the A3 gate.

## TRIAGE STALENESS OBSERVATION
After independent inspection, `automation/TRIAGE.md` was found materially stale: it still treats #87 corrective closure as active and says not to advance to #88, while live primary repository state has frozen v3.61 and advanced to active #91 Content Review. That TRIAGE conclusion was not used as evidence for this report.
