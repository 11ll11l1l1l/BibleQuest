# BibleQuest V5 Requested Features Acceptance Checklist

Updated: 2026-09-13 JST
Scope: feature completion on the current architecture
Authority: `V5_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V5.md`
Protocol: `V5_COORDINATED_AGENT_PROTOCOL.md`

Evidence labels used below:

- **STATIC** — source/contract/unit evidence.
- **BROWSER-AUTO** — automated browser behavior on an exact SHA.
- **BACKEND-E2E** — controlled real backend execution.
- **DEVICE/FIELD** — actual device/network/account/congregation behavior.

Static evidence never substitutes for a required real backend/device gate.

## A. Phase 1 — Leader Center

- [ ] Overview: congregation snapshot, role, member count, active-in-30-min.
- [ ] Assignments: published/scheduled/completed split.
- [ ] Response review reachable as a real destination, not only inline.
- [ ] People view exposes ministry-relevant directory only and excludes private notes, Transform answers, Couples content, personality/psychometric answers.
- [ ] Groups & Teams composes existing Journey Groups/Team Center owners; no new backend.
- [ ] Ordinary member denied and authorized leader allowed on current candidate using real browser evidence. **BROWSER-AUTO or stronger required.**

## B. Phase 2 — Admin Console completion

- [ ] User card UI: identity, congregation, security sections.
- [ ] Safe/Restricted/Destructive action tiers exist for every accepted emergency action.
- [ ] Typed confirmation for destructive actions.
- [ ] Email-change/recovery action owner-only, audited, session-safe, no sensitive value logged.
- [ ] Non-owner/self/invalid-target cases fail correctly.
- [ ] Email change proven against a controlled real Supabase Auth account and target email restored/cleaned up. **BACKEND-E2E required.**
- [ ] Existing Gate A field-test path is runnable against the completed UI.

## C. Phase 3 — artwork/dead-owner completion

- [ ] Games matchable emoji/HUD/card-face items replaced only with genuine matching existing assets.
- [ ] Recognition remaining genuine matches wired; unmatched codes documented rather than forced.
- [ ] Couples, Notification Center, Encouragements remaining genuine matches wired.
- [ ] Dead duplicate `src/app/media-library.js` and `src/features/media-library/index.js` retired while the live `media` route continues to resolve to the accepted Recordings/Media owner.
- [ ] Architecture validator/docs updated atomically with dead-owner retirement where still applicable.
- [ ] Whole-app glyph/emoji scan leaves only documented exceptions.
- [ ] Accessibility labels remain meaningful independent of decorative images.

## D. Phase 4 — minimum real Web Push

- [ ] Push subscription capture through client `PushManager` or current-browser equivalent.
- [ ] Subscription persistence is account/device-safe with owner-only access/RLS.
- [ ] Explicit category opt-in/out defaults to off.
- [ ] Sign-out/account switch cannot leak or reuse another account's subscription context.
- [ ] In-app Notification Center remains source of truth.
- [ ] Server-side delivery exists for accepted current notification types.
- [ ] Same-origin notification click/deep-link behavior works.
- [ ] Invalid/unsubscribed endpoints are cleaned up safely on appropriate push-service responses.
- [ ] No private VAPID/service secret is shipped to the client.
- [ ] App closed + push enabled receives and opens a real notification. **DEVICE/FIELD required.**
- [ ] Push disabled preserves pre-push behavior. **DEVICE/FIELD required for final acceptance.**

## E. Phase 5 — baseline offline Scripture

- [ ] Previously-opened/currently-cached Scripture availability is detected correctly.
- [ ] Reader shows a clear available/unavailable offline state.
- [ ] Previously-opened passage can be reopened with the network actually disabled. **DEVICE/FIELD or equivalent real browser no-network evidence required.**
- [ ] Never-opened/unavailable content fails clearly rather than blank/broken.
- [ ] No generalized cache-everything/offline mutation queue/book-package engine is introduced.

## F. Phase 6 — multi-congregation

- [ ] Active-congregation selection is account-safe and rejects non-member IDs.
- [ ] Visible switcher exists for users with multiple memberships.
- [ ] Calendar respects active congregation.
- [ ] Presence respects active congregation.
- [ ] Assignments respect active congregation.
- [ ] A controlled second test congregation exists or equivalent safe test topology is established.
- [ ] Cross-congregation isolation Gate C actually executes without leakage. **BACKEND-E2E/DEVICE-FIELD required.**

## G. Phase 7 — verification debt

- [ ] CEBOCB 66-book/current Reader contract remains intact on current candidate.
- [ ] CEBOCB representative mobile Reader behavior has current exact-head browser proof. **BROWSER-AUTO required.**
- [ ] Couples Journey intended spouse-to-spouse sharing is genuinely bidirectional and private to the correct relationship/account scope. **BROWSER-AUTO plus backend evidence where applicable.**
- [ ] Deferred V4 Section E integration sweep completed with evidence.
- [ ] Deferred Section G loading/empty/error/offline sweep completed with evidence.

## H. Cross-phase P0 — localization foundation

This section must pass before broad Tagalog/Cebuano screen migration is considered complete.

- [ ] One small current-architecture localization helper exists with stable string keys and deterministic lookup.
- [ ] Canonical English dictionary/source exists.
- [ ] Tagalog dictionary uses the same key inventory.
- [ ] Cebuano dictionary is designed to use the same key inventory rather than a second ad-hoc mechanism.
- [ ] Missing key falls back safely to English and is test-detectable.
- [ ] Locale preference uses an existing safe settings/state pattern; no new global state engine.
- [ ] No third-party i18n framework/build migration/router rewrite is introduced for V5.
- [ ] A completeness scan/test can report missing locale keys and obvious hard-coded user-visible strings in migrated surfaces.
- [ ] A small glossary defines recurring ministry/product terms to keep Tagalog/Cebuano consistent.

## I. P0 — Tagalog coverage

- [ ] Shared shell/navigation/common controls localized.
- [ ] Transformation UI and BibleQuest-authored Transformation content localized naturally.
- [ ] Home/Today localized.
- [ ] Calendar localized.
- [ ] Assignments and Notification Center localized.
- [ ] Settings/profile localized.
- [ ] Community/Media and remaining member-facing surfaces localized.
- [ ] Leader/admin user-visible instructions, errors, empty/loading states localized where part of V5 scope.
- [ ] Proper nouns/Bible translation names may remain unchanged where appropriate.
- [ ] Representative mobile/browser checks show translated text does not cause clipping/overflow or inaccessible controls. **BROWSER-AUTO required.**
- [ ] Completeness scan has no unexplained English leaks on agreed Tagalog surfaces.
- [ ] Scripture text always comes from approved/licensed Bible translations and is never app-generated/machine-translated.

## J. P0 — real Calendar

- [ ] Month grid is the primary calendar-format presentation.
- [ ] Existing useful agenda/details remain available where appropriate.
- [ ] Events use consistent category colors.
- [ ] Color is not the sole category cue; visible text/icon cue exists.
- [ ] Mobile day selection/detail flow is usable.
- [ ] Existing personal/congregation/assignment event behavior is preserved.
- [ ] Active-congregation filtering is respected once Phase 6 context is available.
- [ ] No new calendar backend/engine is introduced.

## K. P0 — latest completed service in Media/Recordings

- [ ] Stable recording/video identity is the deduplication key.
- [ ] When the current BibleQuest/recordings flow already exposes a completed stable recording, it is surfaced as the latest service without duplicate insertion.
- [ ] Authorized user can hide/edit/correct an incorrectly surfaced item.
- [ ] If completion cannot be known from current data, V5 uses a minimal leader confirmation/import step rather than pretending external automation exists.
- [ ] No YouTube Data API polling, webhook ingestion, scheduled external discovery, new ingestion daemon/service, or replacement media platform is introduced in V5.
- [ ] Existing Recordings/Media owner remains authoritative.

## L. P0 — Today / This Week Home

- [ ] Home composes existing owners for next event, current assignment, continue reading, latest service, Transformation prompt, and unread notifications.
- [ ] Missing source data produces intentional empty state rather than broken placeholders.
- [ ] No new state engine or duplicate data owner is created.
- [ ] Representative mobile/browser composition works. **BROWSER-AUTO required.**

## M. P0 — connected weekly spiritual journey

- [ ] Existing service/sermon can connect to Scripture context.
- [ ] Existing Transformation/reflection can connect to the week's service/Scripture.
- [ ] Optional discussion/prayer and assignment/action can be reached through current owners.
- [ ] Calendar context can be linked without a new workflow engine.
- [ ] A user can follow the intended weekly chain without duplicate authoritative records.

## N. P1 — content depth

- [ ] Transformation flow supports Scripture/context -> understand -> reflect -> apply -> pray.
- [ ] Optional spouse/family discussion and weekly action use existing Journey/Assignment patterns.
- [ ] Pastor/leader weekly message anchors existing weekly content without a new content engine.
- [ ] My Journey/reflection history presents existing private signals only; no competitive spiritual leaderboard.
- [ ] Family & Couples tracks cover agreed topics using existing owners/patterns.
- [ ] Personal milestones are encouraging/non-competitive and derive from current progress where possible.
- [ ] Ask at Dinner attaches one short prompt to relevant weekly content.

## O. P2 — full Cebuano/Bisaya localization

- [ ] Same localization keys/mechanism used as English/Tagalog.
- [ ] Member-facing UI fully localized in Cebuano/Bisaya for agreed V5 surfaces.
- [ ] BibleQuest-authored member content fully localized in Cebuano/Bisaya.
- [ ] Representative mobile/browser checks show no clipping/overflow or inaccessible controls. **BROWSER-AUTO required.**
- [ ] Completeness scan has no unexplained English/Tagalog leaks on agreed Cebuano surfaces.
- [ ] CEBOCB or another approved Cebuano Scripture source remains Scripture; BibleQuest does not generate its own Cebuano Bible translation.

## P. P2 — discovery and Media organization

- [ ] Lightweight filter/search operates only over data already exposed/loaded by current owners unless a separately-approved minimal current-architecture query is needed.
- [ ] No generalized index/ranking/search platform is introduced.
- [ ] Media organization uses available metadata first.
- [ ] Any new category field/metadata extension is proven necessary, isolated, and RLS-tested if persisted.
- [ ] Categories may include latest service, Sunday services, Bible studies, worship, testimonies, couples/family, kids when supported by real metadata.

## Q. Data-model discipline

- [ ] For every new table/column proposal, existing Transformation/Assignment/Journey/Calendar/Media/settings/progress owners were checked first.
- [ ] New durable schema is minimal and separately claimed/reviewed.
- [ ] Existing RLS/security conventions are preserved.
- [ ] No V5 schema change becomes a generalized V6 content/repository/tenant engine.

## R. Phase 8 — certification and promotion

- [ ] All required sections above pass on one exact candidate SHA or have evidence explicitly bound to that candidate/environment.
- [ ] Full accumulated regression green on the exact candidate SHA.
- [ ] Required browser/backend/device evidence is recorded honestly; skipped/pending is not PASS.
- [ ] V4 remains rollback until V5 is explicitly accepted.
- [ ] A5 freezes/reports the candidate but scheduled agents do not autonomously promote to `main`/production.
- [ ] `V5_ACTIVE_STATUS.md` is updated to the exact final state before V6 runtime work begins.

## S. V5/V6/V7 firewall

- [ ] No V5 implementation introduces a Vite/build migration, global router/state rewrite, broad TypeScript conversion, Reader/Games engine rewrite, generalized offline/background-sync platform, replacement notification engine, generalized repository/data-access layer, tenant engine, replacement media platform, generalized search/index engine, or broad V7 visual/navigation overhaul.
- [ ] If an accepted behavior cannot be safely completed without such replacement architecture, V5 records the bounded limitation and defers the replacement mechanism to V6 rather than silently expanding scope.
