# BibleQuest Roles and Ministry Authority

BibleQuest separates **platform authority** from **church/congregation ministry authority**. A ministry title never grants site-wide administration by itself.

## Platform roles

| Role | Scope | Authority |
| --- | --- | --- |
| Owner | Entire BibleQuest installation | Full platform authority. Can grant/revoke site Admin and Owner access, manage all users, and manage congregation roles. The active Owner cannot remove their own Owner access. |
| Admin | Entire BibleQuest installation | Operational site administration and user support. Can manage ordinary platform access and congregation ministry roles. Cannot create/remove Owner or other protected site-admin authority. |
| Member | Entire BibleQuest installation | Normal BibleQuest access. Ministry authority comes only from congregation membership. |

Legacy global `pastor` or `leader` rows may still be displayed by the Admin & Ministry console so they can be migrated, but new site-level Pastor/Leader assignments are rejected by the backend.

## Congregation roles

| Role | Scope | Intended authority |
| --- | --- | --- |
| Admin | One congregation | Congregation administration. Highest operational congregation role. |
| Pastor | One congregation | Ministry oversight. Can create assignments, give member feedback, create congregation invite codes, run/coordinate supported group ministry activities, and perform delegated scoring supported by the trusted score engine. |
| Leader | One congregation | Operational ministry leadership. Can create assignments, give feedback, create invites, run supported activities, and perform supported delegated scoring. Does not receive BibleQuest site-admin authority. |
| Facilitator | One congregation | Session/helper role. Can create supported assignments/invites and facilitate supported group activities, with no platform administration. |
| Member | One congregation | Normal participant. Can learn, join group activities, and complete assigned work. |

### Role assignment rule

Users are never made Pastor or Leader merely because they enter a church name in their profile. The normal flow is:

1. User creates a BibleQuest account.
2. User creates or joins a congregation using a valid invite code.
3. User initially has the congregation role assigned by the join/create flow.
4. An authorized BibleQuest Owner/Admin promotes the membership to Pastor, Leader, Facilitator, or congregation Admin in **Admin & Ministry**.
5. Server-side Edge Functions re-check the caller's authenticated user and current congregation membership before privileged ministry actions are accepted.

## Current permission boundaries

- `bq-admin`: site Owner/Admin only.
- `bq-assignment`: Facilitator, Leader, Pastor, or congregation Admin may create assignments; leadership roles may give feedback under the function's rules.
- `bq-invite`: Facilitator, Leader, Pastor, or congregation Admin may create invite codes.
- `bq-score`: delegated scoring is restricted to Facilitator, Leader, Pastor, or congregation Admin and only for supported activity sources.
- Password recovery remains user-controlled. Admins, pastors, and leaders cannot read recovery codes or reset another user's password through BibleQuest Admin.

## Production principle

Authorization must be enforced on the server. UI visibility is convenience only and must never be treated as the security boundary. Role checks use authenticated user identity and database-backed access/membership records rather than user-editable profile metadata.
