# V8 Library to spiritual-practice handoff

Baseline: remote integration `5aff510dc02f6b8e9134e75577455594ba1d0925`, PR #1558. One executor; bounded coding-first continuation.

## Implementation

Reviewed, published, rights-valid devotionals and past teachings may offer up to three practice links from explicit public topic tags. Prayer/life-in-Christ maps to morning surrender; trust to short Silencio; community/relationships to fellowship; love to service. Canonical topic matching only: no reading title/body/ID, emotion selection, learner answer, confession or private reflection enters the recommendation or URL. Unsupported, book, unreviewed, undisplayable and unknown-topic records offer no links. Existing conversation handoffs remain intact.

The existing practice route accepts a canonical practice ID via its query and the lazy page validates it against existing templates/guides. A timed routine gets a preview and explicit Begin control; action guides open with their steps at the top. Navigation performs no start, session replacement or storage write. Existing current sessions/reflections remain authoritative. Stale start/custom controls cannot overwrite a current session; unknown/custom-without-duration IDs are ignored. EN/TL/CEB source and target labels are authored; unsupported locales use English.

## Verification

31/31 affected checks PASS: real approved public catalog mappings/immutability, publication/rights/type/topic denials, bounded/deduplicated IDs, private-field exclusion, actual item rendering/context reset, route preview/explicit start, unknown route rejection, persisted session/reflection preservation, existing Library recovery/routing, conversation handoff and practice localization/controller checks. Typecheck, production build, lint/format, browser-script syntax and whitespace pass locally on Node 24.22.1.

Existing built-artifact Library browser coverage now follows a real public reading to the canonical practice route, checks no auto-start, explicitly begins/pauses/reloads and verifies a new guide preserves the timer at each existing locale/viewport. Browser execution and fresh exact-head CI remain pending; no device, full-V8 or production certification claim. No schema/provider writes or real-user notifications.
