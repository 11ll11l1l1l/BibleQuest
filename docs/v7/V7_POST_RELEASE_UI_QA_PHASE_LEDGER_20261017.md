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
| 00 | Baseline reproduction / fixture seed | Docs PR available | All IDs, especially R01 R02 G01 | IN_PROGRESS | User-confirmed screenshots are accepted as the defect baseline for implementation. Exported CSS viewport/DPR and per-route production SHA remain unknown; these are retained as owner verification items and are not claimed as browser reproduction evidence. |
| 01 | Reader player geometry | 00 P0 reproduction or evidence-backed skip | R01 R02 R08 G01 | IN_PROGRESS | Screenshot S4 confirms audio player obscures Scripture and bottom navigation covers reading content. Source fix + responsive browser assertions on branch codex/v7-uiux-phase-00-01-20261017; exact browser CI and phone DOM evidence pending. |
| 02 | Reader player controls and status | 01 | R03 R04 R06 R07 R09 | IN_PROGRESS | Screenshot S4 confirms compressed Auto-next and Audio options labels plus `--:--`. Auto-next moved inside Audio options; duration unavailable has localized copy. Book/translation selectors and expanded audio options now have 44px project tap-target sizing; exact phone browser CI and device check remain pending. |
| 03 | Header, bottom tabs, safe areas | 01; coordinate with 02 | R02 R05 G01 | IN_PROGRESS | The existing shell retains five labeled 44px navigation targets and safe-area-aware fixed-tab offsets. The new exact-build phone matrix records topbar/tab rectangles and checks all four viewport widths; owner device safe-area/PWA acceptance remains pending. No speculative shell z-index change was made. |
| 04 | Shared type/colors/spacing/components | 03; source CSS audit | R10 H08 Y03 Y07 O09 L09 G02 G03 | IN_PROGRESS | Scoped source-token audit for the phone You surface: disclosure surfaces use existing border/radius/accent/focus/spacing tokens; computed contrast, light theme, 200% text, and cross-screen style conflicts remain unverified. |
| 05 | Home primary first viewport | 04 | H01 H02 H07 | IN_PROGRESS | S5 shows a duplicated chapter/plan heading. Home now labels the next chapter explicitly (`Next: Genesis 1`) while retaining the Genesis-to-Revelation plan and current completion summary; chapter data and navigation hooks are unchanged. Phone/browser layout, primary-action balance, and Phase 04 checks remain pending. |
| 06 | Home lower density/shortcuts | 05 | H03 H04 H05 H06 H08 H09 H10 | IN_PROGRESS | Removed the duplicate five-destination Home shortcut rail; wrapped the six-step weekly workflow in a native disclosure that reports progress and retains all six routes and optional completion controls. Focused source tests pass. V6 test fixture provenance, floating oval ownership, ministry-role variants, and phone/browser visibility remain unverified. |
| 07 | You grouped navigation/role entry | 04 | Y01 Y02 Y03 Y04 Y05 Y06 Y07 | IN_PROGRESS | S1 phone screenshot shows a very long stack of similarly prominent feature cards and repeated full-width gold actions. Five feature groups now use native disclosures; existing shortcut routes and action data hooks are retained. Focused test/browser phone interaction and role-gating checks pending; Phase 04 is still in progress, so this phase is not PASS. |
| 08 | ONE 2 ONE hero/empty/invite | 04 | O01 O02 O03 O04 O07 | IN_PROGRESS | S2 phone screenshot supports the repeated eyebrow/title and oversized hero concern. Removed the duplicate overline, reduced hero min-height for phone widths, and made the localized empty state point to Invite a member. Existing invite and pairing hooks are untouched; loading/error/role/browser checks remain pending, as does Phase 04 acceptance. |
| 09 | ONE 2 ONE tools/settings hierarchy | 08 | O05 O06 O08 O09 | IN_PROGRESS | Mentor/lesson tools now start hidden and appear only when the active congregation has the existing `ministry` capability; context refresh recalculates visibility. Account/congregation/back links moved into a compact disclosure. Server checks remain authoritative. Focused member/authorized/context-change source tests pass; tenant denial, live role variants, and phone browser evidence remain pending. |
| 10 | Library compact content cards | 04 | L01 L02 L03 L04 L08 L09 | IN_PROGRESS | Text-only cards now omit decorative cover space; failed approved art is removed while live title/details/actions remain. Single-column mobile cards and 44px action are retained. Focused fallback/card tests pass. Real-screen geometry, computed contrast, topic metadata, and 320/390 browser evidence remain pending. |
| 11 | Library discovery/detail state | 10 | L05 L06 L07 L08 | IN_PROGRESS | Existing compact search/type/refine controls and explicit loading/empty/error/retry states remain. Return state now preserves submitted query, type, taxonomy, emotion, need, originating item focus, and prior vertical scroll position; focused regressions cover route serialization and scroll/focus restoration. Offline/live detail and browser scroll checks remain pending. |
| 12 | Responsive geometry matrix | 01-11 relevant implementations | G01 G05 G06 R01 R02 L01 | IN_PROGRESS | Added `tests/v7/phone-first-uiux-built-artifact-browser.mjs` to the exact-SHA build workflow: five routes × ten viewport/locale profiles (320 and 390 EN/TL/CEB/ILO; 430 and 800 English), shell geometry, horizontal overflow, Reader audio collapsed/expanded, 200% text probe, and hashed 390px English screenshots. Syntax check passes. Rendered matrix and screenshot hashes await the candidate browser run; physical-device review remains with the user. |
| 13 | Accessibility, typography, locales | 12 | G03 G04 G05 G06 R10 Y03 L03 | IN_PROGRESS | Existing built-artifact accessibility and Library locale/contrast/focus checks remain in the exact-SHA workflow. The new route matrix adds visible control-name and 44px action-target assertions plus 200% text scaling on all five screens in all ten profiles. Japanese Reader and human assistive-technology behavior remain pending; no accessibility PASS claimed. |
| 14 | Journeys, role and state interactions | 12-13 | R09 H10 Y05 Y06 O07 L06 L07 G07 G08 | IN_PROGRESS | Existing built-artifact route, ONE 2 ONE deep-link/role, Library browse/back/offline, Home motion/continue, and authenticated journey tests remain assigned to established suites. Exact-candidate execution and real account/device cases remain pending. |
| 15 | Security, regression, PWA, performance | 14 | O08 G07 G08 G09 | IN_PROGRESS | Pinned Node 22 lint/format/typecheck, 721 V7 unit tests, image audit, exact build identity/integrity and budgets have executed successfully on the correction candidates. Browser runs exposed and drove repairs to Reader targets/200% layout, Library clear/deck controls, and Groups wrapping. Current final run, authenticated/API privacy, PWA and integration evidence are linked from PR #1549; physical-device observations remain with the owner. |
| 16 | Exact-SHA candidate and CI | 12-15 PASS | G10 | IN_PROGRESS | Pinned Node 22 exact-candidate build and convergence workflows now run for this correction PR. Current run links and immutable review preview are maintained in PR #1549; final review/release readiness is not inferred from a partial workflow. |
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

## Phone-first implementation continuation — 2026-10-17

- Phase 06 removed the repeated shortcut rail (its destinations remain in Today, the bottom tabs, and the weekly workflow) and made the six-step weekly ministry guide an accessible native disclosure with its completion count visible while collapsed. No assignment, event, ministry, or progress data was removed. `H05` fixture provenance and `H06` floating-control origin remain specifically unresolved.
- Phase 09 exposes ONE 2 ONE mentor/lesson links only after the active congregation reports the existing ministry capability; a context refresh recalculates visibility and fails closed. Account, congregation, and Back to Grow controls are grouped under a disclosure. This is presentation-level guidance only; routes/services continue to enforce their own permissions. Live tenant/privacy denial tests remain a required blocker.
- Phase 10 removes the large decorative cover area from no-art text cards and removes a failed approved image from layout, leaving semantic type, title, summary, metadata, and the full-card 44px+ action. Existing published/rights checks are unchanged.
- Phase 11 adds explicit return-state regressions for submitted search, type, taxonomy, Feeling, and Need selections, and now restores vertical scroll and focus to the originating card after results settle. Browser validation of actual scroll timing, offline/cache, and live content checks remain outstanding.
- Focused Home, ONE 2 ONE, Library page/card tests and syntax/diff checks pass locally. Exact-head browser/phone QA, real account role variants, and production reproduction remain unverified; no phase is marked PASS.

## Candidate verification probe — 2026-10-17

- Rechecked the open correction PR #1549 after the Reader parser fix. Code commit `fcbf49a61b12a4fb78fff0c6658df3be63e9f550` is followed by documentation-only head `1955be4cb3eeec70ceb4c02c06c675ccce5040eb`. The V6 PR Serialization Guard passed on the code commit, and Cloudflare Pages deployed the current head successfully to `https://4fc0498c.mybiblequest.pages.dev`.
- Installed the lockfile dependencies in the local checkout (available Node `24.19.0`; project pins `22.23.2`). `npm run typecheck` passes. `npm run unit:v7` passes all 721 tests and the image-ledger audit (31 attempts, no problems).
- The first local production build and Vite dev-server dependency scan exposed a JavaScript parse error in the Reader audio markup at `src/features/reader/index.js`. Rewrote the audio HTML as explicit fragments while preserving all reader audio hooks and controls. `node --check src/features/reader/index.js` and `npm run build:v6` now pass locally.
- Browser preview spot check on the latest branch preview ran as guest in dark theme at 1363×936 CSS px on Home, Reader, Library, ONE 2 ONE, and You; all five routes loaded and document scroll width stayed within the viewport. Reader audio rendered the disabled seek control and `Duration unavailable`; on the code commit preview its bounds were x=186, y=4555, 982×166, while primary navigation was y=860–928. This is desktop-only evidence and does not satisfy the phone matrix or prove small-screen geometry.
- Local Playwright is present, but its Chromium binary is unavailable. Installing Chromium returned a truncated/invalid archive, so no rendered phone screenshots or phone DOM geometry were produced. The exact-head local build passed; this is not production deployment or smoke evidence.
- Phase status remains unchanged: Phase 00 and 03 are BLOCKED; Phases 01–02 and 04–11 remain IN_PROGRESS; Phase 12 remains OPEN and is not entered because its prerequisite phases lack their required evidence. No phase is PASS. Next required action is a Chromium-capable exact-candidate phone matrix, starting with Reader 320/390/430 px and recording player/nav/content bounds.

## Owner-directed continuation — 2026-10-17

- The user directed us to continue through the remaining phases now and reserved all visual/device verification for after the site is available to inspect. Their phone screenshots are therefore the accepted source baseline for corrections; this unblocks implementation without relabeling missing viewport/device evidence as complete.
- Phase 00 and 03 are now IN_PROGRESS (not PASS). Phase 12–15 implementation and test integration are IN_PROGRESS. The repository gate states remain strict: no phase is PASS until its required exact-candidate browser/API evidence exists; owner phone/PWA verification remains explicitly outstanding.
- Added a built-artifact five-route phone matrix to `.github/workflows/v7-build-pwa-performance.yml`; it checks 50 route/profile combinations across 320/390/430/800px and EN/TL/CEB/ILO, including a locale-neutral Reader duration assertion. Geometry plus hashed English screenshots are uploaded with exact-SHA evidence and included in the CI certification seal. The matrix design identified undersized Reader book/translation selectors and audio checkboxes; these now meet the 44px project tap-target minimum. Latest exact candidate `fc5969fc7b77fdf8cbdaa1cac27c3ce709c5a23e` passes local script syntax, typecheck, 721 V7 tests plus image-ledger audit, lint, format, build identity, artifact integrity and performance. Local Playwright has no Chromium executable, so the rendered phone matrix has not run; no phase or owner visual check is reported as PASS.
- Phase 16 stays OPEN until phases 12–15 have exact-candidate results; Phase 17 stays OPEN until the production release gate is satisfied. Current PR preview remains the user-reviewable candidate; no production identity or deployment is claimed.

## Latest review preview — 2026-10-17

- PR #1549 head `fc5969fc7b77fdf8cbdaa1cac27c3ce709c5a23e` is deployed to the Cloudflare Pages preview at `https://11a3d0f3.mybiblequest.pages.dev/` (deployment check succeeded). Signed-out desktop browser smoke reached Home, Reader, Library, ONE 2 ONE, and You; Reader completed its lazy load and exposed Scripture plus the in-flow audio player and localized `Duration unavailable` state. This is 1363×936 desktop preview evidence only.
- Phases 00–15 remain IN_PROGRESS; phases 16–17 remain OPEN. The preview is ready for owner phone/PWA/safe-area review. No phone matrix result, real-device evidence, full privacy/API run, production deployment or phase PASS is claimed.

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

## Owner phone follow-up — 2026-10-17 22:59 JST

The two new phone screenshots confirm actual mixed-theme defects, not merely suspected contrast: You shortcuts combined pale hardcoded card backgrounds with inherited dark-theme light headings; the floating Report launcher had the same mismatch. Fixed at their component sources using existing charcoal/gold/text/border/focus tokens. Phone shortcuts now form one column up to 520px, preserving labels without squeezed two-column text. Reporting dialog/status/input surfaces follow the same theme.

Owner specifically authorized one new Home image. Added original Bible-study/community artwork and removed the unrelated emotion-art replacement. Source/raster/rights/uniqueness/coordinator evidence and exact hash are under `artwork-evidence/home-hero-20261017/`. This exception does not reopen any other artwork queue. No generated words or Scripture quotes appear in the image.

Phases 04/05/07/13 include these corrections. Added computed 4.5:1 contrast assertions for actual You shortcut headings/hints and Report launcher to the route matrix. Existing build/PWA and convergence workflows now include the post-release correction target branch; no security/privacy assertion was removed. Exact CI is now eligible to execute instead of waiting for an unavailable manual dispatch. Local typecheck/lint/format and all 721 V7 tests plus image audit pass. Current-candidate CI/browser/device acceptance is pending; no phase PASS or production promotion is implied.


## Theme reconciliation and remaining implementation — 2026-10-17

The app intentionally uses the existing near-black/gold theme, including when the operating system prefers light mode. The defect was a component mixing hardcoded light surfaces with inherited light text. You shortcuts, Library text-only cards, Report launcher/dialog and their fields now consume the same semantic tokens. This does not introduce a separate light-mode setting.

| Role | Shared token | Active dark value | Use |
| --- | --- | --- | --- |
| Page | `--bq-bg` | `#080909` | App canvas |
| Surface | `--bq-surface` | `#101212` | Panels and dialogs |
| Raised surface | `--bq-surface-muted` | `#171a19` | Shortcut and fallback cards, fields |
| Primary text | `--bq-text` | `#f4f3ee` | Headings and control labels |
| Secondary text | `--bq-text-secondary` | `#d2d1ca` | Hints and metadata |
| Brand / selected | `--bq-brand` / `--bq-brand-soft` | `#d7ba72` / `#2b2518` | Active/featured emphasis |
| Focus | `--bq-focus` | `#e6ca82` | Visible keyboard outline |
| Border | `--bq-border-strong` | `#3a3f3c` | Interactive surface edge |
| Shape | `--bq-radius-control/surface/hero` | 12 / 16 / 22 px | Existing component hierarchy |
| Space | `--bq-space-1/2/3/4/6/8/12` | 4 / 8 / 12 / 16 / 24 / 32 / 48 px | Existing spacing scale |

Source: `src/ui/v6-black-theme.css` loaded after the foundation and experience layers; shape/space come from `src/ui/v6-modern-foundation.css`. Actual component contrast is asserted in the rendered phone matrix, rather than inferred solely from this table.

The first pinned 320px matrix on `12cc41e977f7aa9257d61e5cb32a5ed13ae4d919` reproduced a 22px-wide Reader search field, a narrow narrator selector and a 36px audio-download button. Follow-up source correction makes the phone search toolbar wrap, gives the narrator selector a 44px minimum and enlarges the download control. It also removes the remaining fixed-position expanded audio settings and keeps Follow verse visible in the disclosure. The matrix now checks the expanded control container itself, excludes descendants of closed native disclosures using browser visibility, and collects all failing profiles with screenshots while still failing the gate.

Older accessibility/backup/weekly browser fixtures now explicitly open the new disclosures; guest ONE 2 ONE smoke asserts leader-only tools stay hidden, while the authenticated leader fixture exercises both launchers and checks they disappear when switching to a mentee. These changes retain positive and denial coverage. The owner-requested multi-phase execution and one Home image supersede the older one-phase-per-chat/artwork-freeze instructions only for this correction scope.


## Review handoff scope — 2026-10-17

Implementation now covers the five requested routes and their shared phone behavior: Reader in-flow audio and expanded settings, usable search/select/download controls, honest duration state and completed read action; Home dedicated Bible-study art, clearer next chapter, compact weekly guide and readable two-column progress metrics; You single-column readable shortcuts and grouped tools; compact dark Library text cards with filter/back restoration and bounded deck controls; shorter Groups introduction, guided empty state and capability-aware mentor launchers. The Report control is placed in normal page flow at the end of reportable pages so it cannot cover Continue/View Quest, Scripture, or bottom tabs. Existing report modal and context hooks remain.

The 200% phone run on `bc0d93348294dbd0f2f62c583daf42c66e603202` cleared Reader/Groups overflow and the Library 44px target failures; its only failures were Library deck-counter min-content sizing at 320px in four requested locale profiles. The follow-up replaces the fixed 6rem counter with a bounded three-column control grid. Home imagery is decoded/asserted against the dedicated source at every profile and retained at 320/390/430/800 English widths. Bottom tabs wrap at increased text size; the mobile Reader header scrolls with the page; search/narrator fields and Context follow the same dark surface tokens.

The latest verified source and workflow/preview links live in PR #1549. This paragraph intentionally does not self-certify a later commit or unrun matrix. The owner requested review before further release work: production promotion (Phase 17), physical Android/browser/PWA/safe-area/audio observations and human assistive-technology checks remain OPEN. Unknown private “V6 test” assignment provenance is not permission to filter or delete real user content. Full app UI supports EN/TL/CEB; requested ILO profile exercises the existing supported fallback, while ILO content remains preserved. No full Ilocano shell translation is claimed.

Earlier dated probe sections are history, not the current execution state. No “browser unavailable” blocker applies to GitHub's pinned Chromium runners; their actual current results govern acceptance. No production merge, data reset or security/rights waiver is part of this review handoff.


### Rendered phone matrix milestone

Pinned Chromium/Node 22 run [39040624416](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/39040624416), source `f6bfab85eaaac5ce9936b58697c11b3e1dc93d0d`: the phone-first correction matrix step PASSED all 50 route/profile cases, including 200% text. This is actual rendered evidence, superseding earlier unrun/blocked statements. It also decodes the dedicated Home artwork and captures English Home at all four widths. The final Report flow/handoff update follows this source and requires its own current-candidate run; no later head is certified by the earlier result. Remaining browser/PWA/convergence results and immutable preview identity are maintained in PR #1549.


### Screenshot-driven follow-up after geometry PASS

On `c6133aafb3cee05fbaa3345fd89ddd75260f1086`, the full Build/PWA/automated-accessibility workflow [39040835281](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/39040835281) passed, including 50 phone matrix cases and all nine screenshots. Independent image technical QA confirmed Home study/title/action crop survival at all four widths, but actual screenshot inspection found a separate inherited Home Journey two-column grid at 430px and clipped progress numerals at 320/800px. These were not detected by document-level overflow checks, so visual acceptance was not closed. Follow-up scopes the Journey to one column at every width, removes the forced three-column 320px stats rule, and sizes/wraps progress values within their cards. The browser gate now asserts the actual stat content width and Journey column count, in addition to page overflow. The source asset/hash is unchanged.


Independent follow-up on `f84b93b1b5969fee5965748d65444242f3ebabcc` confirmed the 430px column collapse and actual clipping are gone at all four widths; its full pinned build/phone/PWA gate [39041292141](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/39041292141) passed. Screenshot inspection also exposed unused inherited icon-grid columns inside Home stat cells: at 320px, otherwise-visible chapter totals/labels wrapped unnecessarily. Final source makes Home statistic cells block layout so absent icon slots cannot consume text width. All data and values remain unchanged. This final bounded CSS change reruns the same exact-candidate gates; see PR #1549 for its identity/result.

## Owner review follow-up — 2026-10-18: compact Library and quiet live filters

Owner accepted the prior five-screen preview and supplied a phone screenshot of a devotional overwhelmed by source/attribution/usage prose, a duplicate title and raw topic IDs. Requested separate Books/Devotionals, smaller actual-title text entries, automatic click/type filtering and no page remount/scroll reset.

- Library now starts on Devotionals, with direct Books/Devotionals/Teachings buttons. Search is a single quiet field without a submit button; typing debounces 250ms, and type/taxonomy/discovery selections update immediately.
- Filter changes replace the existing route query in browser history without invoking the router, preserve the mounted form/input, and use the existing latest-request-wins Library service. Pending timers are canceled on disposal. Existing results/height stay in place during reads; pending results are inert rather than replaced by a blank loading page.
- Feeling/Need decks remain available under Refine results and synchronize selected state without rebuilding their carousel. Unchanged result payloads do not recreate cards. Item/back links retain query/type/taxonomy/discovery and return focus/scroll behavior.
- Browse rows show the reviewed item title in a compact semantic text row, with no decorative art, generic source tag, repeated description or metadata stack. Publication/rights validation still precedes each card.
- Devotional detail presents one title and reading body. Source, attribution, usage basis/allowed uses and validated original-source link remain in a collapsed Source and usage details disclosure. Reviewed language fallback notices and all content/rights checks remain intact.
- Added focused tests for debounced non-navigating updates, result retention, immediate type selection, canceled pending work, compact real-title rows and metadata-free reading. Built browser checks now use the actual type buttons/refine disclosure and verify mounted DOM identity, focus and scroll during live search. Existing localization/contrast/offline checks remain.
- Local V7 unit/image-ledger, typecheck, lint, format and whitespace pass on Node 24.19.0. Pinned exact-candidate browser/API results and the updated immutable preview are maintained in PR #1549; local static checks do not claim rendered acceptance.
