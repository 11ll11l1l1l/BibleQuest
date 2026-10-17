# BibleQuest V7 — Five-screenshot UI QA defect inventory

Updated 2026-10-17 JST; documentation/triage ONLY. Every row begins OPEN; no item is claimed reproduced on live production, fixed, or verified by this writing.
Master instructions: V7_POST_RELEASE_UI_QA_CORRECTIONS_20261017.md.
Execution tracker: V7_POST_RELEASE_UI_QA_PHASE_LEDGER_20261017.md.

## Evidence and severity language

S1 You/More = user attachment 1000033118.jpg (90x1536 exported, text not reliably measurable).
S2 ONE 2 ONE = 1000033117.jpg (516x1536 exported).
S3 Library = 1000033116.jpg (64x1536 exported, text not reliably measurable).
S4 Reader = 1000033115.jpg (716x1536 exported).
S5 Home = 1000033114.jpg (195x1536 exported, text not reliably measurable).
These dimensions reflect user-exported JPEGs, NOT CSS viewport width, screen density or native display dimensions. Personal names, congregation data and other identifiers must be redacted in browser fixtures. Screenshots are currently in the conversation only and need durable sanitized captures in Phase 00.

Tag legend: V = directly visible in supplied screenshot, S = verified in repository source, T = plausible runtime/design concern requiring test. V does not prove same issue exists on latest deployed build. State values allowed: OPEN, REPRODUCED, NOT_REPRODUCED, IN_PROGRESS, BLOCKED, FIXED, DEFERRED with rationale. Priority is provisional until reproduced.

P0 critical: functionality/content physically inaccessible, security/privacy leak, or serious reading blocker.
P1 high: broken hierarchy, major overlength, bad responsive behavior, misleading workflow.
P2 normal: decorative consistency, optional polish or low-frequency path.
Evidence owner should attach exact URL/route, source SHA, scenario, viewport, theme, locale, role, screenshot/DOM metric/keyboard behavior and related automated test.

## Screenshot S4 — Bible Reader (first priority; phases 00-03, 12-15)

| ID | Pri | Evidence | Observed defect / verification question | Required outcome | Phase | State |
|---|---|---|---|---|---|---|
| R01 | P0 | V+S | Large sticky audio player covers central Genesis text; sticky player CSS uses bottom offset and 5-column layout | Verse content including final verse remains scrollable/reachable above player and nav, in collapsed and expanded states | 01 | OPEN |
| R02 | P0 | V+T | Fixed bottom nav overlaps reading region and audio-player lower edge | Correct bottom safe-area scroll padding, no masked/focus-hidden text or controls | 01/03 | OPEN |
| R03 | P1 | V+S | Audio controls wrap: Audio options appears in vertically stacked tiny space, Auto-next takes multiple lines | Mini-player responsive structure; options in accessible sheet/details, labels and checkbox remain readable | 02 | OPEN |
| R04 | P1 | V+S | Playback time shows 0:00 / --:-- but says Ready to play | Explicit loading, ready, duration unavailable, failure and retry states; no misleading progress slider | 02 | OPEN |
| R05 | P1 | V+T | Top-right drop-down/control seems partially hidden underneath brand header | Verify header/dropdown stack and selector focus; never clip or block tap | 03 | OPEN |
| R06 | P1 | V+S | Genesis 1 repeated as chapter selector/title and audio chapter label; English/BSB/English labels duplicate some context | Keep one navigational chapter selector, one clear reading heading and compact translation/narration metadata | 02/04 | OPEN |
| R07 | P1 | V+S | Marked read action/status is not visually distinguishable from an actionable button | State-specific accessible action; no repeated XP award, verify persisted completion | 02 | OPEN |
| R08 | P1 | V+T | Large reader font with other layers may force excess scroll and selection obstruction | Preserve font-size preference and line length; don't shrink Scripture solely to fit audio UI | 01/12 | OPEN |
| R09 | P1 | S+T | Reader audio and mark read use data-reader-audio-* and data-reader-mark hooks | Restructure without breaking callbacks, audio timers, seek, chapter auto-next or offline | 02/14 | OPEN |
| R10 | P2 | V | Typography and spacing between title, source, card top and scripture appear inconsistent | Standardized reader heading/metadata rhythm preserving editorial serif for Scripture | 04 | OPEN |

## Screenshot S5 — Home (phases 05-06)

| ID | Pri | Evidence | Observed defect / verification question | Required outcome | Phase | State |
|---|---|---|---|---|---|---|
| H01 | P1 | V+S | First hero and large Continue Journey section dominate the top and share a Bible CTA | Make next action obvious; compress only redundant content, preserve hero/reading function | 05 | OPEN |
| H02 | P1 | V+S | Repetitive visible Genesis 1 Genesis → Revelation journey label | Clear single reading plan/chapter naming; inspect underlying formatting, preserve valid progress | 05 | OPEN |
| H03 | P1 | V+S | Home duplicates destinations in Today, rail, bottom tabs, icon shortcuts and tool badges | One or two contextual shortcuts only where useful; route to features retained in their canonical area | 06 | OPEN |
| H04 | P1 | V+S | Huge vertical stacking: Today, progress, weekly ministry, assignments, multiple shortcut grids | Compress lower-priority sections into digest links/disclosure; maintain accessibility and feature inventory | 06 | OPEN |
| H05 | P1 | V+T | 'V6 test' content is visible in Today / weekly ministry; may be legitimate fixture/user content | Identify source/account/tenant before removal; block dev fixtures from real production only if confirmed | 06 | OPEN |
| H06 | P1 | V+T | White floating oval near bottom-right appears unrelated to app visual grammar | Identify whether Android/browser/PWA overlay or app element; remove/fix ONLY if source is app and safe | 06/12 | OPEN |
| H07 | P1 | V+S | XP, chapters, books, percentage, streak and badge numbers are adjacent with weak explanatory labels | Rebalance stat hierarchy and unit labels; never change underlying XP/progress data | 05/06 | OPEN |
| H08 | P2 | V | Gold CTAs, dark panels, decorative circular images repeat without clear content differentiation | Reserve gold emphasis for current task; semantic surfaces and spacing consistent | 04/06 | OPEN |
| H09 | P1 | T | Role-specific assignments and ministry tasks could appear to users without context | Verify member, leader and empty/no-congregation variants and context switch | 06/14 | OPEN |
| H10 | P1 | T | Card actions may repeat or be unavailable offline | Check actual callback, deep-link, pending state and offline fallback for each retained shortcut | 14 | OPEN |

## Screenshot S1 — You/More (phase 07)

| ID | Pri | Evidence | Observed defect / verification question | Required outcome | Phase | State |
|---|---|---|---|---|---|---|
| Y01 | P1 | V+S | Many large dark navigation cards extend far down a single narrow column | Group by personal/study/community/leadership/device; compact row treatment, no feature loss | 07 | OPEN |
| Y02 | P1 | V | Primary personal actions, admin tools and infrequent features look similarly emphasized | Rank personal/account/progress, role-specific and utility functions by frequency/relevance | 07 | OPEN |
| Y03 | P1 | V+T | Tiny category labels/descriptions appear hard to read in exported image | Verify actual computed sizes and 200% text; use readable 14-16 secondary text | 04/07/13 | OPEN |
| Y04 | P1 | V+S | Repeating one gold full-width CTA on each feature amplifies competing actions | Compact icon+label rows, contextual actions only; no all-gold button list | 07 | OPEN |
| Y05 | P1 | T | Some features may be unreachable after compaction | Inventory every data-attribute/callback pre/post, make route equivalence test | 07/14 | OPEN |
| Y06 | P1 | T | Member/leader/admin gating and deep links may differ | Run all roles; settings, Content Review, user tools remain correct and secure | 07/14 | OPEN |
| Y07 | P2 | V | Icons, section card styles and panel spacing vary | Apply shared icon family, radius/padding and section headings | 04/07 | OPEN |

## Screenshot S2 — ONE 2 ONE (phases 08-09)

| ID | Pri | Evidence | Observed defect / verification question | Required outcome | Phase | State |
|---|---|---|---|---|---|---|
| O01 | P1 | V+S | ONE 2 ONE eyebrow immediately repeats ONE 2 ONE h1 | Distinct overline meaning or remove duplicate while preserving page title/accessibility | 08 | OPEN |
| O02 | P1 | V+S | Tall teal hero consumes large vertical space before relationships | Short contextual header at small widths, no text overlay or image license risk | 08 | OPEN |
| O03 | P1 | V+S | 'No relationships in this congregation' has little guidance, before an equally big Reload | Helpful empty state; invite next step if user permitted; retry only as context-appropriate action | 08 | OPEN |
| O04 | P1 | V+S | Invite a member is prominent but invitation/pairing outcome not explained | Clear contextual copy/CTA and functional invite flow; show permission/context | 08 | OPEN |
| O05 | P1 | V+S | Curriculum and Prepare lesson assignment look like universal tools | Verify actual role permissions; expose in mentor/leader section only where authorized | 09 | OPEN |
| O06 | P1 | V+S | Account, Choose congregation, Back to Grow appear as three giant main CTAs | Move into compact navigation/settings; preserve route and context | 09 | OPEN |
| O07 | P1 | V+T | Relationships count/status may report empty while still fetching | Proper loading, empty, error and retry state, aria-live and stale-request handling | 08 | OPEN |
| O08 | P0 | T | Tenant/mentor/mentee privacy or cross-congregation leakage risk after reorganizing actions | Backend access denials, consent, revocation and role checks remain enforced; no CSS-only security | 09/15 | OPEN |
| O09 | P2 | V | Secondary dark controls and separators are repetitive with excessive gap | Card/section spacing normalized by shared tokens | 04/09 | OPEN |

## Screenshot S3 — Library (phases 10-11)

| ID | Pri | Evidence | Observed defect / verification question | Required outcome | Phase | State |
|---|---|---|---|---|---|---|
| L01 | P1 | V | Many tall pale text-first tiles create extraordinary page length and wasted vertical area | Compact cards with fixed content structure; featured items may remain visually large | 10 | OPEN |
| L02 | P1 | V | Thumbnail/featured image treatment differs greatly from text fallback cards | One cohesive component family; image if approved, live-text editorial fallback otherwise | 10 | OPEN |
| L03 | P1 | V+T | Low readable-text density and potential low-contrast text on pale gradients | Measure real CSS contrast/legibility, improve semantics and title prominence | 10/13 | OPEN |
| L04 | P1 | V+T | Content categories, duration/progress and next action aren't obvious at reduced view | Type/topic/length/progress metadata and one clearly labeled action | 10 | OPEN |
| L05 | P1 | T | Search, chips and filtering may be pushed far above results on lengthy listing | Sticky/compact discovery controls as warranted, preserving focus and spacing | 11 | OPEN |
| L06 | P1 | T | Details/back may drop user search/filter/scroll context | Preserve query serialization, route restoration and saved state | 11/14 | OPEN |
| L07 | P1 | T | Empty, fetch-error, offline/cache and unavailable illustration states need true coverage | Designed status/retry without blank image frame, no false 'approved' content | 11/14 | OPEN |
| L08 | P1 | S+T | Catalog includes devotionals, external-link books, teachings; image and rights policy restricts publication | Preserve 300 records, rights/source/translation gating, legal external links and passed artwork only | 10/15 | OPEN |
| L09 | P2 | V | Card spacing, background hues and font treatment vary without clear taxonomy | Limited coherent type accents, consistent vertical rhythm and semantic labels | 04/10 | OPEN |

## Cross-screen and release-quality defects (phases 03-04, 12-17)

| ID | Pri | Evidence | Observed defect / verification question | Required outcome | Phase | State |
|---|---|---|---|---|---|---|
| G01 | P0 | V+T | Sticky shell, mobile safe area, browser toolbar and player may collide at specific heights | Measured nonoverlap and readable last content at all supported viewports and 200% scale | 03/12 | OPEN |
| G02 | P1 | S+T | Many inherited CSS layers can override the same components | Reconcile source-order specificity in actual computed styles; avoid !important patch cascade | 04 | OPEN |
| G03 | P1 | V+T | Font hierarchy/padding/titles differ between surfaces | Shared semantic type/space/shape/interactive tokens and same visual roles | 04/13 | OPEN |
| G04 | P1 | T | Contrast may fail on gradients, overlays, small metadata or light theme | Measured WCAG 2.2 AA computed color checks with real themes/states | 13 | OPEN |
| G05 | P1 | T | Long TL/CEB/ILO labels and 200% text could clip | Verify no loss of content, horizontal scroll, hidden controls or truncation of essential copy | 12/13 | OPEN |
| G06 | P1 | T | Reflows/reduced-motion/keyboard focus may differ from touch screenshots | Keyboard/screen reader/focus order, reduced-motion states, Android PWA/browser | 12/13 | OPEN |
| G07 | P1 | T | Missing picture or offline fetch may create empty/unstable layouts | Approved real bytes only; deterministic compact fallback; offline/cache behavior retained | 14/15 | OPEN |
| G08 | P1 | T | Visual refactor can accidentally break feature handlers, progress, save/read, back behavior | Stable event hooks and regressions for all five routes | 14/15 | OPEN |
| G09 | P0 | T | Security/privacy/backend role gates must not change during reorganizing Groups/You | Existing authenticated API and cross-tenant denial regression PASS | 15 | OPEN |
| G10 | P1 | T | DOM screenshots may pass while actual deployed bundle differs from certified build | Exact-SHA CI plus full served identity and post-deploy smoke | 16/17 | OPEN |

## Reassessment decisions (supersede premature assumptions)

1. The artwork shortage is NOT a V7 post-release UI issue requiring new images. Approved-image-only and text-first fallback are governing requirements.
2. Gold/black branding is intentional and should remain. Current poor density is mainly information architecture and layout, not a mandate for a new aesthetic.
3. Reader obstruction is a high-priority visually observable *candidate* and needs production reproduction before marking a release blocker in the implementation ledger.
4. Repeated 'V6 test' might be genuine account/congregation data; never delete a real assignment as a visual cleanup.
5. The floating white oval in Home may belong to browser/OS/screen capture; verify origin before editing app.
6. The heavily reduced S1/S3/S5 exports cannot establish exact minimum font size or computed contrast; capture browser fixtures and test.
7. Cosmetic change must never hide an entitlement/security problem; validate underlying backend role/access rules.
8. User data, XP, translations, readings and publication approvals cannot be reset by a redesign.

## Minimum evidence record for each defect update

ID and state; first observed file/route; reproduced candidate SHA and deployed SHA; fixture/account-role category; CSS viewport x height and DPR; locale/theme/font zoom; element selector; screenshot link/hash; measured rect/contrast when relevant; steps and outcome; source code path; PR/commit SHA; targeted test/run URL; regressions found; residual risk. Use a sanitized test account and do not commit production user identifiers or credentials.

No state transitions were performed by this plan-writing task. Phase 00 must establish the actual live baseline.
