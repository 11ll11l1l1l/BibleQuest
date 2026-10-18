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

Status: IMPLEMENTING. Release evidence will be maintained in the production PR and this workstream's handoff.
