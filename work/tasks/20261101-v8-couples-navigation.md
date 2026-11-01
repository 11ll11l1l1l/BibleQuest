# V8 Couples saved cards and deck navigation

Baseline: integration `8c35506137a7189a0bb8d8550d77a006445f81cd`, PR #1558. One executor; coding-first bounded continuation.

## Change

The existing local Couples service already persisted saved IDs but the dashboard had no saved-card browser. Add a saved-card entry with count, reopen, saved-only cycling, removal and empty state. Uses the existing single storage owner; no cloud writes or new storage. New view copy supports EN/TL/CEB; existing Taglish cards remain unchanged.

Another card and Discussed now retain the selected category, family/couple track or themed deck and its heading. Save/re-render retains the same selection. Reader handoff still passes the current canonical card to the existing Reader callback. Saved-card Back returns to the saved list. The inherited 64-card bank, references, safety framing and Couples Cloud remain unchanged. Full question-bank expansion and full Couples localization remain open.

## Verification

Four new controller tests with the real local service pass: category continuity, track/themed continuity, saved reload/cycle/removal/empty and source-preserving TL/CEB rendering. Existing local Couples edge and Communication Journey edge/static checks pass. Typecheck, production build, lint/format and whitespace checks pass locally on Node 24.22.1; no pinned-toolchain/device certification claim. Existing mobile browser smoke now includes saved/reload/remove and selected-category continuity; browser execution awaits exact-head CI.

Also reconciles the remaining inherited source-guide browser expectation from five to six Bible translations and explicitly checks the Ilocano source entry. Existing escaping/rights tests are retained.

## Prior candidate CI

Baseline whole-app browser, deployed Cloudflare/PWA/offline smoke and build/PWA/performance passed. Inherited run 41238481104 reached browser tests and failed the obsolete source-guide translation count (fixed here). Convergence run 41238481235 passed static/build/API gates but failed authenticated browser with route.fetch TargetClosedError; unresolved, no full-green claim. Full QA remains deferred; new exact-head CI and physical acceptance remain open. No production promotion or database/provider mutations.
