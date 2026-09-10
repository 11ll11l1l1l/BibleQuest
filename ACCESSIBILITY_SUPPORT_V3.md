# BibleQuest v3 Accessibility Support (#86)

Status: implementation candidate. Promotion requires targeted verification followed by the complete exact-SHA accumulated regression gate.

## Recovered contract

Retained `accessibility-runtime.js`, `accessibility-runtime.css`, and `journey-accessibility.js` establish device-local readability and keyboard support: normal/large/extra-large text, follow-device/reduced/full motion choices, normal/stronger contrast, visible keyboard focus, dialog semantics and keyboard focus containment, Escape behavior owned by the dialog, and reduced-motion behavior.

The legacy runtime directly used browser storage, exposed `window.BQAccessibility`, and depended on MutationObserver. Those mechanisms are not ported into v3.

## v3 ownership

`src/app/accessibility.js` is the single accessibility preference owner. It normalizes and persists text/motion/contrast settings only through the existing shared `storage` service and converts the device reduced-motion media preference into one effective motion state.

`src/ui/accessibility.js` is the single global accessibility presentation runtime. It subscribes to the service, applies root presentation attributes, and contains keyboard focus inside the currently visible modal dialog without discovering or mutating features through MutationObserver.

`src/features/accessibility/index.js` owns the explicit Accessibility settings page reached from More. Existing Router, shell, feature dialogs, account, Progress, API/backend and Storage implementations keep their existing ownership.

## Accessibility behavior

- Text choices: `normal`, `large`, `xlarge`.
- Motion choices: `system`, `reduce`, `full`; `system` follows `prefers-reduced-motion` changes while the app is open.
- Contrast choices: `normal`, `strong`.
- Preferences persist on the current device through the shared storage boundary and therefore follow existing backup/reset rules.
- Keyboard focus has a globally visible `:focus-visible` treatment.
- Route rendering keeps the existing shell behavior of moving focus to the main view.
- Visible modal dialogs retain focus while tabbing; dialog-specific Escape/close semantics remain owned by the feature dialog rather than duplicated by Accessibility.
- No accessibility preference writes account/cloud data, awards Progress, changes Router ownership, or creates a second dialog lifecycle.

## Verification boundary

Required verification covers malformed stored preference normalization, option validation, persistence, device reduced-motion changes, cleanup, More → Accessibility routing, labeled controls, keyboard focus visibility/order, modal focus containment, 390px readability/no horizontal overflow, preference persistence across reload, and reduced-motion presentation.
