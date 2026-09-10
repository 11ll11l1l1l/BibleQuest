# A2 Contract Audit — #75 Assignment Push Workflow

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-10 JST

## STATE / PROVENANCE
- Active milestone: **#75 Assignment Push Workflow**.
- Canonical branch `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine candidate `agent/a1-work/075-assignment-push`: `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- Frozen base `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional verification run inspected: `34444825916` (job `102767251066`).
- This report supersedes the prior A2 audit bound to candidate `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`.

## EVIDENCE INSPECTED — PRIMARY
Before reading TRIAGE, A2 independently inspected:
- live canonical, quarantine and frozen refs;
- `FEATURE_INVENTORY_V3.md` at exact candidate;
- `ASSIGNMENT_PUSH_V3.md` at exact candidate;
- `DEVELOPMENT_HANDOFF_V3.md` at exact candidate;
- retained `assignment-advanced.js` from frozen v3.47;
- candidate `src/app/assignments.js`;
- candidate `supabase/functions/bq-assignment/index.ts`;
- candidate `tests/v3-assignment-publish-auth-edge.mjs`;
- exact Actions run `34444825916`, job steps and decoded job log, including exact checkout/assertion and the actual accumulated architecture/edge/browser invocations.

`automation/TRIAGE.md` was read only after this provisional primary-evidence pass.

## FACT — AUTHORITATIVE PARITY BOUNDARY
The authoritative inventory still defines row #75 narrowly as `leader publish→member receive→complete`. It intentionally still records #75 as Not started and #74 Advanced assignments as Verified because bookkeeping/promotion has not occurred. That ledger is authoritative for official status but is not evidence that the current quarantine candidate lacks implementation.

Required #75 parity remains:
1. ministry-role publishing for active `facilitator`, `leader`, `pastor`, and `admin`, with trusted server authorization authoritative;
2. retained audiences `all`, `member`, `team`, and `group`, independently congregation/active scoped by the server;
3. retained publish data: title, instructions, assignment type, Scripture refs, target scope/id, due date, points, scheduled opening, reminder metadata, recurrence metadata, required reflection, minimum quiz score, and evidence type;
4. successful create reloads server truth and feeds the existing #73/#74 assignment identity/read/realtime/start/complete path;
5. `src/app/assignments.js` remains the sole assignment application owner and `src/core/api.js` the sole browser trusted-function/Realtime boundary; no browser direct writes to assignment/progress/score tables;
6. #76 Ministry Hub, #77 Notification Center/push delivery, #78 Workspace, #79 linked-activity execution, and browser recurrence generation remain outside #75.

## FACT — RETAINED SOURCE CONTRACT
Frozen retained `assignment-advanced.js` proves the compatibility authoring flow used the existing assignment form and `bq-assignment` create invocation, supported group targeting plus schedule/reminder/recurrence/reflection/quiz/evidence metadata, refreshed assignment truth after create, and exposed a linked-activity selector. The selector is evidence of later retained capability, not permission to absorb #79 into #75. Recurrence was stored/displayed with scheduler-disabled messaging, not generated in the browser.

## FACT — CURRENT CANDIDATE CONTRACT IMPLEMENTATION
Candidate `src/app/assignments.js` composes the existing assignment owner, normalizes four target scopes and advanced metadata, requires local ministry capability for authoring, loads trusted publish targets through the API owner, validates the selected target against the loaded directory, publishes through the API owner, checks returned congregation identity, detects account/congregation changes, and reloads server truth after creation. It does not introduce a local assignment shadow owner.

Candidate trusted function `supabase/functions/bq-assignment/index.ts` contains:
- ministry-gated `targets`, returning active same-congregation member/team/group directories;
- ministry-gated `create`, four retained target scopes, required non-`all` target IDs, and independent validation of member/team/group targets before assignment insertion;
- bounded advanced metadata and server-owned assignment insertion;
- recipient-specific `start`/`complete` authorization through `assignmentRecipient`, not ministry-wide response authority.

No contract evidence requires broader Journey Group RLS or a second assignment service.

## FACT — TRUSTED PUBLISH-AUTH EVIDENCE
The new permanent `tests/v3-assignment-publish-auth-edge.mjs` is materially stronger than the earlier source-string/client-mock evidence. It loads the production `bq-assignment` source, strips only TypeScript syntax/import wiring needed for Node VM execution, captures and executes the actual production request handler, and supplies controlled infrastructure/data-boundary doubles.

It executable-checks that:
- an ordinary member is denied trusted `targets` and `create` and cannot reach insertion;
- `facilitator`, `leader`, `pastor`, and `admin` can use trusted target discovery/create;
- target discovery returns only active same-congregation members, teams and groups;
- foreign/inactive member/team/group targets are rejected before insertion;
- valid same-congregation active targets succeed;
- missing non-`all` targets fail closed.

This closes the specific contract-evidence gap identified on candidate `78fa191f...`; A2 found no remaining retained-contract ambiguity behind that gap.

## FACT — EXACT FUNCTIONAL EVIDENCE
Actions run `34444825916` completed successfully. Its job explicitly checked out `a42100452d1b1fff7c146543e8ab5cd67da32193`, then asserted `git rev-parse HEAD` equals that exact candidate before tests ran.

The executed job then passed:
- accumulated architecture validators, including `validate-v3-assignment-push.mjs`;
- accumulated edge regressions, including `v3-assignment-push-edge.mjs`, `v3-assignment-response-auth-edge.mjs`, and the new `v3-assignment-publish-auth-edge.mjs`;
- Playwright/Chromium setup and local server;
- the accumulated browser/mobile suite, including `v3-assignment-push-smoke.mjs`.

The log explicitly reports `BibleQuest v3 assignment publish authorization trusted-boundary regression passed.` and `BibleQuest v3 Assignment Push mobile browser regression passed.` No PASS is transferred from an earlier SHA.

## VERIFIED OWNERS TO COMPOSE
- `src/app/assignments.js` — sole assignment application owner.
- `src/core/api.js` — sole browser cloud/trusted-function/Realtime boundary.
- `src/features/assignments/index.js` — assignment presentation/event forwarding surface.
- Session and Congregation Membership — identity, selected-congregation and fail-closed local capability inputs; browser role gating is not server authorization.
- `supabase/functions/bq-assignment/index.ts` — trusted authority for target discovery, create and assignment response mutations.

## UX / STATE — FACT
- Ordinary members, signed-out, local-preview and no-congregation states cannot publish.
- Authoring is congregation-scoped and fail-closed.
- Successful publish reloads server truth.
- Eligible members receive through the existing assignment read/Realtime path and complete through verified #73/#74 semantics.
- #75 does not require a separate inbox, task store, scheduler, linked-activity executor or Ministry Hub.

## LEGACY BEHAVIOR NOT TO COPY
- Do not revive retained `assignment-advanced.js` DOM enhancement/query logic as a parallel runtime owner.
- Do not carry its linked-activity selector into #75 browser publishing.
- Do not infer recurrence execution from recurrence metadata.

## FACT / INFERENCE / RECOMMENDATION
### FACT
- Exact live candidate at report-write recheck: `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- Exact canonical at report-write recheck: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Exact frozen base at report-write recheck: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact run `34444825916` is green and executed the intended accumulated architecture, edge and browser/mobile phases against the exact candidate.
- The previously missing trusted publish authorization/target-rejection scenarios now have faithful executable handler-boundary coverage.

### INFERENCE
- Current candidate is contract-complete at source/evidence level for the recovered #75 boundary.
- No additional #75 product behavior is justified by retained/inventory evidence merely because later Ministry Hub, notification or linked-activity capabilities exist.

### RECOMMENDATION
- Keep `a42100452d...` unchanged while mandatory HIGH-RISK A3/A4/A5 exact-SHA review completes.
- If those roles authorize promotion, prepare bookkeeping off-canonical and run the complete accumulated suite again against the exact bookkeeping SHA before canonical/release advancement.
- Do not add later-row behavior while closing #75.

## AMBIGUITIES / BLOCKERS
A2 found **no unresolved retained-contract ambiguity and no primary-evidence contract blocker** for exact candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`.

Promotion authorization remains outside A2 ownership. #75 is HIGH-RISK, so fresh A3/A4/A5 exact-candidate review remains procedural evidence required before bookkeeping/promotion.

## MISSING EVIDENCE
- A2 did not launch a new test run; it independently audited the exact executed Actions evidence already available for this candidate.
- No bookkeeping candidate exists yet, so no exact bookkeeping-SHA accumulated verification exists yet.
- Production Supabase/Cloudflare/v2 behavior was intentionally neither modified nor tested by this role.

## CONCRETE ACCEPTANCE CHECKLIST
- [x] #75 retained contract recovered without broadening later rows.
- [x] Ministry publisher roles recovered; trusted server remains authoritative.
- [x] `all/member/team/group` audience semantics recovered.
- [x] Trusted target discovery is active/same-congregation scoped.
- [x] Trusted create independently rejects foreign/inactive/missing targets before insertion.
- [x] Existing assignment owner/API boundary retained.
- [x] Retained advanced publish metadata carried while #79 linked activity remains excluded.
- [x] Successful create reloads server truth and composes #73/#74 receive/complete path.
- [x] Recipient response authorization remains recipient-specific.
- [x] Permanent #75 architecture, edge, trusted publish-auth and browser/mobile coverage is invoked by the accumulated workflow.
- [x] Exact functional candidate `a42100452d...` has complete accumulated green run `34444825916`.
- [ ] Fresh mandatory HIGH-RISK A3/A4/A5 promotion authorization on this exact unchanged candidate.
- [ ] Off-canonical bookkeeping candidate and exact bookkeeping-SHA complete accumulated green gate.

## DEPENDENCY-LIKELY NEXT MILESTONES
A2 did not broaden this run beyond the active milestone because #75 is not yet promoted. Inventory evidence remains sufficient to preserve the boundary: #76 owns Ministry Hub (`open tools; role guard; navigation`), #77 owns Notification Center/inbox (`load; read/unread; open target; refresh`), and #79 owns linked-activity launch/completion handoff. These later rows must be independently recovered when they become active; they are not #75 requirements.

## TRIAGE RECONCILIATION
After the independent pass, TRIAGE was read. Its 14:58 JST snapshot is stale for candidate-specific direction because it is bound to `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4` and still requests the trusted publish-auth evidence that now exists and passed on `a42100452d...` in run `34444825916`. That staleness does not itself authorize promotion; it only means current A3/A4/A5 reviews must judge the new exact candidate.

## STALENESS CONDITIONS
This report becomes stale for candidate-specific conclusions immediately if:
- `agent/a1-work/075-assignment-push` moves from `a42100452d1b1fff7c146543e8ab5cd67da32193`;
- canonical `feature/v3-assignment-push` moves from `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`;
- frozen base moves from `2523f85d47f59721eae81da10cf1007d29af4139`;
- a later exact run supersedes or contradicts run `34444825916`;
- authoritative #75 inventory/contract changes;
- bookkeeping creates a new candidate SHA.

Reinspect primary evidence before using this report against any changed state.