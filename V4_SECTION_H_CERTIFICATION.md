# BibleQuest V4 Section H certification

## Status

Section H automated/browser release gates are certified from exact tested candidate `d99965db288340d61cebfb3029d807dabb6b8490`.

The tested candidate is preserved at `release/v4-section-h`. It was merged into `v4/modern-ui-overhaul` by PR #147 as merge commit `69679e929b070fe330747ceaf18361a8fc9cb127`.

## Exact evidence

- Dedicated Section H workflow `34692818724`: PASS.
- Whole-app browser audit `34692818768`: PASS.
- Protected-page audit `34692818740`: PASS.
- Final Games artwork verification `34692818742`: PASS.
- Full accumulated build/architecture/edge/browser-mobile regression `34692817888`: PASS.
- Verification-only PR #148 was closed without merge after the accumulated regression passed.

## Automated/browser gates closed

Repository evidence verifies the 320, 360, 390, 412 and 430 px phone widths; tablet portrait/landscape; desktop; phone landscape/orientation; safe-area contracts; keyboard-only traversal; visible focus treatment; browser accessibility semantics on major workflows; reduced-motion preference; route-loaded resource ceilings; PWA manifest/service-worker/installability prerequisites; offline shell reload; and reconnect recovery.

Browser semantic checks are evidence for accessible names/landmarks/focus behavior, not a claim of physical TalkBack/VoiceOver field testing.

## Real defects found and fixed

1. The V4 shell previously handled the bottom safe area but did not fully protect the top/left/right insets. `src/ui/section-h-release-gates-v4.css` now protects the shell, sticky top bar and fixed navigation with all four safe-area inset variables.
2. Calendar add/edit date inputs were exposed without an accessible name. Both Calendar add/edit title/date controls now have explicit accessible names. No Calendar storage, synchronization, permissions, routing or event behavior changed.
3. The earlier Calendar certification test byte-locked the feature owner before the accessibility correction. Its guard now permits exactly the two repeated accessibility labels while continuing to byte-lock the service and reject every other Calendar feature-owner change.

## Field gates intentionally still open

The following cannot be honestly certified from headless Chromium/CI alone and remain field checks:

- Installed-PWA behavior on a real device.
- Physical Android Chrome at 100% zoom.
- Physical Android Brave at 100% zoom.

These field checks do not invalidate the automated Section H certification; they remain release evidence to collect before final promotion.