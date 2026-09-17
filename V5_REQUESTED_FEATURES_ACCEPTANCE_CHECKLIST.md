# BibleQuest V5 Requested Features Acceptance Checklist

Updated: 2026-09-17 JST
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

Candidate reconciliation 2026-09-17 (Pass 8): exact candidate `b301a617c17c21dc212b74a0210b9aa6fce57ed1` supports **108/122 accepted items (88.5%)**. See `docs/v5/V5_CERTIFICATION_RECONCILIATION_PASS8_2026-09-17.md`. This ratio is formal acceptance coverage, not implementation-progress percentage.

Controlled existing-project evidence update 2026-09-18: source candidate `7b2710fe097b6321fef68916938017bb88bc1c7c` adds accepted server-delivery and Gate C evidence, bringing the checklist to **111/122 accepted items (91.0%)**. See `docs/v5/V5_EXISTING_SUPABASE_CONTROLLED_EVIDENCE_2026-09-18.md`. The stricter A2 non-production Admin Auth gate and Push DEVICE/FIELD gates remain open.

Localization closeout 2026-09-18: runtime/source candidate `04034d8749695d272f532ecc3e848b7ebf600a46` closes the remaining Tagalog and Cebuano/Bisaya localization items, bringing formal acceptance to **117/122 accepted items (95.9%)**. Exact-head-equivalent verification PR #445 passed localization QA `35281386346`, collision `35281386338`, Section G `35281386331`, preview smoke `35281386515`, and accumulated regression `35281386502`; the PR was closed without merge and its branch reset to the source candidate. See `docs/v5/V5_LOCALIZATION_CLOSEOUT_2026-09-18.md`.

Admin isolated-local evidence 2026-09-18: source head `1fa91d30d85067abcaa17c3b2e06b514421a42aa` closes the formal email-change BACKEND-E2E gate with zero hosted-project cost, bringing formal acceptance to **118/122 accepted items (96.7%)**. Run `35283763923` / job `105411397336` PASS. See `docs/v5/V5_ADMIN_LOCAL_BACKEND_E2E_2026-09-18.md`.

Genuine push-provider invalidation evidence 2026-09-18: source head `618ce3cde7730925a3c3373a484e88987470d380` closes the remaining provider-response cleanup gate, bringing formal acceptance to **119/122 accepted items (97.5%)**. Run `35288009361` / job `105424531705` PASS against Mozilla Autopush. See `docs/v5/V5_PUSH_PROVIDER_INVALIDATION_E2E_2026-09-18.md`.

## A. Phase 1 — Leader Center

- [x] Overview: congregation snapshot, role, member count, active-in-30-min. **STATIC + BROWSER-AUTO: merged #399; final PR head `f82d8d2f103feebf6c3a17ecf1d88b884b3b45dc`; focused run `35051843361` SUCCESS. Member count reuses the existing ministry-authorized Assignments target directory; Presence remains the existing active-count owner.**
- [x] Assignments: published/scheduled/completed split. **STATIC + BROWSER-AUTO on exact candidate `b301a617`: server-owned lifecycle projection resolves the current active target-recipient denominator; `completed` requires a non-zero audience with every current recipient completed. Unknown aggregates fail closed and never use one member's progress.**
- [x] Response review reachable as a real destination, not only inline. **STATIC + BROWSER-AUTO: #399 delegates through existing `assignments.open(id)` + `assignments.loadReview(id)` before navigating to the current Assignments review destination; focused run `35051843361` SUCCESS.**
- [x] People view exposes ministry-relevant directory only and excludes private notes, Transform answers, Couples content, personality/psychometric answers. **STATIC + BROWSER-AUTO: #399 projects only existing ministry-safe `id`/`label`/`role` fields; domain and Chromium privacy assertions passed on run `35051843361`. Directory failure is unavailable, never fabricated as zero.**
- [x] Groups & Teams composes existing Journey Groups/Team Center owners; no new backend. **STATIC + BROWSER-AUTO: #399 reuses the existing Assignments target directory and existing Journey Groups/Team Center navigation owners; focused run `35051843361` SUCCESS.**
- [x] Ordinary member denied and authorized leader allowed on current candidate using real browser evidence. **BROWSER-AUTO: #392 exact head `8e6bf5246267595691ad37068faece27353811d0`, evidence-pack run `35035310862` SUCCESS; #399 reran and preserved this role boundary on its exact merge candidate.**

**Phase 1 is 6/6 formally accepted at Pass 8.**

## B. Phase 2 — Admin Console completion

- [x] User card UI: identity, congregation, security sections. **STATIC exact-current-head certification: #389.**
- [x] Safe/Restricted/Destructive action tiers exist for every accepted emergency action. **STATIC exact-current-head certification: #389.**
- [x] Typed confirmation for destructive actions. **STATIC exact-current-head certification: #389.**
- [x] Email-change/recovery action owner-only, audited, session-safe, no sensitive value logged. **STATIC security chain + session-revocation certification: #358/#365/#371/#389.**
- [x] Non-owner/self/invalid-target cases fail correctly. **STATIC exact-current-head security certification: #389.**
- [x] Email change proven against a controlled real Supabase Auth account and target email restored/cleaned up. **BACKEND-E2E PASS: isolated loopback Supabase CLI run `35283763923`, job `105411397336`, executed the real Auth/function/session-revocation path with generated owner/admin/target identities, restored the target email, deleted disposable users, and stopped the stack. See `docs/v5/V5_ADMIN_LOCAL_BACKEND_E2E_2026-09-18.md`.**
- [x] Existing Gate A field-test path is runnable against the completed UI. **Controlled non-production readiness path verified fail-closed on #389; this does not claim the real field run.**

Evidence note: #338 ensures `delete_account` cannot write a false `{accountDeleted:true}` terminal audit until Supabase Auth deletion succeeds. #358/#365/#371 add fail-closed session-revocation semantics, controlled email-change E2E readiness, and integrated security-chain verification. #389 executes the existing UI/security/readiness contracts together on one exact current head. On 2026-09-18 the deployed path was also exercised successfully with disposable QA identities in the existing project and fully restored/cleaned. Formal acceptance was subsequently closed by the isolated-local Supabase BACKEND-E2E recorded in `docs/v5/V5_ADMIN_LOCAL_BACKEND_E2E_2026-09-18.md`.

## C. Phase 3 — artwork/dead-owner completion

- [x] Games matchable emoji/HUD/card-face items replaced only with genuine matching existing assets. **STATIC exact-head revalidation: #427 hard-zero workflow run `35115458073` reran `tests/v5-games-artwork-certification.mjs` successfully before accepting zero undocumented glyphs.**
- [x] Recognition remaining genuine matches wired; unmatched codes documented rather than forced. **STATIC exact-head revalidation: #427 run `35115458073` reran the focused Recognition mapping/exception contract successfully.**
- [x] Couples, Notification Center, Encouragements remaining genuine matches wired. **STATIC exact-head revalidation: #427 run `35115458073` reran all three focused contracts successfully; documented exceptions retain independent text meaning.**
- [x] Dead duplicate `src/app/media-library.js` and `src/features/media-library/index.js` retired while the live `media` route continues to resolve to the accepted Recordings/Media owner.
- [x] Architecture validator/docs updated atomically with dead-owner retirement where still applicable. **The duplicate Media owner remains retired, canonical Media/Recordings routing remains protected, and #427 collision guard run `35115458236` plus Section G run `35115458103` passed on the same candidate.**
- [x] Whole-app glyph/emoji scan leaves only documented exceptions. **#427 removed the final unused Mission glyph fields and promoted the collector to a hard-zero assertion. Exact-head run `35115458073` reported 128 occurrences, 128 documented, 0 undocumented.**
- [x] Accessibility labels remain meaningful independent of decorative images. **Focused Games, Recognition, Couples, Notification, Encouragement, Bible World, Story Journey, Avatar Vault, semantic-UI, Scripture-reference, leaderboard, and Mission contracts were green on #427; Mission artwork remains `aria-hidden` while title/copy/action text carries meaning.**

## D. Phase 4 — minimum real Web Push

- [x] Push subscription capture through client `PushManager` or current-browser equivalent. **STATIC/current-browser lifecycle: #339.**
- [x] Subscription persistence is account/device-safe with owner-only access/RLS. **STATIC: merged #348 persistence adapter + #349 lifecycle wiring over the existing RLS-backed `bible_push_subscriptions` owner.**
- [x] Explicit category opt-in/out defaults to off. **STATIC: #339.**
- [x] Sign-out/account switch cannot leak or reuse another account's subscription context. **STATIC executable lifecycle: #339.**
- [x] In-app Notification Center remains source of truth; no replacement notification engine was introduced by the browser lifecycle tranche.
- [x] Server-side delivery exists for accepted current notification types and is accepted on the final candidate. **STATIC + live backend path + exact-SHA CI: candidate `7b2710fe` has the server-authoritative sender, encrypted Vault VAPID fallback, idempotency ledger, bounded recipient/category selection, and no client secret exposure. Controlled existing-project execution proved the no-subscription no-op and signed sender path; exact-SHA push security/source-contract/type-check/secret-scan workflows all passed. Automatic assignment-triggered production fanout remains deliberately undeployed pending DEVICE/FIELD evidence.**
- [x] Same-origin notification click/deep-link behavior works. **STATIC service-worker contract: #339.**
- [x] Invalid/unsubscribed endpoints are cleaned up safely on appropriate real push-service responses. **BACKEND-E2E PASS: exact source head `618ce3cde7730925a3c3373a484e88987470d380`, run `35288009361`, job `105424531705`. The real candidate sender posted a signed/encrypted request to Mozilla Autopush using a randomized nonexistent provider endpoint; the genuine terminal provider response removed exactly the matching assignment subscription while an unrelated calendar control subscription remained. See `docs/v5/V5_PUSH_PROVIDER_INVALIDATION_E2E_2026-09-18.md`.**
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
- [x] A controlled second test congregation exists or equivalent safe test topology is established. **BACKEND fixture: 2026-09-18 QA-only second congregation with two QA identities; real congregation memberships were not repurposed.**
- [x] Cross-congregation isolation Gate C actually executes without leakage. **BACKEND-E2E: 2026-09-18 existing-project QA run passed 14/14 bidirectional RLS assertions covering congregation visibility, member directory, assignments, and calendar; transient rows/membership changes were cleaned/restored. See `docs/v5/V5_EXISTING_SUPABASE_CONTROLLED_EVIDENCE_2026-09-18.md`.**

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
- [x] Cebuano dictionary is implemented through the same localization helper and canonical key inventory as English/Tagalog. **STATIC: exact-candidate localization completeness and Cebuano contracts.**
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
- [x] Community/Media and remaining member-facing surfaces fully localized. **STATIC + BROWSER-AUTO: final Tagalog closeout on source candidate `04034d87`; Community and Videos/Recordings 390px proofs are included in localization run `35281386346`, alongside shell, Transformation, Calendar, Assignments, Notification Center, Account/settings, weekly journey, Home/Today, and final mobile-width companions.**
- [x] Leader/admin user-visible instructions, errors, empty/loading states localized where part of V5 scope. **STATIC + BROWSER-AUTO: shared Leader Center EN/TL/CEB dictionary and localized Admin auth/status shell are green on `b301a617`.**
- [x] Proper nouns/Bible translation names may remain unchanged where appropriate.
- [x] Representative mobile/browser checks show translated text does not cause clipping/overflow or inaccessible controls on the currently migrated surfaces. **BROWSER-AUTO.**
- [x] Completeness scan has no unexplained English leaks across every agreed final Tagalog surface. **STATIC: `tests/v5-localization-final-completeness.mjs` requires explicit 444-key Tagalog ownership, placeholder parity, and permits byte-equal English only for a reviewed set of product/proper/technical terms; run `35281386346` SUCCESS.**
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

- [x] Transformation flow supports Scripture/context -> understand -> reflect -> apply -> pray. **STATIC + BROWSER-AUTO: existing Transform persistence owner; no leader-visible response or spiritual score.**
- [x] Optional spouse/family discussion and weekly action use existing Journey/Assignment patterns. **STATIC + BROWSER-AUTO on exact candidate.**
- [x] Pastor/leader weekly message anchors existing weekly content without a new content engine. **STATIC: existing assignment owner and route only.**
- [x] My Journey/reflection history presents existing private signals only; no competitive spiritual leaderboard. **STATIC + BROWSER-AUTO: #392 exact head `8e6bf5246267595691ad37068faece27353811d0`; existing-owner/private/noncompetitive contracts plus EN/TL/empty/390px proof; run `35035310862` SUCCESS.**
- [x] Family & Couples tracks cover agreed topics using existing owners/patterns. **STATIC + BROWSER-AUTO: bounded authored tracks reuse the Couples owner.**
- [x] Personal milestones are encouraging/non-competitive and derive from current progress where possible. **STATIC + BROWSER-AUTO: no score, rank, or spiritual-worth projection.**
- [x] Ask at Dinner attaches one short prompt to relevant weekly content. **STATIC + BROWSER-AUTO: merged #431 adds exactly one explicitly optional EN/TL prompt to the existing connected weekly journey without changing its six-owner route sequence or adding persistence, scoring, backend, schema, or a content engine. Exact PR head `a7663599c2b5b9d71ee3c86d63e27f3315fd7812`; connected-journey run `35157691298`, accumulated regression `35157691285`, collision guard `35157691271`, Section G `35157691320`, Home/browser companions, and hard-zero glyph run `35157691273` all SUCCESS; merged as `f79301a6880af2a60e5431f3725768f8bf84d98b`.**

## O. P2 — full Cebuano/Bisaya localization

- [x] Same localization keys/mechanism used as English/Tagalog. **STATIC: canonical 444-key EN/TL/CEB inventory on exact candidate.**
- [x] Member-facing UI fully localized in Cebuano/Bisaya for agreed V5 surfaces. **STATIC + BROWSER-AUTO: all former canonical UI fallbacks closed except intentional `BibleQuest` product-name inheritance; representative shell, Community, Account, Calendar, Videos, and weekly journey UI passed at 390px on run `35281386346`.**
- [x] BibleQuest-authored member content fully localized in Cebuano/Bisaya. **STATIC: canonical authored Home/Transformation/Assignments/Notification/Account/Calendar member copy, Videos copy, shell recovery copy, and connected weekly journey / Ask at Dinner content are explicit in Cebuano under the current V5 localization owners; Scripture remains approved-source CEBOCB and is excluded.**
- [x] Representative mobile/browser checks show no clipping/overflow or inaccessible controls. **BROWSER-AUTO: `tests/v5-cebuano-member-browser.mjs` covers 390 × 844 shell, Community, Account, Calendar, Videos, and weekly journey with overflow, page-error, and touch-target assertions; run `35281386346` SUCCESS.**
- [x] Completeness scan has no unexplained English/Tagalog leaks on agreed Cebuano surfaces. **STATIC + BROWSER-AUTO: final completeness gate requires explicit Cebuano ownership for every canonical key except the reviewed BibleQuest product name, complete explicit Videos copy, stable placeholders, and canonical-English leak rejection in the representative browser matrix; run `35281386346` SUCCESS.**
- [x] CEBOCB or another approved Cebuano Scripture source remains Scripture; BibleQuest does not generate its own Cebuano Bible translation. **STATIC: maintained Reader/source contract; localization inventory excludes Scripture translation keys.**

## P. P2 — discovery and Media organization

- [x] Lightweight filter/search operates only over data already exposed/loaded by current owners unless a separately-approved minimal current-architecture query is needed. **STATIC + BROWSER-AUTO: merged #432 filters only the canonical Recordings owner's already-loaded rows; search reads existing `title`/`description` and featured-only filtering reads existing `featured`. Exact PR head `d53022bc7b9ef9aff7e5f54580449fdf463f76f6`; focused Recordings run `35158463303` and accumulated regression `35158463291` SUCCESS; merged as `3e4306aad8f8d29a9fb265df1b901a9f15ab1f36`.**
- [x] No generalized index/ranking/search platform is introduced. **STATIC: #432 remains a local presentation filter over the current Recordings state and adds no API/query, index, ranking field, external discovery, data owner, or search service.**
- [x] Media organization uses available metadata first. **STATIC + BROWSER-AUTO: #432 uses only existing `title`, `description`, and `featured` values, while preserving canonical Recordings service/query/player ownership. Focused run `35158463303` SUCCESS.**
- [x] Any new category field/metadata extension is proven necessary, isolated, and RLS-tested if persisted. **NOT APPLICABLE / STATIC FIREWALL: #432 introduced no category field, metadata extension, schema change, persistence, or Supabase mutation; therefore no new persisted field required RLS evidence.**
- [x] Categories include Sunday services, Bible studies, worship, testimonies, couples/family, kids, and other only when supported by persisted real metadata. **STATIC: exact-candidate metadata contract rejects title/description guessing; category migration/index is isolated.**

## Q. Data-model discipline

- [x] For every new table/column proposal, existing Transformation/Assignment/Journey/Calendar/Media/settings/progress owners were checked first. **Exact candidate reuses existing owners; only bounded Media category metadata is added.**
- [x] New durable schema is minimal and separately claimed/reviewed. **One constrained `category` column and index; no generalized content/search engine.**
- [x] Existing RLS/security conventions are preserved. **Category remains inside the existing RLS-enabled Media owner; lifecycle aggregation stays server-authorized.**
- [x] No integrated V5 schema change becomes a generalized V6 content/repository/tenant engine at this reconciliation.

## R. Phase 8 — certification and promotion

- [ ] All required sections above pass on one exact candidate SHA or have evidence explicitly bound to that candidate/environment.
- [x] Full accumulated regression green on exact candidate `b301a617c17c21dc212b74a0210b9aa6fce57ed1`. **GitHub run `35207329259` SUCCESS; all 29 candidate workflows green.**
- [x] Required browser/backend/device evidence is recorded honestly; skipped/pending is not PASS. **Exact-SHA staging run `35207329163` passed deployed routes/state/PWA-offline/recovery. Gate C BACKEND-E2E is now recorded PASS from the 2026-09-18 QA-only isolation run; the stricter A2 non-production Admin Auth gate and Push DEVICE/FIELD gates remain explicitly open.**
- [x] V4 remains rollback until V5 is explicitly accepted.
- [x] A5 freezes/reports the candidate but scheduled agents do not autonomously promote to `main`/production.
- [x] `V5_ACTIVE_STATUS.md` is updated to the exact current candidate state before V6 runtime work begins.

## S. V5/V6/V7 firewall

- [x] No integrated V5 implementation at this reconciliation introduces a Vite/build migration, global router/state rewrite, broad TypeScript conversion, Reader/Games engine rewrite, generalized offline/background-sync platform, replacement notification engine, generalized repository/data-access layer, tenant engine, replacement media platform, generalized search/index engine, or broad V7 visual/navigation overhaul.
- [x] If an accepted behavior cannot be safely completed without such replacement architecture, V5 records the bounded limitation and defers the replacement mechanism to V6 rather than silently expanding scope.
