# BibleQuest V6 Requested Features & Architecture Acceptance Checklist

Updated: 2026-09-25 JST
Authority: `V6_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V6.md`

This checklist is the release-blocking inventory for V6 unless `V6_ACTIVE_STATUS.md` explicitly marks an item non-applicable or owner-waived. A waiver is not a PASS.

Evidence checkpoint: integrated V6 head `a83120a3bf599a40b93a7ae3a1e2bd708f05f805`. Checked items below are limited to behavior directly supported by merged source plus executable CI evidence; signed-out Chromium, local Supabase CI and physical/device evidence are not treated as interchangeable. Core V6 reconciliation includes merged PR #538 with V6 Phase 1 Build Gate `35961956126` SUCCESS. Phase-2 reconciliation includes merged PR #541 with V6 Database CI `35975269052` SUCCESS and V6 Phase 1 Build Gate `35975269120` SUCCESS. Shared typed-account-resume parity repair PR #546 passed V6 Phase 1 `35975512403` and inherited regression `35975512420` before merge.

Certification reconciliation from integrated head `316c9fadd50d30854c0c545914a7d5749eff9f8c`: production parity is proven by merged PR #510 (Phase 1 `35823184257`, Database CI `35823184256`, inherited regression `35823184264`) and current ancestry; push cleanup/rate-control/server-category evidence is integrated through PR #541 Database CI `35975269052` and subsequent green S2 integrations; account/tenant isolation is integrated through PRs #550/#557 with Phase 1 + inherited regression green; privacy-safe telemetry is merged through PR #568 with Database CI `36062843154`, regression `36062843068`, and Phase 1 `36062843220`; Games engine/characterization/adapters/presentation are merged through PR #572 with Phase 1 `36063707076` and regression `36063706908`. The dedicated integrated-acceptance certification test on this checklist reconciliation must also pass before merge. Physical-device, authenticated role-browser, unmerged Reader/Assignments, and Cloudflare exact-artifact requirements remain unchecked.

Second certification reconciliation from integrated head `0e00188c3144a137ca48dd927faa954bfc7a361a`: previously integrated Database CI covers Presence, Journey Group/team/Live Room and media/notification tenant boundaries; inherited Leader Center contracts plus a focused stale-tenant unit regression prove the composition fails closed after an active-congregation change; per-book Recall uses demand-loaded pack fetches; Scripture source/license/attribution metadata remains in the Bible data owner; and the release checklist itself is regression-guarded so WAIVED is never counted as PASS.

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
- [ ] Feature modules do not make UI visibility the authority for protected actions.
- [x] Route-level lazy loading/cancellation and stale-request invalidation primitives are standardized.
- [x] Compatibility feature command/event boundary and fail-closed migration seam exist.
- [x] At least one low-risk feature proves the new architecture end to end before Reader/Games rewrite: Accessibility preferences mutate through the V6 command seam and built Chromium proves runtime application plus V5-compatible persistence after reload.

## E. Reader decomposition

- [x] Current Reader translation/content behavior has characterization tests before migration.
- [x] Reader navigation/translation state has a DOM-independent typed parity seam.
- [ ] Scripture repository/content provider separated from route/view.
- [ ] Chapter/verse presentation split into testable components.
- [ ] Search is independently testable.
- [ ] Verse Peek is independently testable.
- [ ] Context Lab bridge is independently testable.
- [ ] Japanese furigana support preserved.
- [ ] Japanese vocabulary support preserved.
- [x] Copyright/licensed-link redistribution policy is explicit and tested in the V6 content-manifest boundary.
- [ ] Read/progress writes use new domain/data boundary.\n- [ ] Canonical chapter-read identity remains translation-independent so the same Bible chapter cannot duplicate XP/progression across translations.\n- [ ] Reader/Main Quest chapter completion preserves one trusted Reading leaderboard identity per chapter and server-authoritative scoring; local XP never becomes leaderboard authority.
- [ ] Reader route passes parity + accessibility + mobile tests.

## F. True offline Bible

- [x] Versioned Scripture content-manifest format exists with package identity/license metadata.
- [x] Offline package lifecycle manager supports deliberate declared book-package installation through injected transport/repository boundaries.
- [ ] At least one supported full translation can be made truly offline where licensing/size permits.
- [ ] Download progress/cancel/retry/remove controls exist.
- [ ] Storage usage/reclaim controls exist.
- [x] Package byte-length/checksum/version validation exists and fails closed before persistence.
- [ ] Corrupt/outdated package recovery is tested.
- [ ] Previously downloaded Bible text opens with network disabled.
- [ ] Offline chapter navigation works after app restart.
- [ ] Supported local search works offline or is clearly scoped if deferred.
- [x] Live/licensed redistribution policy explicitly rejects unsupported packaged substitution.
- [ ] App/service-worker/content-pack versions can upgrade safely.
- [ ] Physical installed-PWA offline acceptance passes.

## G. Games engine and Games UI

- [x] Existing games have characterization/parity inventory.
- [x] Common game registry/metadata contract exists.
- [x] Game session logic can run without DOM rendering.
- [x] Scoring/reward policies are isolated and testable.
- [x] Turn/timer rules are isolated where applicable.
- [x] Progress/result contract is shared.
- [ ] Solo/pass-and-play/remote adapters do not duplicate game logic unnecessarily.
- [x] Individual game views/components replace one monolithic all-game renderer.
- [x] Shared question/feedback/result/scoreboard primitives exist.
- [ ] Raw decorative emoji are removed where intentional art assets exist.
- [x] Accessible labels remain independent from decorative art.
- [x] Recall/game content is lazy-loaded where appropriate.
- [x] Representative engine sessions are deterministic/replayable in unit tests.
- [x] All existing game launcher→result flows pass browser regression.

## H. Media subsystem

- [x] Provider-adapter architecture exists.
- [x] YouTube playback uses the official IFrame API or an equally explicit supported adapter, not command-only raw messaging as the primary abstraction.
- [ ] Multiple media instances can register without creating uncontrolled persistent iframes.
- [x] One-audible-session default policy is enforced/tested.
- [x] Player switching/route teardown is deterministic.
- [x] Queue/playlist behavior exists where accepted.
- [ ] Continue-watching/resume state exists where accepted.
- [ ] Picture-in-Picture works where provider/browser support exists and degrades safely otherwise.
- [x] Background/foreground lifecycle is tested.
- [x] Media curation remains server-authorized.
- [ ] Old dead Media Library owner is removed only after live routes have parity/evidence.

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

## J. Offline mutation/sync

- [x] Offline-write allowlist is documented per domain.
- [x] Versioned IndexedDB outbox exists for accepted safe mutations.
- [x] Idempotency/retry/backoff rules exist.
- [ ] Conflict policy exists and is testable.
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
- [ ] Upcoming due items/events surface is available.
- [ ] Leader announcement/notification publishing is integrated.
- [x] Journey Group/team management entry points are integrated where applicable.
- [ ] Moderation/review entry points preserve existing server authority.
- [ ] Role matrix passes DB + browser tests.
- [ ] Cross-congregation denial passes DB + browser tests.

## L. Multi-congregation

- [x] Two-congregation deterministic database-CI topology is source-controlled and executable.
- [x] Users with multiple memberships have an explicit congregation switcher/context.
- [x] Tenant switch clears stale cached/view state.
- [ ] Sensitive repository calls require explicit congregation context.
- [x] Invitation/join flow is preserved/migrated.
- [ ] Membership/role management is preserved/migrated.
- [ ] Congregation profile/settings workflow exists as accepted.
- [ ] Congregation provisioning workflow exists as accepted.
- [ ] Assignments/responses cross-tenant isolation passes.
- [x] Presence cross-tenant isolation passes.
- [x] Groups/teams/rooms cross-tenant isolation passes.
- [x] Media/notifications/Leader Center cross-tenant isolation passes.
- [ ] Any inter-congregation directory/shared-resource feature is opt-in and separately approved, not implied by tenancy support.

## M. Auth/admin/security hardening

- [ ] Leaked-password protection or supported equivalent is enabled/verified or explicitly accepted with rationale.
- [ ] Privileged Owner/Admin re-auth requirements are reviewed.
- [ ] Real session revocation is tested.
- [x] Admin operation contracts/audit schema are typed/tested.
- [x] Client bundle contains no privileged secrets.
- [x] Dependency/security scanning exists after package management is introduced.
- [ ] CSP is compatible with media/push/build architecture and enforced as accepted.
- [x] Secret scanning/client artifact scanning exists.
- [ ] MFA/passkeys for privileged roles are evaluated with recovery implications documented.
- [ ] Relevant Supabase security-advisor findings are triaged before RC freeze.

## N. Design system / i18n / accessibility

- [ ] Shared component primitives cover common buttons/forms/dialogs/cards/status states.
- [ ] Focus/keyboard contracts are componentized/tested.
- [ ] Icon/art registry replaces scattered decorative symbols where applicable.
- [ ] New/migrated UI strings use structured catalogs rather than new scattered hard-coded language strings.
- [x] Existing supported-language and Japanese/furigana behavior is preserved.
- [x] Scripture licensing/source metadata remains separate from UI localization.
- [ ] Automated accessibility checks run on built artifacts.
- [ ] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.

## O. Observability and performance

- [x] Release SHA/build identity is available in diagnostics.
- [x] Privacy-safe structured error reporting exists.
- [x] Telemetry excludes auth tokens, private notes and sensitive Scripture/user content by default.
- [x] Controlled source-map resolution exists.
- [x] Diagnostics expose safe SW/content/connectivity state.
- [x] Route/chunk size budgets are enforced in exact-head build CI.
- [x] Image/font budgets are enforced.
- [ ] Startup/critical-route performance budgets are defined.
- [ ] Large Bible/game/media payloads are not eagerly loaded without need.

## P. CI/release architecture

- [ ] Reusable/version-neutral workflows replace permanent reliance on `v3-*`/`v4-*` naming for inherited gates.
- [x] Unit/type/lint/build gates run on V6 PRs.
- [x] Database/RLS integration gate runs on relevant Supabase/database PRs using a real disposable stack.
- [ ] Whole-app/protected-route/browser gates run against built output.
- [ ] PWA/offline gate covers real V6 SW/content architecture.
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
