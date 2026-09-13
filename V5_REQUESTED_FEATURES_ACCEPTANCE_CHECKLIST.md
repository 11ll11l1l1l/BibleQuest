# BibleQuest V5 Requested Features Acceptance Checklist

Updated: 2026-09-13 JST
Scope: product-completeness work on the current architecture. See `DEVELOPMENT_PLAN_V5.md` for full phase detail.

## A. Phase 1 — Leader Center

- [ ] Overview view: congregation snapshot, role, member count, active-in-30-min.
- [ ] Assignments view: published/scheduled/completed split.
- [ ] Response review reachable as a real navigation destination, not only inline per-assignment.
- [ ] People view: ministry-relevant directory only - verified to exclude private notes, Transform, Couples, personality/psychometrics data.
- [ ] Groups & Teams view composes existing Journey Groups/Team Center owners, no new backend.
- [ ] Ordinary members cannot reach any Leader Center route - verified both by hiding and by independent server-side role check.

## B. Phase 2 — Admin Console completion

- [ ] User card UI: identity, congregation, security sections.
- [ ] Safe/Restricted/Destructive severity-tiered action buttons exist for every Phase 2 backend action.
- [ ] Typed confirmation required for every Destructive action.
- [ ] Email-change/recovery Edge Function action built, owner-only, audited, no sensitive value logged.
- [ ] Email-change proven end-to-end against a real test Supabase Auth account.
- [ ] Gate A's existing manual field-test script is actually runnable against the finished UI.

## C. Phase 3 — Icon/artwork completion

- [ ] Games: all remaining emoji replaced with matching existing assets (medals/HUD chrome first, then Memory Meadow card faces).
- [ ] Congregation Recognition: remaining codes with a genuine asset match wired; codes with no match remain explicitly documented exceptions.
- [ ] Couples Family/Cloud, Notification Center, Encouragements: remaining matchable icons wired.
- [ ] `src/app/media-library.js` and `src/features/media-library/index.js` deleted.
- [ ] Main architecture validator's required-file list and `ARCHITECTURE_V3.md` updated in the same change as the deletion.
- [ ] Repeat whole-app emoji/glyph scan finds only documented exceptions.

## D. Phase 4 — Push notifications (minimum)

- [ ] Push subscription capture and storage, device/account-scoped.
- [ ] Server-side send for assignment, encouragement, announcement, and award notification types.
- [ ] Per-category opt-in, defaulting to off.
- [ ] In-app inbox remains source of truth; push is a delivery channel only.
- [ ] Real device test: app closed, push enabled, notification received and tappable.
- [ ] Real device test: push disabled, no behavior change from pre-Phase-4 app.

## E. Phase 5 — Baseline offline Bible reading

- [ ] Currently-open translation/book cached on read.
- [ ] "Available offline" indicator shown to the user.
- [ ] Reopening a previously-read passage works with no network connection.
- [ ] Never-opened passages fail gracefully offline, not blank/broken.

## F. Phase 6 — Multi-congregation verification and tooling

- [ ] A real second test congregation exists, unblocking Gate C.
- [ ] Gate C cross-congregation isolation actually executed with real evidence.
- [ ] Active-congregation switcher visible and functional for multi-congregation users.
- [ ] Calendar, presence, and Assignments all respect the active-congregation switch (not just the first membership).

## G. Phase 7 — Verification debt

- [ ] CEBOCB Reader integration re-verified intact against current `main`, with evidence, not assumed.
- [ ] Couples Journey shared-communication feature verified genuinely bidirectional between spouse accounts; fixed if not.
- [ ] V4 whole-app audit Section E (re-verify already-converted areas) completed with evidence.
- [ ] V4 whole-app audit Section G's deferred loading/empty/error/offline state sweep completed with evidence.

## H. Phase 8 — Certification and promotion

- [ ] Full accumulated regression green on one exact candidate SHA.
- [ ] All of Sections A-G above PASS on that same exact SHA.
- [ ] V4 preserved as rollback until V5 is explicitly accepted.
- [ ] `V5_ACTIVE_STATUS.md` updated to reflect promotion before `DEVELOPMENT_PLAN_V6.md` work begins.
