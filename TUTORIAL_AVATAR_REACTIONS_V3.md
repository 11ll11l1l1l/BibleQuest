# BibleQuest v3 Tutorial Avatar Reactions (#85)

Status: functionally verified at exact candidate `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c`; targeted run `34499623045` and complete accumulated run `34499796826` passed. Bookkeeping/freeze still require a separate exact-SHA gate.

## Recovered contract

Retained `onboarding-tutorial.js`, `tutorial.css`, and `assets/tutorial-trainer-sprite.webp` establish the visual trainer contract. The retained trainer has eight sprite states in a 4x2 sheet: `welcome`, `right`, `left`, `up`, `down`, `thumbs`, `surprise`, and `thoughtful`. Tutorial steps select a state deterministically; Back/Next re-render the matching state. The trainer has no independent persistence, account state, scoring, backend state, or answer-driven state machine.

The six verified v3 #84 tutorial steps map to the retained semantic states without inventing new reactions: Welcome -> `welcome`; Daily Journey -> `down`; Learn/Read -> `up`; Grow -> `thumbs`; More/feature map -> `thoughtful`; Ready/final -> `thumbs`.

The retained presentation uses `assets/tutorial-trainer-sprite.webp`, a 400% x 200% background sheet with positions 0/33.333/66.666/100 percent across the two rows, a gentle bob animation, a 122px mobile trainer, and animation disabled under `prefers-reduced-motion: reduce`.

## v3 ownership

`src/features/tutorial/trainer.js` is static presentation configuration only. It owns the supported state names and the deterministic six-step mapping. It does not own tutorial lifecycle, persistence, routing, account state, Progress, Storage, APIs, or DOM lifecycle.

`src/features/tutorial/index.js` remains the single #84 overlay presenter. It consumes the trainer mapping and renders the state into the already-owned trainer slot. `src/ui/tutorial.css` owns sprite presentation, responsive sizing/positioning, and reduced-motion behavior. `src/app/tutorial.js` remains the sole tutorial lifecycle/completion owner.

No legacy `window.BQ*`, MutationObserver, direct browser storage, Supabase, fetch, scoring, or second tutorial state owner is introduced.

## Verification evidence

Targeted run `34498989910` reproduced only a CSS zero-unit serialization issue in the new test; product runtime was unchanged. Targeted run `34499380103` reproduced only a transformed bounding-box measurement issue caused by the retained trainer bob rotation; runtime was unchanged. Both test defects retain corrected regression coverage.

Exact candidate `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c` then passed targeted run `34499623045` and complete accumulated functional run `34499796826`, including architecture, edge/security, browser/mobile, reduced-motion and offline behavior.

## Scope boundaries

In scope: correct retained trainer state per current tutorial step, all retained sprite cells, Next/Back state changes, mobile 122px positioning without horizontal overflow, reduced-motion behavior, and offline reuse through the already verified #98 shell cache.

Out of scope: changing tutorial text/lifecycle/completion rules (#84), Avatar Vault ownership (#82), quiz-answer reactions, new emotion persistence, new XP/rewards, new backend contracts, or production deployment.
