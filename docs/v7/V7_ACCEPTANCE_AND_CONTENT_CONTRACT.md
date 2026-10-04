# V7 Acceptance, Content Provenance, and Evidence Contract (P0-D)

Status: **P0-D acceptance/content/provenance contract accepted in the serialized P0 freeze; no product acceptance is claimed.**
Owner: **P0-D — acceptance, content, provenance, and localization readiness.**
Scope authority: `V7_ACTIVE_STATUS.md` and `DEVELOPMENT_PLAN_V7.md`.
Baseline: live `v7/development` at the start of this continuation (2026-10-04).
This document defines acceptance evidence and content rules. It does not implement runtime behavior, authorize permissions, or certify a release.

## 1. V7 scope accepted by this contract

V7 contains two product systems:

1. **Library:** Books, Devotionals, and Past Teachings, with browse/detail, topic or category discovery, source attribution, and a Scripture Reader handoff where appropriate.
2. **Structured ONE 2 ONE:** mentor/mentee pairing and relationship state, Track → Module → Lesson, learner progress, the seven-step lesson flow, authorized authoring/assignment, pair-thread communication using the existing V6 communication capability, and the approved deep-link/QR entry and return behavior.

V7 reuses the released V6 app, Reader, authentication, tenant context, assignments/deep links, localization, PWA/offline, notifications, communication capabilities, and security owners. V7 does not create a replacement messaging system. An acceptance claim must identify any V6 contract it relies on and must not imply that a V6 capability was reimplemented.

The following do not enter the V7 acceptance denominator: new Leader Conversation Deck, participant broadcast or realtime small-group sessions/group chat; a central Google Drive media ingest/storage pipeline or full media moderation/provider project; full Ilocano rollout or Bible ingestion; bulk content ingestion; Couples expansion; recommendation-engine work beyond Library MVP; and a second whole-app visual redesign. These are transfer items for V8 (Section 7), except existing V6 capabilities that V7 directly reuses.

## 2. Phase 0 acceptance contract

The integration owner closes each shared-contract row only after reconciling the relevant P0-A/B/C artifact. This lane defines the acceptance criteria and evidence; it does not decide another lane’s data, navigation, or security design.

| ID | Acceptance criterion | Required evidence class | Later accountable owner |
|---|---|---|---|
| P0D-01 | Scope is limited to the Library and structured ONE 2 ONE objectives in Section 1; every prior broad-product item is either reused as V6 or listed in the V8 transfer manifest. | STATIC | Integration owner |
| P0D-02 | The content taxonomy distinguishes Books, Devotionals, Past Teachings, and the ONE 2 ONE curriculum hierarchy without conflating source type, topic tag, language, or publication status. | STATIC / DATABASE | P0-A data owner |
| P0D-03 | Each content type has the minimum provenance and rights fields in Section 3, including a clear rule for unknown rights. | STATIC / DATABASE | P0-A data owner and content owner |
| P0D-04 | Representative, source-valid content is selected for each Library type before feature acceptance; this does not require bulk ingestion. | CONTENT REVIEW | Content owner |
| P0D-05 | Library discovery supports its accepted category/topic and language metadata; displayed source, attribution, and permitted-use information remain available in detail. | BROWSER / CONTENT REVIEW | Library feature owner |
| P0D-06 | UI strings and content records are locale-ready, use the existing localization system, and show a defined fallback when a translation is unavailable. This is readiness, not a full Ilocano rollout. | STATIC / BROWSER | Localization and feature owners |
| P0D-07 | ONE 2 ONE acceptance covers an accepted mentor/mentee relationship, authorized assignment, Track → Module → Lesson progression, the seven-step lesson flow, and pair-thread communication through the existing V6 capability. | BROWSER / INTEGRATION | Discipleship feature owner |
| P0D-08 | Assignment, completion, private reflection/prayer, and any explicitly shared response have separately stated audiences. Pair-thread messages are limited to current pair participants; pairing alone does not make private lesson text visible to the mentor. | INTEGRATION / DATABASE | P0-C security owner and feature owner |
| P0D-09 | Pairing, lesson, notification/deep-link, and Reader handoff routes use the keys and entry/return behavior ratified by P0-B. No route ID is invented in this contract. | BROWSER / RESPONSIVE | P0-B route owner and feature owners |
| P0D-10 | Each read and mutation has an allowed actor, scope, positive case, and denial case consistent with P0-C; client visibility is not authorization. | INTEGRATION / LIVE BACKEND | P0-C security owner and feature owners |
| P0D-11 | Representative Library and lesson content preserve Scripture translation/source identity and licensing; Scripture remains served by the existing V6 Reader/content owner. | CONTENT REVIEW / INTEGRATION | Content and Reader owners |
| P0D-12 | V7 changes preserve unaffected V6 data, tenant isolation, Reader, assignment, localization, PWA/offline, and release contracts. | AFFECTED EXISTING CHECKS | Feature owner and integration owner |
| P0D-13 | Release evidence is tied to one exact V7 candidate SHA and uses the repository’s existing release gates. | CI / BUILD / ARTIFACT; DEPLOYED at release | Serialized candidate owner |

“Later accountable owner” identifies who must produce implementation evidence; it does not assert that implementation is complete. Replace role labels with named owners in the integrated status/task record before implementation begins.

## 3. Content provenance and publication rules

Every Library item, curriculum item, and reviewable user-authored response must retain applicable fields from the P0-A data contract:

- stable item ID, content type, version/revision, locale, and owner/scope;
- title/author/creator and originating organization when known;
- source title and URL or catalog ID; source revision/date or checksum where versioned;
- rights holder, license or written permission basis, allowed uses, and required attribution;
- translation/adaptation relationship and translator/editor identity when known;
- review/publication state, reviewer, decision timestamp, and revision history;
- withdrawal/removal reason and affected derivative references where applicable.

Unknown or unverified rights mean the item remains unpublished and unavailable for reuse. Public web access alone is not proof of public-domain status or permission. Do not silently replace missing or disputed material with generated content.

Content-type rules:

- **Books:** show source and rights information. External links are acceptable. Host full text only where the recorded rights permit it.
- **Devotionals:** record author/source, attribution, language, license or permission, and review status. Topic tags describe discovery; they do not establish rights.
- **Past Teachings:** retain the source sermon/teaching identity and its authorized use. A derived article must be reviewed for faithful meaning, Scripture references, attribution, and publication rights before it is presented as an approved Library item.
- **ONE 2 ONE curriculum:** identify the curriculum author/reviewer and rights for lesson material. Keep Scripture source/translation identity separate from BibleQuest-authored explanation and questions.
- **Personal lesson responses:** retain author and visibility state. Prayer, reflection, and discussion text is private by default; any sharing must name the audience before submission and follow P0-C authority.

Use a representative, reviewed sample for acceptance of each content type. P0-D does not request or authorize a bulk import.

## 4. Localization readiness

V7 content records must identify their language/locale and preserve source-language attribution. UI text must use the existing localization mechanism rather than hard-coded English in the affected surface.

Acceptance checks confirm:

- the changed Library or ONE 2 ONE flow has complete keys for visible labels, actions, empty/error states, and relevant accessibility labels;
- when a translation is missing, the existing approved fallback is used and the source language remains clear;
- text expansion, Japanese strings where supplied, and representative narrow-phone layouts do not hide content or controls;
- Scripture language/translation selection remains with the V6 Reader contract.

This contract does not claim all UI/content is translated into Ilocano, create an Ilocano Bible corpus, or authorize machine translation of Scripture.

## 5. Evidence classes and status vocabulary

Use the smallest existing check that can establish the row:

| Class | Establishes | Does not establish by itself |
|---|---|---|
| STATIC | Contract, schema shape, content metadata, or deterministic local rule | Runtime reachability or server authorization |
| CONTENT REVIEW | Source, rights, attribution, accuracy, and reviewer decision for the named item/revision | Rights or accuracy for unreviewed items |
| INTEGRATION / DATABASE | Connected persistence and applicable role/scope behavior | Deployed identity or physical-device behavior |
| BROWSER / RESPONSIVE | Named route and interaction in the tested browser/viewport | Backend denial or physical-only behavior |
| CI / BUILD / ARTIFACT | Named existing gate and artifact for an exact SHA | Live deployment or authenticated success |
| LIVE BACKEND | Actual authorized/denied operation in the named environment, actor, and scope | UI reachability |
| DEPLOYED | Exact deployed artifact and named live smoke | Unvisited routes or unobserved device behavior |

- **PASS:** the declared evidence exists for the exact row, scope, and candidate.
- **OPEN:** required evidence has not been completed.
- **FAIL:** observed behavior violates the row.
- **UNVERIFIED:** available evidence cannot establish the claim; record what is missing.
- **OWNER-WAIVED:** an owner explicitly deferred the requirement; this is not PASS.

Evidence records identify candidate SHA, environment, actor/role and scope, route/action, tool or device, timestamp, result, and durable artifact reference. Remove personal data, private reflection text, tokens, and signed URLs from evidence. A screenshot or green check may not stand in for a different evidence class.

## 6. Contract reconciliation required before P0 closes

P0-D’s acceptance/provenance deliverable is usable when the following are resolved in serialized integration:

1. P0-A’s data taxonomy and provenance fields map to Sections 2–3, and its relationship/progress model includes the in-scope mentor/mentee pairing and pair-thread messages using V6 communication. No new messaging system is implied.
2. P0-B’s route and journey map includes Library and ONE 2 ONE pairing/lesson/pair-thread flows and maps routes from the current registry. New group chat, Conversation Deck, and realtime group routes are V8 scope.
3. P0-C’s role, relationship, privacy, and denial criteria match the narrowed V7 feature set. Existing V6 security remains authoritative outside changed V7 surfaces.
4. The integrated status names the accountable implementation owner for each shared route, data, authorization, and evidence surface.

Until this reconciliation occurs, this document is a P0-D proposal and Phase 0 remains open. Do not mark implementation, content, backend security, or release acceptance PASS from the presence of this document.

## 7. V8 transfer manifest

| Deferred objective | V7 treatment | V8 entry condition |
|---|---|---|
| Leader Conversation Deck, participant broadcast, and new realtime group chat/session engine | Excluded; pair-thread communication may reuse existing V6 capability | V8 scope, data ownership, and route/security contract approved |
| Central Google Drive media ingest/storage pipeline and full moderation/provider project | Excluded; use only an already-supported V6 path if an in-scope item needs one | Storage, authorization, lifecycle, and moderation contracts approved |
| Full Ilocano Bible and application UI rollout | Excluded; preserve locale-ready fields and existing localization support | Source rights, translation review, and rollout plan approved |
| Bulk devotional corpus ingestion and bulk Past Teachings/sermon conversion | Excluded; use reviewed representative samples for V7 acceptance | Rights/provenance audit and bounded import/review design approved |
| Large/expanded Books catalog and broad hosted-book program | Excluded; Books MVP uses metadata, browse/detail, legitimate external links, and rights-permitted hosted content | Catalog scope and per-title rights/hosting policy approved |
| Couples expansion and new Couples question bank | Excluded; preserve existing V6 behavior | Separate product scope approved |
| Advanced/personalized recommendations or deeper discovery beyond the Library MVP | Excluded; implement only the accepted V7 category/topic discovery, filters, and search | Product goal, data source, privacy, and measurable acceptance approved |
| Second whole-app visual/navigation redesign | Excluded; change only routes/surfaces required for Library and ONE 2 ONE | Full-product design scope approved |
| Unrelated games, ministry, media, or other V6 feature expansion | Preserve released V6; no V7 work implied | Separate V8 objective approved |

The transfer manifest records exclusions; it does not schedule or authorize V8 work.

## 8. P0-D exit condition

P0-D is ready for integration-owner review when the acceptance rows, content rules, evidence semantics, localization readiness, and V8 transfer items above are reconciled with the live P0-A/B/C drafts. Phase 0 closes only when the serialized integration owner accepts the combined contracts in `V7_ACTIVE_STATUS.md`. The pairing/data, exact route map, and backend/security implementation remain owned by their respective lanes.
