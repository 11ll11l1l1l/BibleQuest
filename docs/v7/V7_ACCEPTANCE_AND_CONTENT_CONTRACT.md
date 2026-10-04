# V7 Acceptance, Content Provenance, and Evidence Contract

Status: Phase 0 working contract; route and permission rows remain open until reconciled with the architecture lane.
Authority: V7 scope follows DEVELOPMENT_PLAN_V7.md; V6 runtime/data/security contracts remain governed by V6_ACTIVE_STATUS.md and the V6 acceptance policy.
Owner: P0-D acceptance/content lane.
Base: v7/development at 7d972a0ecdc048fc435e5ca44f94f6d7d38692d3.

## Purpose

This contract defines how V7 scope, content provenance, permissions, and evidence are accepted. It does not authorize a feature, migration, production change, or new permission. Resolve the open rows with the route/architecture owner before feature implementation. Do not mark a row PASS based on this document alone.

## V7 acceptance checklist

### Phase 0 contract gate

- [ ] A complete route/surface inventory maps every existing V6 route to a V7 product family, primary user job, owner, and disposition: redesign, preserve, redirect, or retire.
- [ ] Every proposed V7 route has a unique route ID, canonical entry point, auth/session prerequisite, tenant requirement, and deep-link behavior. Route keys are taken from the current router/registry, not invented in this document.
- [ ] The product families in DEVELOPMENT_PLAN_V7.md are covered: Explore/Journey; Learn/Reader/Study; Play/Games/Kids/Avatar; Grow/Reflect; Community/Congregation/Couples; Ministry/Leader/Admin; Media/Notifications/Settings/Account.
- [ ] Global, congregation-scoped, group/team/couple/family-scoped, and user-private data ownership is assigned for every surface that reads or writes data.
- [ ] Member, Leader, Pastor, and Admin actions are mapped to existing V6 permission predicates or a separately approved V7 permission decision. UI visibility does not grant authority.
- [ ] Every content type has a provenance record and publication/moderation state appropriate to its source and scope.
- [ ] Every acceptance row names its required evidence class and the owner of that evidence. Missing live backend, authenticated account, or physical device evidence remains OPEN / UNVERIFIED.
- [ ] P0-A/P0-B architecture decisions and the current route registry are reconciled. No TBD, unresolved role, or unowned route may pass Phase 0.

### V7 product acceptance

- [ ] Every active route is accepted against its user job, supported role, scope, loading/empty/error/offline/unauthorized state, and narrow-phone behavior.
- [ ] Accepted V5/V6 features remain reachable and preserve their data meaning, ownership, authorization, and licensing. Intentional changes have an explicit product decision and revised evidence.
- [ ] Shared shell, navigation, state presentation, design components, and interaction patterns are coherent across all product families.
- [ ] Keyboard/focus, contrast, text scaling, reduced motion, and sound-off behavior are checked on affected routes; physical-only behavior is labeled separately.
- [ ] Responsive behavior is checked at representative phone, tablet, and desktop widths.
- [ ] Reader, Bible translations, BSB audio, offline behavior, push, assignments, congregation isolation, and existing security contracts continue to use their V6 owners. V7 presentation work does not fork those engines.
- [ ] ONE 2 ONE includes mentor/mentee pairing, Track → Module → Lesson progress, the seven-step lesson flow, deep links/QR, and direct communication scoped to active authorized relationships. Pairing, assignment visibility, response visibility, message access, and pair termination have explicit role/tenant denial cases.
- [ ] V7 media/file flows follow the approved centralized BibleQuest Google Drive model: Drive stores bytes, Supabase stores metadata/authorization/moderation state, no Drive credentials reach clients, and all delivery is authorized by BibleQuest. Reconcile the older ImageKit-first document before media implementation.
- [ ] The final candidate passes the existing required feature, security, database, browser/PWA, artifact, and exact-SHA release gates. No evidence transfers to a changed SHA unless the governing gate permits it.

## Domain and ownership contract

| Domain | Canonical scope | Acceptance rule |
|---|---|---|
| Licensed Scripture and translation assets | Global catalog, subject to each source's license and attribution | Never fabricate or silently substitute text. Keep translation/source identity and licensing visible to the owning content policy. |
| BibleQuest-created or licensed learning content | Global only after content approval and rights are recorded | Discipleship tracks use Track → Module → Lesson and the accepted Scripture → Understand → Discuss → Reflect → Apply → Pray → Action structure. Content is BibleQuest-created, church-approved, or properly licensed. |
| Congregation content and ministry operations | Explicit active congregation; narrower group/team/couple/family scope where applicable | Use the active V6 tenant context and server authorization. Do not infer a congregation or widen a scoped item to global. |
| Personal progress, reflections, and private notes | Owning user unless an explicit existing share contract says otherwise; ONE 2 ONE pairing has only the explicitly approved shared progress/communication scope | Preserve privacy through route changes, account switching, sync, and offline behavior. Pairing does not grant blanket access to all private notes, prayers, or reflections. |
| Uploaded photos and files | Metadata/permissions/moderation in Supabase; bytes in the central BibleQuest Google Drive account | Preserve owner, exact scope, visibility, Drive file ID, checksum, type, size, review state, and lifecycle. Private by default; no Drive credentials or direct Drive access for users. |
| Shared global resources | Explicitly public/global by approved owner and license | Global visibility is deliberate and auditable; absence of congregation_id alone is not proof of public authorization. |

### Role boundary

The role names Member, Leader, Pastor, and Admin are not substitutes for action-level authorization. For each route and mutation, the acceptance matrix must record: action, allowed role, required congregation/group context, server-side authority, and denial evidence.

- Member: access only published/global content and the user's own records, plus resources explicitly shared with that user under existing V6 rules. ONE 2 ONE access is limited to the active accepted pair, assigned lesson, and explicit message/share scope.
- Leader: may facilitate assigned small-group sessions and manage their prepared conversation decks only under existing/approved scoped authority. Group leadership does not expose a member's ONE 2 ONE private messages, prayer, or reflection.
- Pastor: may moderate or publish congregation-owned material only where the existing V6 authorization permits it. This does not grant global publishing or cross-congregation access.
- Admin: system-wide policy/provider and global-content actions remain behind existing privileged Admin checks. Admin status does not waive provenance, licensing, audit, or least-privilege requirements.

Any capability not already supported by the V6 authority requires a written decision naming actor, scope, permitted action, denial case, backend enforcement, and migration impact before implementation.

## Content provenance requirements

Every published or reviewable content record must retain, as applicable:

- stable content ID, content type, language/locale, version/revision, and owning scope;
- creator/uploader identity and originating organization where supplied;
- source title/URL or source catalog ID, retrieval/version date, and source revision or checksum where the material is versioned;
- copyright owner, license/permission basis, required attribution, and permitted usage;
- translation/adaptation relationship to the original source and translator/editor identity when known;
- moderation/publication state, reviewer identity, decision time, and revision history;
- removal/withdrawal reason and links to affected derivative content where applicable.

Unknown or unverified rights/provenance means unpublished and unavailable for reuse. Do not infer a public-domain or church-approval license from availability on the web. BibleQuest-authored material must still identify its authoring/review process; Scripture excerpts and media retain their separate translation/audio source identity.

For uploaded media, preserve the Drive file ID, checksum, uploader, scope, safe display metadata, review state, and deletion/moderation lifecycle defined by the P0-A data contract. Do not expose Drive credentials or store direct user-facing Drive access as authorization.

V7 does not rewrite or regenerate the V6 BSB corpus. Preserve its human-narration source, text/audio revision identity, checksums, timings, and existing evidence.

The approved V7 discipleship scope includes mentor/mentee pairing, Track → Module → Lesson, individual learner progress, the seven-step lesson flow, and the scoped communication required by the ONE 2 ONE and small-group experiences. Pairing does not itself publish private reflections, prayers, notes, or messages; P0-C must define the audience and denial cases, and P0-A must map the relationships and message lifecycle.


## Route and ownership acceptance matrix

The following surface inventory accepts the P0-B hierarchy as the P0-D acceptance basis. P1 must bind these product destinations to exact live route IDs and verify that every V6 route has an explicit disposition; route strings are implementation details and must come from the current router.

| Product destination | In-scope surfaces | Minimum acceptance owner |
|---|---|---|
| Today | Resume daily/assigned journey; relevant next steps | P0-B owns destination; affected feature owner proves resume and deep-link return |
| Bible | Shared Reader, selected passage/translation context, return to source item | V6 Reader owner proves preserved reading/licensing/offline contracts |
| Grow | Personal progress; ONE 2 ONE pairing; Track → Module → Lesson; seven lesson steps; deep links/QR; private direct communication states | P0-A maps entities; P0-C maps pair/tenant/visibility authority; feature owner proves positive and denial cases |
| Library | Books, Devotionals, Past Teachings; browse/detail; tags/language; attribution and Reader handoff | P0-A maps revisions/provenance; content owner proves license, review state, localization, and source handoff |
| Community | Congregation, groups/teams, Leader Conversation Deck, live prompt/Scripture, authorized small-group communication and shared media | P0-A maps group/deck/media relationships; P0-B maps communication routes; P0-C proves tenant and role boundaries; group/media owners prove their user paths |
| More | Play, Calendar, Progress details, Notifications, Account, Ministry/Admin | Existing V6 feature owners preserve accepted capability; P0-B defines placement; each privileged route names its Admin scope |
| Cross-destination | Deep links/QR, notification target, session/tenant hydration, loading/empty/offline/error/unauthorized states | Route owner and originating feature owner prove entry, return context, and state behavior |

P0-D accepts the destination hierarchy for planning. The serialized integration owner ratifies the hierarchy, route dispositions, and any exclusions in the canonical V7 status before P1 changes route behavior.

### Work ownership

| Lane/owner | Accountable outcome | Excluded from that lane |
|---|---|---|
| P0-A data architecture | Logical entities, relationships, revisions, ownership, provenance fields, media metadata, and Drive object lifecycle | Route UX, role/RLS policy, runtime migration |
| P0-B navigation / information architecture | Primary destinations, hierarchy, page journeys, route-entry/return behavior, and user-visible states | Schema, authorization policy, runtime router changes |
| P0-C security / tenancy | Role capabilities, tenant boundaries, pair/group visibility, server enforcement, moderation authority, and denial criteria | Navigation hierarchy, schema ownership, UI implementation |
| P0-D acceptance / content | Acceptance rows, content rights/provenance requirements, route coverage criteria, evidence classes/status semantics, and evidence owner per row | Runtime, migrations, permission implementation, production release |
| P0 integration owner | Reconcile conflicts, ratify exact P0 scope/routes/owners, establish the integration base, and maintain the single V7 status authority | Unreviewed self-merge or unsupported PASS claims |
| P1+ feature owner | Implement one bounded surface against the frozen contracts and attach exact-SHA evidence | Changing shared contracts without integration review |

Before a P0 row closes, the integrator records one named implementation owner for every shared runtime/auth/data surface. Parallel drafts are proposals until that reconciliation is recorded.

## Evidence classes and states

Each acceptance row must declare one or more evidence classes before testing:

| Class | What it can prove | It cannot prove by itself |
|---|---|---|
| UNIT / STATIC | Deterministic local logic, schema, permissions mapping, content validation | Real browser reachability, backend authorization, physical behavior |
| INTEGRATION / DATABASE | Connected feature and persistence behavior; applicable RLS/role denial | Deployed artifact identity or physical-device behavior |
| BROWSER / RESPONSIVE | Actual route, interaction, responsive layout, accessibility observation in the named browser/device emulation | Real push receipt, audible/background audio, all physical devices |
| CI / BUILD / ARTIFACT | Exact check result and built artifact for a stated SHA | Live deployment, authenticated user success, physical observation |
| LIVE BACKEND | Actual authorized/denied request against the named environment and role/scope | UI reachability or device-only behavior |
| DEPLOYED | Exact deployed SHA/artifact and specified live smoke | Unobserved routes, authenticated paths, physical device behavior |
| PHYSICAL DEVICE | Named device/OS/browser and directly observed device behavior | Other devices, roles, routes, or backend states not exercised |

State vocabulary:

- PASS: required evidence exists, is attributable to the exact candidate and scope, and satisfies the declared class.
- OPEN: evidence has not been completed.
- FAIL: observed result violates the acceptance row.
- UNVERIFIED: the claim cannot be concluded from evidence currently available; identify the missing environment, identity, device, or observation.
- OWNER-WAIVED: explicit owner decision to defer a requirement; never equivalent to PASS.

Evidence records name candidate SHA, environment, role/scope, route/action, tool/device, timestamp, result, and durable artifact reference. Sanitize personal data, tokens, signed URLs, and private notes. A green CI check, screenshot, guest-only visit, or UI affordance must not be presented as proof of a different evidence class.


## Cross-lane decisions that must be reconciled before P0 freeze

1. **Route hierarchy:** P0-B proposes the five primary destinations and a More area described above. Treat this as the design proposal; P0 integration must accept it and map all existing V6 routes to it before Phase 0 closes.
2. **ONE 2 ONE and communication scope:** the approved V7 roadmap includes mentor/mentee pairing, Track → Module → Lesson, the seven-step flow, deep links/QR, and scoped direct/small-group communication. P0-C covers pair authorization, while P0-A currently omits pairing and message entities. P0-B defines a small-group deck but explicitly excludes free-form group chat. The P0 integration owner must map the approved communication scope to existing V6 messaging capabilities or a bounded V7 surface, and define message ownership, audience, retention, and lifecycle before freezing. Private responses, prayer, notes, and progress each need an explicit audience; a pairing alone does not publish them.
3. **Media storage:** the approved V7 decision is one central BibleQuest Google Drive account for bytes, with Supabase as metadata/moderation/permission authority. P0-A reflects this. The older ImageKit-first docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md and any P0-C references to it must be reconciled as superseded before media implementation.
4. **Admin meaning:** preserve P0-C's distinction between congregation Admin and platform Admin/Owner. The route and feature contract must name which one is meant; neither role grants access to personal reflections, private pair messages, or another congregation's records by default.

## Route agreement and Phase 0 handoff

Use the P0-B navigation proposal as the route-family starting point: Today, Bible, Grow, Library, and Community are the five primary destinations; Play, Calendar, Progress details, Notifications, Account, and role-authorized Ministry/Admin remain reachable from More. The exact V7 route IDs and mapping from every current V6 route must be inventoried from the live router by the implementation owner; this contract does not invent URL keys. The integration owner records the accepted map and ownership matrix in the single V7 status authority after the parallel lanes reconcile.

P0-D is complete when the Phase 0 contract checklist is closed with no unresolved route, scope, permission, provenance, or evidence-owner row; the V7 acceptance checklist is usable against the implementation; and the integration owner has accepted the route/ownership matrix. Until then, this document is a bounded working contract, not a claim that Phase 0 has passed.
