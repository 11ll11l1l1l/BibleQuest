# A2 Contract Audit — #75 Assignment Push Workflow

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-10 JST

## Exact state inspected
- Canonical milestone branch `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- A1 quarantine candidate `agent/a1-work/075-assignment-push`: `1ddc4c8b8fd90f9a3e5a1b0a9788cb6dc1ea57be`.
- Latest frozen v3 release `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Candidate is nine commits ahead of canonical and is not canonical/release state.

## Primary evidence — FACT
- `FEATURE_INVENTORY_V3.md` is the authoritative parity ledger. It records #74 Advanced assignments as Verified, #75 Assignment push workflow as Not started, #76 Ministry Hub as Not started, and #77 Notification Center/inbox as Not started. The inventory is therefore stale relative to candidate implementation and must not be interpreted as candidate verification status.
- Retained root `assignment-advanced.js` proves the old workflow had an authorized create form using `bq-assignment`, supported `all/member/team/group` targeting, advanced schedule/reminder/recurrence/reflection/quiz/evidence metadata, and refreshed assignments after create. Its linked-activity selector is retained evidence for later capability, not proof that #75 must absorb #79.
- Candidate `supabase/functions/bq-assignment/index.ts` now contains a trusted `targets` action guarded to `facilitator/leader/pastor/admin`; it returns active congregation members, teams, and Journey Groups through the server/admin boundary. The same function independently enforces ministry role for `create`, validates target scope, requires a target for non-`all`, and validates member/team/group membership in the selected congregation before insert.
- Candidate `src/app/assignments.js` remains the assignment application owner and now contains target normalization, publish-input normalization, local ministry capability guard, stale account/congregation target-load rejection, target membership validation against the loaded target directory, trusted API create invocation, and server-truth reload after successful creation. It keeps `linkedActivityPublishing:false` and `recurrenceGeneration:false`.
- `ASSIGNMENT_PUSH_V3.md` defines #75 narrowly as authorized publish -> eligible member receive through the existing assignment read/realtime path -> completion through #73/#74. It explicitly excludes #76 Ministry Hub, #77 Notification Center delivery, #78 Workspace, and #79 linked-activity handoff.
- Exact candidate SHA `1ddc4c8b8fd90f9a3e5a1b0a9788cb6dc1ea57be` has zero GitHub Actions workflow runs at inspection time. No architecture, edge, browser/mobile, full accumulated, or bookkeeping pass may be inferred for this SHA.

## Contract conclusion — FACT
#75 has an implementation candidate in quarantine, but no exact-SHA verification evidence. The canonical branch correctly remains behind it. The older TRIAGE statement that implementation had not started is stale for the quarantine candidate, though it remains true for canonical state.

The recovered parity boundary supported by primary evidence is:
1. ministry-role publishing only (`facilitator`, `leader`, `pastor`, `admin`), with server authorization remaining authoritative;
2. audiences `all/member/team/group`, congregation-scoped and independently server-validated;
3. publish fields already supported by retained/server contract: title, instructions, type, Scripture refs, due/points, schedule, reminder metadata, recurrence metadata, reflection, minimum quiz score, and evidence type;
4. successful creation must converge by reloading server truth and reuse the existing #73/#74 receive/start/complete identity and mutation path;
5. no direct browser assignment/progress/score writes, no second assignment owner, no broadened Journey Group read policy for selector convenience;
6. no notification delivery, recurrence scheduler, Workspace, or linked-activity completion handoff in #75.

## INFERENCE / RECOMMENDATION
- The candidate's trusted `targets` projection is consistent with the retained four-audience contract and avoids making ordinary Journey Group reads congregation-wide. This should be evaluated as the intended #75 solution, not treated as a new product requirement.
- Promotion should wait for A4/A5 review of this exact candidate SHA (or its successor) and permanent tests proving role denial, foreign/inactive target denial, stale session/congregation handling, create-then-reload semantics, eligible receive/completion, and 390px behavior, followed by the complete accumulated exact-SHA gate.
- Because candidate HEAD includes a documentation-only commit after the implementation commit, evidence must bind to the final candidate SHA actually proposed for promotion rather than an earlier implementation SHA.

## Missing evidence
- No workflow run exists for candidate `1ddc4c8b8fd90f9a3e5a1b0a9788cb6dc1ea57be` at inspection time.
- No executed browser proof was independently available in this A2 run for leader publish -> eligible member receive -> #73/#74 completion.
- No executed negative proof was independently available in this A2 run for ordinary member, signed-out, foreign congregation, inactive target, or stale-context cases.
- Inventory status has not been advanced and must not be advanced based on source inspection alone.

## Dependency-likely next milestones
### #76 Ministry Hub — FACT
The authoritative inventory defines verification only as `open tools; role guard; navigation`. #75 explicitly excludes #76. No broader dashboard/refactor requirement is inferred here. Before #76 implementation, recover retained navigation/tool-entry evidence and current verified route/role owners; do not duplicate assignment ownership.

### #77 Notification Center/inbox — FACT
The inventory defines verification as `load; read/unread; open target; refresh`. #75 explicitly limits reminder handling to stored metadata and excludes notification/inbox or push delivery. Before #77 implementation, independently recover retained inbox source, notification persistence/read authority, target-routing contract, and current session/congregation scope. Do not infer actual push-delivery infrastructure merely from `reminder_at` metadata.

## Staleness conditions
This report becomes stale for candidate conclusions immediately if `agent/a1-work/075-assignment-push` moves from `1ddc4c8b8fd90f9a3e5a1b0a9788cb6dc1ea57be`, if canonical `feature/v3-assignment-push` moves from `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`, if the frozen base changes from `2523f85d47f59721eae81da10cf1007d29af4139`, or if new exact-candidate workflow evidence appears. Reinspect primary repository evidence before relying on this report for promotion.