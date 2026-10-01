# BibleQuest V6 Requested Features & Architecture Acceptance Checklist

Updated: 2026-10-01 JST
Authority: `V6_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V6.md`

This checklist is the release-blocking inventory for V6 unless `V6_ACTIVE_STATUS.md` explicitly marks an item non-applicable or owner-waived. A waiver is not a PASS.

Evidence checkpoint: integrated V6 head `b343b308ab1b3abf17203fdef2084303f97eef23`. Checked items below are limited to behavior directly supported by merged source plus executable CI evidence; signed-out Chromium, local Supabase CI and physical/device evidence are not treated as interchangeable. Core V6 reconciliation includes merged PR #538 with V6 Phase 1 Build Gate `35961956126` SUCCESS. Phase-2 reconciliation includes merged PR #541 with V6 Database CI `35975269052` SUCCESS and V6 Phase 1 Build Gate `35975269120` SUCCESS. Shared typed-account-resume parity repair PR #546 passed V6 Phase 1 `35975512403` and inherited regression `35975512420` before merge.

Certification reconciliation from integrated head `316c9fadd50d30854c0c545914a7d5749eff9f8c`: production parity is proven by merged PR #510 (Phase 1 `35823184257`, Database CI `35823184256`, inherited regression `35823184264`) and current ancestry; push cleanup/rate-control/server-category evidence is integrated through PR #541 Database CI `35975269052` and subsequent green S2 integrations; account/tenant isolation is integrated through PRs #550/#557 with Phase 1 + inherited regression green; privacy-safe telemetry is merged through PR #568 with Database CI `36062843154`, regression `36062843068`, and Phase 1 `36062843220`; Games engine/characterization/adapters/presentation are merged through PR #572 with Phase 1 `36063707076` and regression `36063706908`. The dedicated integrated-acceptance certification test on this checklist reconciliation must also pass before merge. Physical-device, authenticated role-browser, unmerged Reader/Assignments, and Cloudflare exact-artifact requirements remain unchecked.

Second certification reconciliation from integrated head `0e00188c3144a137ca48dd927faa954bfc7a361a`: previously integrated Database CI covers Presence, Journey Group/team/Live Room and media/notification tenant boundaries; inherited Leader Center contracts plus a focused stale-tenant unit regression prove the composition fails closed after an active-congregation change; per-book Recall uses demand-loaded pack fetches; Scripture source/license/attribution metadata remains in the Bible data owner; and the release checklist itself is regression-guarded so WAIVED is never counted as PASS.

Third certification reconciliation from integrated head `f4f98f861005f1b9b0039473a8b6fe6a1bf591b5`: merged Reader live-progress boundary PR #727 passed Client Artifact Security `36199644834`, Phase-1 `36199644766`, and inherited regression `36199644696`; merged speedtrack batch #737 passed Phase-1 `36205547820`, Database CI `36205547874`, and inherited regression `36205547836`, including deterministic startup/critical-route budgets; merged speedtrack batch #759 passed Database CI `36206770253`, Client Artifact Security `36206770277`, Phase-1 `36206770345`, and inherited regression `36206770324`, preserving the deterministic offline conflict policy and executable real Auth session-revocation proof. Only the directly evidenced items below are promoted by this reconciliation.


Fourth certification reconciliation from integrated head `ed255200495eeb58e55fb955f0fc1f43868ede7e`: merged batch #770 passed Client Artifact Security `36210385282`, Phase-1 `36210385339`, and inherited regression `36210385312`; merged canonical batch #783 passed Client Artifact Security `36219169398`, Phase-1 `36219169342`, and inherited regression `36219169485`, preserving the shared Games pass-and-play engine cutover, standalone CSP inline-block growth guard, Reader audio-provenance fail-closed hardening, and Context Lab async accessibility/resilience.

Fifth certification reconciliation from integrated head `2b779928582aa73d961db6b39de16319152a74cd`: batch #804 passed Client Artifact Security `36275042207`, Phase-1 `36275042156`, and inherited regression `36275042176`; batch #810 passed Client Artifact Security `36297539457`, Phase-1 `36297539463`, inherited regression `36297539465`, and Cloudflare preview. Directly evidenced promotions from these merged batches are limited to the Leader Center upcoming agenda and preservation of Japanese furigana/vocabulary learning aids. CI version-neutralization, Verse Peek completion, exact deployed-artifact identity, authenticated role-browser coverage, and physical-device acceptance remain open.
Sixth certification reconciliation from integrated head `dfff5bcf4fe73642cfb24393f03b6705adeb37df`: PR #811 corrected the Phase-1 exact-head checkout/build-identity path and landed the fail-closed deployed-artifact verifier, with Phase-1 `36298560863` and inherited regression `36298560896` SUCCESS. PR #812 replaced version-specific inherited CI execution ownership with reusable static/browser composite seams while preserving the accumulated V3/V4/V5 coverage; Phase-1 `36299094338` and inherited regression `36299094354` SUCCESS. The Cloudflare exact-deployed-artifact item remains OPEN because the current Git-integrated Pages project still needs to build/publish `dist-v6` before deployed-byte verification can pass.

Seventh reconciliation at integrated head `5a80ae75778da2d4aff8329b6911b8876a08584d`: merged Reader PRs #815/#816 provide independently testable Search and Verse Peek presentations and route Scripture/Search/Context Lab reads through `ScriptureContentProvider`; the three corresponding Reader decomposition items are now PASS. Mobile/accessibility Reader acceptance from PR #817 and subsequent offline package/audio/security work remain in the local speedtrack candidate, outside this official checkpoint. Therefore this integrated checklist is 131/210 PASS; the local branch `codex/v6-offline-reader` has unintegrated commits and separate candidate evidence in `V6_ACTIVE_STATUS.md`.

Eighth reconciliation at integrated head `b68b0b75` after merged PR #818: its exact source head `7dc3c077` passed Client Artifact Security `36501288796`, Phase-1 build/Chromium/PWA `36501288723`, disposable Supabase replay/pgTAP/lint/types `36501288726`, and inherited static/browser regression `36501288841`. The built Reader accessibility/mobile probe covers 320/360/390/412/430 px. The built offline probe installs all 66 BSB books, cancels/resumes a partial install across browser restarts, reopens and navigates offline, searches installed text without external requests, and removes packages. Unit and CacheStorage adapter regressions cover corrupt package recovery. Ten directly evidenced items below are promoted; installed PWA on physical devices, live external audio, authenticated full-role matrix, and deployed artifact identity remain OPEN. The actual checklist row count before this update was 135 checked/76 open (211 total), despite the older prose saying 131/210. It is now 145/211 PASS with 66 open; the historical discrepancy needs an inventory audit before release.

Ninth reconciliation at integrated head `eed8ab7c3f6853f4d46f067c4ba75290165d8753`: PR #822 merged active-congregation enforcement for Videos after exact-head Client Artifact Security `36514080673`, Phase-1 build/Chromium/PWA `36514080579`, and inherited regression `36514080593` all passed. PR #823 merged avatar-vault tenant-write pgTAP coverage after Database CI `36518308814` and inherited regression `36518308821` passed. PR #824 hardened congregation provisioning with IANA timezone validation and compensating cleanup after invite-creation failure; its exact head `b04d6865` passed Phase-1 build/browser `36518587955`, Database CI `36518587987`, and inherited regression `36518588025`. The previously merged #818/#821 evidence also directly proves independently testable chapter/verse presentation, bounded multi-instance media ownership, account-scoped resume, canonical Recordings ownership, ministry announcement→durable notification production, congregation member/settings management, and assignment-response tenant isolation. Nine directly evidenced rows are promoted in this reconciliation. Physical-device, live OpenBible/provider behavior, full authenticated role-browser coverage, deployed Cloudflare byte identity, CSP enforcement, and final RC gates remain OPEN. Checklist count is now 154 checked / 57 open (211 total).

Tenth acceptance reconciliation at integrated head `19e6e88c10767fdb06fd5a87a18f89e22b291aba`: PR #838 merged Team Center active-congregation scoping from exact PR head `02e45ab785f75dc58223c9ef3a9b6dc2e0e58841`; V6 Client Artifact Security `36664115225`, V6 Phase 1 Build Gate `36664115260`, and inherited regression `36664115301` all completed successfully. PR #839 then merged Journey Groups and Encouragements active-congregation scoping from exact PR head `6bc69f477826f559e2a0bf5c8154a34d1c0bb29d`; Phase-1 `36665434001`, Database CI `36665434038`, Client Artifact Security `36665434025`, and inherited regression `36665434074` all passed. These bounded tenant tranches do not by themselves promote the global cross-congregation rows. Separately, the already-integrated shared V6 UI primitives in `src/v6/ui/keyboard.ts` and `src/v6/ui/focus-return.ts`, exported through `src/v6/ui/index.ts`, are directly covered by `tests/v6/ui-keyboard-focus.test.ts` inside the exact-head Phase-1 unit suite. The suite exercises Enter/Space activation, horizontal/vertical/RTL roving focus, disabled-item skipping, Home/End and wrapping behavior, one-shot focus return, and fail-closed handling for disconnected/hidden/inert/aria-hidden/throwing targets. This promotes only the Phase-11 focus/keyboard componentization row. Inventory is now **159 checked / 52 open (211 total, 75.4%)**.

Eleventh acceptance reconciliation at integrated head `b343b308ab1b3abf17203fdef2084303f97eef23`: PR #842 integrated the bounded built-output evidence record proving that exact PR head `6bc69f477826f559e2a0bf5c8154a34d1c0bb29d` was built before whole-app/protected-route Chromium acceptance in Phase-1 run `36665434001`, including built-artifact parity, authenticated Assignments deep-link hydration, the built Leader Center four-role matrix, built PWA acceptance, and Reader mobile/accessibility acceptance. PR #843 then integrated `tests/v6/pwa-content-version-upgrade.test.ts` from exact head `1e3f6bc09317c01fa6d9b81ae92fcb33258065f2`; Phase-1 `36700158062` and inherited regression `36700157859` passed. The test executes the real service-worker activate handler, proves stale BibleQuest shell-cache cleanup without touching unrelated caches, controlled same-origin refresh behavior, and atomic content-package replacement only after exact version/checksum verification while preserving the prior package on corrupt replacement. These two merged evidence tranches promote only `Whole-app/protected-route/browser gates run against built output` and `App/service-worker/content-pack versions can upgrade safely`. Physical installed-device evidence and deployed Cloudflare exact-SHA identity remain open. Inventory is now **161 checked / 50 open (211 total, 76.3%)**.

Twelfth acceptance reconciliation at integrated head `bb0e2251a74049e5309b4fb9ae0d1706de2a9507`: PR #912 merged from exact head `5e1b99f674648e83ab6141ee810deec6ee055194`; Phase-1 `36765035212`, inherited regression `36765035206`, and Client Artifact Security `36765035213` passed. Its built Reader/browser and package-policy evidence promotes only the explicit user-initiated/removable/permission-gated offline-download row and the bounded selective-audio-download/no-silent-full-cache row. PR #934 then merged at `bb0e2251a74049e5309b4fb9ae0d1706de2a9507` from exact head `18a6306d790f6d6219c104ee0221c82c17a8a6e3`; Phase-1 `36790797552` and inherited regression `36790797547` passed. The exact-head Phase-1 run built `dist-v6`, passed both report-only and enforcing Chromium CSP gates across the V6 app and covered standalone surfaces, and the deployable root `_headers` contains the same reviewed enforcing policy. This promotes only `CSP is compatible with media/push/build architecture and enforced as accepted.` Exact Cloudflare deployed-byte identity remains a separate OPEN release gate because Pages currently returns HTML at V6 artifact-metadata paths. Inventory is now **179 checked / 32 open (211 total, 84.8%)**.

Thirteenth acceptance reconciliation at integrated head `5dc32d4b7660bd42040cac28b90cbb5bff9b14a9`: PR #939 merged from exact head `1640496e3a708e823d7c9725cf22276260aa3ae4`; V6 Phase-1 Build Gate `36792168865` and inherited regression `36792168887` passed. The systemic architecture gate inventories protected Admin, Assignments, Congregation, Content Review, Journey Groups, Leader Center, Live Rooms, Ministry Announcements, Team Center and Recordings presentation modules, rejects direct Supabase/RPC/Edge transports from those presentation modules, verifies delegation to domain owners, and ties their role/tenant re-checks to existing executable server-authority/RLS evidence. This promotes only `Feature modules do not make UI visibility the authority for protected actions.` Inventory is now **180 checked / 31 open (211 total, 85.3%)**.

## A. Phase 0 — V6 authority and baseline

- [x] `V6_ACTIVE_STATUS.md` accepted as current authority.
- [x] `DEVELOPMENT_PLAN_V6.md` accepted and bound to released V5.
- [x] V6 integration branch recreated from released V5 production `f6a0cff0e63ddf676b77b8470d84678958fe9d70`.
- [x] Obsolete pre-V5 V6 history preserved at `archive/v6-pre-v5-experiment-20260913` (`8a5c09b7...`).
- [x] ADR index/template exists.
- [x] ADR-0001 build/client architecture accepted.
- [x] ADR-0002 reproducible database-CI strategy accepted without requiring paid infrastructure.
- [x] Inherited static/governance baseline green on Phase-0 candidate.
- [x] Inherited/built browser baseline re-run on Chromium-capable CI: 45 canonical direct deep links + not-found, representative 320/360/390/412/430px routes, service-worker registration, and built PWA shell acceptance are green.
- [x] Current production parity baseline `7420bbba789ce21e02ac667f98558681e71d2a28` is merged forward into `v6/architecture-upgrade` with inherited regression/browser evidence green on the exact reconciliation head. PR #515 has already merged this baseline into the parity-candidate branch used by PR #510.

## B. Build/toolchain

- [x] `package.json` + lockfile exist and `npm ci` is green in the exact-head Phase-1 gate.
- [x] Supported Node version is pinned/documented (`22.23.2`).
- [x] Vite produces deterministic built artifacts with embedded exact-SHA identity.
- [x] TypeScript is enabled for new architecture contracts; incremental legacy-JS compatibility is documented by the accepted build/client architecture.
- [x] Typecheck/lint/unit/build commands run in CI.
- [x] Built route/deep-link behavior is proven across all 45 canonical hashes plus unknown-route handling in Chromium.
- [x] Source maps are generated/handled safely: hidden maps are generated without embedded source text, moved outside `dist-v6`, and public-map/reference absence is CI-enforced.
- [x] Route/domain code splitting is active: 44 feature-page modules load lazily and built Chromium waits for chunk completion.
- [x] CSS/assets/images are owned by build pipeline.
- [x] Bundle/chunk/image budgets are CI-visible; the browser entry is capped at 700 KiB and at least 40 feature dynamic chunks are required.
- [ ] Cloudflare exact-SHA deployment identity works from built artifacts.

## C. Real Supabase/Postgres CI

- [x] Reproducible local-only Supabase project configuration exists.
- [x] CI starts a real disposable local Supabase/Postgres environment without hosted project credentials.
- [x] Clean disposable database reset applies the supported released-V5 reconstruction plus current V6 forward migrations from zero.
- [x] Upgrade-path database test represents the supported released-V5→current-V6 path. Direct V4→V6 is no longer the supported V6 baseline because V6 starts from released V5.
- [x] Schema/type drift check exists: Database CI generates local TypeScript database types twice, compares them byte-for-byte, and verifies the reviewed SHA-256 digest against the exact disposable V5→V6 replay.
- [x] Generated TypeScript database types are produced deterministically twice in local CI and compared byte-for-byte.
- [x] Two populated congregations exist in deterministic fixtures.
- [x] Fixtures include ordinary members, ministry roles and a platform-privileged identity.
- [x] RLS allow/deny tests execute against the real disposable database as database callers.
- [x] Anonymous/public privilege exposure is explicitly tested for covered sensitive objects.
- [ ] Cross-congregation denial is tested for every sensitive migrated domain.
- [x] `SECURITY DEFINER` / `SECURITY INVOKER` behavior is actually executed: pgTAP/RLS suites invoke covered privileged helpers under realistic authenticated/service-role caller contexts while asserting execute grants, pinned search paths, cross-account denial, and fail-closed behavior.
- [x] Function/table grants and denials are executable CI assertions for the covered tenant/security surface.
- [x] Privileged function `search_path`/least-privilege requirements are tested for the covered helper functions.
- [x] Static SQL checks remain fast guards and are supplemented by executable pgTAP/RLS/privilege tests.

## D. Core V6 client architecture

- [x] Typed app-shell/router access and deep-link contracts are established for V6 boundaries.
- [x] Typed session/auth owner established: `src/v6/kernel/session-context.ts` is the typed identity/membership owner, integrated with the legacy session/account-resume boundary; session ownership and account-switch failure behavior are covered by the merged V6 unit suite.
- [x] Explicit active-congregation context is established separately from authenticated identity.
- [x] Central typed repository/data-access boundary is established for V6 domain migration.
- [x] Standard async/error/offline/unauthorized state contract established: `async-state.ts`, `errors.ts`, and `view-state.ts` define the shared typed failure/view-state semantics with executable unit coverage for offline, unauthorized, forbidden, retryable remote and generic failures.
- [x] Feature modules do not make UI visibility the authority for protected actions.
- [x] Route-level lazy loading/cancellation and stale-request invalidation primitives are standardized.
- [x] Compatibility feature command/event boundary and fail-closed migration seam exist.
- [x] At least one low-risk feature proves the new architecture end to end before Reader/Games rewrite: Accessibility preferences mutate through the V6 command seam and built Chromium proves runtime application plus V5-compatible persistence after reload.

## E. Reader decomposition

- [x] Current Reader translation/content behavior has characterization tests before migration.
- [x] Reader navigation/translation state has a DOM-independent typed parity seam.
- [x] Scripture repository/content provider separated from route/view.
- [x] Chapter/verse presentation split into testable components.
- [x] Search is independently testable.
- [x] Verse Peek is independently testable.
- [x] Context Lab bridge is independently testable.
- [x] Japanese furigana support preserved.
- [x] Japanese vocabulary support preserved.
- [x] Copyright/licensed-link redistribution policy is explicit and tested in the V6 content-manifest boundary.
- [x] Read/progress writes use new domain/data boundary.
- [x] Canonical chapter-read identity remains translation-independent so the same Bible chapter cannot duplicate XP/progression across translations.
- [x] Reader/Main Quest chapter completion preserves one trusted Reading leaderboard identity per chapter and server-authoritative scoring; local XP never becomes leaderboard authority.
- [x] Reader route passes parity + accessibility + mobile tests.

Local candidate note (2026-09-28; code SHA `56f151b9f486be8cea4dda984dccbceccb5f70ce`, exact build artifact SHA-256 `9ae5ea54f6e0d45f8db324cccf260cd807d35ec06b07c98d03d0003d8cf5527d`): the live Reader now delegates validated chapter/verse markup to `renderReaderChapterPresentation` in `src/v6/reader/presentation.ts`. The pure presenter escapes Scripture and labels and covers grouped verses, highlighted verses, and mark-read state. The full V6 unit suite passes 612 tests; lint, format, typecheck, and exact-SHA build evidence pass. This code is on the local speedtrack branch and is not added to the official `5a80ae...` acceptance count until integration. Reader browser/mobile parity remains open because local Chromium is unavailable.

## F. True offline Bible

- [x] Versioned Scripture content-manifest format exists with package identity/license metadata.
- [x] Offline package lifecycle manager supports deliberate declared book-package installation through injected transport/repository boundaries.
- [x] At least one supported full translation can be made truly offline where licensing/size permits.
- [x] Download progress/cancel/retry/remove controls exist.
- [x] Storage usage/reclaim controls exist.
- [x] Package byte-length/checksum/version validation exists and fails closed before persistence.
- [x] Corrupt/outdated package recovery is tested.
- [x] Previously downloaded Bible text opens with network disabled.
- [x] Offline chapter navigation works after app restart.
- [x] Supported local search works offline or is clearly scoped if deferred.
- [x] Live/licensed redistribution policy explicitly rejects unsupported packaged substitution.
- [x] App/service-worker/content-pack versions can upgrade safely.
- [ ] Physical installed-PWA offline acceptance passes.

Local candidate evidence (2026-09-28, runtime code SHA `ada62e2d787107df32f7dd5e6495a9eae6cbc926`; not promoted to the official count): Reader exposes full approved-translation download/progress/cancel/resume/remove. At exact SHA `ebcad81a...`, Chromium acceptance cancelled a real partial BSB download, confirmed already completed packages remained, closed and reopened the persistent browser profile, verified the partial inventory remained, resumed to all 66 books, closed and reopened again, verified all packages remained, then reloaded offline, navigated Genesis 1→2, returned Genesis 1:1 from offline text search, and removed the full package with both caches empty. A checksum regression test covers and prevents legacy Reader reserialization of managed package bytes. V6 unit tests additionally require all 66 canonical books before enabling full-translation download; an incomplete manifest is refused before any transfer, while a complete 66-book fixture proves install, cancel, resume and remove. On local candidate `ada62e2d...`, offline search is connected to the Reader’s offline action using only checksum-verified packages, the selected translation, and installed books; its controller regression test confirms the search makes no manifest or payload network request. The offline-search checkbox remains formally open pending refreshed exact-SHA browser/PWA evidence. The previous browser proof is at `ebcad81a...`; current-candidate browser rerun is blocked locally because the Playwright Chromium executable is absent. Installed-PWA full-Bible and physical-device acceptance remain open.

## F2. BSB Audio Bible

Integrated evidence (2026-09-30; PR #836, exact PR head `d7280801a9de50b324970453e2d906b0c8bd25d5`, merge `a48d49147bb953da606fd40c95db1dc8593b9867`): the required built-artifact Reader browser suite now deterministically proves BSB-only human-audio presentation and playback-position recovery through a full page reload at mobile width. Phase-1 run `36634970468` passed built Chromium parity, PWA acceptance, Reader acceptance at 320/360/390/412/430 px, and the opt-in live OpenBible probe. Raw live output confirmed failed-request retry recovery, Hays Genesis 1 playback, seeking to 5.0 s, Souer switching/playback, Genesis 2 chapter navigation, and narrator persistence after reload. Inherited regression `36634970343` also passed. This promotes only the direct-stream, live browser/seek/retry, and built browser/mobile/PWA recovery rows; offline-copy rights, exact source/text revision alignment, verse timing, auto-next text synchronization, background-device behavior and physical-device acceptance remain open.
Integrated control evidence (2026-09-30; PR #837, exact PR head `8b5f8a51056bfec0d27a5c8a648d42e03e0fcdb7`, merge `33ed133376feef6ae9bb3eef6a96dd2825e74f86`): auto-next now keeps the displayed Reader passage synchronized with the chapter actually playing, and manual passage changes cancel any in-flight auto-next load before it can take ownership later. Exact head passed Client Artifact Security `36636117624`, Phase-1 `36636117710` including the built mobile Reader regression and live OpenBible smoke, and inherited regression `36636117694`. Existing unit coverage already exercises pause/resume, playback-rate bounds, auto-next, sleep timer and persisted resume; this tranche adds pending-load cancellation plus built-browser Genesis 1→2 synchronization. The combined playback-controls row is therefore promoted; physical background/lock-screen behavior and verse-alignment rows remain open.


W3 selective-offline evidence (2026-09-30; PR #912 code/browser evidence head `215eeca2689265ffb1844140b607994d2baeab0b`): V6 Phase-1 build job `36721681035` completed successfully on that exact code head. Its unit/source contracts prove audio installation is exposed only through the explicit per-chapter `installChapter(book, chapter)` action and no whole-Audio-Bible installer exists. The same Phase-1 workflow runs `tests/v6/reader-route-acceptance-browser.mjs` against built output; that browser gate proves the current OpenBible source exposes streaming while offline-copy permission is unapproved, with no offline-download button present. Existing package-manager coverage keeps rights, exact checksum/byte-length, Scripture/audio revision and storage ceilings fail-closed. This promotes only the selective-download/no-silent-bulk-cache row; offline-copy permission, exact source-file identity, alignment, highlight/autoscroll and physical-device rows remain open.

Local candidate evidence (2026-09-28; code SHA `c95ccd02bb006f2e8a4a95e6040643947a367a73`, exact build artifact SHA-256 `495b804f9fe74926f5092f2efdb51f4ba0cc460a07799d625cf20681cd6b65e4`): the Reader streams all 1,189 BSB Hays chapters and all 1,189 Bob Souer alternatives directly from OpenBible, defaults to Barry Hays, and exposes a persisted narrator selector. Switching pauses the prior source and prepares the same chapter in the selected source. Audio package policy remains fail-closed for offline copies; verse synchronization remains hidden until exact source-matched timing rows are reviewed. The opt-in browser smoke now checks failed-source retry, decoded playback, seeking, Hays→Souer switching, chapter navigation, and narrator persistence through page reload. Full V6 unit suite (611), lint, formatting, typecheck, and exact-SHA build pass. Browser execution remains pending because Chromium is absent locally and the external-source smoke has not yet run in CI. Real-device acceptance and alignment/source identity review remain open.

- [x] One public-domain/CC0 BSB human narration is selected as the canonical initial English Audio Bible source and provenance is recorded in-repo.
- [x] Play the selected public chapter stream directly on demand; BibleQuest does not need to host a full audio-library mirror.
- [x] Confirm OpenBible stream availability, seeking/range support, and browser behavior on supported origins; show a clear retry/unavailable state when the source cannot play.
- [x] Any offline download is explicitly user-initiated, stored only on that user's device, removable, and blocked until offline-copy permission is approved.
- [ ] Offline files are exact-source checksum/version verified; CORS or browser fetch restrictions produce an unavailable-download state while direct streaming remains usable.
- [ ] If a later reviewed decision adds a BibleQuest mirror, speech-optimized encoding and the strict **below 10 GB** inventory/release gate apply to that mirror.
- [ ] Audio chapter identity maps deterministically to the exact BSB book/chapter text used by the Reader.
- [ ] Verse timing/alignment manifest exists and is versioned with the matching BSB text/audio revision.
- [ ] Current verse highlights during playback and tapping a verse seeks to the correct audio position.
- [ ] Auto-scroll follows spoken verses without preventing manual navigation/accessibility use.
- [x] Pause/resume, playback speed, auto-next chapter, sleep timer and persisted resume position work.
- [ ] Background/lock-screen media controls work where supported and degrade safely where unsupported.
- [x] Selective offline audio download is bounded by explicit user choice; the app does not silently cache the complete Audio Bible.
- [x] Audio binaries are excluded from Git and Supabase bulk storage; direct streaming remains at the public audio source and optional downloads stay in local PWA storage.
- [x] Audio provider abstraction allows future narrators/languages without coupling Reader state to one host/provider.
- [x] Built browser/mobile/PWA regression verifies BSB text/audio translation match and playback state recovery.

## G. Games engine and Games UI

- [x] Existing games have characterization/parity inventory.
- [x] Common game registry/metadata contract exists.
- [x] Game session logic can run without DOM rendering.
- [x] Scoring/reward policies are isolated and testable.
- [x] Turn/timer rules are isolated where applicable.
- [x] Progress/result contract is shared.
- [x] Solo/pass-and-play/remote adapters do not duplicate game logic unnecessarily.
- [x] Individual game views/components replace one monolithic all-game renderer.
- [x] Shared question/feedback/result/scoreboard primitives exist.
- [x] Raw decorative emoji are removed where intentional art assets exist.
- [x] Accessible labels remain independent from decorative art.
- [x] Recall/game content is lazy-loaded where appropriate.
- [x] Representative engine sessions are deterministic/replayable in unit tests.
- [x] All existing game launcher→result flows pass browser regression.

## H. Media subsystem

- [x] Provider-adapter architecture exists.
- [x] YouTube playback uses the official IFrame API or an equally explicit supported adapter, not command-only raw messaging as the primary abstraction.
- [x] Multiple media instances can register without creating uncontrolled persistent iframes.
- [x] One-audible-session default policy is enforced/tested.
- [x] Player switching/route teardown is deterministic.
- [x] Queue/playlist behavior exists where accepted.
- [x] Continue-watching/resume state exists where accepted.
- [x] Picture-in-Picture works where provider/browser support exists and degrades safely otherwise.
- [x] Background/foreground lifecycle is tested.
- [x] Media curation remains server-authorized.
- [x] Old dead Media Library owner is removed only after live routes have parity/evidence.

## I. Push notifications and background delivery

- [x] Web Push subscription lifecycle exists and the released V5 lifecycle/persistence contracts run in the V6 exact-head build gate.
- [x] Push server secrets remain server-side.
- [x] Account-scoped notification-category preferences and quiet-hours model exist.
- [x] Service worker handles push events and notification clicks; the V5 lifecycle contract verifies both listeners and same-origin click handling against the V6 candidate.
- [x] Notification destinations are restricted to the integrated V6 deep-link allowlist.
- [x] Expired/invalid push subscriptions are cleaned safely.
- [x] Delivery is deduplicated/idempotent/rate-limited.
- [ ] Assignment assigned/due push is supported.
- [x] Leader/congregation announcement push is supported.
- [x] Encouragement push is supported.
- [x] In-app Notification Center remains the durable fallback.
- [x] V6 notification client context tests clear account-scoped preferences on sign-out/account switch and fail closed without an active account.
- [ ] Physical-device push acceptance passes.

Local candidate progress (2026-09-28, not release evidence): an idempotent tenant-scoped SQL producer, service-only `bq-assignment-reminders` dispatcher, and one-minute Supabase Cron/Vault setup runbook now cover due reminders; assignment creation still delivers the existing immediate “assigned” notification. The database suite and schedule are not active in a Supabase project from this workspace, so keep the checklist item open until pgTAP passes and the deployed job/push delivery is verified.

## J. Offline mutation/sync

- [x] Offline-write allowlist is documented per domain.
- [x] Versioned IndexedDB outbox exists for accepted safe mutations.
- [x] Idempotency/retry/backoff rules exist.
- [x] Conflict policy exists and is testable.
- [x] Reload/restart preserves queued safe writes.
- [x] Account/tenant switching does not leak queued writes across identities/tenants.
- [x] Privileged/destructive admin operations are never blindly queued offline.

## K. Leader Center

- [x] Leader Center is restored as an explicit V6 feature, not an unavailable placeholder.
- [x] Server-authorized role gate is enforced.
- [x] Active congregation is visible/explicit.
- [x] Assignment publishing/review/follow-up workflows are available as accepted.
- [x] Privacy-safe member/group activity summaries are available.
- [x] Raw presence data is not exposed to ordinary roles or used as unnecessary surveillance.
- [x] Upcoming due items/events surface is available.
- [x] Leader announcement/notification publishing is integrated.
- [x] Journey Group/team management entry points are integrated where applicable.
- [x] Moderation/review entry points preserve existing server authority.
- [x] Role matrix passes DB + browser tests.
- [x] Cross-congregation denial passes DB + browser tests.

## L. Multi-congregation

- [x] Two-congregation deterministic database-CI topology is source-controlled and executable.
- [x] Users with multiple memberships have an explicit congregation switcher/context.
- [x] Tenant switch clears stale cached/view state.
- [ ] Sensitive repository calls require explicit congregation context.
- [x] Invitation/join flow is preserved/migrated.
- [x] Membership/role management is preserved/migrated.
- [x] Congregation profile/settings workflow exists as accepted.
- [x] Congregation provisioning workflow exists as accepted.
- [x] Assignments/responses cross-tenant isolation passes.
- [x] Presence cross-tenant isolation passes.
- [x] Groups/teams/rooms cross-tenant isolation passes.
- [x] Media/notifications/Leader Center cross-tenant isolation passes.
- [x] Any inter-congregation directory/shared-resource feature is opt-in and separately approved, not implied by tenancy support.

## M. Auth/admin/security hardening

- [ ] Leaked-password protection or supported equivalent is enabled/verified or explicitly accepted with rationale.
- [x] Privileged Owner/Admin re-auth requirements are reviewed.
- [x] Real session revocation is tested.
- [x] Admin operation contracts/audit schema are typed/tested.
- [x] Client bundle contains no privileged secrets.
- [x] Dependency/security scanning exists after package management is introduced.
- [x] CSP is compatible with media/push/build architecture and enforced as accepted.
- [x] Secret scanning/client artifact scanning exists.
- [x] MFA/passkeys for privileged roles are evaluated with recovery implications documented.
- [ ] Relevant Supabase security-advisor findings are triaged before RC freeze.

## N. Design system / i18n / accessibility

- [x] Shared component primitives cover common buttons/forms/dialogs/cards/status states.
- [x] Focus/keyboard contracts are componentized/tested.
- [x] Icon/art registry replaces scattered decorative symbols where applicable.
- [x] New/migrated UI strings use structured catalogs rather than new scattered hard-coded language strings.
- [x] Existing supported-language and Japanese/furigana behavior is preserved.
- [x] Scripture licensing/source metadata remains separate from UI localization.
- [x] Automated accessibility checks run on built artifacts.
- [ ] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.

## O. Observability and performance

- [x] Release SHA/build identity is available in diagnostics.
- [x] Privacy-safe structured error reporting exists.
- [x] Telemetry excludes auth tokens, private notes and sensitive Scripture/user content by default.
- [x] Controlled source-map resolution exists.
- [x] Diagnostics expose safe SW/content/connectivity state.
- [x] Route/chunk size budgets are enforced in exact-head build CI.
- [x] Image/font budgets are enforced.
- [x] Startup/critical-route performance budgets are defined.
- [x] Large Bible/game/media payloads are not eagerly loaded without need.

## P. CI/release architecture

- [x] Reusable/version-neutral workflows replace permanent reliance on `v3-*`/`v4-*` naming for inherited gates.
- [x] Unit/type/lint/build gates run on V6 PRs.
- [x] Database/RLS integration gate runs on relevant Supabase/database PRs using a real disposable stack.
- [x] Whole-app/protected-route/browser gates run against built output.
- [x] PWA/offline gate covers real V6 SW/content architecture.
- [ ] Push tests include browser/service-worker coverage plus physical-device acceptance.
- [ ] Exact-SHA Cloudflare preview verification remains mandatory.
- [ ] V4→V6 upgrade database path is tested before RC.
- [ ] V4→V6 route/feature parity matrix is complete.
- [ ] One exact V6 RC SHA passes all applicable automated gates.
- [ ] Required field/device evidence is attached to exact candidate.
- [x] No WAIVED item is represented as PASS.
- [ ] Production promotion uses the exact certified candidate.
- [ ] Post-production exact-SHA + route + PWA + offline + push smoke passes.
- [ ] V4 rollback reference remains available through V6 production acceptance.

Integrated acceptance evidence (2026-09-30; PR #649, exact PR head evidence via Phase-1 `36157859026` and inherited regression `36157858952`): the versioned offline mutation outbox is allowlisted to accepted safe mutations and rejects privileged/destructive/auth/admin actions rather than replaying them after reconnect. This is automated exact-head evidence; it does not promote unrelated physical-device or live-service rows.

## Q. Cross-cutting safety gates

- [ ] No V6 feature weakens server-side authorization, RLS, role checks or tenant isolation.
- [ ] No content/media asset is hosted or transformed without verified redistribution rights/provenance.
- [ ] If BibleQuest-controlled audio hosting is added, its inventory remains below 10 GB and release fails at or above the ceiling.
- [x] Audio binaries remain outside Git and Supabase Storage; public-source streaming and user-controlled local PWA downloads are used by default.
- [x] Large offline downloads require explicit user action and provide storage/removal controls.
- [x] Privileged/destructive/auth/admin actions are never blindly replayed from an offline queue.
- [x] Client bundles/logs/diagnostics contain no privileged secrets, auth tokens or unnecessary private content.
- [x] Accessibility, localization and 320/360/390/412/430px mobile behavior remain regression-covered on migrated surfaces.
- [ ] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.
- [ ] Overlapping runtime integrations remain serialized and are rebased/revalidated after parity/foundation changes.
- [ ] One exact V6 RC SHA passes all applicable security, tenant, offline, PWA, push and regression gates before promotion.
