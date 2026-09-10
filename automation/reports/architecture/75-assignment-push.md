# Architecture / Security Report — #75 Assignment Push Workflow

Agent: `BQ-A3-ARCH-SECURITY`
Updated: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#75 Assignment Push Workflow — HIGH-RISK**.
- Canonical: `feature/v3-assignment-push` at exact HEAD `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine candidate: `agent/a1-work/075-assignment-push` at exact HEAD `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4` when re-read immediately before this report write.
- Frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional run: `34438690160` — completed successfully; the verification workflow explicitly checked out/asserted `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`, then ran accumulated architecture validators, accumulated edge regressions, Playwright/Chromium setup, local server, and accumulated browser/mobile regressions.
- Frozen-base run `34433120915` remains baseline evidence only.

Staleness: candidate-specific conclusions become stale if `agent/a1-work/075-assignment-push` moves from `78fa191f...`, or if the trusted assignment function, assignment API/application owner, assignment RLS/migrations, or exact verification evidence changes. Canonical/frozen provenance becomes stale if those refs move.

## VERDICT

**Architecture/security READY for exact functional candidate `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`, with no current architecture/security BLOCKER established.**

The previously demonstrated response-authorization defect is corrected on this exact candidate. `start`/`complete` no longer reuse ministry-wide assignment visibility; they authorize against target-scope recipient eligibility. The correction is permanently covered by `tests/v3-assignment-response-auth-edge.mjs`, which executes the production recipient helper against member/team/group/all fixtures and asserts non-recipient ministry identities are denied. That regression was invoked by successful exact run `34438690160`.

This READY statement is architecture/security-specific. It does not replace the mandatory fresh A4 READY review and A5 promotion recommendation required for this HIGH-RISK exact SHA, nor the later exact bookkeeping-SHA accumulated gate.

## INSPECTED PRIMARY EVIDENCE / FACTS

### FACT — safe server trust boundary exists and is narrow

Candidate `supabase/functions/bq-assignment/index.ts`:
- authenticates the caller with `requireUser` and resolves active congregation membership before actions;
- gates `action:targets` and `action:create` to `facilitator`, `leader`, `pastor`, or `admin`;
- returns only active same-congregation members, teams and Journey Groups for publisher target selection;
- independently validates non-`all` member/team/group target IDs against the selected congregation before insert;
- persists assignments server-side rather than trusting browser-created identity/state;
- keeps `start`/`complete` on the trusted function and writes assignment progress/score events server-side.

### FACT — response authorization is now separated from ministry visibility

Exact candidate defines `assignmentRecipient(...)` without a ministry-role bypass:
- `all`: any active congregation member may respond;
- `member`: only exact target user;
- `team`: only a user present in `bible_team_members` for that target team;
- `group`: only an active `bible_group_members` member for that target group.

The `start`/`complete` branch calls this recipient predicate and returns 403 otherwise. This removes the earlier path where ministry role alone allowed completing another recipient's targeted assignment and receiving score credit.

### FACT — permanent trusted-boundary regression exists and executed

`tests/v3-assignment-response-auth-edge.mjs` extracts and executes the production `assignmentRecipient` helper, verifies ordinary recipient cases and explicitly verifies that a non-member ministry identity is denied for member/team/group targets while `all` remains congregation-wide. It also asserts that `start`/`complete` calls the recipient helper and that the former `assignmentVisible(...member.role)` authorization path is absent.

The exact verification workflow for run `34438690160` explicitly invokes this test in the accumulated edge-regression phase and pins checkout/assertion to `78fa191f...`. The job completed all architecture, edge, and browser/mobile phases successfully.

### FACT — browser ownership remains centralized

`src/core/api.js` remains the browser Supabase/trusted-function/Realtime boundary. Assignment target discovery and create/start/complete are delegated through `bq-assignment`; assignment reads remain RLS-backed table reads. The Realtime subscription returns an idempotent disposer using `client.removeChannel(channel)` and guards duplicate cleanup with `closed`.

The recovered #75 contract continues to require `src/app/assignments.js` as sole assignment application owner and `src/features/assignments/index.js` as presentation/event forwarding only. No evidence inspected in this run establishes a second assignment owner.

### FACT — general data visibility was not broadened merely for publishing

The publisher target directory is implemented inside the trusted assignment function using service authority after caller role/congregation validation. This avoids widening ordinary Journey Group read scope simply to populate a ministry selector. The retained #75 contract explicitly requires this fail-closed congregation scope and prohibits direct browser assignment/progress/score mutations.

### FACT — no new schema migration is required by the exact candidate trust-boundary correction

The relevant correction is in the existing trusted function plus permanent tests. No primary evidence inspected here requires a new #75 schema/RLS/grant migration or production deployment to reconstruct the workflow. Existing assignment read/RLS semantics remain the receive path; production systems remain outside this rebuild gate.

## REQUIRED OWNER / COMPOSITION

Safe composition remains:
1. session/congregation context establishes signed-in user and selected congregation;
2. `src/features/assignments/index.js` presents/forwards events;
3. `src/app/assignments.js` owns assignment publisher/recipient state, normalization, stale-request protection and reload lifecycle;
4. `src/core/api.js` is the sole browser cloud/trusted-function/Realtime boundary;
5. `bq-assignment` is server authority for target discovery, create, start/complete authorization and persistence;
6. assignment table RLS/Realtime remains the receive path rather than a new local inbox/task system.

## AUTHORIZATION / RLS / PRIVACY

- Browser ministry-role checks are usability gating only; server role/membership checks are authoritative.
- Target IDs and congregation IDs must remain independently revalidated server-side.
- Journey Group visibility must not be broadened congregation-wide for ordinary browser users merely to supply publisher options.
- Browser code must not gain direct INSERT/UPDATE/DELETE authority over `bible_assignments`, `bible_assignment_progress` or `bible_score_events`.
- Private Notes, Cloud Notes, Transform answers, Couple Journey state, credentials and unrelated study state remain outside assignment publishing payload/scope.
- #77 notification delivery and #79 linked-activity execution remain outside #75.

## LIFECYCLE / CLEANUP

The inspected central API assignment subscription binds assignment changes by congregation and progress changes by user, and returns a cleanup function that removes the channel once. No new timer or Realtime ownership is required for #75 beyond that verified path. Recurrence remains stored metadata only; browser recurrence generation must remain absent.

## UNSAFE APPROACHES — DO NOT BROADEN

- Do not reintroduce ministry-wide response eligibility for targeted assignments.
- Do not broaden general Journey Group RLS for target discovery.
- Do not add direct browser assignment/progress/score mutations.
- Do not trust browser target lists or local role checks as authorization.
- Do not revive retained root `assignment-advanced.js` as a parallel runtime owner.
- Do not fold #77 Notification Center/push delivery, recurrence execution, or #79 linked-activity launch/completion into #75.
- Do not deploy production Supabase/Cloudflare changes as part of this rebuild verification.

## INFERENCE / RECOMMENDATION

- The current separation between ministry publisher visibility and recipient response eligibility is the safer and contract-consistent server model; preserve it through bookkeeping and later milestones.
- A future full deployed Edge Function integration test would be stronger than helper-level trusted-boundary execution, but no current evidence shows it is required to resolve an active #75 architecture defect. The existing test executes production authorization logic and the exact accumulated workflow passed it; therefore this is not classified as a blocker here.
- If any bookkeeping or later change touches `bq-assignment`, assignment RLS/grants, central API ownership, or the response predicate, this READY disposition must be re-audited for that new SHA.

## BLOCKERS

- **None established on exact candidate `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`.**

## NON-BLOCKING / MISSING EVIDENCE

- Fresh A4 QA READY for exact candidate `78fa191f...` is still required by HIGH-RISK process; this is process/promotion evidence, not an architecture defect.
- A5 must issue promotion disposition for that same unchanged candidate after current A4 review.
- After authorization, separate off-canonical bookkeeping and complete accumulated verification against the exact bookkeeping SHA are still mandatory before canonical/release advancement.
- No PASS transfers if candidate SHA changes.

## ARCHITECTURE ACCEPTANCE CHECKS FOR PROMOTION

For exact candidate `78fa191f...`, architecture/security evidence is satisfied when the following remain true:
1. `targets/create` require authenticated active same-congregation ministry membership.
2. member/team/group target IDs are server-validated in the supplied congregation.
3. `start/complete` authorize actual recipients, not ministry visibility.
4. direct browser assignment/progress/score mutation bypass is absent.
5. general Journey Group RLS is not broadened for publisher discovery.
6. central API and assignment application ownership remain single-owner.
7. Realtime cleanup remains bounded/idempotent.
8. exact accumulated workflow invokes the #75 architecture validator, assignment edge coverage, recipient-authorization regression and browser/mobile coverage without weakening prior regressions.
9. exact functional candidate receives required A4/A5 review before bookkeeping.
10. exact bookkeeping SHA later passes the complete accumulated suite before canonical/release advancement.

## TRIAGE COMPARISON

`automation/TRIAGE.md` was read only after the provisional primary-evidence findings above were formed. Its current conclusion is consistent with this audit: the earlier target-directory and ministry-response defects are resolved on exact candidate `78fa191f...`, while HIGH-RISK promotion remains withheld pending fresh exact-SHA A4 review and subsequent A5 recommendation. This report independently upgrades A3 architecture/security coverage from stale `d13ba6b...` to exact candidate `78fa191f...`.

## NEXT LIKELY MILESTONES

No speculative requirements are promoted for #76/#77 in this run. #77 is explicitly outside #75 scope. Detailed architecture contracts for subsequent milestones should be recovered from their live authoritative contracts when #75's release gate closes rather than invented from retained compatibility code.
