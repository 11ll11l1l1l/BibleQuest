# BibleQuest V5 Requested Features & Architecture Acceptance Checklist

Updated: 2026-09-13 JST
Authority: `V5_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V5.md`

This checklist is the release-blocking inventory for V5 unless `V5_ACTIVE_STATUS.md` explicitly marks an item non-applicable or owner-waived. A waiver is not a PASS.

## A. Phase 0 — V5 authority and baseline

- [ ] `V5_ACTIVE_STATUS.md` accepted as current authority.
- [ ] `DEVELOPMENT_PLAN_V5.md` accepted.
- [ ] V5 integration branch created from cleaned `main` `ef5d46485f9e7138b969777d34de585cfd9ecbd1`.
- [ ] V3/V4 archives remain unchanged/read-only by policy.
- [ ] ADR index/template exists.
- [ ] Initial build/client architecture ADR accepted.
- [ ] Initial real-database-CI ADR accepted.
- [ ] Full inherited baseline green on exact Phase 0 V5 head.

## B. Build/toolchain

- [ ] `package.json` + lockfile exist and installs are deterministic.
- [ ] Supported Node version is pinned/documented.
- [ ] Vite produces deterministic deployable artifacts.
- [ ] TypeScript is enabled for new architecture contracts; migration policy for legacy JS is documented.
- [ ] Typecheck/lint/unit/build commands run in CI.
- [ ] Built route/deep-link behavior matches production expectations.
- [ ] Source maps are generated/handled safely.
- [ ] Route/domain code splitting is available.
- [ ] CSS/assets/images are owned by build pipeline.
- [ ] Bundle/chunk/image budgets exist and are CI-visible.
- [ ] Cloudflare exact-SHA deployment identity works from built artifacts.

## C. Real Supabase/Postgres CI

- [ ] Reproducible local Supabase project configuration exists.
- [ ] CI starts a real ephemeral Supabase/Postgres environment.
- [ ] Clean database applies all required migrations from zero.
- [ ] Upgrade-path database test represents supported V4→V5 migration.
- [ ] Schema/type drift check exists.
- [ ] Generated TypeScript database types are committed/generated deterministically.
- [ ] At least two populated congregations exist in deterministic fixtures.
- [ ] Fixtures include ordinary member + ministry-role + platform-privileged identities required by tests.
- [ ] RLS allow/deny tests execute as actual database callers.
- [ ] Anonymous/public exposure is explicitly tested.
- [ ] Cross-congregation denial is tested for every sensitive migrated domain.
- [ ] `SECURITY DEFINER` / `SECURITY INVOKER` behavior is actually executed.
- [ ] Function grants/revokes are tested.
- [ ] Privileged function search-path/least-privilege requirements are tested.
- [ ] Static SQL checks remain fast guards but are not the sole release proof.

## D. Core V5 client architecture

- [ ] Typed app-shell/router contract established.
- [ ] Typed session/auth owner established.
- [ ] Explicit active-congregation context established.
- [ ] Central repository/data-access boundary established.
- [ ] Standard async/error/offline/unauthorized state contract established.
- [ ] Feature modules do not make UI visibility the authority for protected actions.
- [ ] Route-level loading/cancellation/stale-request behavior is standardized.
- [ ] Compatibility/feature-flag cutover mechanism exists.
- [ ] At least one low-risk feature proves the new architecture end to end before Reader/Games rewrite.

## E. Reader decomposition

- [ ] Current Reader behavior has characterization tests before migration.
- [ ] Navigation/translation state separated from DOM renderer.
- [ ] Scripture repository/content provider separated from route/view.
- [ ] Chapter/verse presentation split into testable components.
- [ ] Search is independently testable.
- [ ] Verse Peek is independently testable.
- [ ] Context Lab bridge is independently testable.
- [ ] Japanese furigana support preserved.
- [ ] Japanese vocabulary support preserved.
- [ ] Copyright/licensed-link behavior preserved.
- [ ] Read/progress writes use new domain/data boundary.
- [ ] Reader route passes parity + accessibility + mobile tests.

## F. True offline Bible

- [ ] Versioned Scripture content-manifest format exists.
- [ ] Download manager supports deliberate translation/book packages.
- [ ] At least one supported full translation can be made truly offline where licensing/size permits.
- [ ] Download progress/cancel/retry/remove controls exist.
- [ ] Storage usage/reclaim controls exist.
- [ ] Package checksums/version validation exist.
- [ ] Corrupt/outdated package recovery is tested.
- [ ] Previously downloaded Bible text opens with network disabled.
- [ ] Offline chapter navigation works after app restart.
- [ ] Supported local search works offline or is clearly scoped if deferred.
- [ ] Live/licensed translations never silently substitute another translation offline.
- [ ] App/service-worker/content-pack versions can upgrade safely.
- [ ] Physical installed-PWA offline acceptance passes.

## G. Games engine and Games UI

- [ ] Existing games have characterization/parity inventory.
- [ ] Common game registry/metadata contract exists.
- [ ] Game session logic can run without DOM rendering.
- [ ] Scoring/reward policies are isolated and testable.
- [ ] Turn/timer rules are isolated where applicable.
- [ ] Progress/result contract is shared.
- [ ] Solo/pass-and-play/remote adapters do not duplicate game logic unnecessarily.
- [ ] Individual game views/components replace one monolithic all-game renderer.
- [ ] Shared question/feedback/result/scoreboard primitives exist.
- [ ] Raw decorative emoji are removed where intentional art assets exist.
- [ ] Accessible labels remain independent from decorative art.
- [ ] Recall/game content is lazy-loaded where appropriate.
- [ ] Representative engine sessions are deterministic/replayable in unit tests.
- [ ] All existing game launcher→result flows pass browser regression.

## H. Media subsystem

- [ ] Provider-adapter architecture exists.
- [ ] YouTube playback uses the official IFrame API or an equally explicit supported adapter, not command-only raw messaging as the primary abstraction.
- [ ] Multiple media instances can register without creating uncontrolled persistent iframes.
- [ ] One-audible-session default policy is enforced/tested.
- [ ] Player switching/route teardown is deterministic.
- [ ] Queue/playlist behavior exists where accepted.
- [ ] Continue-watching/resume state exists where accepted.
- [ ] Picture-in-Picture works where provider/browser support exists and degrades safely otherwise.
- [ ] Background/foreground lifecycle is tested.
- [ ] Media curation remains server-authorized.
- [ ] Old dead Media Library owner is removed only after live routes have parity/evidence.

## I. Push notifications and background delivery

- [ ] Web Push subscription lifecycle exists.
- [ ] Push server secrets remain server-side.
- [ ] Notification-category preferences exist.
- [ ] Service worker handles push events and notification clicks.
- [ ] Push deep links resolve through supported V5 routes.
- [ ] Expired/invalid push subscriptions are cleaned safely.
- [ ] Delivery is deduplicated/idempotent/rate-limited.
- [ ] Assignment assigned/due push is supported.
- [ ] Leader/congregation announcement push is supported.
- [ ] Encouragement push is supported.
- [ ] In-app Notification Center remains the durable fallback.
- [ ] Sign-out/account switch clears/changes device notification context correctly.
- [ ] Physical-device push acceptance passes.

## J. Offline mutation/sync

- [ ] Offline-write allowlist is documented per domain.
- [ ] Versioned IndexedDB outbox exists for accepted safe mutations.
- [ ] Idempotency/retry/backoff rules exist.
- [ ] Conflict policy exists and is testable.
- [ ] Reload/restart preserves queued safe writes.
- [ ] Account/tenant switching does not leak queued writes across identities/tenants.
- [ ] Privileged/destructive admin operations are never blindly queued offline.

## K. Leader Center

- [ ] Leader Center is restored as an explicit V5 feature, not an unavailable placeholder.
- [ ] Server-authorized role gate is enforced.
- [ ] Active congregation is visible/explicit.
- [ ] Assignment publishing/review/follow-up workflows are available as accepted.
- [ ] Privacy-safe member/group activity summaries are available.
- [ ] Raw presence data is not exposed to ordinary roles or used as unnecessary surveillance.
- [ ] Upcoming due items/events surface is available.
- [ ] Leader announcement/notification publishing is integrated.
- [ ] Journey Group/team management entry points are integrated where applicable.
- [ ] Moderation/review entry points preserve existing server authority.
- [ ] Role matrix passes DB + browser tests.
- [ ] Cross-congregation denial passes DB + browser tests.

## L. Multi-congregation

- [ ] Two-congregation deterministic CI topology is permanently available.
- [ ] Users with multiple memberships have an explicit congregation switcher/context.
- [ ] Tenant switch clears stale cached/view state.
- [ ] Sensitive repository calls require explicit congregation context.
- [ ] Invitation/join flow is preserved/migrated.
- [ ] Membership/role management is preserved/migrated.
- [ ] Congregation profile/settings workflow exists as accepted.
- [ ] Congregation provisioning workflow exists as accepted.
- [ ] Assignments/responses cross-tenant isolation passes.
- [ ] Presence cross-tenant isolation passes.
- [ ] Groups/teams/rooms cross-tenant isolation passes.
- [ ] Media/notifications/Leader Center cross-tenant isolation passes.
- [ ] Any inter-congregation directory/shared-resource feature is opt-in and separately approved, not implied by tenancy support.

## M. Auth/admin/security hardening

- [ ] Leaked-password protection or supported equivalent is enabled/verified or explicitly accepted with rationale.
- [ ] Privileged Owner/Admin re-auth requirements are reviewed.
- [ ] Real session revocation is tested.
- [ ] Admin operation contracts/audit schema are typed/tested.
- [ ] Client bundle contains no privileged secrets.
- [ ] Dependency/security scanning exists after package management is introduced.
- [ ] CSP is compatible with media/push/build architecture and enforced as accepted.
- [ ] Secret scanning/client artifact scanning exists.
- [ ] MFA/passkeys for privileged roles are evaluated with recovery implications documented.
- [ ] Relevant Supabase security-advisor findings are triaged before RC freeze.

## N. Design system / i18n / accessibility

- [ ] Shared component primitives cover common buttons/forms/dialogs/cards/status states.
- [ ] Focus/keyboard contracts are componentized/tested.
- [ ] Icon/art registry replaces scattered decorative symbols where applicable.
- [ ] New/migrated UI strings use structured catalogs rather than new scattered hard-coded language strings.
- [ ] Existing supported-language and Japanese/furigana behavior is preserved.
- [ ] Scripture licensing/source metadata remains separate from UI localization.
- [ ] Automated accessibility checks run on built artifacts.
- [ ] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.

## O. Observability and performance

- [ ] Release SHA/build identity is available in diagnostics.
- [ ] Privacy-safe structured error reporting exists.
- [ ] Telemetry excludes auth tokens, private notes and sensitive Scripture/user content by default.
- [ ] Controlled source-map resolution exists.
- [ ] Diagnostics expose safe SW/content/connectivity state.
- [ ] Route/chunk size budgets are enforced.
- [ ] Image/font budgets are enforced.
- [ ] Startup/critical-route performance budgets are defined.
- [ ] Large Bible/game/media payloads are not eagerly loaded without need.

## P. CI/release architecture

- [ ] Reusable/version-neutral workflows replace permanent reliance on `v3-*`/`v4-*` naming for inherited gates.
- [ ] Unit/type/lint/build gates run on PRs.
- [ ] Database/RLS integration gate runs on relevant PRs.
- [ ] Whole-app/protected-route/browser gates run against built output.
- [ ] PWA/offline gate covers real V5 SW/content architecture.
- [ ] Push tests include browser/service-worker coverage plus physical-device acceptance.
- [ ] Exact-SHA Cloudflare preview verification remains mandatory.
- [ ] V4→V5 upgrade database path is tested before RC.
- [ ] V4→V5 route/feature parity matrix is complete.
- [ ] One exact V5 RC SHA passes all applicable automated gates.
- [ ] Required field/device evidence is attached to exact candidate.
- [ ] No WAIVED item is represented as PASS.
- [ ] Production promotion uses the exact certified candidate.
- [ ] Post-production exact-SHA + route + PWA + offline + push smoke passes.
- [ ] V4 rollback reference remains available through V5 production acceptance.
