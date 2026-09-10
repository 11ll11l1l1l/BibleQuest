# BibleQuest v3 Tutorial / Onboarding Trainer (#84)

Status: implementation candidate; not promoted until exact-SHA verification.

## Recovered contract

Retained production `onboarding-tutorial.js`, `tutorial-launcher.js`, and historical tutorial commits establish the #84 behavior boundary:

- provide a trainer-led multi-step first-run onboarding flow after account creation;
- persist completion only when the guide is finished;
- support Next, Back, temporary Close/Skip, Finish, and actionable handoffs into real BibleQuest destinations;
- never mount duplicate tutorial overlays;
- keep a permanent Home launcher that can force-open the guide after completion;
- after account creation, keep the one-time recovery code visible and non-dismissible until the existing Account owner confirms that the user saved it, then hand off to onboarding;
- keep recovery-code material private and out of tutorial state, global events, logs, analytics, URLs, and browser-session scratch storage;
- remain usable on mobile and through the existing installed/offline shell after assets have been warmed;
- keep the tutorial surface in English where the retained account/onboarding contract requires it.

Retained production does **not** auto-open the full tutorial merely because an anonymous guest lands on Home. Its automatic trigger is account-created/pending-recovery onboarding; `tutorial-launcher.js` supplies the permanently available manual launcher. v3 preserves that trigger boundary so ordinary guest navigation remains usable.

## v3 ownership

`src/app/tutorial.js` is the sole #84 lifecycle and completion-persistence owner. It uses the existing shared `storage` boundary; it does not access `localStorage`, `sessionStorage`, routing, DOM, Supabase, or progress state directly.

`src/features/tutorial/index.js` is the single overlay presenter. It renders exactly one mounted layer, forwards Next/Back/Close/Finish actions to the tutorial service, and delegates destination changes to the existing router callback.

`src/features/home/index.js` owns only the persistent Home launcher presentation. It invokes the supplied tutorial callback; it does not own completion state.

`src/features/account/index.js` remains the recovery-code presentation/security owner. Signup completion passes only a no-argument callback to the tutorial after the user checks that the code was saved. The recovery code itself never enters tutorial state.

`src/app/bootstrap.js` composes these owners. The existing Router remains navigation/history owner, `src/core/storage.js` remains browser-persistence owner, and `src/app/offline-shell.js` remains PWA/offline owner.

## First-run and reopen semantics

On a newly created account, the existing Account flow first requires the user to save the one-time recovery code. Only after that confirmation does Account invoke the no-payload tutorial callback. Closing the guide is temporary and does not mark completion. Finishing persists completion. A normal future onboarding open respects the completed state, while the permanent Home launcher uses force-open semantics and therefore works after completion.

An anonymous Home load remains unobstructed, matching retained production behavior. The tutorial layer is mounted once at bootstrap but remains hidden until Account onboarding or the Home launcher opens it.

## Account and recovery-code safety

The tutorial does not receive a recovery code. Account creation continues to render the one-time code inside the Account feature, keeps Continue disabled until the user checks that the code was saved, and only then invokes `onTutorial()` with no payload. Password-recovery and recovery-code rotation flows remain Account-only and do not start onboarding.

## #85 is explicitly separate

#85 Tutorial avatar reactions remains **Not started** during #84. The #84 presenter intentionally uses only a static `BQ` trainer mark. It contains no trainer reaction state, sprite selection, animated emotional response system, or answer-driven avatar behavior. Those are #85 scope and must receive their own owner, tests, exact-SHA gate, and promotion transaction.

## PWA/offline boundary

#84 adds no service worker, cache manifest, or PWA owner. `index.html` loads `src/ui/tutorial.css` and bootstrap imports the tutorial modules, so the existing offline-shell resource warmup owns caching of those already-loaded same-origin assets. Offline acceptance must verify behavior rather than create a second cache system.

## Acceptance evidence required before promotion

1. Service edge tests: normal fresh open, Next/Back, temporary Skip, Finish persistence, completed-state guard, force-open after completion, invalid persisted-state fallback.
2. Browser/mobile smoke: guest Home remains unobstructed, exactly one hidden overlay layer is mounted, permanent launcher opens it, controls work, no duplicate layer appears, finish persists across reload, force-open still works after completion, real route handoff works, and mobile/offline behavior remains usable.
3. Architecture validator: one-owner boundaries, no direct browser storage/global BQ/MutationObserver/Supabase in #84 owners, recovery-code isolation, #85 remains Not started, workflow contains permanent #84 evidence.
4. Complete accumulated exact-SHA functional regression gate.
5. Separate exact-SHA bookkeeping gate before release freeze.
