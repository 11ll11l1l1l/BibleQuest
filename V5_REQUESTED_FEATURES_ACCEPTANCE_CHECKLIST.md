# BibleQuest V5 Requested Features Acceptance Checklist

Updated: 2026-09-16 JST
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

Documentation reconciliation 2026-09-16 (Pass 4): merged evidence supports **76/122 accepted items (62.3%)**. See `docs/v5/V5_CERTIFICATION_RECONCILIATION_2026-09-16.md`, `docs/v5/V5_CERTIFICATION_RECONCILIATION_PASS2_2026-09-16.md`, `docs/v5/V5_CERTIFICATION_RECONCILIATION_PASS3_2026-09-16.md`, and `docs/v5/V5_CERTIFICATION_RECONCILIATION_PASS4_2026-09-16.md`. This ratio is formal acceptance coverage, not implementation-progress percentage.

## A. Phase 1 — Leader Center

- [ ] Overview: congregation snapshot, role, member count, active-in-30-min.
- [ ] Assignments: published/scheduled/completed split.
- [ ] Response review reachable as a real destination, not only inline.
- [ ] People view exposes ministry-relevant directory only and excludes private notes, Transform answers, Couples content, personality/psychometric answers.
- [ ] Groups & Teams composes existing Journey Groups/Team Center owners; no new backend.
- [x] Ordinary member denied and authorized leader allowed on current candidate using real browser evidence. **BROWSER-AUTO: #392 exact head `8e6bf5246267595691ad37068faece27353811d0`, evidence-pack run `35035310862` SUCCESS.**

## B. Phase 2 — Admin Console completion

- [x] User card UI: identity, congregation, security sections. **STATIC exact-current-head certification: #389.**
- [x] Safe/Restricted/Destructive action tiers exist for every accepted emergency action. **STATIC exact-current-head certification: #389.**
- [x] Typed confirmation for destructive actions. **STATIC exact-current-head certification: #389.**
- [x] Email-change/recovery action owner-only, audited, session-safe, no sensitive value logged. **STATIC security chain + session-revocation certification: #358/#365/#371/#389.**
- [x] Non-owner/self/invalid-target cases fail correctly. **STATIC exact-current-head security certification: #389.**
- [ ] Email change proven against a controlled real Supabase Auth account and target email restored/cleaned up. **BACKEND-E2E required.**
- [x] Existing Gate A field-test path is runnable against the completed UI. **Controlled non-production readiness path verified fail-closed on #389; this does not claim the real field run.**

Evidence note: #338 ensures `delete_account` cannot write a false `{accountDeleted:true}` terminal audit until Supabase Auth deletion succeeds. #358/#365/#371 add fail-closed session-revocation semantics, controlled email-change E2E readiness, and integrated security-chain verification. #389 executes the existing UI/security/readiness contracts together on one exact current head. The real owner email-change BACKEND-E2E requirement remains open.

## C. Phase 3 — artwork/dead-owner completion

- [ ] Games matchable emoji/HUD/card-face items replaced only with genuine matching existing assets.
- [ ] Recognition remaining genuine matches wired; unmatched codes documented rather than forced.
- [ ] Couples, Notification Center, Encouragements remaining genuine matches wired.
- [x] Dead duplicate `src/app/media-library.js` and `src/features/media-library/index.js` retired while the live `media` route continues to resolve to the accepted Recordings/Media owner.
- [ ] Architecture validator/docs updated atomically with dead-owner retirement where still applicable.
- [ ] Whole-app glyph/emoji scan leaves only documented exceptions.
- [ ] Accessibility labels remain meaningful independent of decorative images.

## D. Phase 4 — minimum real Web Push

- [x] Push subscription capture through client `PushManager` or current-browser equivalent. **STATIC/current-browser lifecycle: #339.**
- [x] Subscription persistence is account/device-safe with owner-only access/RLS. **STATIC: merged #348 persistence adapter + #349 lifecycle wiring over the existing RLS-backed `bible_push_subscriptions` owner.**
- [x] Explicit category opt-in/out defaults to off. **STATIC: #339.**
- [x] Sign-out/account switch cannot leak or reuse another account's subscription context. **STATIC executable lifecycle: #339.**
- [x] In-app Notification Center remains source of truth; no replacement notification engine was introduced by the browser lifecycle tranche.
- [ ] Server-side delivery exists for accepted current notification types and is accepted on the final candidate.
- [x] Same-origin notification click/deep-link behavior works. **STATIC service-worker contract: #339.**
- [ ] Invalid/unsubscribed endpoints are cleaned up safely on appropriate real push-service responses.
- [x] No private VAPID/service secret is shipped to the client. **Exact-head focused CI: #339.**
- [ ] App closed + push enabled receives and opens a real notification. **DEVICE/FIELD required.**
- [ ] Push disabled preserves pre-push behavior. **DEVICE/FIELD required for final acceptance.**

## E. Phase 5 — baseline offline Scripture

- [x] Previously-opened/currently-cached Scripture availability is detected correctly. **STATIC + integrated Reader contract.**
- [x] Reader shows a clear available/unavailable offline state. **Integrated Reader UI.**
- [x] Previously-opened passage can be reopened with the network actually disabled. **BROWSER-AUTO equivalent real no-network evidence: PR #323; Playwright `context.setOffline(true)`; workflow SUCCESS.**
- [x] Never-opened/unavailable content fails clearly rather than blank/broken. **Same real-browser no-network proof + companion contracts.**
- [x] No generalized cache-everything/offline mutation queue/book-package engine is introduced.

**Phase 5 acceptance is satisfied.** The checklist permits DEVICE/FIELD **or equivalent real browser no-network evidence**. Compare from merged proof commit `8b74b6520ea42a542ba8294f275244b0165e4fd6` to the reconciliation line shows these Reader/offline owners and proof files remained protected by accumulated regression/collision checks.

## F. Phase 6 — multi-congregation

- [x] Active-congregation selection is account-safe and rejects non-member IDs. **Maintained V5 active-congregation contract remains green in the collision guard.**
- [x] Visible switcher exists for users with multiple memberships and has current-candidate acceptance evidence. **STATIC + BROWSER-AUTO: #392 exact-head visible switching/single-membership/fail-closed/390px proof; run `35035310862` SUCCESS.**
- [x] Calendar respects active congregation with dedicated/current-candidate acceptance evidence. **STATIC + BROWSER-AUTO: #392 proves Calendar consumes the active congregation owner rather than `memberships[0]`, with Calendar browser proof on the same exact head.**
- [x] Presence respects active congregation. **Focused exact-head Phase 6 Presence verification: #340.**
- [x] Assignments respect active congregation. **Maintained exact-head Assignments active-congregation contract.**
- [ ] A controlled second test congregation exists or equivalent safe test topology is established.
- [ ] Cross-congregation isolation Gate C actually executes without leakage. **BACKEND-E2E/DEVICE-FIELD required.**

## G. Phase 7 — verification debt

- [x] CEBOCB 66-book/current Reader contract remains intact on current candidate. **STATIC: merged #347 exact-head CEBOCB/source/current Reader re-verification; run `34911926437` SUCCESS.**
- [x] CEBOCB representative mobile Reader behavior has current exact-head browser proof. **BROWSER-AUTO: #347, run `34911926437` includes 390px CEBOCB Reader proof.**
- [x] Couples Journey intended spouse-to-spouse sharing is genuinely bidirectional and private to the correct relationship/account scope. **STATIC + BROWSER-AUTO: merged #383, exact head `63d1995b209d70a50210df355d600fbfc2fb1124`, run `35021093121` SUCCESS including 390px bidirectional/privacy proof.**
- [x] Deferred V4 Section E integration sweep completed with evidence. **STATIC + BROWSER-AUTO: repaired exact head `53fdc20835fb54541278764f0aa9eac3142ada75`; Section E run `35034652466`, collision run `35034652255`, Section G run `35034652337` all SUCCESS; merged #390 as `1fce2b1d03ac6e91c4ef81e5620d5a8c0d272a06`.**
- [x] Deferred Section G loading/empty/error/offline sweep completed with evidence. **STATIC + BROWSER-AUTO: current-line run `35029103272` SUCCESS; preceding exact Home integration run `35028738463` explicitly executed the Playwright loading/empty/error/offline matrix.**

**Phase 7 verification debt is formally satisfied.**

## H. Cross-phase P0 — localization foundation

This section must pass before broad Tagalog/Cebuano screen migration is considered complete.

- [x] One small current-architecture localization helper exists with stable string keys and deterministic lookup.
- [x] Canonical English dictionary/source exists.
- [x] Tagalog dictionary uses the same key inventory on migrated surfaces.
- [ ] Cebuano dictionary is designed/implemented to use the same key inventory rather than a second ad-hoc mechanism.
- [x] Missing key falls back safely to English and is test-detectable.
- [x] Locale preference uses an existing safe settings/state pattern; no new global state engine.
- [x] No third-party i18n framework/build migration/router rewrite is introduced for V5.
- [x] A completeness scan/test can report missing locale keys and obvious hard-coded user-visible strings in migrated surfaces.
- [x] A small glossary defines recurring ministry/product terms to keep Tagalog/Cebuano consistent.

## I. P0 — Tagalog coverage

- [x] Shared shell/navigation/common controls localized.
- [x] Transformation UI and BibleQuest-authored Transformation content localized naturally on the integrated scoped surface.
- [x] Home/Today localized on the integrated scoped surface.
- [x] Calendar localized.
- [x] Assignments and Notification Center localized.
- [x] Settings/profile localized on the integrated Account/settings surface.
- [ ] Community/Media and remaining member-facing surfaces fully localized. Community EN/TL is integrated in #372 and 390px browser proof passed in #380; Videos/Recordings is integrated; remaining agreed member surfaces still need completion.
- [ ] Leader/admin user-visible instructions, errors, empty/loading states localized where part of V5 scope.
- [x] Proper nouns/Bible translation names may remain unchanged where appropriate.
- [x] Representative mobile/browser checks show translated text does not cause clipping/overflow or inaccessible controls on the currently migrated surfaces. **BROWSER-AUTO.**
- [ ] Completeness scan has no unexplained English leaks across every agreed final Tagalog surface.
- [x] Scripture text always comes from approved/licensed Bible translations and is never app-generated/machine-translated.

## J. P0 — real Calendar

- [x] Month grid is the primary calendar-format presentation.
- [x] Existing useful agenda/details remain available where appropriate.
- [x] Events use consistent category presentation.
- [x] Color is not the sole category cue; visible text/icon cue exists.
- [x] Mobile day selection/detail flow is covered by current Calendar browser evidence.
- [x] Existing personal/congregation/assignment event behavior is preserved by maintained contracts.
- [x] Active-congregation filtering has dedicated/current-candidate Phase 6 acceptance evidence. **STATIC + BROWSER-AUTO: #392 exact head `8e6bf5246267595691ad37068faece27353811d0`, run `35035310862` SUCCESS.**
- [x] No new calendar backend/engine is introduced.

## K. P0 — latest completed service in Media/Recordings

- [x] Stable recording/video identity is the deduplication key for latest-service surfacing. **STATIC: merged #353; stable YouTube ID dedupe contract.**
- [x] When the current BibleQuest/recordings flow already exposes a completed stable recording, it is surfaced as the latest service without duplicate insertion. **STATIC: merged #353, exact head `229a5ebeef67bc74f1dd923027ab58fc5ca699db`, run `34927753652` SUCCESS.**
- [x] Authorized user can hide/edit/correct an incorrectly surfaced item. **STATIC + BROWSER-AUTO: merged #396; exact head `1ebaa759f503255f065ece0f2ebd5e66dffca6db`; focused run `35040064030` SUCCESS. UI delegates only to existing `setFeatured`/`archive`; server RLS remains authoritative.**
- [x] If completion cannot be known from current data, V5 uses a minimal leader confirmation/import step rather than pretending external automation exists. **STATIC: #353 uses the existing leader-curated `featured` signal and returns no latest service for unconfirmed rows rather than inferring completion by date.**
- [x] No YouTube Data API polling, webhook ingestion, scheduled external discovery, new ingestion daemon/service, or replacement media platform is introduced in the integrated Videos/Recordings localization tranche.
- [x] Existing Recordings/Media owner remains authoritative.

**Section K is formally satisfied at Pass 4.**

## L. P0 — Today / This Week Home

- [x] Home composes existing owners for next event, current assignment, continue reading, latest service, Transformation prompt, and unread notifications. **STATIC: merged #385; exact head `fa8d443917b135d4029f7a96c5f281e3dc4d8ee8`; runs `35028738458` and `35028738560` SUCCESS.**
- [x] Missing source data produces intentional empty state rather than broken placeholders. **STATIC + BROWSER-AUTO: merged #394; exact head `87b21bc566e128d9cb1916102bfc8ebbc99f2d44`; focused run `35039155709` SUCCESS with EN/TL empty and populated owner states.**
- [x] No new state engine or duplicate data owner is created. **STATIC: #385 acceptance contract requires Calendar/Reader/Recordings/Transform/Notification/Assignments/Daily Journey owners and rejects localStorage/sessionStorage/direct Supabase bypasses.**
- [x] Representative mobile/browser composition works. **BROWSER-AUTO: #394 focused run `35039155709` SUCCESS at 390px; Home Tagalog `35039155616`, collision `35039155644`, Section G `35039155587` also SUCCESS.**

**Section L is formally satisfied at Pass 4.**

## M. P0 — connected weekly spiritual journey

- [x] Existing service/sermon can connect to Scripture context. **STATIC + BROWSER-AUTO: merged #395 exact head `e0e83bf0f3637c4e9f0c23617ebee9177408bd81`, focused run `35039686763` SUCCESS.**
- [x] Existing Transformation/reflection can connect to the week's service/Scripture. **Same #395 existing-owner route sequence and 390px EN/TL browser proof.**
- [x] Optional discussion/prayer and assignment/action can be reached through current owners. **#395 routes through existing Journey Groups and Assignments owners; no new backend.**
- [x] Calendar context can be linked without a new workflow engine. **#395 existing `#/calendar` route; static firewall rejects new storage/API/workflow persistence.**
- [x] A user can follow the intended weekly chain without duplicate authoritative records. **#395 proves `Recordings -> Reader -> Transformation -> Journey Groups -> Assignments -> Calendar` navigation only; collision run `35039686747` and Section G `35039686745` SUCCESS.**

**Section M is formally satisfied at Pass 4.**

## N. P1 — content depth

- [ ] Transformation flow supports Scripture/context -> understand -> reflect -> apply -> pray.
- [ ] Optional spouse/family discussion and weekly action use existing Journey/Assignment patterns.
- [ ] Pastor/leader weekly message anchors existing weekly content without a new content engine.
- [x] My Journey/reflection history presents existing private signals only; no competitive spiritual leaderboard. **STATIC + BROWSER-AUTO: #392 exact head `8e6bf5246267595691ad37068faece27353811d0`; existing-owner/private/noncompetitive contracts plus EN/TL/empty/390px proof; run `35035310862` SUCCESS.**
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
- [x] No integrated V5 schema change becomes a generalized V6 content/repository/tenant engine at this reconciliation.

## R. Phase 8 — certification and promotion

- [ ] All required sections above pass on one exact candidate SHA or have evidence explicitly bound to that candidate/environment.
- [ ] Full accumulated regression green on the exact candidate SHA.
- [ ] Required browser/backend/device evidence is recorded honestly; skipped/pending is not PASS.
- [x] V4 remains rollback until V5 is explicitly accepted.
- [x] A5 freezes/reports the candidate but scheduled agents do not autonomously promote to `main`/production.
- [ ] `V5_ACTIVE_STATUS.md` is updated to the exact final state before V6 runtime work begins.

## S. V5/V6/V7 firewall

- [x] No integrated V5 implementation at this reconciliation introduces a Vite/build migration, global router/state rewrite, broad TypeScript conversion, Reader/Games engine rewrite, generalized offline/background-sync platform, replacement notification engine, generalized repository/data-access layer, tenant engine, replacement media platform, generalized search/index engine, or broad V7 visual/navigation overhaul.
- [x] If an accepted behavior cannot be safely completed without such replacement architecture, V5 records the bounded limitation and defers the replacement mechanism to V6 rather than silently expanding scope.