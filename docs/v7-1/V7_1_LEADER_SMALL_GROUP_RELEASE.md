# BibleQuest V7.1 — leader and small-group sessions

Owner authorized implementation and direct release on 2026-10-18. Baseline: production c16278602c097087792dd8c31876b3645b37ed8b. This explicitly advances the previously deferred Conversation Deck into V7.1; the V7 release remains preserved.

## Scope and acceptance

- Reach sessions from Groups, Leader Center and existing Live Rooms. Signed-in congregation members join by the existing room code; facilitator/leader/pastor/admin hosts create sessions. This is a congregation-backed live session, not a new private Journey Group membership boundary.
- Host chooses a public original prompt series and its ordered cards; previews with Previous/Next, keyboard or horizontal swipe; an explicit Send or upward swipe on a dedicated gesture area publishes the selected card. Preview navigation never broadcasts automatically.
- Participant phones show the authoritative selected prompt and Scripture reference, with the existing licensed Reader action. No Scripture prose is invented or copied into the deck. No participant answers, notes, chat or private ONE 2 ONE records are stored or transmitted.
- Use existing bible_shared_sessions state and its RLS/realtime owner. Host/account/active-tenant checks, optimistic update conflicts, late joins, refresh/reconnect and ended sessions must work. Unrecognized card data is not rendered as trusted content.
- Preserve focus and scroll on membership/connection updates; no full-page polling/remount. Poll only the active visible session as a realtime recovery path, with cleanup on leave/navigation.
- Phone-first, 44px controls, readable theme contrast, EN/TL/CEB copy, reduced-motion safe and native keyboard actions. Existing Ilocano fallback is not a full Ilocano release.
- Preserve verified image bytes, compact Books/Devotionals, existing groups and discipleship privacy. No artwork generation, new group chat, central media pipeline or full Ilocano Bible/UI rollout (V8).

## Verification and release

Unit/contract checks cover canonical content, host/tenant/account/race denial and quiet preview. Disposable-database authenticated API checks prove host publication and member/cross-tenant denial. Built browser checks prove two-phone host/participant selection, join-late/reconnect, narrow layout, focus stability, localization and keyboard/swipe actions. Run existing exact-source strict release, security, inherited, phone/PWA/offline and deployed full-file certification before reporting released. Record actual candidate, PR, workflow and deployed SHA below; no physical-device PASS is inferred.

Implementation is complete in [production PR #1550](https://github.com/11ll11l1l1l/BibleQuest/pull/1550). That PR maintains the current frozen candidate, exact-source CI, promotion SHA and deployed certification links; a new source change requires new certification. No physical-device acceptance is claimed.

Automated checks include 733 V7 unit cases and image ledger; existing Live Rooms active-tenant edge regression; original V4 relational presentation contract (kept byte-exact); architecture; typecheck; lint/format; production build. Required pinned CI, real-JWT API/RLS checks, two-browser Realtime and full served-artifact checks remain release gates.

Rollback verified remotely: `rollback/v7-pre-7-1-20261018` → `c16278602c097087792dd8c31876b3645b37ed8b`. Existing V7 production evidence remains PR #1549.

The new feature is a separate lazy module. The frozen original Live Rooms owner and its tests remain unchanged; the Live Rooms entry is added by a navigation wrapper. Host/participant updates preserve deck DOM and focus. Permission changes are enforced by existing database RLS; no schema changes are required.

The first revised-candidate certification (`6e8ab9a8a031ffcefc5d97bfb83941130319fdec`) passed all eleven PR workflows, including strict convergence run 39090460150, real-JWT API checks and the two-phone flow. Final certification also explicitly asserts participant Realtime events. The disposable CI prerequisite overlay reproduces the two existing hosted publication memberships, verified via read-only `pg_publication_tables` on 2026-10-18; no production mutation/migration is introduced. The phone screenshot is retained in convergence artifacts.

Phone screenshot inspection additionally caught inherited low-contrast Community heading styles. The session now owns a scoped dark header/code treatment with computed 4.5:1 text checks, and a collapsed Session details disclosure keeps prompts near the top of the phone. The legacy Live Rooms page remains byte-exact.

The real-database journey also exposed a pre-existing sign-out hang when push cleanup awaited a service worker that never installed. Cleanup now queries the existing registration without waiting; readiness waits are bounded. Its regression and existing push lifecycle/storage/onboarding tests pass. Candidate `8793a7e33f78c65cb1d9abebf6fb117a36142ca7` passed the complete authenticated API and browser journey, including actual protocol-2 Realtime delivery, locale/reload/reconnect and account switching, before the final scoped phone contrast/layout correction. All required release gates still apply to the final PR head.
