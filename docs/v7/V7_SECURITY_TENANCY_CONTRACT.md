# BibleQuest V7 Security and Tenancy Contract (P0-C)

> Current V7 communication boundary (2026-10-05): [the accepted reconciliation](V7_PAIR_COMMUNICATION_RECONCILIATION.md) supersedes the historical OPEN pair-thread dependency below. V7 supports explicit item-level lesson-response sharing with the active mentor; generic pair-private chat is unavailable and excluded. Conditional thread-security requirements do not authorize messaging infrastructure or create a V7 release blocker. Response-sharing privacy, pair lifecycle and tenant-denial requirements remain mandatory.

Status: **P0-C security/privacy/tenancy contract accepted in the serialized P0 freeze**
Owner: **Lane C — Security, privacy and tenancy**
Baseline: current V7 scope in `DEVELOPMENT_PLAN_V7.md`
Applies to: Library (Books, Devotionals, Past Teachings) and structured ONE 2 ONE. Pair-communication rules apply only if a compatible backend capability is verified and authorized; the P1-A inventory found no V6 pair-private capability, so this part remains OPEN.

This contract defines authorization and privacy behavior expected in V7. It does not claim that runtime policies or tests are already implemented. V6 server authorization, RLS, session handling and congregation isolation remain authoritative until a reviewed V7 change proves otherwise.

## 1. Security invariants

1. **The server is the authority.** Client visibility and filters are usability controls, not authorization. Protected reads and writes must pass the existing server/API and database/RLS authorization path.
2. **Resolve scope explicitly.** A protected request must resolve an authorized user, resource, and congregation scope where applicable. Missing, ambiguous or stale scope fails closed. Never infer scope from the first membership or trust an object ID by itself.
3. **Preserve role boundaries.** Congregation roles do not imply platform Admin/Owner authority. Mentor and Mentee are relationship roles and do not replace congregation membership or other capabilities.
4. **Grant least privilege.** A role label alone is not permission. Authoring, program management and review actions require a named capability for the resource and scope.
5. **Keep personal work private by default.** Reflection answers, prayer/action notes, drafts, bookmarks and personal notes are owner-only unless that specific item is deliberately shared with a named recipient.
6. **Revalidate current authority.** Check active membership, capability, pairing and resource state at each protected operation. A revoked role or ended pairing blocks the next request.
7. **Prevent stale-context disclosure.** On account or congregation switch, invalidate scoped results and pending work. A response started under the previous identity or scope must not appear in the new context.
8. **Audit consequential changes without copying private content.** Pairing, role/capability, assignment and publication changes retain actor, target, scope, action and timestamp. Logs must not include reflection text or other private content.

## 2. V7 data scopes

Every protected V7 record has one explicit authorization owner and visibility class. Lane A's accepted data contract determines the concrete schema; this contract defines the access behavior.

| Scope | V7 examples | Access rule |
|---|---|---|
| Published Library catalog | Published Books, Devotionals and Past Teachings | Read according to publication and licensing state. Only an explicitly authorized content owner may create, edit, publish or archive an item. |
| Congregation content | Past Teachings or resources explicitly owned by a congregation | Requires current membership and the content-specific capability in that congregation. An ID, URL or membership in another congregation grants no access. |
| ONE 2 ONE relationship | Pair, assigned track/module/lesson, operational progress, and pair communication only if its backend dependency is resolved | Pair and progress data require the active, accepted relationship. If pair messaging is later authorized, it must be visible only to its two participants. Program operations also require the relevant capability and congregation scope. |
| Personal learner data | Private reflection, prayer/action response, draft or personal note | Owner-only unless the owner explicitly shares one item with a named recipient and the audience is shown before submission. |
| Public entry point | Published public content and approved onboarding routes | Public access only to intentionally public material. A deep link to protected content does not make it public. |

A record with no congregation scope is global only when its data contract explicitly defines it as a global catalog item. Null scope never means access across all congregations. Child records must be checked against their parent resource and current scope on both reads and writes.

## 3. Capabilities and visibility

| Actor | Library | ONE 2 ONE |
|---|---|---|
| Guest | Read published public items only | No access to protected pair, assignment or learner data. A protected deep link waits for authentication and then performs authorization. |
| Member / Mentee | Read items available in the active congregation; manage own personal data | See own active program, assigned lessons and progress; exchange messages only in their own active pair. Private responses remain private unless individually shared. |
| Mentor | Same Library access as their congregation membership | While a pair is active and accepted, see assigned material, only the operational progress disclosed to the mentee, and messages in that same pair thread. No access to another pair's thread or to private reflection, prayer/action text, drafts or unrelated mentees. |
| Authorized author / Leader / Pastor / congregation Admin | Create or manage only content for which the actor has an explicit capability in the item's global or congregation scope | Manage program or assignment operations only when the relevant capability is granted. No role grants blanket access to private learner responses. |
| Platform Admin / Owner | Explicit platform operations only, separate from congregation roles and purpose-limited | No routine browsing of private pair content or learner responses. Any exceptional authorized access is purpose-limited and audited. |

An actor may hold more than one role. Authorization uses the current resource scope and required capability, not the broadest role label on the account. Content authority and congregation administration remain separate when the product grants different capabilities.

## 4. Pairing and learner privacy

- Pairing is created through an explicit workflow and accepted by both participants. Unless an accepted product rule says otherwise, a pair belongs to one congregation.
- A mentor's default visibility is limited to the assigned curriculum and the operational progress needed to support the learner, with the sharing expectation disclosed to the mentee.
- A mentor cannot browse private reflection, prayer/action text, personal notes, drafts, or answers merely because a lesson is complete or the mentor is a Leader, Pastor or Admin.
- Sharing is per item. Before a learner shares, the UI names the recipient and audience; the backend stores and enforces that scope.
- If pair messaging is authorized, a thread belongs to exactly one active pair and only its two current participants may read or send. A pair ID, route or congregation role does not authorize access. The current P1-A inventory found no compatible V6 pair-private backend; this contract does not assert one exists or authorize a V7 message table/adapter.
- If pair messaging is later implemented, ending, declining or suspending a pair immediately blocks new sends. Retained history remains limited to former participants under the owning backend's retention rules. No V7 retention behavior is defined while the capability gap remains open. Ending a pair does not publish or erase private lesson responses.
- A program operator may access enrollment and operational status only to the extent needed for the assigned program task. It does not confer access to personal response text.

## 5. Protected routes and deep links

- A protected deep link is a locator, not an access grant. Guessing or changing pair, lesson, congregation, recipient or content identifiers must not broaden access.
- The route waits for session hydration, resolves the active congregation when required, then loads protected data through the authorized V6/V7 service path.
- Signed-out, wrong-congregation, unpaired, ended-pair and insufficient-capability states remain distinct and fail closed. Do not briefly render cached protected content while authorization is unresolved.
- After account, congregation or pairing changes, clear or invalidate protected route data and reject late responses from the old context.
- Notification or QR links must return to the intended route only after session restoration and the same authorization checks.

## 6. P0-C acceptance criteria and implementation ownership

P0-C freezes intended behavior; it does not mark future runtime checks as passed.

| ID | Required behavior | Later implementation owner | Evidence required |
|---|---|---|---|
| SEC-TEN-01 | Protected reads and writes require an explicit, current user and resource scope; missing or stale scope fails closed. | P1-A, with service consumers | Positive same-scope case plus missing/stale-scope denial. |
| SEC-TEN-02 | Changing congregation, object, parent or recipient identifiers cannot expose another congregation's Library or discipleship records. | P1-A and P1-C | Same-tenant allow plus cross-tenant read/write denial for affected V7 records. |
| SEC-TEN-03 | Congregation Admin and other congregation roles cannot exercise platform Admin/Owner capabilities. | P1-A | Tenant-admin denial for a platform-only operation; valid platform path remains separately tested. |
| SEC-TEN-04 | Mentor access requires an active, accepted pair and is limited to assigned content and disclosed operational progress. | P1-C | Paired allow; unpaired, unrelated-pair, ended-pair and cross-congregation denial. |
| SEC-TEN-04A | Pair-thread reads and sends are limited to the two participants; only former participants may read retained history after pair end, and ended pairs cannot send. | P1-C and existing V6 communication owner | Participant allow; outsider, wrong pair, ended-pair send, wrong congregation and changed-ID denial; retained history remains former-participant-only. |
| SEC-TEN-05 | Private learner responses remain private unless the learner explicitly shares an item with a named audience. | P1-C and P3-C | Private-response API/RLS denial plus explicit-share allow and audience UI assertion. |
| SEC-TEN-06 | Authoring and publishing require the content-specific capability in the item's global or congregation scope. | P1-A and P1-B | Authorized create/edit/publish case plus wrong-role and wrong-congregation denial. |
| SEC-TEN-07 | Protected deep links wait for session/scope resolution and do not expose cached or guessed-ID content. | P1-C and integration owner | Signed-out, wrong-tenant, unauthorized-ID, refresh and session-restoration cases. |
| SEC-TEN-08 | Account, congregation or pair revocation takes effect on the next request and stale in-flight results cannot appear in a new context. | P1-C and affected route owner | Revocation and context-switch tests on the changed routes/services. |
| SEC-TEN-09 | Authorization audit events record consequential metadata without private response content. | P1-A and affected mutation owner | Event payload assertion excluding private text and secrets. |

Reuse existing V6 tenant, role, session, assignment and deep-link tests where their fixtures match. Add only the V7 cases needed for new Library and ONE 2 ONE resources. Do not repeat V6 aggregate security certification for this contract task.

## 7. Ownership and exclusions

- **Lane C owns:** the V7 role/capability boundaries, congregation and pair visibility, private reflection/progress rules, and protected deep-link/session requirements.
- **Lane C does not own:** schema/RLS migrations (P1-A), Library or discipleship implementation, global route wiring, or broad V6 recertification.
- **V7 exclusions:** Conversation Deck/realtime group messaging, central Google Drive or external media storage, full media moderation, full Ilocano rollout, bulk content ingestion, Couples expansion and a second whole-app redesign remain V8 scope. Pair-private communication remains an OPEN V7 dependency because no compatible V6 capability was found; do not create a new messaging system without explicit contract resolution.
- **P0 freeze:** this contract was accepted with the P0-A, P0-B and P0-D contracts. P1 implementation follows the current lane ownership and does not reopen the frozen contract.

## 8. Handoff

The contract was accepted in the serialized P0 freeze. It establishes reviewable behavior and assigns later evidence to the existing V7 lane owners. Runtime authorization, schema policies and route tests remain **OPEN** until those implementation owners produce the required evidence.
