# BibleQuest V7 — Post-release UI/UX screenshot correction specification

Status: PROPOSED / DOCUMENTATION ONLY. No UI implementation or browser verification performed by this documentation PR.
Created: 2026-10-17 JST.
Owner direction: Reassess five user-supplied mobile screenshots, make a complete corrective plan in independent chat-sized increments, and make handoffs durable.
Repository: 11ll11l1l1l/BibleQuest.
Initial inspected main head: 3df992466fdf3d0fcc7b4c9101f3841125378cdd (PR #1546 Calendar color fix).
Production app: https://mybiblequest.pages.dev/ .
Defect ledger: V7_POST_RELEASE_UI_QA_DEFECT_LEDGER_20261017.md in this folder.
Execution ledger: V7_POST_RELEASE_UI_QA_PHASE_LEDGER_20261017.md in this folder.

## 0. Authority, scope, and evidence integrity

This document is a NEW post-release corrective workstream, not an assertion that the V7 release was incomplete. Current V7 release certification and rollback protections remain in force. Read AGENTS.md, work/README.md, work/RULEBOOK.md, V7_ACTIVE_STATUS.md, docs/v7/V7_TEXT_FIRST_RELEASE_RESET_20261017.md, and the relevant parts of docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md before editing. If status records disagree, compare CURRENT main, PRs, CI and deployed SHA; do not blindly trust historical text. This corrective document is subordinate to valid release, security, privacy, rights, and Scripture contracts.

Scope: Five routes in supplied screenshots (You / More, Groups / ONE 2 ONE, Library discovery, Bible Reader, Home), shared shell, relevant interactions, responsive states and regression coverage. No backend re-architecture, unrelated modules, new features, image generation, image derivative production, image deletion or V8 work. Use existing independently approved and production-eligible visual assets only. Missing art uses compact intentional text/color cards with live localized copy; never restore image quota release gates. Do not remove valid features, links, user records, metrics, translations, Scripture, mentor privacy or consent to make screenshots appear shorter.

Evidence classes:
- OBSERVED = pixel-visible in screenshot; its appearance is reported, not its cause.
- SOURCE-CONFIRMED = present in currently inspected repository file; runtime behavior can still differ.
- VERIFY = plausible condition not confirmed from static screenshot or source, requires built/deployed browser test.
- REPRODUCED = runtime failure with browser/DOM evidence and exact SHA.
- FIXED = implemented, reviewed, relevant tests pass, before/after evidence and commit/PR recorded.
Screenshots are diagnostic inputs, NOT proof of current production regressions. The source screenshots in the conversation are not in GitHub; Phase 00 must capture durable sanitized browser screenshot fixtures at real device sizes rather than assuming JPEG widths are viewport sizes.

User-supplied screenshot mapping:
- S1 You (file 1000033118.jpg; exported 90x1536; extreme horizontal reduction).
- S2 ONE 2 ONE (file 1000033117.jpg; exported 516x1536).
- S3 Library (file 1000033116.jpg; exported 64x1536; text measurements unreliable).
- S4 Bible Reader (file 1000033115.jpg; exported 716x1536).
- S5 Home (file 1000033114.jpg; exported 195x1536; extreme reduction).
These are screenshot file identifiers, not repository asset paths or physical viewport measurements. Never infer precise CSS pixels or contrast ratios directly from their scaling. Do not publish user/account names, avatars, sensitive information or authenticated pages in public evidence; use fixture/demo data with redaction.

## 1. Confirmed implementation entry points (read live files again before edits)

- App bootstrap/routing: src/app/bootstrap.js, src/app/router.js, src/ui/shell.js.
- Global foundations and ordering: index.html; src/ui/v6-modern-foundation.css, src/ui/v6-core-experience.css, src/ui/v6-black-theme.css; inherited app/V4 styles loaded earlier. Existing dark tokens and spacing already exist; repair them centrally where possible, not with another stack of contradictory !important rules.
- Reader: src/features/reader/index.js; src/ui/reader.css; src/ui/reader-v4.css; src/ui/v6-core-experience.css; src/ui/v6-black-theme.css. Reader audio renders markup via readerAudioHtml, contains data-reader-audio-* hooks, and is sticky above bottom navigation. Retain functional hooks and Scripture selectable text.
- Home: src/features/home/index.js; src/features/home/assignment-summary.js; src/features/home/today-this-week.js; src/ui/v7-home-feature.css; src/ui/v6-core-experience.css.
- Library: src/features/library/page.js, visual-content-card.js, visual-decks.js, discovery.css, visual-decks.css, item-page.js, index.js. Validate exact files and any lazy CSS imports before implementation.
- ONE 2 ONE: src/features/one-to-one/index.js, src/ui/v7-one-to-one-lesson.css, and the actual stylesheet defining bq-one2one-home (locate at Phase 08). The overview uses data-pair-invite, data-pair-retry, data-pair-results and related handlers; preserve these or migrate with equivalent tests.
- You: src/features/more/index.js; src/ui/more-v4.css, more-phase-b.css and v6 overrides.
- Tests: package.json supports npm run typecheck, npm run unit, npm run build:v6; targeted V7 tests under tests/v7; release/browser acceptance and workflows are documented in existing V7 release requirements. Confirm exact targeted tests before running; do not invent successful test results.
- Existing mobile nav canonical order verified in src/ui/shell.js: Home, Bible, Library, Groups, You. Keep 5 labeled tabs.
- CSS source finding: src/ui/v6-core-experience.css currently defines sticky bq-reader-audio with bottom calc(78px + env(safe-area-inset-bottom)) and multi-column grid; the screen suggests a narrow-screen layout mismatch. Confirm computed layout, CSS specificity and bounding rectangles before editing.
- ONE 2 ONE hero currently renders repeated ONE 2 ONE eyebrow plus h1 in src/features/one-to-one/index.js (source-confirmed); treat duplication as intentional only if visual hierarchy is defensible.
- Home markup includes a featured hero, another Continue Journey hero, Today, weekly cards, assignments, and shortcut rail; multiple actions may duplicate access paths. Do not delete callbacks without replacement.
- V7 is already released; phases are post-release corrections on a branch/PR against live main. Do not use older v7/development instructions to overwrite main.

## 2. Mandatory target design contract — measurable, not arbitrary polish

Retain BibleQuest near-black + muted warm gold and editorial serif for prominent content headings, with one coherent sans family for controls, metadata, navigation. No additional display font family unless justified by real typographic need.
- Type: normal app body target at least 16 CSS px; important secondary text 14-16; rare nonessential dense metadata may be 13 only if readable and tested; chapter scripture reading settings control size independently. Body line-height about 1.45-1.7, scripture approximately 1.6-1.85 unless reader preferences override. Use existing bq-type variables and em/rem fluid behaviors before new hardcoded values. Preserve heading semantics.
- Contrast: WCAG 2.2 AA minimum 4.5:1 for ordinary text, 3:1 for qualifying large text and meaningful nontext controls; verify with computed styles on image and gradient backgrounds. Gold foreground on gold background or pale-on-pastel text is unacceptable. Do not assume a theme variable passes in every component.
- Touch: 44x44 CSS px project target for major controls; WCAG 2.2 AA minimum 24x24 or valid spacing exception where relevant. Keyboard focus visible and contrast >=3:1; active state not color-only. Do not shrink targets to solve density.
- Spacing: use existing 4/8/12/16/24/32/48 token scale. Typical mobile page gutter 16 px minimum where compatible with 320-wide view. Prefer 12-16 px card padding for compact text cards and 16-24 for reading/featured content, adjusted for real breakpoints. Avoid redundant horizontal inset from nesting panels.
- Shapes: existing radius-control ~12, radius-surface ~16, radius-hero ~22; consistent depth and borders. Do not make every ordinary menu item into a huge rounded card.
- Content hierarchy: exactly one visually dominant primary action per task context; secondary actions quiet/outlined or in overflow. Information-rich cards must communicate title, type, relevance/duration or progress, and action without forced excessive whitespace.
- Sticky/fixed: define actual header, bottom tab, safe-area and player geometry; no overlay can hide focusable controls or last content. Reserve in-flow space or programmatic scroll-padding-bottom for sticky elements; do not rely on z-index only. Handle viewport resize, browser chrome and keyboard.
- Navigation: stable five destinations, recognizable labels, visible active state, preserved deep-link/back behavior and focus management. Keep feature access discoverable even when Home/You shortcuts are compacted.
- Locale: EN, TL, CEB, ILO for existing supported UI/context, plus any active Japanese reader content as applicable; use localization keys for newly touched strings. Check translated button wrapping and text direction assumptions without replacing Scripture or modifying translation content.
- State completeness: loading, empty, retry/error, signed-out, access denied, network loss, offline cached and missing-art fallback where applicable. Avoid white flashes in dark theme.
- Motion: use existing V7 motion tokens, prevent transitions blocking touch/keyboard and honor prefers-reduced-motion.
- Security: ONE 2 ONE pairing/lesson controls respect membership, roles, privacy, tenant denial, consent, share revocation and pending permission hydration. Frontend hiding alone is not authorization.
- Performance: no new large media/network calls; retain approved image byte/hash/licensing restrictions, lazy loading, offline/PWA cache, scroll smoothness and CI bundle budgets.
- Labels/data: source-backed chapter, progress/XP, event dates and localization. Debug-looking visible values must be confirmed against actual account data; never erase legitimate records as a cosmetic fix.

## 3. Proposed interaction hierarchy per screen

Reader: primary continuous Scripture with chapter/navigation and mark-read status; audio is initially a compact nonobstructive mini-player when available; secondary speed/voice/timer/auto-next settings in accessible details/sheet; all text may scroll above player. If player is expanded, opening is intentional and collapsible; preserve seek and chapter auto-next behavior.
Home: first viewport answers what to do next (Continue or Today); featured content remains an optional branded visual, progress is compact, ministries and assignments are a concise preview linking into Groups; no wholesale deletion of features or real congregation content.
You: account/profile with personal progress and saved items at top; grouped small navigation rows for study, community/leadership, personal tools/settings; low-frequency tools not visually equal to primary reading journey. Permission-aware sections.
ONE 2 ONE: one clear introduction; existing relationships or helpful empty state; Invite Member as action if authorized; mentor curriculum/assignments only for allowed roles; account/congregation switching in contextual controls rather than three giant bottom buttons.
Library: search + type filters first; compact text-first entries for unillustrated items, approved image where present, clear title/content category/topic/reading time/progress and one action; preserve search/query state and return position. Treat colored empty cover surfaces as a fallback to improve, not as a reason to create images.

## 4. Execution rules for each independent chat

A chat executes ONE phase (or one smaller split subphase when necessary) and must be able to finish implementation plus affected verification within the turn. Do not auto-start the next phase because time remains. No phase is PASS simply because code or a PR exists.
1. Fetch live main HEAD, current plan + both ledgers, existing PRs touching owned files, and the most relevant rules/feature files. Compare with source SHA recorded in ledger.
2. Select first OPEN phase whose dependencies PASS and with no competing active branch owner; Phase 00 must run before implementation. If prior phase is BLOCKED, do not bypass a safety gate; other disjoint phases may proceed only if no dependency.
3. Write specific scoped acceptance tests (including negative interactions) before or alongside the change. Preserve established data-* hooks or update all associated listeners/tests.
4. Create a narrowly named branch from fresh main. Limit affected files to the phase scope; conflicts on shell/design tokens/ledger use one owner at a time.
5. Run the smallest meaningful tests; verify built mobile/browser behavior at specified widths. A code inspection is NOT browser QA. If Chromium/device unavailable, mark visual run as NOT RUN/BLOCKED, document how to execute it, and do not claim visual PASS.
6. Create PR with changed paths, original defect IDs, exact head SHA, screenshot/DOM metrics, commands, outcomes, exceptions, rollback concern. Merge only after required protections/CI and review conditions; never force push over concurrent tasks.
7. Update execution ledger with phase OPEN/IN_PROGRESS/BLOCKED/PASS, exact merged SHA/PR, commands and CI URLs, evidence, unresolved IDs. Add V7_ACTIVE_STATUS.md brief pointer once project begins; do not duplicate its release authority or falsify status.
8. Hand off next eligible phase. No background work; every chat must record finished versus remaining work.

Pass criteria for a phase: implementation committed + changes integrated safely + relevant test PASS + actual browser/DOM/device evidence where applicable + no new confirmed P0/P1 regression + ledger updated. Otherwise status remains OPEN or BLOCKED with concrete next action. A test marked SKIP/NOT RUN is not PASS. A screenshot-only visual issue may be CLOSED_AS_NOT_REPRODUCED if CURRENT production DOM/device evidence proves compliant; record evidence rather than forcing a cosmetic change.

## 5. Eighteen chat-sized phases: boundaries, deliverables, gates

### Phase 00 — Baseline reproduction and QA fixture seed (no app edits)
Read current main, recent fixes and overlap PRs. Verify S1-S5 exact routes, logged-in fixture roles, built/deployed source SHA and viewport. Capture sanitized 320, 390, 430, 800 CSS px screenshots of Home/Reader/Library/ONE 2 ONE/You in dark theme plus at least one light-theme pass; record layout bounding boxes and scrollHeight/clientHeight for content/player/nav. Confirm reader audio available state. Mark each defect REPRODUCED, NOT REPRODUCED or NEEDS AUTH/DATA in defect ledger; distinguish resized upload artifacts from actual UI. Produce testing fixture instructions and exact playback/nav observations.
Gate: real screenshot/DOM evidence for P0 audio and shell, route map and prioritized backlog. If no browser/device tool exists, produce runnable reproduction commands and mark BLOCKED; do not promote visual claims.

### Phase 01 — Reader audio geometry and obscured Scripture (P0)
Touch Reader audio markup/styles only plus minimal related tests. Verify original sticky multi-column layout; implement compact player geometry at 320/390/430, responsive wrapping without overlap, reserve bottom space for nav and player, ensure last verse and chapter footer scroll into view. Choose in-flow vs sticky by measured usability; retain Play/Pause and player state.
Gate: no overlap of verse focus/selection/player/nav in expanded/collapsed modes; last verse visible and accessible; no unintended horizontal scroll; reader state preserved after route return.

### Phase 02 — Reader player controls, status, and copy (P1)
Put narrator, speed, timer, Auto-next and other secondary controls behind clear disclosure/sheet; enforce responsive label/checkbox behavior. Replace unresolved --:-- with explicit loading/unavailable state without inventing duration; confirm seek disabled when not loaded, audio-error recovery, success status, mark-read idempotency and XP. Translate touched labels via localization. Preserve data-reader-audio-* hooks and behavior.
Gate: keyboard/touch operable; no narrow vertical word stacking; no regression in narration, seek, offline, chapter auto-next or marked-read/XP.

### Phase 03 — Global shell, safe areas, headers and bottom tabs (P0/P1)
Inspect src/ui/shell.js and CSS layering from index.html. Address screenshot Reader top-right selector likely obscured by header; ensure nav/header/safe areas robust on Android PWA and browser. Validate nav labels/active state; z-index/focus order; back and deep-link restoration. Do not redesign nav architecture or add sixth tab.
Gate: 5 labeled tabs accessible at 320/390/430/800, no header/dropdown clipping or nav over content, safe-area bottom and browser/PWA resize handled.

### Phase 04 — Shared tokens and reusable primitives (P1)
Audit computed style conflicts and inherited CSS override order (app/V4/V6/V7); harmonize existing body/meta/heading type, semantic color contrast, control/card spacing, radius, focus. Refactor focused shared primitives first and migrate only touched screens; avoid blanket selectors/!important proliferation. Keep dark brand; preserve working light theme.
Gate: documented design token table + contrast samples in dark/light + no unrelated screen regression, 200% text and 44px primary target.

### Phase 05 — Home first viewport and priority (P1)
In Home render/hero styling, remove redundant breadcrumb/heading presentations, focus top space on featured or Continue journey plus one meaningful Today action. Preserve hero approved asset/fallback, real reading state, route callbacks, and XP. Avoid multiple equally dominant CTAs.
Gate: Continue works, correct chapter/progress, Today accessible without a long scroll on 390 high typical handset; no repeated title text or inaccessible hero buttons.

### Phase 06 — Home secondary density and duplicate entry points (P1)
Consolidate weekly ministry, assignment summaries, progress and shortcut rail into digest/summary + linked destination; do not delete real tasks, statuses, event data or features. Confirm whether 'V6 test' is actual content fixture vs production user data before filtering. Investigate white oval/floating control source (app, browser, OS, overlay); don't delete if accessibility/system element.
Gate: no feature lost; no duplicated identical low-value shortcut in same viewport; ministry role visibility remains correct; settings/menu navigation tests pass.

### Phase 07 — You hub information architecture (P1)
Convert repeated giant More feature cards into grouped compact tappable rows; retain all existing feature launchers including games, study, media, community, tools, accessibility/admin. Introduce meaningful grouped headings; search or jump links only if current scope stays bounded. Keep account/settings discoverable and avoid exposing inappropriate admin entry points.
Gate: inventory every pre-change launch action and verify matching post-change path; long localized labels fit, group sections keyboard navigable, short high-value first viewport.

### Phase 08 — ONE 2 ONE introductory/empty-state flow (P1)
Deduplicate visual 'ONE 2 ONE' heading/eyebrow; reduce unnecessary hero height/padding without losing context; explain no-relationship state, ensure invite semantics and account/congregation context visible. Make Reload a refresh/retry affordance, not giant competing CTA; preserve load/retry and aria-live.
Gate: fresh/empty/list/error/retry states accurate, invite action leads correctly, no misleading claim that nothing exists during load.

### Phase 09 — ONE 2 ONE mentor tools and settings hierarchy (P1/security)
Move curriculum and lesson preparation to role-appropriate action area; move Account, Choose congregation, Back to Grow into contextual nav/settings without breaking navigation. Verify member/mentor/leader/admin variants and congregation switch with consent/privacy/tenant-denial tests. Do not use CSS hiding as security.
Gate: rights-appropriate controls, exact relationship context, all callbacks remain routed, privacy/tenant/consent tests green.

### Phase 10 — Library result cards (P1)
Inspect current render/visual decks/card styles. Replace oversized pale full-tile placeholders with concise live-text rows/cards, include title, content type, topic, length/progress if available and one CTA. Show approved art when registered; no missing-image slots or generated placeholders. Responsive one-column small phones; use two columns only when content/height works.
Gate: identical item counts and IDs, safe attribution/rights, no image policy regression, no clipping/contrast fail, visible usable titles at 320/390.

### Phase 11 — Library browse/search/filter/detail (P1)
Clarify discovery header, search field, type filters, active chips, loading/empty/error/retry; preserve URL query and scroll/filter on details back; no lost localizations. Verify devotional Book external links, Past Teachings and Saved state; avoid altering license/content status. Remove duplicate filters only if navigation remains explicit.
Gate: end-to-end browse/search/filter/detail/read/back in EN/TL/CEB/ILO where supported; works offline/cached with honest status.

### Phase 12 — Responsive geometry acceptance (independent QA)
Run browser matrix five screens at 320, 390, 430 and 800 CSS px, dark/light where applicable, with 200% scale, both collapsed/expanded Reader player and live vs fallback cards. Assert no horizontal scroll, overlap, clipped actionable text, offscreen focus or safe-area collisions. Record bounding rectangles, screenshot artifact hashes and exact candidate SHA.
Gate: every active P0/P1 geometry defect closed or explicitly BLOCKED with data; not a generic screenshot approval.

### Phase 13 — Accessibility, typography and localization acceptance
Check WCAG 2.2 AA text/large/nontext contrast, focus order/visible focus, heading landmarks, accessible names, icon labels, screen reader/live regions, 44px project primary tap target, 200% text, reduced motion and EN/TL/CEB/ILO labels. Validate actual Japanese Reader selector/text where supported. Record failures by ID and reopen owner phase if needed.
Gate: no unwaived confirmed critical access issues; checks include negative states and real computed styles.

### Phase 14 — Functional journeys and application states acceptance
Test Home Continue, Reader selection/audio/mark-read/XP, Library browse/detail/back, ONE 2 ONE invite/relationship/mentor tool, You entry inventory. Exercise loading, empty, offline, cached, retry, denied, logged-out, slow/error image, failed audio, back/deep links, Android keyboard and landscape/portrait as supported. Compare behavior to pre-change baseline.
Gate: no missing features, destructive change, broken callback, accessibility trap or stale state.

### Phase 15 — Regression, privacy, performance, PWA hardening
Run affected and full authorized suites: typecheck, unit, V7 browser/regression, ONE 2 ONE API privacy/tenant, relevant visual-asset checks, build, PWA/offline, security. Compare bundle/file budgets, image rights/served bytes, and theme/motion. Use actual CI work links. Fix observed regressions in small follow-up commits (or split into subphase 15A/B if too large).
Gate: required checks PASS on a single source candidate; unrelated historical failures explicitly classified with evidence, not silently waived.

### Phase 16 — Release candidate preparation and exact-SHA CI
Review open phase defects, dependency closure, PR conflicts and rollback pin. Freeze one candidate SHA, run current established strict release gate without muting checks. Verify all affected browser artifacts, served media/content manifest and review controls. No simultaneous unrelated production promotion.
Gate: exact candidate SHA, run URLs, CI PASS, releaseReady evidence and rollback recorded. If source changes, invalidate and repeat certification.

### Phase 17 — Production deployment, post-deploy test and closure
Promote through the current authorized production process, verify deployed identity and full served-file checks, smoke each of five routes on real deployed URL and Android PWA/browser if possible. Capture final sanitized screenshot/geometry evidence. Reconcile defect ledger/phase ledger; update V7_ACTIVE_STATUS.md with links and actual remaining issues; no speculative 'all solved'.
Gate: same-source production byte/identity and smoke PASS, rollback intact, explicit user-visible summary.

## 6. Dependencies and execution sizing

Sequence 00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17 is safest with a single executor. Phases 05-11 may be reordered only if they do not touch shared CSS/router or release state and Phase 04 is complete. Phases 12-15 can discover defects and RETURN them to their owner phase; do not mark them PASS while open P0/P1 issues exist. Every chat is capped to its assigned phase. If a phase cannot be completed in one session, split into numbered A/B subphases and log precise outstanding work, rather than pretending completion.

Phase 00 is evidence/setup; Phase 01 is first implementation. The reader has first priority, but major visual redesigns must not bypass privacy/security or release gates. Phase 17 is not automatically authorized by a prior phase's PASS; the executing user direction and current repository release procedure determine deployment.

## 7. Standard per-phase handoff template (fill, never fabricate)

Phase ID / status / owner:
Source main SHA and feature branch:
Defect IDs and reproduced before state:
Paths changed (or no edit):
Intentional behavior changes / behavior preserved:
Tests run, command, environment, exact output link:
Widths/locales/themes/roles checked:
Before/after screenshots, DOM metrics, artifact SHA or explicit NOT RUN:
PR, review/CI status, merge SHA:
Remaining risks and next eligible phase:
Any result without explicit test evidence is UNVERIFIED.

## 8. Durable continuation commands

New chat, implementation:
"Continue BibleQuest post-release UI QA Phase NN. First read docs/v7/V7_POST_RELEASE_UI_QA_CORRECTIONS_20261017.md and the associated defect/phase ledgers from live main or its open documentation PR. Verify source HEAD, work the bounded phase only, run affected QA, commit/PR safely, update ledger, report evidence."

New chat, automatic selection:
"Continue the first eligible OPEN BibleQuest post-release UI QA phase from the live GitHub phase ledger. Do exactly one phase, verify it, and leave a durable GitHub handoff."

If this document remains on a PR branch, first find the open UI QA documentation PR; do not claim it is on main or that phase instructions are universally installed. In case of conflict, honor live release/rights/privacy contracts and record resolution in the PR.

## 9. Exit definition

All five routes work and are understandable for normal users; user-visible P0/P1 defects from the ledger are fixed or evidence-backed not reproducible; interactions and saved state are intact; accessibility, privacy, translations, PWA/offline, performance and exact-SHA release gates pass; deployed build matches certified source. Screenshot elegance without correct behavior is not completion.
