# Architecture / Security Report — #75 Assignment Push Workflow

Agent: `BQ-A3-ARCH-SECURITY`
Analyzed canonical branch: `feature/v3-assignment-push`
Analyzed HEAD: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`
Date: 2026-09-10 JST

## Verdict

No external BLOCKER established. One MILESTONE architecture requirement must be satisfied before #75 can be considered safely implemented: the browser cannot obtain the retained `group` publish-target directory by directly reusing the current Journey Groups read path, because `bible_groups` RLS exposes only groups the caller owns or has joined. A leader publishing to any active Journey Group in the selected congregation therefore needs a ministry-authorized, congregation-scoped target projection through the existing central API/trusted-server boundary.

## Inspected architecture/backend evidence

- `ASSIGNMENT_PUSH_V3.md`: #75 retains `src/app/assignments.js` as sole application owner and `src/core/api.js` as sole browser cloud/trusted-function boundary; audiences are `all/member/team/group`; server must independently validate same-congregation targets.
- `src/app/assignments.js`: current owner already centralizes normalization, member start/complete, state and Realtime cleanup; ministry roles are `facilitator/leader/pastor/admin`.
- `src/core/api.js`: assignment reads/start/complete/subscription already live under one API owner. Team Center can read active teams and congregation-member directory. Journey Groups `list(userId)` first loads the caller's memberships, then only those group IDs.
- `supabase/functions/bq-assignment/index.ts`: `action:create` is trusted server authority, authenticates the user, requires active congregation membership, permits only `facilitator/leader/pastor/admin`, validates member/team/group targets against the supplied congregation, bounds/normalizes assignment inputs, and performs the assignment insert with the service-role client.
- `20260904_journey_groups_daily_loop.sql`: `journey groups member read` allows `bible_groups` select only when the caller is owner or an active group member; there is no congregation-leader directory policy.
- `20260905181000_linked_activity_assignment_groups.sql`: adds `group` assignment scope and updates `private.bible_assignment_visible` so normal members see group assignments only when they are active members of an active group in the same congregation; ministry roles can read congregation assignments.
- `20260905132000_pastor_community_rls_parity.sql`: later migration aligns assignment-progress leadership read with `facilitator/leader/pastor/admin`.
- `src/app/congregation-membership.js`: browser capability checks are fail-closed for unknown roles and distinguish normal read from ministry capability; these are UI/application guards, not server authorization.

## REQUIRED OWNER / COMPOSITION

- Keep `src/app/assignments.js` as the only assignment application owner. Add publish state/lifecycle there rather than reviving retained root `assignment-advanced.js`.
- Keep `src/core/api.js` as the only browser Supabase/Edge/Realtime boundary.
- Presentation must forward events/data only; it must not instantiate another Supabase client or directly mutate assignment tables.
- Reuse the existing congregation/session owners for selected congregation and local ministry-capability visibility.

## SAFE DATA FLOW

1. Signed-in application selects an active congregation through existing membership state.
2. Local UI exposes authoring only when `congregation.assert(congregationId, 'ministry')` succeeds.
3. Target directory is loaded through the central API boundary.
4. For `member/team/group`, the browser sends only the selected target ID plus normalized publish fields.
5. `bq-assignment` re-authenticates the caller, resolves active membership and role server-side, and independently validates target scope and congregation.
6. Server creates the row. Browser does not synthesize a durable local assignment.
7. Application reloads server truth through the existing RLS-protected assignment read path; eligible members receive via the existing Realtime-refresh path and complete through #73/#74.

## AUTHORIZATION / RLS CONTRACT

- Browser ministry-role gating is usability only; authorization remains server-side.
- `action:create` must continue to require an active membership role in `facilitator/leader/pastor/admin`.
- Member target: target must be an active member of the same congregation.
- Team target: team must belong to the same congregation. Preserve any active/type constraint expected by the recovered contract when producing selectable targets.
- Group target: group must be active and belong to the same congregation.
- Member receipt remains RLS-defined. Do not compute audience visibility in browser code.
- Do not add browser INSERT/UPDATE/DELETE grants or policies for `bible_assignments`, `bible_assignment_progress`, or `bible_score_events`.

## SERVER / TRUST BOUNDARY

Current `bq-assignment action:create` is suitable as mutation authority. The missing piece is read-side target discovery for Journey Groups.

Recommended minimum boundary: extend the existing trusted assignment function/API with a read-only target-directory action (for example `action:targets`) that:
- requires authenticated active membership in the selected congregation;
- requires a ministry role before returning publishing targets;
- returns only fields needed by the selector (IDs plus display labels; no private study/progress data);
- filters members to active same-congregation members;
- filters teams to same-congregation active publishable teams;
- filters groups to same-congregation active Journey Groups;
- never trusts browser-supplied role or congregation membership claims.

This avoids weakening the general `bible_groups` RLS policy merely to support a leader selector. If Agent 1 instead composes existing RLS-visible member/team reads with a new trusted group-only projection, that is acceptable if all three remain under `src/core/api.js` and the resulting directory is explicitly congregation-scoped and ministry-gated.

## LIFECYCLE / CLEANUP CONTRACT

- Preserve the existing single assignment Realtime subscription and `stopSync()`/returned cleanup semantics.
- Publishing must not create a second Realtime channel or independent polling timer.
- A create success should trigger/reuse the existing reload path; do not append an optimistic durable record that can diverge from RLS/server truth.
- Switching congregation, signing out, local-preview transition, feature teardown, or re-entering Assignments must not leave stale target-directory data or duplicate subscriptions.
- Target-directory requests should fail closed on session/congregation changes; stale results from a previously selected congregation must not populate the next congregation's selector.

## PRIVACY / SCOPE REQUIREMENTS

- Target discovery must expose only congregation directory metadata required to select an audience. Do not attach Private Notes, Cloud Notes, Transform answers, Couple Journey data, assignment submissions, credentials, presence detail, or unrelated study state.
- Do not broaden `bible_groups` select policy to every congregation member. That would change the privacy model for Journey Groups beyond #75's need.
- A ministry target-directory response must never include users/teams/groups from another congregation, even if the caller knows their UUIDs.
- Ordinary members, signed-out users, local preview, unknown roles and no-congregation states must receive no publish-target directory suitable for authoring.

## UNSAFE APPROACHES TO FORBID

- Direct browser insert/update into assignment/progress/score tables.
- Reusing `journeyGroups.list(userId)` as the authoritative `group` target selector and silently restricting leaders to groups they personally joined.
- Broadening general Journey Group RLS to all congregation members just to make the selector work.
- Trusting browser role checks as authorization.
- Accepting arbitrary target IDs without server same-congregation validation.
- Reviving `assignment-advanced.js` as a second runtime assignment owner.
- Implementing recurrence generation, Notification Center behavior, or linked-activity launch in #75.

## MIGRATION / FUNCTION CHANGES THAT MAY BE COMMITTED BUT NOT DEPLOYED

- No schema migration is required if the missing target directory is supplied by a new read-only action on the existing `bq-assignment` Edge Function.
- Such an Edge Function change may be committed to the v3 rebuild branch and tested without deployment to production.
- If a new RPC/view/policy is chosen instead, it must be committed as an ordered migration with explicit authenticated/ministry/congregation scope and without widening unrelated reads. This is less minimal than extending the existing trusted assignment function.
- Eventual production rollout ordering, outside this rebuild run: deploy/verify the trusted target-directory backend first, then deploy the browser client that depends on it. Do not ship a client that assumes the new directory contract before the backend exists.

## BLOCKERS

None external. The current absence of an all-active-group publish directory is a #75 MILESTONE implementation requirement, not a reason to stop canonical work.

## NON-BLOCKING OBSERVATIONS

- The migration history initially excluded `group` and `pastor` in older assignment policies, but later committed migrations explicitly add `group` visibility and pastor leadership parity. Agent 1 must assess the final ordered migration state, not the earliest migration in isolation.
- Existing assignment Realtime handlers ignore event payload data and use events only to reload RLS-filtered server truth, which is a safer ownership pattern for #75.
- Current v3 account/device service does not contain the broad local-progress snapshot synchronization path previously identified in old v2/main analysis; do not import that older finding into #75 without new v3 evidence.

## Architecture acceptance checks

1. Static validator proves `src/app/assignments.js` remains the sole assignment application owner and `src/core/api.js` the sole browser cloud boundary.
2. Ordinary member/signed-out/local-preview/no-congregation/unknown-role attempts cannot load authoring targets or publish.
3. Ministry target directory returns only active same-congregation member/team/group targets and includes an active Journey Group the leader has not personally joined.
4. Cross-congregation member/team/group UUIDs are rejected by server create even if manually supplied.
5. Browser source contains no direct assignment/progress/score table mutation path.
6. Successful publish reloads server truth; eligible member receives through existing RLS/Realtime flow and completes through existing #73/#74 path.
7. Congregation/session switch cannot reuse stale target-directory results; teardown leaves no duplicate Realtime subscription/timer.
8. Permanent tests cover all four audience scopes and preserve #1-#74 accumulated regression suite.

## Triage recommendation

`MILESTONE`: add a trusted congregation-scoped publish-target directory before implementing the #75 group selector. No BLOCKER or unrelated DEFER item established in this pass.
