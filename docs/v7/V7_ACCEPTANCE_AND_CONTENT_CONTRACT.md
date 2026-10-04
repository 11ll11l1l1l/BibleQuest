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
- [ ] V7 media/file flows preserve the approved strict-zero-cost and provider-neutral contract in docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md, including private authorization, quota fail-closed behavior, and no Supabase Storage blob use.
- [ ] The final candidate passes the existing required feature, security, database, browser/PWA, artifact, and exact-SHA release gates. No evidence transfers to a changed SHA unless the governing gate permits it.

## Domain and ownership contract

| Domain | Canonical scope | Acceptance rule |
|---|---|---|
| Licensed Scripture and translation assets | Global catalog, subject to each source's license and attribution | Never fabricate or silently substitute text. Keep translation/source identity and licensing visible to the owning content policy. |
| BibleQuest-created or licensed learning content | Global only after content approval and rights are recorded | Discipleship tracks use Track → Module → Lesson and the accepted Scripture → Understand → Discuss → Reflect → Apply → Pray → Action structure. Content is BibleQuest-created, church-approved, or properly licensed. |
| Congregation content and ministry operations | Explicit active congregation; narrower group/team/couple/family scope where applicable | Use the active V6 tenant context and server authorization. Do not infer a congregation or widen a scoped item to global. |
| Personal progress, reflections, and private notes | Owning user unless an explicit existing share contract says otherwise | Preserve privacy through route changes, account switching, sync, and offline behavior. |
| Uploaded photos and files | Metadata/permissions in Supabase; bytes in the approved external provider | Preserve owner, exact scope, visibility, moderation, provider-neutral object identity, checksum, type, size, and lifecycle. Private by default; no permanent signed URL in metadata. |
| Shared global resources | Explicitly public/global by approved owner and license | Global visibility is deliberate and auditable; absence of congregation_id alone is not proof of public authorization. |

### Role boundary

The role names Member, Leader, Pastor, and Admin are not substitutes for action-level authorization. For each route and mutation, the acceptance matrix must record: action, allowed role, required congregation/group context, server-side authority, and denial evidence.

- Member: access only published/global content and the user's own records, plus resources explicitly shared with that user under existing V6 rules.
- Leader: receives no new capability from the label alone. Any group or congregation action must match an existing V6 permission; otherwise it remains unavailable pending an approved V7 decision.
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

For uploaded media, additionally preserve the provider-neutral asset metadata and deletion/moderation lifecycle required by V7_FREE_MEDIA_FILE_STORAGE.md. Do not store provider secrets or long-lived signed URLs in the client, evidence, or metadata.

V7 does not rewrite or regenerate the V6 BSB corpus. Preserve its human-narration source, text/audio revision identity, checksums, timings, and existing evidence.

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

## Route agreement and Phase 0 handoff

Route names are intentionally not guessed here. The architecture/route owner supplies the exact current V6 route IDs and proposes the V7 destinations; P0-D checks each against the acceptance rows above. The integration owner records the final agreed route map and ownership matrix in the single V7 status authority after the parallel lanes reconcile.

P0-D is complete when the Phase 0 contract checklist is closed with no unresolved route, scope, permission, provenance, or evidence-owner row; the V7 acceptance checklist is usable against the implementation; and the integration owner has accepted the route/ownership matrix. Until then, this document is a bounded working contract, not a claim that Phase 0 has passed.
