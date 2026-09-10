# Architecture / Security Report — #75 Assignment Push Workflow

Agent: `BQ-A3-ARCH-SECURITY`
Updated: 2026-09-10 JST

## Exact inspected state

- Canonical: `feature/v3-assignment-push` at `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Live quarantine candidate: `agent/a1-work/075-assignment-push` at `d13ba6b9729a02021ee5efab961c6c233a0b669e` when re-read immediately before this report write.
- Candidate product/security implementation inspected at parent `651ad992681490bfae74178c99c2f8cf6aa15bb4`; `d13ba6b...` changes only `tests/v3-assignments-smoke.mjs` to preserve the ministry recipient read-only UI contract while exposing the publisher.
- Frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Frozen-base exact accumulated evidence retained in handoff: run `34433120915` for `2523f85...`. It is baseline evidence only, not #75 candidate evidence.
- Exact current candidate `d13ba6b...`: no associated workflow run returned by GitHub during this audit. No candidate PASS is claimed.

Staleness: this report becomes stale if canonical, quarantine candidate, assignment Edge Function, assignment owner/API boundary, assignment migrations/RLS, or #75 verification SHA changes.

## Verdict

No external architecture/security BLOCKER established. The previously missing trusted congregation publish-target directory is now implemented on quarantine behind the existing assignment server boundary. It should remain there; general Journey Group RLS must not be broadened.

One authorization-integrity issue requires A5/A1 review before #75 promotion: the trusted server currently reuses `assignmentVisible()` for both read visibility and `start`/`complete` eligibility, and `assignmentVisible()` returns true unconditionally for ministry roles. A ministry user can therefore invoke the server directly to start/complete an assignment targeted to another member/team/group and potentially award points to themself, even though the current browser deliberately keeps ministry recipient controls read-only. This is source-demonstrated authorization behavior; runtime exploitation was NOT EXECUTED.

## Primary evidence and FACT findings

### FACT — publish target discovery now uses a narrow trusted boundary

Candidate `supabase/functions/bq-assignment/index.ts`:
- re-authenticates the bearer token and requires active congregation membership;
- gates `action:targets` to `facilitator/leader/pastor/admin`;
- queries only active members, active teams and active groups scoped to the supplied congregation;
- returns selector metadata only (`id`, display label, role/team type where applicable);
- `action:create` repeats server-side ministry-role authorization and independently validates member/team/group target IDs against the selected congregation before insert.

This satisfies the safe direction identified in the prior report without widening the browser's general Journey Group read model.

### FACT — database visibility remains scoped

Ordered migrations show:
- `20260904_assignments_presence_unlocks.sql` originally grants authenticated SELECT only through `private.bible_assignment_visible` and does not grant browser assignment/progress mutation.
- `20260905181000_linked_activity_assignment_groups.sql` adds `group` scope and group visibility only for active group members of an active group in the same congregation; ministry roles retain congregation assignment visibility.
- The target-directory implementation uses the trusted service-role Edge Function rather than broadening that RLS policy.

Do not assess the earliest assignment migration in isolation; later ordered migration state is authoritative.

### FACT — application ownership/lifecycle contract remains single-owner

Candidate evidence retains `src/app/assignments.js` as assignment application/state owner and `src/core/api.js` as browser cloud/trusted-function/Realtime boundary. The #75 edge regression exercises ministry target loading, all four target scopes, stale congregation target rejection, create-then-reload failure handling, signed-out/local-preview/no-congregation fail-closed states, and server source assertions for ministry/same-congregation target checks.

The latest candidate test commit explicitly preserves the recipient side as read-only for ministry roles while requiring the publisher UI to exist. This is useful primary evidence that publisher privilege and recipient completion are intended to be distinct capabilities.

### FACT — server currently conflates visibility with response eligibility

In candidate `bq-assignment/index.ts`, `assignmentVisible(...)` begins with `if(leaderRoles.has(role)) return true`. The `start`/`complete` branch authorizes by `if(!(await assignmentVisible(...))) ... 403`. Consequently any active ministry-role caller in that congregation passes the response authorization for any assignment row in the congregation, regardless of its target scope/target ID. On first completion the function can write that caller's `bible_assignment_progress` row and insert an idempotent `bible_score_events` award for that caller.

Current browser tests deliberately hide Start/Complete from ministry users, but browser hiding is not an authorization boundary. No exact server-negative test proving a ministry caller cannot complete somebody else's targeted assignment was found/executed in this audit.

Impact: integrity of assignment completion and congregation scoring for ministry accounts. Scope is limited to already-privileged active ministry members; this is not evidence of ordinary-member or cross-congregation access.

## INFERENCE / RECOMMENDATION

- Treat read visibility and response eligibility as separate server concepts. Ministry visibility for review/feedback can remain broad, while `start`/`complete` should authorize against the assignment audience unless an explicit authoritative contract says ministry users are also recipients.
- Because the browser now explicitly treats ministry recipient actions as read-only, the safer contract is for the server to enforce the same separation rather than relying on UI controls.
- A5 should classify final priority. This is not an external stop condition; it is a candidate authorization-integrity finding that is cheapest to settle before #75 promotion.

## Safe trust boundary for #75

1. Browser session/congregation owner selects an active congregation.
2. Presentation exposes publisher controls only as local usability gating.
3. `src/app/assignments.js` owns target-directory state, normalization, stale-request protection and publish lifecycle.
4. `src/core/api.js` is the only browser path to `bq-assignment` and assignment Realtime.
5. `bq-assignment` independently authenticates, resolves active membership/role, returns congregation-scoped target metadata, validates target UUIDs and creates the assignment.
6. Browser reloads server truth; members receive through existing RLS/Realtime and complete through the trusted server path.

## Must not be broadened

- Do not grant congregation-wide Journey Group SELECT merely to populate the publisher selector.
- Do not add direct browser INSERT/UPDATE/DELETE paths for `bible_assignments`, `bible_assignment_progress` or `bible_score_events`.
- Do not trust browser role checks, target lists or congregation IDs without server revalidation.
- Do not revive retained `assignment-advanced.js` as a second assignment owner.
- Do not add #77 notification delivery, recurrence generation, or #79 linked-activity execution to #75.
- Do not deploy production Supabase/Cloudflare changes as part of rebuild verification.

## Exact missing evidence before promotion

- Exact-SHA executed #75 architecture validator on the final candidate.
- Exact-SHA executed edge/security regression, including unauthorized ordinary role, inactive/foreign member/team/group targets, stale congregation/session result, create/reload failure, and a server-level negative proving non-recipient ministry users cannot start/complete/score a targeted assignment unless an authoritative contract explicitly permits it.
- Exact-SHA 390px publisher -> eligible member receive -> complete browser evidence, plus subscription cleanup/no duplicate lifecycle evidence.
- Complete accumulated #1-#75 functional gate against the exact clean functional candidate.
- A4/A5 review of that exact functional SHA before autonomous promotion.
- Complete accumulated gate again against the exact bookkeeping SHA before canonical/release advance.

## TRIAGE comparison

`automation/TRIAGE.md` was read only after the provisional repository findings above were formed. Its prior target-directory MILESTONE is now stale for the quarantine candidate because the trusted directory exists there; canonical remains pre-implementation. Its missing-proof requirement remains valid. The server response-eligibility issue above is new primary-evidence information for firewall review.

## Next milestones

No speculative architecture requirement is promoted for #76/#77 in this run. #77 remains explicitly out of #75 scope; detailed future analysis should wait for its live contract/candidate so this report does not invent requirements ahead of authoritative evidence.
