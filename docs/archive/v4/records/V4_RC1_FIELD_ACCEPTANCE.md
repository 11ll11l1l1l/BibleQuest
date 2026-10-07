# BibleQuest V4 RC1 field acceptance protocol

## Candidate under test

- RC branch: `release/v4-rc1`
- Exact SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- Promotion PR: #151
- Automated certification: `V4_RC1_AUTOMATED_CERTIFICATION.md`

This protocol records the release evidence that cannot be honestly replaced by headless Chromium or responsive emulation.

## Rule before testing

The tested site/environment must correspond to RC1 exact candidate `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`, or an explicitly verified deployment of those same application bytes. Do not count the current production site merely because it loads: production follows `main` and remains the previous release until V4 is promoted.

If no exact-RC preview/staging deployment can be identified, leave preview/staging and physical-device RC acceptance OPEN rather than testing unrelated production bytes.

## A. Preview/staging smoke

Status: **PASS — 2026-09-12 JST**

Exact deployment evidence:

- Cloudflare Pages check run: `103560676216` (`Cloudflare Pages: mybiblequest`) — **SUCCESS** on exact head SHA `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`.
- Cloudflare deployment identifier: `9748307b-66e4-44d6-857d-80aa3b7a6e42`.
- Immutable preview URL: `https://9748307b.mybiblequest.pages.dev`.
- Branch preview URL: `https://release-v4-rc1-preview.mybiblequest.pages.dev`.
- Final verification-only remote smoke: workflow run `34697229965`, job `103562690126` — **PASS**.
- Verification workflow branch: `verify/v4-rc1-cloudflare-smoke` @ `2d90abc83ee058b7561ab3822b577dfbf8943540`; this branch contains only the external verifier and is not the release candidate.

Required evidence:

- [x] Exact RC1 deployment identity is known/verifiable. Cloudflare check is attached to the exact RC1 SHA.
- [x] Home loads without blank screen or permanent loader. Remote smoke passed at 390x844 with body width 390/390.
- [x] Home assignment/status surface renders safely for the available account state. `[data-home-assignments]` was present.
- [x] Home shortcut rail works and does not cause horizontal document overflow. Rail was present, Home remained 390/390, and the Progress/Grow shortcut was clicked successfully.
- [x] Reader opens and renders content. Reader route passed with rendered content and no overflow.
- [x] Play opens and at least one game launches and returns normally. Memory Meadow launched and returned to the game launcher successfully.
- [x] Grow/Progress opens. Direct Grow route passed and Home shortcut rail -> Grow navigation passed.
- [x] More opens and representative lower-frequency destination navigation works. More route passed and More -> Backup navigation passed through the shipped control.
- [x] Account/sign-in surface is reachable. Account route passed.
- [x] No obvious console/page/runtime failure is observed in the smoke environment. No page errors or startup-failure surface occurred in the passing run.
- [x] Offline/reconnect behavior remains consistent with the automated contract where the environment permits testing. Service worker became active, offline reload rendered the Home shell, then reconnect -> Reader passed.

The final run also directly passed Home, Reader, Play, Assignments, Calendar, Community, Backup, More, Account and Grow with no document-level horizontal overflow at the 390 px staging viewport.

## B. Installed PWA on a real Android device

Status: **OPEN**

Required evidence:

- [ ] Install/add BibleQuest using the browser's install-PWA path for the exact RC deployment.
- [ ] Launch from the installed app icon/standalone surface.
- [ ] Home renders in standalone mode.
- [ ] Bottom/top navigation remains usable with device safe areas.
- [ ] Reader opens.
- [ ] At least one game launches and returns.
- [ ] Background/close/reopen does not strand the app on a permanent loader.
- [ ] Offline launch shows the intended offline shell/available local content rather than a browser error page.
- [ ] Reconnect restores normal online behavior without requiring storage deletion/reinstall.

## C. Physical Android Chrome — 100% zoom

Status: **OPEN**

Required evidence:

- [ ] Browser zoom/text zoom used for the release check is 100% unless an OS accessibility setting is intentionally being tested separately.
- [ ] Home has no document-level horizontal overflow.
- [ ] Sticky top bar and bottom navigation remain fully visible and tappable.
- [ ] Shortcut rail scrolls independently without dragging the whole document sideways.
- [ ] Reader content remains readable and controls remain reachable.
- [ ] Assignments, Calendar, Couples, Community and Backup representative screens show no severe clipping/overlap.
- [ ] One game is playable and its controls remain reachable.
- [ ] Keyboard/input workflows tested on at least one form do not become unusable when the software keyboard opens.
- [ ] Rotation portrait -> landscape -> portrait does not leave the shell in a broken layout.
- [ ] No blank screen, permanent loader, impossible navigation, or severe overflow is observed.

## D. Physical Android Brave — 100% zoom

Status: **OPEN**

Repeat the Chrome matrix in Brave:

- [ ] Home/no horizontal document overflow.
- [ ] Shell/navigation/safe areas usable.
- [ ] Home shortcut rail usable.
- [ ] Reader usable.
- [ ] Representative Assignments/Calendar/Couples/Community/Backup pages usable.
- [ ] One game launches/returns.
- [ ] Representative form + software-keyboard behavior usable.
- [ ] Portrait/landscape recovery usable.
- [ ] No blank screen, permanent loader, impossible navigation, or severe overflow.

If Brave Shields changes expected network behavior, record the Shields setting used; do not silently weaken application security or privacy controls to accommodate a browser-specific test.

## Failure rule

A reproduced P0/P1 field defect blocks promotion. Record the exact device/browser, route, steps, visible result, expected result, and whether the same defect reproduces in the other browser.

A runtime/product fix creates a new candidate and invalidates RC1 exact-SHA certification. Create RC2 (or later), run focused regression for the defect, then rerun the complete applicable release suite.

Cosmetic P2/P3 observations that do not break release-critical usability should be documented separately and must not be used to justify an unverified late product change.

## Pass rule

The field gate is complete only when:

1. the exact-RC preview/staging identity is verified and its smoke passes;
2. installed-PWA real-device acceptance passes;
3. physical Android Chrome 100% acceptance passes;
4. physical Android Brave 100% acceptance passes.

Only then may PR #151 be considered for promotion to `main`, followed by independent Cloudflare production identity and production-browser verification.
