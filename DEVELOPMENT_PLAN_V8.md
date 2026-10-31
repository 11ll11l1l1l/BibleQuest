# BibleQuest V8 development plan

Updated: 2026-10-31 JST
Status: **ACTIVE — Library/group, media and spiritual-practice implementations in review; integrated release OPEN**
Current release and handoff authority: [V7_ACTIVE_STATUS.md](V7_ACTIVE_STATUS.md)

## Purpose

This file preserves the future scope originally deferred from V7. The owner authorized accelerated V8 development on 2026-10-28 after the V7 cleanup. Reuse released V7.1 contracts; implement only verified gaps. Production promotion still requires exact-candidate gates.

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

### Spiritual practices and guided formation — owner-added V8 scope
See [source mapping, timer contract, guides and acceptance](docs/v8/V8_SPIRITUAL_PRACTICES_SILENCIO_20261031.md), based on the two owner-supplied Spiritual Disciplines/Silencio PDFs.
- Add a shared guided/silent practice player, with exact 120-minute Silencio and clearly labeled shorter adaptations.
- Connect Library/Home practice discovery, Bible passage meditation, private reflections, You routines/history and existing reminders/offline support.
- Include morning surrender, daytime 30-second presence pause, evening examination and practical rest/service/simplicity/digital-fast guides.
- Keep private confession/reflections out of group broadcasts, analytics and ALAM inputs. Formation is grace-centered; no holiness score or competitive silence.
- Scope is accepted; implementation, affected verification and release remain OPEN. Preserve coding-first execution while deferring full QA/release certification honestly.

### Couples expansion

- Expanded Couples question bank.
- Deeper relationship/conversation prompts.
- Scripture-reference audit for expanded content.
- Structured Couples content integration with the broader Library/content system.

## Execution phases

Released runtime baseline: `main` at `87cb9dd4c3b60b9679e0acecda519300194b6d55`. Cleanup PR #1554 is a prerequisite; its runner repair head is `7440cbb1df2fa54b25e898c66fe76a57ccbc79d9`. V8 begins on a stacked isolated branch until cleanup integrates. Never replace production with a stale V7 development branch.

| Phase | Bounded outcome | Current state / gate |
|---|---|---|
| P0 — Inheritance and scope | Retain Library/ONE 2 ONE/Auth/tenancy/PWA and V7.1 session engine; identify actual missing capabilities | Refreshed for first P1 slice; media/provider and Ilocano licensing contracts still require task-specific validation |
| P1 — Group/content integration | Public Library reading → related canonical discussion series; retain explicit host-send and joined-session authority | First implementation in review; browser/authenticated CI still required. Private lesson responses and arbitrary reading prose are excluded from broadcasts |
| P2 — Media and moderation | Central Drive ingest, metadata ownership, pending-review lifecycle, moderation and provider/quota recovery | Bounded Files/upload/moderation/Drive recovery implementation in draft PR #1556. Provider credentials/restricted folder/quota configuration, real backend/Drive/browser validation and integrated deployment remain OPEN; migration is unapplied |
| P3 — Ilocano | Source/license-valid full Bible through existing provider, then full UI | Bible source/rights/coverage and provider/offline compatibility first; existing English fallback is not full Ilocano |
| P4 — Content expansion | Bounded devotional/teaching/book/Couples batches using existing provenance, review and reference checks | Do not reimport the 300 existing devotionals or bypass rights/translation review; use verified missing-ID queues |
| P4a — Spiritual practices | Shared timer/player, Silencio, Scripture meditation and daily routines; then additional practice guides using existing owners | Timer/content/player/reflections plus Library/Home/You discovery and selected-verse Reader meditation implemented on PR #1557; short/custom durations, daily-life guides and optional wake lock; full V7 suite (759/759) and build PASS. Owner authorized push/review PR; browser/device/offline certification OPEN. See [implementation handoff](work/tasks/20261031-v8-spiritual-practices.md) and linked source mapping for remaining scope |
| P5 — Integrated release | Existing exact-SHA, backend/tenant/privacy, responsive/localization, PWA/offline/performance and deployment verification | OPEN; no source/unit-only release claim |

For the current single bounded P1 task, one executor owns Library presentation, canonical series preference, route wiring and its tests; no concurrent shared-file writers. [Task handoff](work/tasks/20261028-v8-library-group-handoff.md).

When broader independent execution is enabled, use at least four disjoint lanes where the work supports it: A group/content UX, B media/provider and moderation, C Ilocano/source/localization, D integration/security/release. Assign exact baseline, owned files, exclusions and existing checks before parallel writes. One integration owner serializes shared schema/router/workflow/status changes. These are work boundaries, not claims that four workers are running or that external provider access exists.

## First P1 acceptance

- Only validated published, rights-verified devotional/teaching records with explicit supported topic links offer a related series. Books and unsupported topics do not invent a match.
- Handoff URL contains a canonical series ID only, never source prose, reading IDs or private learner answers. Topic matching is deterministic, not a new personalized recommendation engine.
- Host starts with that local preview preference; existing canonical shared-session state wins on join/reload. Opening, previewing or changing series does not broadcast.
- EN/TL/CEB labels, explicit source-language fallback, existing role/account/tenant denial, keyboard/phone controls, and licensed Scripture Reader remain intact.
- Existing authenticated built-app journey covers Library → session creation → selected preview → explicit send → actual participant delivery. Report local and CI evidence separately.

## Guardrail

A useful V8 extension point may be left in V7 only when it is the simplest clean contract needed by V7 itself. Do not implement a V8 backend, realtime engine, storage pipeline, bulk importer or localization rollout early merely to make V7 appear future-proof.


## Current remaining work and accelerated execution order — 2026-10-31

1. Finish the remaining practice coding gaps: reviewed localization, existing-reminder integration, managed offline packaging and optional transition cues. Short/custom durations, additional daily-life guides and wake lock are now coded; do not rebuild them.
2. Reconcile cleanup #1554, Library/group #1555, media #1556 and practices #1557 onto one current candidate. These PRs are still open; individual source trees are not proof of a combined build or deployment. Preserve distinct media/runtime changes and serialize shared-file conflicts.
3. Complete central-media configuration and actual provider/backend validation against the setup contract in #1556. The code exists, but no production migration, Drive setup or real upload/moderation PASS is implied.
4. Complete source/license-valid full Ilocano Bible, provider/offline compatibility and UI rollout. Do not represent existing fallback as full Ilocano support.
5. Complete verified missing devotional/teaching/book/Couples expansion and personalized discovery/ALAM gaps through existing rights, review and privacy boundaries. Do not duplicate the 300 existing devotionals or feed private confessions into recommendations.
6. Run the existing pinned-toolchain, exact-candidate integration/browser/auth/tenant/privacy/offline/performance/deployment checks once coding converges; diagnose any failed gate and promote only the certified candidate. Current local browser installation is blocked by truncated download; physical-device evidence remains separate.

This is sequencing for faster execution, not silent removal of accepted V8 scope or certification. No complete-V8 percentage or release date is claimed without a reconciled acceptance inventory.
