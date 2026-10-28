# BibleQuest V8 Deferred Scope

Updated: 2026-10-27 JST
Status: **CONTRACT REFRESH NEXT — cleanup before implementation**
Current release and handoff authority: [V7_ACTIVE_STATUS.md](V7_ACTIVE_STATUS.md)

## Purpose

This file preserves the future scope originally deferred from V7. The owner requested V7 cleanup before V8 work. Reconcile the provisional phases with released V7.1 before selecting implementation tasks; this cleanup does not expand product scope.

## Inherited from released V7.1

[PR #1550](https://github.com/11ll11l1l1l/BibleQuest/pull/1550) already delivered Conversation Deck selection/preview/explicit send, participant Scripture handoff, congregation-scoped realtime sessions, late join/reconnect and EN/TL/CEB presentation. Treat the group/realtime list below as an original planning record to reconcile, not proof those features remain unimplemented. New Library/discipleship integration or richer structured discussion requires a bounded gap assessment. Full Ilocano Bible/UI and central media/moderation remain future scope.

## V8 product theme

**Group ministry + media + multilingual/content expansion.**

V8 should build on the released V7 Library and discipleship foundations rather than creating parallel content or relationship systems.

## Deferred feature families

### Group ministry and realtime

- Leader Conversation Deck.
- Leader-preselected cards and structured discussion flows.
- Swipe left/right navigation and swipe-up broadcast interaction.
- Participant prompt/Scripture-only presentation.
- Realtime session state, reconnect behavior and authorization.
- Small-group integration with V7 Library/discipleship content.

### Central media and moderation

- Central BibleQuest Google Drive media ingest/storage path.
- Supabase metadata/ownership/audit authority for media.
- Pending Review by default.
- Leader/Pastor/Admin moderation: Approve, Reject, Request Changes and Remove After Publish.
- Media lifecycle, provider status, quota/error handling and broader upload/file-management UX.
- Re-evaluate prior `docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` planning against the chosen V8 central-media architecture before implementation; it is not an active V7 requirement.

### Ilocano rollout

- Priority 1: full Ilocano Bible integration using the existing Bible/content provider architecture.
- Priority 2: full Ilocano application UI/localization rollout.
- Preserve translation licensing/source/provenance requirements.

### Content expansion

- Large devotional corpus ingestion and preprocessing.
- Bulk Past Teachings/sermon-to-article conversion.
- Expanded Books catalog and hosted content where licensing permits.
- Advanced/personalized content recommendation and deeper discovery.

### Couples expansion

- Expanded Couples question bank.
- Deeper relationship/conversation prompts.
- Scripture-reference audit for expanded content.
- Structured Couples content integration with the broader Library/content system.

## Provisional phase shape

V8 phases remain provisional. V7.1 is released; P0 must reconcile inherited contracts and identify remaining gaps.

- **V8-P0 — Contract refresh:** confirm V7 inheritance, realtime/media/security/content boundaries.
- **V8-P1 — Group/realtime gaps:** reuse the shipped V7.1 engine and shells; implement only verified remaining group/Library/discipleship integration gaps.
- **V8-P2 — Media/moderation foundation:** central media pipeline, metadata, moderation and operational controls.
- **V8-P3 — Ilocano rollout:** Bible first, then UI.
- **V8-P4 — Content expansion:** devotionals, teachings, books and Couples using bounded ingestion lanes.
- **V8-P5 — Integrated hardening/release:** exact-SHA certification under the canonical rulebook.

When V8 activates, replace this provisional shape with a task-owned phase plan using exact starting SHA, explicit lane ownership, at least four genuinely independent parallel lanes where the work supports it, and serialized integration.

## Guardrail

A useful V8 extension point may be left in V7 only when it is the simplest clean contract needed by V7 itself. Do not implement a V8 backend, realtime engine, storage pipeline, bulk importer or localization rollout early merely to make V7 appear future-proof.
