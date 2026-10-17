# BibleQuest V7 — Post-release UI QA execution and handoff ledger

Created 2026-10-17 JST. Initial status: DOCUMENTED, NOT IMPLEMENTED. This is a **phase execution tracker**, not a new production release authority. Use the current live V7_ACTIVE_STATUS.md and existing release contracts for actual deployment/certification.

Master specification: V7_POST_RELEASE_UI_QA_CORRECTIONS_20261017.md.
Defect inventory: V7_POST_RELEASE_UI_QA_DEFECT_LEDGER_20261017.md.
Initial verified repository main commit: 3df992466fdf3d0fcc7b4c9101f3841125378cdd (Calendar correction PR #1546).
Production current SHA MUST be rechecked at the start of Phase 00; the initial verified repository commit must not be assumed to remain production forever.
Documentation is presently authored on docs/v7-postrelease-uiqa-20261017. If still a PR, fetch that branch. Once merged, prefer main.

Allowed state transitions:
- OPEN -> IN_PROGRESS after inspecting live head and reserving owned surfaces.
- IN_PROGRESS -> PASS only when code, affected tests, browser evidence (where applicable), reviewed integration and GitHub handoff are documented.
- IN_PROGRESS -> BLOCKED when exact missing access/CI/browser evidence is named.
- OPEN/IN_PROGRESS -> NOT_APPLICABLE only with verified current-production evidence, source SHA and rationale.
- PASS -> OPEN when a later regression demonstrably invalidates acceptance; cite defect.
- Never enter PASS based solely on 'PR open', agent assertion or static reasoning.

## Phase tracker

| Phase | Task | Dependency | Defect IDs | Status | PR / merged SHA / tests / evidence |
|---|---|---|---|---|---|
| 00 | Baseline reproduction / fixture seed | Docs PR available | All IDs, especially R01 R02 G01 | BLOCKED | User-confirmed phone screenshots inspected: S1 You, S2 ONE 2 ONE, S3 Library, S4 Reader, S5 Home. These establish phone-observed layout issues but do not expose CSS viewport/DPR, deployed SHA, theme metadata for every route, or clean reusable browser fixtures. Keep strict matrix blocked; use screenshot evidence to prioritize visible corrections. |
| 01 | Reader player geometry | 00 P0 reproduction or evidence-backed skip | R01 R02 R08 G01 | IN_PROGRESS | Screenshot S4 confirms audio player obscures Scripture and bottom navigation covers reading content. Source fix + responsive browser assertions on branch codex/v7-uiux-phase-00-01-20261017; exact browser CI and phone DOM evidence pending. |
| 02 | Reader player controls and status | 01 | R03 R04 R06 R07 R09 | IN_PROGRESS | Screenshot S4 confirms compressed Auto-next and Audio options labels plus `--:--`. Auto-next moved inside Audio options; duration unavailable has localized copy. Reader browser assertions added; exact browser CI pending; do not mark PASS until Phase 01 checks pass. |
| 03 | Header, bottom tabs, safe areas | 01; coordinate with 02 | R02 R05 G01 | BLOCKED | Screenshot S4 shows a top-right selector/control partially obscured by the fixed header region; current evidence is not enough to identify the responsible layer or prove a runtime regression. 1363×936 live spot check showed five labeled tabs and an unclipped topbar only at desktop size. Need phone viewport/PWA/browser resize and safe-area checks; Phases 01–02 exact-head checks pending. |
| 04 | Shared type/colors/spacing/components | 03; source CSS audit | R10 H08 Y03 Y07 O09 L09 G02 G03 | IN_PROGRESS | Scoped source-token audit for the phone You surface: disclosure surfaces use existing border/radius/accent/focus/spacing tokens; computed contrast, light theme, 200% text, and cross-screen style conflicts remain unverified. |
| 05 | Home primary first viewport | 04 | H01 H02 H07 | IN_PROGRESS | S5 shows a duplicated chapter/plan heading. Home now labels the next chapter explicitly (`Next: Genesis 1`) while retaining the Genesis-to-Revelation plan and current completion summary; chapter data and navigation hooks are unchanged. Phone/browser layout, primary-action balance, and Phase 04 checks remain pending. |
| 06 | Home lower density/shortcuts | 05 | H03 H04 H05 H06 H08 H09 H10 | OPEN | Not started |
| 07 | You grouped navigation/role entry | 04 | Y01 Y02 Y03 Y04 Y05 Y06 Y07 | IN_PROGRESS | S1 phone screenshot shows a very long stack of similarly prominent feature cards and repeated full-width gold actions. Five feature groups now use native disclosures; existing shortcut routes and action data hooks are retained. Focused test/browser phone interaction and role-gating checks pending; Phase 04 is still in progress, so this phase is not PASS. |
| 08 | ONE 2 ONE hero/empty/invite | 04 | O01 O02 O03 O04 O07 | IN_PROGRESS | S2 phone screenshot supports the repeated eyebrow/title and oversized hero concern. Removed the duplicate overline, reduced hero min-height for phone widths, and made the localized empty state point to Invite a member. Existing invite and pairing hooks are untouched; loading/error/role/browser checks remain pending, as does Phase 04 acceptance. |
| 09 | ONE 2 ONE tools/settings hierarchy | 08 | O05 O06 O08 O09 | OPEN | Not started |
| 10 | Library compact content cards | 04 | L01 L02 L03 L04 L08 L09 | OPEN | Not started |
| 11 | Library discovery/detail state | 10 | L05 L06 L07 L08 | OPEN | Not started |
| 12 | Responsive geometry matrix | 01-11 relevant implementations | G01 G05 G06 R01 R02 L01 | OPEN | Not started |
| 13 | Accessibility, typography, locales | 12 | G03 G04 G05 G06 R10 Y03 L03 | OPEN | Not started |
| 14 | Journeys, role and state interactions | 12-13 | R09 H10 Y05 Y06 O07 L06 L07 G07 G08 | OPEN | Not started |
| 15 | Security, regression, PWA, performance | 14 | O08 G07 G08 G09 | OPEN | Not started |
| 16 | Exact-SHA candidate and CI | 12-15 PASS | G10 | OPEN | Not started |
| 17 | Production, deployed smoke, closure | 16 PASS and current release authorization | G10 plus all | OPEN | Not started |

One chat = one row. Large QA phases 12-15 may be broken into 12A/12B etc if necessary; do not silently skip a required matrix cell or turn old failure into a pass. A follow-up subphase requires its own tracker row and proof.

## Phase 00 live evidence snapshot — 2026-10-17

- Source checked: current `main` HEAD `172693fc0343bcafa4a87459f6cf1ee8f2f885d1`; plan PR #1547 remains open on `docs/v7-postrelease-uiqa-20261017`, head `186e63529fe81064fe85f00b7d9d0a737498519a`. Deployed app did not expose a build SHA; production/source identity remains unverified.
- Guest routes observed: `#/home`, `#/reader`, `#/library`, `#/one-to-one`, `#/more`. The browser viewport was 1363×936 CSS px, dark theme, guest account. No authenticated user data was opened.
- Reader reproduction: live BSB audio player was 982×166.14 px at x=185.5, y=697.86; primary navigation begins at y=860. The player therefore overlaps the nav by 4 px and visually covers Scripture while scrolling. Its computed position was `sticky` with `bottom: 78px`. Screenshot was observed in the browser but is not retained as a repository file.
- Exact blocker: the cloud browser cannot set a 320/390/430/800 CSS viewport and the local Playwright Chromium executable is unavailable. The 1363×936 route metrics are useful reproduction evidence, not substitutes for the required mobile/light-theme matrix. Record Phase 00 as BLOCKED until that matrix and sanitized durable screenshots are available. R01/R02 were reproducible and sufficient to begin their bounded Reader fix.
- Branch work in progress: remove the sticky overlay and use an in-flow two-row mobile audio layout; keep controls reachable; move Auto-next inside its disclosure; replace `--:--` with a localized duration-unavailable status. Targeted reader wiring tests and typecheck passed locally. Local build failed in the worktree at the V6 compatibility hook (`missing the deployable index or root PWA manifest`) under Node 24.19, while the repository requires Node 22.23.2; exact-head CI is pending and is the required build/browser evidence.

## Phase 03 live shell spot check — 2026-10-17

- Public Reader route, guest, dark theme, 1363×936 CSS px only. Topbar locale selector: x=1054.56, y=10, 65×44; Guest button: x=1125.56, y=10, 70.94×44. Neither is clipped or behind the brand at this width.
- Primary navigation exposes Home, Bible, Library, Groups and You; Bible is the current route. Nav bounds: x=416.5, y=860, 520×68, bottom=928 (8px from viewport bottom). This is desktop-height evidence only and does not prove device safe-area behavior or no content overlap at smaller heights.
- Phase 03 entered for this bounded shell evidence check and is now BLOCKED: its dependency phases 01–02 have no exact-head build/browser checks, and the required 320/390/430/800 + Android PWA/resize matrix is unavailable. R05 remains open; do not change shell z-index or spacing until the suspected mobile clipping can be tested.

## User phone screenshot review — 2026-10-17

- Reviewed the five user-confirmed phone screenshots in conversation, mapping to S1 You (1000033118.jpg), S2 ONE 2 ONE (1000033117.jpg), S3 Library (1000033116.jpg), S4 Reader (1000033115.jpg), and S5 Home (1000033114.jpg). Do not treat exported JPEG dimensions as CSS viewport or DPR, and do not commit the personal screenshots or identifiers.
- S1 supports Y01/Y02/Y04 prioritization: many vertically stacked feature cards repeat high-emphasis gold actions below the personal shortcuts. Source implementation now wraps the five existing tool categories in native details/summary disclosures; all feature action hooks remain in markup.
- S4 visibly supports the Reader player and control defects already tracked as R01–R04. S2 visually supports a tall introduction and an empty relationship state; S3/S5 exports are too reduced to add reliable typography/contrast measurements.
- This review adds screenshot-grounded prioritization. It does not establish current production reproduction, exact CSS viewport, app build SHA, contrast, or a PASS for any phase.

## Claim/coordination model

- At start, read newest main SHA, this ledger, open UI PRs and the most recently merged related changes.
- Reserve phase/owned paths in a small ledger commit on the working PR when code work begins. Do not have two independent chats overwrite src/ui/shell.js, theme foundations, Reader style or this canonical ledger concurrently.
- The single active phase executor owns its scoped selectors until merged/released or its state becomes BLOCKED with exact handoff.
- Other already-running agents are not assumed idle. Rebase after any concurrent main change, recheck affected tests and use safe merge without force overwrite.
- Documentation PR is setup only; no feature phase was worked. Do not treat Phase 00 as completed by the initial static screenshot audit.

## Task completion packet — replace bracketed values

Phase: [00-17 or split ID]
Status: [OPEN/IN_PROGRESS/BLOCKED/PASS/NOT_APPLICABLE]
Last checked (JST): [date time]
Current main SHA: [full SHA]
Owned paths: [file list]
Defect IDs: [IDs]
Before evidence: [sanitized screenshot, DOM measurements, reproduction, or NOT RUN]
Implemented changes: [paths, behavior, preserved callbacks]
Tests: [commands, CI links, outcome and why targeted]
Matrix checked: [width x height, locale, theme, text scale, role, offline/auth]
After evidence: [sanitized screenshot, DOM rects or NOT RUN]
PR: [url]; merged SHA: [full SHA or NONE]
Remaining blockers and next exact action: [detail]
Next eligible phase: [ID]

For Phase 00 use same fields but 'Implemented changes = NONE — baseline only'. For Phase 17 include deployment exact SHA/bytes, live URL, rollback ref and deployed smoke.

## Cross-chat entry command

Continue BibleQuest post-release UI QA Phase 00. Read:
1. docs/v7/V7_POST_RELEASE_UI_QA_CORRECTIONS_20261017.md
2. docs/v7/V7_POST_RELEASE_UI_QA_DEFECT_LEDGER_20261017.md
3. docs/v7/V7_POST_RELEASE_UI_QA_PHASE_LEDGER_20261017.md
from current main, or the docs/v7-postrelease-uiqa-20261017 branch if not yet merged. Check current repo SHA/PRs, execute just the OPEN phase, run affected QA, integrate safely, update ledger, and report the exact next phase.

For later tasks replace 00 by the desired eligible phase number. If the master or ledger is not in main, do NOT invent that it was merged; read the still-open documentation PR.

## First phase priority

00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17. The priority for working implementation is Reader obstruction; style-wide layout cleanup and content browsing follow. If a screen issue no longer reproduces, record NOT_APPLICABLE with browser evidence rather than implementing a speculative visual change.

## Final release gate (not yet run)

All remaining P0/P1 defects fixed/evidence-backed non-reproducible, actual automated responsive/browser/role/audio/security checks green, exact candidate CI/releaseReady, verified deployed SHA and full served-file identity, PWA/offline and real-route smoke, rollback preserved. No artwork production is required.
