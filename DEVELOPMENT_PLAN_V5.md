# BibleQuest V5 Development Plan

Updated: 2026-09-13 JST
Authority: `V5_ACTIVE_STATUS.md`
Integration branch: `v5/feature-completion`
Starting baseline: current production `main`

## 1. V5 line in the sand

V4 modernized presentation and repaired concrete privacy/architecture gaps it found along the way, but a modernization pass is not a completeness pass. Several real product features are unfinished, stubbed, deferred, or missing outright - on the *current*, already-working architecture. Changing architecture before finishing the product built on it means re-doing unfinished work twice, on two different foundations, for no reason.

**V5 does not change architecture.** No build-tooling change, no state-ownership change, no new client platform. V5 finishes what V4-and-earlier left incomplete, using the same patterns already established and proven (single-owner services, server-authoritative RLS, the exact-SHA verify → gate → freeze pipeline). The architecture-replacement work that was originally going to be called V5 is renumbered **V6** (`DEVELOPMENT_PLAN_V6.md`); the full motion/sound/polish rollout that depends on it is renumbered **V7** (`DEVELOPMENT_PLAN_V7.md`). Neither begins until V5 is certified.

## 2. Repository evidence driving this plan

Every item below is a concrete, previously-identified gap - not a generic wishlist:

- the Leader Center is explicitly, officially skipped (`src/app/ministry-hub.js` marks its Leader Dashboard slot unavailable/not migrated); the response-review model (Phase 1) and ministry-role presence data (Phase 3) it needs already exist unused;
- Admin Console has no email-change or account-recovery action - identified as a real gap while drafting the Gate A field-test script, not a hypothetical;
- the Phase 2 admin emergency actions (suspend/reactivate/force-sign-out/temp-password) have a working backend and app-layer service but **no UI** - there are no buttons for them anywhere in the Admin Console page;
- `src/features/games/index.js` and `src/features/games/memory.js` still render 21 raw emoji as game chrome/card faces despite the V4 asset system having matching unused art, deferred across three separate tranches because the render function is too dense to touch safely;
- Congregation Recognition still shows emoji for 3 of 9 badge/award codes (comeback, reflection, most-improved - no matching asset exists) and its award-selection `<select><option>` list can never show icons at all (a permanent platform limitation of native `<option>` elements, not a missed fix);
- Couples Family/Cloud, Notification Center (5 of 10 types), and Encouragements (2 of 5 presets) still have unwired emoji category icons with matching unused assets sitting idle in `assets/v4/`;
- `src/app/media-library.js` and `src/features/media-library/index.js` are dead code - no live route uses them since Live Recordings and Media Library merged into Videos - but they remain required by the main architecture validator and were never cleaned up;
- there is no real Web Push delivery - `src/app/notification-center.js` is fetch/read-state only; a user who does not have the app open never learns about a new assignment or announcement;
- `sw.js` is a retirement/cache-clearing worker, not an offline content strategy - "works offline" is not actually true for Bible reading today;
- Gate C (cross-congregation isolation) is blocked because production has exactly one populated congregation - there is no second-congregation product path to even test against, meaning multi-congregation behavior is largely unverified in practice;
- CEBOCB (Cebuano/Bisaya) Reader integration was integrated once but has never been re-verified as still intact through the several tranches that have touched Reader/translation code since;
- Couples Journey's "shared" communication assessment needs verification that it is genuinely bidirectional (spouse can see spouse's relevant summary) rather than a single-account self-assessment that merely uses the word "shared" in its copy;
- the V4 whole-app audit's Section E (16 items: re-verify already-converted areas still work together) and part of Section G (systematic loading/empty/error/offline state audit across every screen) were explicitly left open for "the gates instance" and, as far as repository evidence shows, never actually completed.

## 3. Execution model

Same discipline as every prior version: one serialized integration stream, exact-SHA verified checkpoints, full accumulated regression before every freeze, honest recording of what's deferred versus done. Each phase:

1. confirms the gap still exists against current `main` before starting (repository evidence, not this document, is authoritative by the time work begins);
2. builds the missing piece using patterns already established elsewhere in the app - no new architecture, no new state-ownership model;
3. adds real regression coverage for the new behavior;
4. runs the full accumulated suite fresh before every push;
5. records what remains honestly deferred, if anything, rather than silently narrowing scope.

---

# Phase 1 — Leader Center

## Scope

Build the previously-skipped Leader Center using only what already exists: Phase 1's response-review model, Phase 3's ministry-role-scoped presence RLS, the existing Assignments/Congregation/Journey Groups/Team Center owners as composition sources. The Leader Center is a navigation/composition layer over these, not a new backend.

- Overview: congregation snapshot, role, member count, active-in-30-min count (reusing the existing aggregate, now with the ministry-role raw-presence option already unlocked).
- Assignments: published/scheduled/completed split, response review (already built, just needs a real entry point beyond the inline per-assignment section).
- People: ministry-relevant congregation directory only - explicitly never private notes, Transform answers, Couples content, or personality/psychometric answers.
- Groups & Teams: composition over the existing Journey Groups/Team Center owners, not a new backend.

## Exit gate

Ordinary members cannot reach any Leader Center route (both hidden and independently role-checked server-side, matching the established "hiding is not authorization" rule). Full accumulated regression green including a real member-vs-leader access-denial browser test.

---

# Phase 2 — Admin Console completion

## Scope

- Build the missing UI for the already-working Phase 2 backend: user card (identity/congregation/security sections), severity-tiered action buttons (Safe/Restricted/Destructive, per the original governing plan), typed confirmation for destructive actions.
- Add the missing email-change/recovery action as a new, owner-only, audited Edge Function action following the exact pattern already used for `set_temp_password` (server-side validation, session revocation, no sensitive value in the audit log).
- Complete the real field verification this unblocks: with a working UI, Gate A's manual test script (already written) becomes actually runnable.

## Exit gate

Every emergency action has a real button, a real confirmation step matching its severity tier, and an audit-log entry. Email-change is proven end-to-end against a real Supabase Auth account in a controlled test, not just unit-tested.

---

# Phase 3 — Icon/artwork completion

## Scope

Finish the icon-wiring priority list left open after the V4 whole-app audit:

- Games: replace all 21 emoji with the matching unused assets already in `assets/v4/games/` and `assets/v4/memory-meadow/` - the markup-restructuring risk that deferred this three times must finally be taken on directly, carefully, one phase at a time (medals/HUD first, then Memory Meadow card faces).
- Congregation Recognition, Couples Family/Cloud, Notification Center, Encouragements: wire every remaining code/type/preset that has a genuine matching asset. Codes with no honest match stay as emoji, explicitly documented, not forced.
- Delete `src/app/media-library.js` and `src/features/media-library/index.js`, updating the main architecture validator's required-file list and `ARCHITECTURE_V3.md` in the same change so nothing is left in an inconsistent state.

## Exit gate

A repeat of the V4 whole-app emoji/glyph scan finds only the explicitly-documented exceptions (directional UI arrows, content-data emoji tied to certified designs, codes with no honest asset match) - not new unaddressed gaps.

---

# Phase 4 — Push notifications (minimum real version)

## Scope

A real, minimum-viable Web Push implementation - not the full V6/V7-era media/offline platform, just working push delivery on top of the current architecture:

- subscription capture and storage (device/account-scoped, matching existing privacy patterns);
- server-side push send for the notification types that already exist in-app (assignment, encouragement, announcement, award);
- explicit per-category opt-in/opt-out, defaulting to off until the user enables it;
- in-app inbox remains the fallback/source of truth - push is a delivery channel for it, not a second notification system.

## Exit gate

A user with push enabled and the app closed receives a real push notification for a new assignment and can tap through to it. A user with push disabled sees no behavior change from today.

---

# Phase 5 — Baseline offline Bible reading

## Scope

A real, minimum offline strategy for Scripture text specifically - not the full versioned-content-pack architecture planned for V6:

- cache the currently-open translation/book on read, so re-opening the same passage works offline;
- an explicit "available offline" indicator so users know what will and won't work without a connection;
- `sw.js` gains this one real responsibility without becoming a general-purpose cache-everything worker (that's V6's job, done properly with a real strategy).

## Exit gate

A user who has read a passage, then goes offline, can reopen that same passage and read it. Passages never opened while online correctly show as unavailable rather than a blank/broken page.

---

# Phase 6 — Multi-congregation verification and minimum tooling

## Scope

- Stand up a second, real test congregation in a controlled way so Gate C's cross-congregation isolation testing is actually possible, not permanently blocked.
- Minimum product tooling: if a user belongs to more than one congregation, a real, visible way to see and switch which one is active, rather than the app silently picking the first membership (the current behavior in several features, including Calendar and Home's presence indicator).

## Exit gate

Gate C can run for real. A multi-congregation user can see and switch their active congregation from the UI, and every feature that reads "the" congregation (Calendar, presence, assignments) respects the switch.

---

# Phase 7 — Verification debt: CEBOCB, Couples Journey, whole-app Sections E/G

## Scope

- Re-verify CEBOCB Reader integration is genuinely still intact against current `main`, not assumed from a past checkpoint.
- Verify Couples Journey's shared-communication feature is genuinely bidirectional between spouses, not a same-account-only self-assessment; fix if it is not.
- Complete the V4 whole-app audit's deferred Section E (re-verify already-converted areas still work correctly together) and the systematic loading/empty/error/offline state sweep from Section G that was left for "the gates instance."

## Exit gate

Each of these three items gets an explicit PASS/FAIL recorded with real evidence in `V5_ACTIVE_STATUS.md` - no more silent "left for later."

---

# Phase 8 — V5 certification and promotion

Full accumulated regression, exact-SHA candidate freeze, staged promotion following the same rollback-preserving discipline as every prior version. V4 remains the production fallback until V5 is explicitly accepted.

## Exit gate

All Phase 1-7 exit gates pass on one exact-SHA candidate. `DEVELOPMENT_PLAN_V6.md` (architecture upgrade) may begin only after this phase closes.
