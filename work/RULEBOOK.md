# BibleQuest rulebook

Canonical operational policy for development, maintenance, multi-agent work and production releases. Updated 2026-10-04 JST. Applies from V7 onward; preserves V1–V6 lessons without importing obsolete workflow machinery.

## 1. Authority and fast start

1. Follow the current user's scope and authorization. Do not restart permission checks for already authorized work.
2. Fetch the assigned branch once, record HEAD, and check local changes. Read the current status, this section and only the task-specific sections below. Inspect the smallest relevant files and existing checks.
3. Live repository, CI and deployed evidence determine what exists. Accepted requirements determine intended behavior. Historical reports and recovered chat claims are leads, not current certification.
4. `V7_ACTIVE_STATUS.md` owns development progress; `V6_ACTIVE_STATUS.md` and its checklist retain released V6 evidence; `BACKUP_MANIFEST.md` owns rollback references. This file owns operating rules. Do not create another competing authority.
5. Produce a bounded fix, integrated feature or durable evidence. When blocked, record the exact failed operation, completed work and next action. Analysis, polling and restated status are not implementation progress.
6. Stop when the requested outcome and affected checks are complete. Do not extend into an audit, architecture rewrite or unrelated cleanup.

## 2. Minimum work and checking

Use the smallest existing check that can detect the failure introduced by the change. Broaden only for shared dependencies, unknown impact, integration conflicts or an existing release requirement.

| Change | Minimum verification | Broaden when |
|---|---|---|
| Narrative documentation | Diff whitespace and changed local links | Moving a path consumed by validators or changing a checked contract |
| Isolated runtime fix | Relevant syntax/type checks and existing regression; actual user path when behavior is visual or navigational | Shared ownership, state, routes or dependencies change |
| UI / localization | Affected flow, changed language strings/states and representative narrow viewport | Shared shell/layout, keyboard/focus or asset registry changes |
| Auth / tenant / data authority | Affected positive behavior plus denial/account-switch tests | Shared role/RLS/session ownership or migration changes |
| Build / PWA / deployment | Existing affected build, artifact or lifecycle gate | Shared cache/update/security policy changes |
| Content / generated media | Source identity and affected deterministic integrity/reference checks | Policy, source revision or generation algorithm changes |
| Release | Existing required gates on one candidate, deployed identity and essential smoke | Actual failures or changed candidate inputs |

- Do not repeat a successful check without changed inputs, expired evidence or a new unresolved concern.
- Reuse a valid same-candidate CI result instead of duplicating it locally. Record the exact SHA and check identity. Local checks on another Node version are not pinned-toolchain release certification.
- A documentation-only follow-up may reuse unchanged-runtime evidence for development verification; it does not magically become a separately certified production SHA. Release rules remain exact-SHA.
- Add a test for a real uncovered failure when it protects behavior. Do not add tests mirroring trivial implementation or reversible prose edits.
- Keep valid tests. If a fixture is obsolete, correct the fixture against the accepted contract without removing the denial/behavior it protects.
- Use the existing workflow and verifier. Add infrastructure only when a required existing gate cannot perform its job and a targeted repair cannot suffice.
- Do not run the complete accumulated suite after every edit. Run affected checks during work and the required integration/release suite at its existing boundary.

## 3. Fix ownership and runtime behavior

- Identify the actual failing route, owner and root cause before patching. Compare runtime, data and cache identities when symptoms suggest mixed versions. Do not label UI/module errors as internet failures without evidence.
- One owner per function/state transition. Keep routes and feature registration explicit. Avoid global DOM observers, interception, runtime injection or multiple implementations of the same feature.
- Fix an existing owner rather than adding another guard around it. A recurring failure may justify replacing the broken owner in a bounded change; it does not justify rebuilding the whole app.
- Exercise the real user entry path: button → route → load → action → persistence. An isolated module test does not prove the launcher reaches it.
- Preserve intended guest-first behavior, optional accounts, logout-to-guest and onboarding triggers. Do not invent new behavior to match a stale test.
- Use bounded recovery, visible Retry/Close/cancel states and useful errors. Do not leave loading indefinitely, silently send users Home, or erase saved progress to recover a module.
- Distinguish local/device state from account/cloud state. Preserve progress and private notes across upgrades; validate migrations and handle invalid persisted state explicitly.
- Load large Scripture/question/audio resources on demand. Avoid startup payload expansion and retain existing budget checks when affected.

## 4. Security, accounts and congregation boundaries

- Client visibility is convenience; backend authorization is authority. Preserve existing Auth, RLS, role checks and tenant isolation.
- Require a valid explicitly selected congregation where the current contract requires it. Do not guess the first membership or query a tenant queue before scope selection.
- Revalidate the session and active scope for privileged mutations. On account or congregation changes, clear stale scoped results, cancel/invalidate old work and prevent late responses from updating the new context.
- Keep guest, session-loading, authenticated and denied states distinct. Deep links must wait for required session hydration; a guest-denial screenshot is not authenticated acceptance.
- Verify object/team/group/recipient ownership against the action's congregation. A valid ID or role name alone does not authorize a cross-tenant operation.
- Check affected role-denial and tenant-denial behavior when these boundaries change; do not repeat an entire security audit for unrelated work.
- Keep secrets out of event payloads, logs, source, analytics and evidence. Sanitize necessary captures and preserve recovery-code privacy.
- Preserve append-only migration history. Use existing disposable database validation for schema/RLS changes. Inspect relevant live state only when reconciling a real deployment discrepancy; avoid blanket production DB audits.
- Native provider hardening gaps require the existing supported alternative or explicit residual-risk decision. Do not weaken authorization or call a waiver PASS.
- Mutation QA uses the existing controlled-account/data path; clean up disposable data. Sending notifications or messages to real users requires the corresponding explicit instruction.

## 5. Scripture, content, translations and audio

- Never fabricate Scripture as a fallback. Explain unavailable content and offer the existing licensed/source-valid alternative or Retry.
- Preserve provenance and translation licensing. Runtime policy, generated corpus, quarantine/held records and manifests must identify the same revision. Reconcile deterministically and preserve records rather than silently dropping difficult content.
- Validate affected references: book identity, verse bounds, reversed ranges, missing endpoints and displayed passage alignment. A plausible citation is not proof of correctness.
- Localization includes visible labels, empty/error states, generated titles, controls and launchers. Check the changed flow after switching language; key parity alone does not prove users see translated content.
- Use existing icon/asset ownership and ensure referenced assets reach the built output. Source presence alone does not prove a deployed icon exists.
- BSB audio must remain tied to declared human narration, exact audio/text revisions, checksums and timing manifests. Preserve established alignment and offline evidence; do not regenerate the corpus for unrelated UI work.
- Expensive generation resumes from verified outputs. Preserve successful shards; repair only failed finalization or mismatched input. Use bounded disjoint work units and the existing generator, not unlimited jobs or forced regeneration.
- Audio play UI is not proof of audible playback, background persistence or lock-screen controls. Backend push delivery is not proof of physical-device receipt.

## 6. PWA, updates, offline and notifications

- Check registration, controller identity and the actual cached/built assets when PWA behavior changes. Manifest and service-worker files merely existing is insufficient.
- Avoid mixing shells, runtime modules and data from incompatible generations. Required and optional resources need bounded handling; optional downloads must not block the shell forever.
- Preserve existing safe cache/update policy, storage limits, offline package integrity and deletion controls. Do not clear user data as a substitute for fixing stale-version handling.
- Test affected warm-cache/update/offline paths using existing checks, not only fresh loads. Verify lazy routes and error recovery when changed.
- Keep mutation replay and push idempotent. Distinguish durable notification creation, dispatch ledger, provider delivery and device receipt; certify only the layer actually observed.
- Notification clicks must resolve the intended route after session restoration. Preserve protected-route denial for signed-out users.
- Do not carry physical evidence from an old release automatically. Reuse it only where the governing policy explicitly permits and required input equivalence is documented.

## 7. Multi-agent work without coordination overhead

Use one executor by default. Parallel agents require explicit authorization or an applicable instruction and genuinely independent work. No mandatory five-agent team or scheduled watchdog for every task.

Before parallel writes, assign each worker: one concrete outcome, starting branch/SHA, owned files or surface, exclusions, existing checks and handoff destination. A few lines in the existing task record are sufficient; no new claims system is required.

- One integration owner serializes merges and current-status/checklist edits. Workers do not repeatedly rewrite shared status files.
- Shared shell, schema, workflow, generated manifest and shared owner changes are assigned to one worker or sequenced explicitly. Do not let two agents patch the same failure independently.
- Each worker produces a commit/PR or evidence, not just a plan. Cap tasks so they fit a meaningful execution window; split large corpus work along existing deterministic shard boundaries.
- Reuse shared baseline findings. Do not ask every worker to rediscover the repository, credentials, completed feature history or the same gates.
- Refresh a feature branch from live integration before merging; validate affected combined behavior after conflicts. Do not use reverse integration-to-feature PRs or force-merge a stale branch.
- A reviewer inspects the changed surfaces, requested behavior and exact checks. Do not add another whole-project audit to every worker handoff.
- A watchdog is useful only for multiple active authorized workers: discover actual artifacts, unblock a concrete failure and integrate ready work. If there is nothing to integrate, it takes a bounded implementation task or stops; repeated status-only runs are waste.
- On a stall, preserve outputs, record the exact blocker and release/reassign ownership. Do not recreate the entire team or rerun completed work as the first response.
- Only one process owns a release candidate. Parallel unrelated work stays off the frozen release line.
- Close only proved superseded PRs. Preserve distinct unmerged work and rollback refs; a non-ancestor commit is not by itself obsolete.

## 8. Git, environments and release identity

- Separate production, integration, task and rollback references. Resolve divergence deliberately; never copy a stale branch over current runtime because its title says ready.
- Check the live base at integration boundaries, not before every read. If another writer moved it, rebase/refresh or stop that mutation and retry safely.
- Use the repository's pinned Node and lockfile for certified builds. Record any environment limitation without changing requirements to fit the local machine.
- Prefer working authenticated tools already available. If CLI writes are unavailable, use the authorized connector and compare tree identities; do not request login merely to check identity.
- Test the candidate explicitly in workflows. A workflow trigger commit or documentation checkpoint is not automatically the candidate.
- Required gates must run or have valid evidence on the exact candidate. Workflow branch/path filters must actually include the intended integration work before claiming automatic coverage.
- Frozen release and rollback refs do not move. Preserve the rollback ref before replacing production; verify it remotely.
- Verify the correct Cloudflare project, publish command/output and deployed metadata. A green deploy badge, reachable site or preview link does not prove the expected artifact is served.
- Promote the certified SHA/artifact through the existing production path. Do not silently rebuild another production candidate. Any required source/build change establishes a new candidate and reruns affected certification under the existing policy.

## 9. Release evidence and human boundaries

Use [release procedure](RELEASE.md) and the [existing exact-SHA gate contract](../docs/v6/V6_RC_EXACT_SHA_GATE.md). Do not create a second release framework.

- Separate implemented, locally tested, CI-certified, deployed and physically observed. Record the actual stage.
- Keep PASS, OPEN, FAIL and OWNER-WAIVED distinct. A waiver records an owner decision; it neither performs a test nor closes a physical PASS requirement.
- Reuse valid evidence for the same candidate and required evidence type. Do not reopen completed BSB/security/UX work merely because another acceptance row mentions it.
- Continue machine-solvable preparation while a genuine device or authorization step remains. Provide the smallest exact human action with candidate, route, expected outcome and required evidence.
- Release authorization persists for its stated scope. Require new input only when the intended action falls outside it or an actual external boundary blocks execution.
- Immediately verify production identity and essential site/session/Reader/audio/navigation/PWA/assignment/notification/protected-route smoke. Existing required physical/authenticated observations remain separate.
- On regression, contain the affected path and restore the verified rollback where authorized. Preserve user data and evidence; diagnose before adding another global patch.
- Report SHA, deployment result, acceptance count, failed gates, exact human action and rollback status. Do not replace these with broad confidence claims.

## 10. Documentation and durable handoff

- Link to canonical evidence and status instead of repeating counts/SHAs in many files. Update the authority when the outcome changes, not after every command.
- Keep a recoverable handoff: branch/HEAD, owned files, completed work, checks and environment, CI/evidence references, exact blocker and next action. Use [task template](templates/TASK.md); a small fix can put this in its PR rather than a separate report.
- Preserve historical text and classify it. Archive unreferenced narrative material; retain paths consumed by runtime, tests or workflows until an intentional migration updates consumers.
- `.txt` data/game bundles are application inputs. Do not delete them as notes. Plain-text work guides link to this authority rather than maintaining duplicate rules.
- Record new lessons only when an incident reveals a new failure mode or invalidates an existing rule. Merge repeated lessons into the applicable rule; do not grow a new checklist for every incident.
- A new mandatory check must name the failure it catches, when it runs and whether existing coverage already catches it. If coverage duplicates another gate, reuse/consolidate it rather than adding a permanent extra gate.

## 11. Retired process overhead

This policy replaces older operational prescriptions for new work, while frozen release contracts/evidence remain intact. Do not apply obsolete instructions to require:

- Every worker reading every authority file and open PR at each run.
- A full regression/security audit after every small edit.
- Fixed five-agent staffing, hourly status-only runs or a separate monitor for one executor.
- Rewriting the task board, active status, checklist and handoff for the same unchanged fact.
- Rebuilding verifiers, creating scripts-only proof PRs or duplicating existing certification.
- Serializing independent preparation behind unrelated long-running gates; only shared writes and candidate inputs need freezing.
- Repeated owner confirmation for reversible authorized work.

Do not use simplification to remove a required exact-SHA release gate, real authorization check, data-preservation rule or genuine physical-evidence requirement. Review only the task-relevant sections; the comprehensive rulebook is a reference, not a command to execute every check.
