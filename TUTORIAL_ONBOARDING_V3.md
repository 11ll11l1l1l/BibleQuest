# BibleQuest v3 Tutorial / Onboarding Trainer (#84)

Status: **Verified functional candidate** at `9f4f018356e48b4f7d7c62887761cffd8278fbd5`; targeted run `34495068372` and complete accumulated functional run `34495260019` passed. Release promotion still requires a separate exact-SHA bookkeeping gate.

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

#84 adds no service worker, cache manifest, or PWA owner. `index.html` loads `src/ui/tutorial.css` and bootstrap imports the tutorial modules, so the existing offline-shell resource warmup owns caching of those already-loaded same-origin assets. Offline acceptance verifies behavior rather than creating a second cache system.

## Verification evidence

- Run `34493685748`: rejected. An early candidate auto-opened the tutorial on anonymous Home and intercepted existing shell/account interaction. Retained production behavior proved that trigger was incorrect.
- Run `34494727258`: rejected. Runtime/shell were green, but the tutorial browser test had an off-by-one finish sequence. Only the test was corrected.
- Run `34495068372` at exact SHA `9f4f018356e48b4f7d7c62887761cffd8278fbd5`: targeted exact-SHA assertion, architecture/privacy validator, lifecycle edges, shell compatibility, account recovery-save handoff, mobile and offline checks all passed.
- Run `34495260019` at the same exact product SHA: the complete accumulated architecture validators, edge/security regressions, and browser/mobile suite all passed.

Permanent evidence:
1. `scripts/validate-v3-tutorial-onboarding.mjs` enforces ownership, trigger, recovery privacy, #85 separation, and accumulated-workflow inclusion.
2. `tests/v3-tutorial-onboarding-edge.mjs` verifies open/Next/Back/Skip/Finish/persistence/completed guard/force-open/malformed-state handling.
3. `tests/v3-tutorial-onboarding-smoke.mjs` verifies unobstructed anonymous Home, one overlay, launcher behavior, recovery-code save gating/no-payload handoff, no browser-storage secret leak, mobile controls/overflow, persistence/reload, route action and offline operation.
4. `.github/workflows/v3-regression.yml` permanently invokes all #84 evidence while remaining `workflow_dispatch` only on the product branch.

## Promotion rule

The functional SHA is not the release SHA once bookkeeping files change. The exact bookkeeping candidate must independently pass inventory validation plus the complete accumulated architecture, edge/security and browser/mobile workflow. Only that exact green bookkeeping SHA may be frozen as `release/v3.57-tutorial-onboarding`.
