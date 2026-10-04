# BibleQuest V7 Security and Tenancy Contract (P0-C)

Status: **Proposed contract for Phase 0 review**
Owner: **P0-C — Security / tenancy**
Baseline: V7 preparation branch `v7/development`, commit `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Scope: role authority, tenant boundaries, mentor/mentee visibility, and moderation for V7 Library, Discipleship, Conversation Deck, and Media surfaces.

This document defines the proposed V7 product contract. It does not change runtime behavior, database policies, or migrations. Existing V5/V6 authorization and RLS remain authoritative until a separately reviewed implementation proves the V7 contract.

## 1. Security invariants

1. **The server is the authorization authority.** Hiding a control or filtering a client query is not access control. Apply authorization in the existing server/Edge Function and database/RLS path for reads and writes.
2. **Resolve scope explicitly.** A request must carry or resolve one authorized resource scope. Never infer a congregation from the first membership, a stale client value, or an object ID alone. Missing or ambiguous scope fails closed.
3. **Keep platform and congregation roles distinct.** A congregation Admin has authority only in that congregation. Platform Admin/Owner authority is separate, deliberate, and auditable.
4. **Use least privilege.** Roles grant actions for a defined product purpose. They do not grant unrestricted access to every record in the same congregation.
5. **Private by default.** Personal notes, prayer/reflection text, private messages, and unshared files are visible to their owner and explicit participants only.
6. **Re-check current authority.** Validate active membership, role, relationship, scope, and resource state at the time of each protected operation. Revocation takes effect on the next request.
7. **Record consequential decisions.** Membership changes, pairing changes, moderation decisions, publication, and deletion retain actor, target/resource, scope, timestamp, and decision history without copying private content into audit logs.

## 2. Scope and ownership model

Every V7 record with congregation or user data must have one authorization owner and an explicit visibility class.

| Scope | Examples | Access rule |
|---|---|---|
| Global catalog | Published BibleQuest books, devotionals, lesson templates, public help | Read according to publication/licensing state; only designated platform content authority publishes global items. |
| Congregation | Congregation Library items, ministry resources, event media | Requires active membership in that congregation and the feature-specific capability. |
| Group or team | Conversation Deck session, group discussion, team resource | Requires active membership in the parent congregation and current membership/participation in that group or team. |
| Mentor pair | Pairing, assigned lessons, explicitly shared progress | Requires an active pairing and only the capabilities granted by the pairing contract. |
| Couple/family | Couple or family content | Requires current membership in the relevant couple/family relationship; congregation membership alone does not grant access. |
| Personal | Journal, private reflection, prayer, private notes, personal settings | Owner only unless the owner explicitly shares a particular item with named recipients. |
| Moderation | Reports, review queue, content decisions | Reporter may see limited status for their own report; reviewers see only items in their assigned moderation scope. |

A scoped row must retain its owning `congregation_id` where applicable. A child row must be proven to belong to its parent scope on both reads and writes. Null congregation scope means global only for an explicitly defined global resource; it must never mean “all congregations.”

For multi-congregation users, the selected active congregation is explicit. Switching it clears or invalidates previous congregation-scoped results and pending writes. A request that started in the old scope cannot publish results into the new scope.

## 3. Role and capability matrix

Capabilities are scoped to the resource and purpose shown below. Feature code must not treat a role label by itself as proof of access.

| Actor | Own/private data | Congregation Library / Media | Group / Conversation Deck | Discipleship pair | Moderation |
|---|---|---|---|---|---|
| Guest | Local guest data only | Public/published items only | Public sessions only, if enabled | None | Submit a public report only where the feature allows it |
| Member | Read/write own data; share selected items explicitly | Read published items allowed to active members; upload/submit into allowed scopes | Participate only in current groups/teams | See own track and lessons; share selected progress with active mentor | Submit a report; see limited status of own report |
| Facilitator | Same private boundary as Member | Member capabilities; no congregation-wide private data access | Facilitate assigned groups/sessions; see only discussion/session data required for that task | No blanket access from facilitator role | Review only when separately granted reviewer capability for that congregation |
| Leader | Same private boundary as Member | Manage ministry material and moderate congregation-scoped items when assigned that responsibility | Manage assigned groups and sessions | Assign/manage pairs only within permitted congregation workflow; see explicitly shared learner progress | Approve, reject, request changes, or remove scoped content when designated as reviewer |
| Pastor | Same private boundary as Member | Congregation leadership visibility for ministry operations; no unrestricted personal-reflection access | Manage congregation groups and sessions consistent with assignment | Oversee program assignment/progress within congregation; private reflection remains private | Same tenant-bound review actions; no cross-congregation authority from Pastor role |
| Congregation Admin | Same private boundary as Member | Manage membership and congregation configuration; content moderation only through an explicit reviewer capability or configured policy | Manage group membership/configuration; not private participant journals | Manage program configuration; no private reflection access | Tenant-bound review actions only when the reviewer capability is granted |
| Platform Admin / Owner | No routine browsing of private member content | Explicit global operations only; every privileged access is purpose-limited and audited | No default access to private sessions or messages | No default access to private pair content | Global review only under explicit platform authority and audit |
| Service/runtime identity | No human UI access | Executes only the validated operation for which it was invoked | Same | Same | No bypass route; actor and tenant authority are validated before privileged execution |

**Role semantics:** Member, Facilitator, Leader, Pastor, and congregation Admin are congregation membership roles. Platform Admin/Owner is application-level authority. Mentor and Mentee are relationship roles, not congregation roles; pairing does not elevate either person's general permissions.

The matrix preserves the V6 distinction between congregation Admin and platform Admin/Owner. If a feature needs a capability not listed here, add a named, scope-bound capability and its denial criteria; do not silently broaden a role.

## 4. Mentor / mentee visibility

- Pair creation requires an explicit workflow and acceptance by both people. The default pairing scope is one congregation; any cross-congregation program needs an explicit product rule and separately tested authorization.
- A mentor can see the mentee's assigned track/lesson, due state, and completion status only while the pairing and assignment are active and only where the mentee has been told this progress is shared.
- A mentor cannot browse private journal entries, prayer requests, notes, drafts, private messages outside the pair, or unshared reflection answers.
- A mentee can see the mentor's assigned material, messages addressed to the pair, and the mentee's own progress. Pairing does not grant access to the mentor's other mentees.
- A reflection, answer, or attachment enters mentor visibility only through an explicit per-item share action that identifies the recipient and scope. The UI must show the audience before submission.
- Group leaders and pastors receive no mentor visibility merely because they can manage the group or congregation.
- Ending, declining, or suspending a pairing immediately blocks new reads and writes through that relationship. Historical audit records remain protected; relationship end does not make content public.

## 5. Library, Conversation Deck, and Media rules

### Library

- Global published books/devotionals and congregation resources have distinct scope and moderation owners.
- Drafts, bookmarks, reading notes, and personal highlights are owner-only unless individually shared.
- A congregation resource is readable only by current authorized members. An ID or share URL does not broaden that audience.
- User-submitted items enter **Pending Review** by default before congregation-wide publication.

### Discipleship

- Lesson templates may be global or congregation-owned; assignments and progress are scoped to the selected congregation and the assigned person/pair.
- Mentorship visibility follows Section 4. Program administrators may see enrollment/operational status needed to run the program, not private reflection text by default.
- Prayer, reflection, and discussion answers are separate visibility fields/classes; completion of a lesson must not implicitly publish its answer.

### Conversation Deck

- A deck/session belongs to its creator's authorized congregation and, when selected, one group/team. Participants must satisfy both scopes.
- The leader may broadcast the active prompt and Scripture to the session. Participant responses remain private to the author unless the response is submitted to the group or explicitly shared.
- Session invitations, deep links, and guessed IDs are not authorization. Removing a participant or ending the session revokes access.

### Media and attachments

- Store uploaded binary files in the central BibleQuest Google Drive account; users do not need to connect personal Drive accounts. Supabase remains authoritative for file metadata, owner, congregation/group/couple scope, permissions, Pending Review/moderation state, and audit history.
- Every upload and download starts with server-side BibleQuest authorization against the current session and the authoritative Supabase metadata. Drive file IDs or URLs are not access grants. Do not expose Drive credentials or unrestricted persistent links to private files to clients; use a controlled delivery path that preserves the authorization check.
- Attachments inherit the narrowest parent scope. Moving or reusing an attachment in another scope requires an explicit authorized metadata relationship; a file ID or URL cannot change ownership or scope.
- Member-uploaded content is **Pending Review** by default. Within the owning congregation, authorized Leader, Pastor, or Admin reviewers may **Approve**, **Reject**, **Request Changes**, or **Remove After Publish**. The uploader cannot approve their own submission. Congregation roles confer no authority over another congregation's queue.
- Removal prevents further authorized delivery and records the decision. Metadata and Drive object lifecycle must remain consistent; audit history does not expose file bytes, credentials, or private content.

## 6. Moderation authority and audit

1. A report identifies the target item and owning scope. Creating a report does not grant the reporter access to the moderation queue or the reported user's private records.
2. A reviewer must be active and authorized for the item's current scope at decision time.
3. Review decisions are limited to `approve/publish`, `reject`, `request changes`, and `remove after publish`; permanent deletion is a separate, narrowly authorized lifecycle action.
4. The uploader/author cannot decide their own item. A second authorized reviewer or explicitly audited platform procedure is required for any exception.
5. Decisions preserve prior state and record reviewer, scope, action, reason/category, and timestamps. Audit records are append-only to ordinary users.
6. A congregation Admin is not a platform Admin. A tenant reviewer cannot read or decide on another congregation's queue. Global content review requires explicit platform authority.
7. A content decision never changes the underlying tenant owner or silently transfers data to another congregation.

## 7. P0-C acceptance criteria

P0-C is complete when the Phase 0 integration can point to this contract and each criterion below is assigned to an existing implementation/test owner for later feature work. This document does not claim those runtime checks have already passed.

| ID | Required behavior | Evidence required at implementation |
|---|---|---|
| SEC-TEN-01 | Active tenant is explicit; absent, stale, or ambiguous scope fails closed. | Request/API and RLS denial for missing or stale congregation context. |
| SEC-TEN-02 | A Member, Facilitator, Leader, Pastor, and congregation Admin cannot read or mutate another congregation's scoped records by changing filters, IDs, parent IDs, or recipient IDs. | Positive same-tenant case plus cross-tenant read/write denial for each affected V7 domain. |
| SEC-TEN-03 | Congregation Admin authority does not imply platform Admin/Owner authority. | Role-matrix tests prove tenant admin cannot use global review or read another tenant. |
| SEC-TEN-04 | Group/team and couple/family child records inherit and validate their parent scope. | Cross-parent reassignment and foreign group/team ID denial tests. |
| SEC-TEN-05 | Mentor access is limited to an active, accepted pair and the explicitly shared progress/items. | Paired/unpaired, ended-pair, unrelated-pair, private-note, and explicit-share positive/negative tests. |
| SEC-TEN-06 | Lesson completion does not expose private reflection; audience is clear before an item is shared. | API/RLS denial for private answers plus UI assertion for the share audience. |
| SEC-TEN-07 | Moderation is tenant-bound, role/capability-bound, and author self-approval is denied. | Approve/reject/request-changes/remove allow/deny cases, including foreign tenant and self-review. |
| SEC-TEN-08 | Media authorization is checked before upload and every download; Google Drive IDs/URLs do not bypass scope checks. | Unauthorized ID/URL guessing denial, client-credential scan, and metadata/Drive-object removal consistency test. |
| SEC-TEN-09 | Membership, role, pairing, or group removal takes effect on the next protected request; stale in-flight results cannot appear after context switch. | Revocation and account/tenant-switch tests on affected routes and requests. |
| SEC-TEN-10 | Platform-level exceptional access and moderation are explicit and auditable. | Tests for authorized platform path, denied ordinary path, and audit metadata without private content. |

Reuse existing V6 tenant, role-matrix, content-review, and media tests where their fixtures and behavior match. Add only V7-specific coverage for new data and relationships; do not recreate an aggregate V6 certification as a P0-C deliverable.

## 8. Ownership and exclusions

- **P0-C owns:** this role/capability contract, tenant and relationship visibility rules, moderation boundaries, and acceptance criteria.
- **P0-C does not own:** V7 route design or general information architecture; media provider selection/adapter implementation; schema/RLS migrations; implementation of Library, Discipleship, Conversation Deck, or moderation UI; whole-repository security recertification.
- **Later feature owners:** implement the applicable contract rows in their feature/API/RLS work and attach the evidence. The serialized V7 integration owner assigns one accountable implementation owner per shared authorization surface.
- **Integration owner:** links this contract from V7's canonical status and acceptance tracker, records any accepted changes, and resolves conflicts before feature implementation.

## 9. Phase 0 handoff

Carry these already-established product decisions into the V7 integration contract:

- User/congregation files use the central BibleQuest Google Drive account; Supabase remains the source of truth for metadata, scope, permissions, and moderation.
- User submissions default to Pending Review. Authorized Leader, Pastor, or Admin reviewers may Approve, Reject, Request Changes, or Remove After Publish within the owning congregation.
- Personal notes, prayer, and reflection remain private unless an individual item is explicitly shared.
- Mentor/mentee pairing is an explicit relationship, scoped to the assigned participants; default to same-congregation unless a separately defined program allows otherwise.
- Congregation Admin and platform Admin/Owner remain distinct authorities.

P0-C hands the security boundaries and acceptance criteria to the serialized integration owner. Any later change to these decisions must update the contract and preserve the relevant denial tests.