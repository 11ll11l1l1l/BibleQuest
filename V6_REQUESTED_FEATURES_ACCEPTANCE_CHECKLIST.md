# BibleQuest V6 Engine / Architecture Acceptance Checklist

Updated: 2026-09-13 JST
Authority: `V6_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V6.md`
Status: PLANNED / BLOCKED BY V5

This checklist is the release-blocking inventory for the V6 **engine upgrade**. V6 starts only from the exact accepted V5 production SHA. A waiver is never a PASS.

## A. V5 handoff / Phase 0

- [ ] V5 Phase 8 is complete.
- [ ] Exact accepted V5 production SHA recorded as V6 baseline.
- [ ] `v6/architecture-upgrade` is based on that exact V5 SHA, not the historical V4 cleanup SHA.
- [ ] Final V5 feature checklist and regression/security/browser/PWA evidence archived.
- [ ] V4/V5 rollback refs preserved.
- [ ] `V6_ACTIVE_STATUS.md` activated.
- [ ] ADR process exists under `docs/v6/adr/`.
- [ ] Build/client ADR accepted.
- [ ] Real database-CI ADR accepted.
- [ ] Full inherited V5 baseline green on exact V6 Phase 0 head.

## B. Build engine

- [ ] `package.json` + deterministic lockfile.
- [ ] Supported Node version pinned.
- [ ] Vite development/build pipeline.
- [ ] Incremental TypeScript policy documented and enforced for new engine contracts.
- [ ] Deterministic deployable artifacts with exact release identity.
- [ ] Safe production source-map handling.
- [ ] CSS/assets/images owned by build pipeline.
- [ ] Route/domain code splitting available.
- [ ] lint/typecheck/unit/build commands run in CI.
- [ ] Bundle/chunk/image budgets defined.
- [ ] Deep links, auth/session startup, PWA install and critical V5 routes preserve parity.

## C. Database verification engine

- [ ] Reproducible local Supabase project config.
- [ ] CI starts real ephemeral Supabase/Postgres.
- [ ] Full migration chain applies from zero.
- [ ] Migration order/idempotence/drift checks exist.
- [ ] Deterministic fixtures include two congregations, multi-membership and required roles.
- [ ] RLS allow/deny tests run as real callers.
- [ ] Cross-congregation denial tested across every sensitive migrated domain.
- [ ] `SECURITY DEFINER` / invoker functions actually execute under realistic roles.
- [ ] Grants/revokes/search-path/least-privilege assertions exist.
- [ ] Generated TypeScript DB types are deterministic and drift-checked.
- [ ] Static SQL checks remain fast guards but are not sole authorization proof.

## D. Application kernel

- [ ] Typed app shell/router contract.
- [ ] Typed session/auth owner.
- [ ] Explicit active-congregation context separated from identity.
- [ ] Central repository/data interfaces.
- [ ] Domain services independent from DOM rendering.
- [ ] Standard idle/loading/ready/empty/offline/error/unauthorized states.
- [ ] Cancellation/stale-request protection standardized.
- [ ] Shared safe error taxonomy/user mapping.
- [ ] Explicit cross-feature event/command boundaries.
- [ ] State owned at narrow durable scope rather than one giant store.
- [ ] At least one low-risk V5 feature proves the new kernel end to end.

## E. Reader/content/offline engine

- [ ] V5 Reader behavior characterized before migration.
- [ ] Reader responsibilities split into testable owners/services/components.
- [ ] Scripture provider/navigation/search/context/furigana/vocabulary/progress boundaries explicit.
- [ ] Copyright/licensed translation behavior preserved.
- [ ] Versioned Scripture content manifests with checksums/version/license metadata.
- [ ] Deliberate book/translation downloads where legally supported.
- [ ] Storage/update/remove/recovery controls.
- [ ] Offline reading position and supported local search.
- [ ] Live/licensed translations fail explicitly offline rather than silently substituting.
- [ ] App/SW/content versions migrate safely.
- [ ] Installed-PWA physical offline acceptance passes.

## F. Games engine

- [ ] V5 Games behavior/artwork state characterized before migration.
- [ ] Common game registry/metadata contract.
- [ ] Deterministic session/action/scoring/timer/result contracts.
- [ ] Game logic can run independently of DOM.
- [ ] Persistence/accessibility/pass-and-play adapters separated.
- [ ] Individual game family components replace all-game monolithic renderer.
- [ ] Shared launcher/question/feedback/result/score primitives.
- [ ] Existing V5 game flows pass parity/browser tests.
- [ ] Representative sessions replay deterministically in unit tests.

## G. Media engine

- [ ] Provider-adapter architecture.
- [ ] Official YouTube/provider APIs used as supported abstraction.
- [ ] Multiple media instances may register safely.
- [ ] Explicit one-audible-session default policy.
- [ ] Deterministic player/route/background teardown.
- [ ] Queue/playlist/resume behavior where accepted.
- [ ] PiP where supported with graceful fallback.
- [ ] Accessibility/media-control semantics.
- [ ] Media curation remains server-authorized.

## H. Notification / background-sync engine

- [ ] V5 minimum push behavior characterized before migration.
- [ ] Authenticated device subscription lifecycle robust.
- [ ] Category preferences preserved/migrated.
- [ ] SW delivery/click/deep-link handling.
- [ ] Invalid subscription cleanup.
- [ ] Dedup/idempotency/rate controls.
- [ ] In-app Notification Center remains source of truth.
- [ ] Safe operational delivery metadata only.
- [ ] Versioned offline-write outbox for explicitly allowed user-owned writes.
- [ ] Retry/conflict/idempotency policies.
- [ ] Account/tenant switch cannot leak queued writes.
- [ ] Privileged/admin/auth actions are never blindly queued.

## I. Ministry/Admin migration

- [ ] Completed V5 Leader Center migrated to V6 kernel with behavior parity.
- [ ] Completed V5 Admin Console migrated without weakening privileged controls.
- [ ] Role/tenant context explicit.
- [ ] Assignment/review/presence/group/team composition uses typed repositories.
- [ ] Privacy-safe aggregates preserved; no new surveillance-like raw feeds.
- [ ] Member/facilitator/leader/pastor/admin role matrix passes DB + browser tests.
- [ ] Cross-congregation denial passes DB + browser tests.

## J. Tenant engine

- [ ] V5 active-congregation switcher behavior preserved/migrated.
- [ ] Every tenant-sensitive repository call requires explicit congregation context.
- [ ] Tenant switch clears stale cached/view state.
- [ ] Two-congregation deterministic fixture topology permanent in CI.
- [ ] Assignment/response isolation tested.
- [ ] Presence isolation tested.
- [ ] Groups/teams/rooms isolation tested.
- [ ] Media/notifications/Leader/Admin isolation tested.
- [ ] Join/membership/provisioning/role tooling remains server-authorized.
- [ ] No feature silently chooses first membership.

## K. Auth/security hardening

- [ ] Privileged re-auth/session freshness reviewed.
- [ ] Real session revocation tested.
- [ ] Leaked-password/MFA/passkey options evaluated and documented.
- [ ] CSP and unsafe-DOM audit completed.
- [ ] Dependency/security scanning exists after package management introduction.
- [ ] Client artifacts scanned for secrets.
- [ ] Edge/database privileged functions reviewed for least privilege/search path.
- [ ] Relevant Supabase security-advisor findings triaged.

## L. Design/runtime platform and motion/sound engine

- [ ] Shared component primitives and design tokens.
- [ ] Focus/keyboard/accessibility contracts componentized.
- [ ] Structured i18n/content boundaries.
- [ ] Privacy-safe runtime error diagnostics with exact build identity.
- [ ] Route/bundle/image/startup performance budgets.
- [ ] Motion token/preset registry.
- [ ] Sound-event registry with persisted user preference.
- [ ] reduced-motion and sound-off behavior defined.
- [ ] Browser gesture-unlock/audio policy handled centrally.
- [ ] Haptic capability abstraction where supported.
- [ ] Engine proven on 2-3 reference surfaces spanning playful and restrained families.
- [ ] Full app rollout is explicitly deferred to V7.

## M. V6 certification / promotion

- [ ] Complete V5→V6 parity matrix.
- [ ] Clean-install DB migration test.
- [ ] Supported V5→V6 upgrade DB path test.
- [ ] Full executable RLS/security matrix.
- [ ] Browser/mobile/PWA/offline/media/tenant coverage.
- [ ] Build identity/performance budgets green.
- [ ] Reference-surface motion/sound preference/accessibility matrix green.
- [ ] Exact-SHA Cloudflare preview verification.
- [ ] One exact V6 RC SHA passes all applicable automated gates.
- [ ] Required physical/field evidence attached to same candidate.
- [ ] No WAIVED item represented as PASS.
- [ ] Production promotion uses exact certified candidate.
- [ ] Post-production exact-SHA route/PWA/offline/media smoke passes.
- [ ] Exact accepted V6 production SHA recorded as V7 baseline.
- [ ] V5 rollback remains available through V6 production acceptance.