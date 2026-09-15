# BibleQuest V5 Official Active Status

Updated: 2026-09-15 JST
Execution model: coordinated five-agent feature-completion program with serialized integration
Official V5 integration branch: `v5/feature-completion`
Observed integration HEAD at this reconciliation: `e0899b185fc1d3c0aa31dfd7f9de74993faa9bb9`
Production fallback: V4 on `main` until an exact V5 candidate is accepted and promoted

## 1. Authority and conflict resolution

Use this order whenever instructions disagree:

1. Current repository/branch/commit state, CI/check evidence, and controlled backend/device evidence.
2. `V5_ACTIVE_STATUS.md` — current phase/blocker/candidate truth.
3. `DEVELOPMENT_PLAN_V5.md` — complete V5 target and sequencing.
4. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — testable completion contract.
5. `V5_COORDINATED_AGENT_PROTOCOL.md` — five-agent operating rules and ownership lanes.
6. The newest non-expired `V5-CLAIM` / `V5-DISPATCH` entries on Issue #185.
7. Scheduled-agent prompt text.
8. Older Issue #185 comments, old chat handoffs, lab branches, README prose, and historical V5/V6 naming.

Older Issue #185 architecture-era dispatches remain historical evidence only. They do not override the files above. A claim expires unless it has a corresponding active branch/PR or is renewed after re-checking current ownership.

## 2. V5 line in the sand

V5 is **feature completion on the current proven architecture**. V6 owns engine/architecture replacement. V7 owns the later full product/visual overhaul.

V5 must not introduce a Vite/build migration, global router/state rewrite, Reader/Games engine rewrite, generalized offline/background-sync platform, replacement notification engine, generalized repository/data-access layer, tenant engine, replacement media platform, generalized search/index engine, or broad visual/navigation overhaul.

A small helper needed to complete an accepted V5 feature is allowed only when it remains local, dependency-light, current-architecture compatible, separately testable, and does not redefine ownership across the app.

## 2b. My Journey (P1 content track) - committed, blocked from full CI proof by a pre-existing unrelated failure

Implemented as an unclaimed, uncontested V5 P1 item (no open PR referenced it; an earlier incomplete attempt had already been removed in #336). Pure composition over the existing shared progress-event log and Assignments owner, no new state/storage. Fully localized in English and Tagalog through the existing `localization.t()` system (new `myjourney.*` keys added to both `en.js`/`tl.js`, key-parity verified by both the localization foundation test suite and a new dedicated static contract). Real edge, static, and browser smoke coverage added (EN/TL rendering, empty state, mobile touch targets).

Committed directly to `v5/feature-completion` and verified clean on an independent fresh clone (local edge suite, validators, and the project's own localization-parity tests). **A real CI gate was attempted and came back `failure`** - but the failing step was `architecture validators`, which was proven pre-existing and unrelated *before* committing (stashed all My Journey changes, re-ran the same failing checks against the bare branch tip: identical failures - `push-subscription.js` direct-storage-use and a stale tutorial-launcher contract, both from other agents' in-flight work). That pre-existing failure short-circuits the workflow, so the edge-regression and full browser suite steps never ran at all for this candidate - meaning **My Journey has not yet received real CI-level browser proof**, only local/fresh-clone proof. Per the standing rule ("never freeze a SHA that has not itself passed the gate"), no `release/v5-my-journey` checkpoint was created. This is recorded as an honest gap, not a claimed certification.

**Action needed from A5 or whoever owns Phase 3/4 artwork+push serialization:** once the `push-subscription.js` storage-boundary violation and the stale tutorial-launcher contract are fixed (both pre-existing, unrelated to this item), re-run the gate for My Journey specifically - the code itself is already integrated and should pass cleanly once the architecture-validator step itself is unblocked.

## 3. Current reconciliation state

A5 has repaired the concurrent-work collision damage and is serializing one reviewed tranche at a time. The integration line now has a push/PR collision guard, exact-head focused workflows for newly integrated high-risk work, and a fail-fast browser startup diagnostic. Open PRs remain work products rather than integrated truth.

- **Integration stability:** REPAIRED / GREEN at this reconciliation. The incomplete My Journey bootstrap wiring and retired `mediaLibrary.leave()` cleanup reference were removed in #336. The shared-shell browser gate now reports module/startup failures directly instead of timing out. The V5 collision guard is active on integration work.
- **Phase 1 — Leader Center:** IMPLEMENTED / EXIT EVIDENCE OPEN. The feature owner is present, but the current-candidate member-denied vs leader-allowed browser gate still needs to be serialized on the current integration line.
- **Phase 2 — Admin Console completion:** IN PROGRESS. The truthful account-deletion audit ordering fix is integrated in #338: `accountDeleted:true` is recorded only after Supabase Auth deletion succeeds. Controlled real Supabase Auth email-change evidence remains a required open gate.
- **Phase 3 — artwork/dead-owner cleanup:** IN PROGRESS. The duplicate Media Library owner has been retired and the live `media` route remains on Recordings; remaining genuine-match artwork/glyph verification debt still needs reconciliation.
- **Phase 4 — minimum Web Push:** IN PROGRESS. The reviewed browser `PushManager` lifecycle and service-worker push/click handling are integrated in #339 with dedicated exact-head CI. Explicit category opt-in defaults off, stale-account subscription rotation/rollback/sign-out cleanup are covered, and notification click targets are same-origin. Final backend persistence/delivery integration evidence, invalid-endpoint cleanup against real push-service responses, and app-closed DEVICE/FIELD delivery/tap proof remain open.
- **Phase 5 — baseline offline Scripture:** **COMPLETE / ACCEPTANCE GATE SATISFIED.** Availability detection is integrated, Reader visibly reports offline availability, and merged PR #323 proved cached Scripture reopening with an actual Chromium context switched offline via `context.setOffline(true)`. The same proof requires never-opened Scripture to remain unavailable/fail clearly. The checklist explicitly allows equivalent real-browser no-network evidence; no hardware-device claim is needed for this gate. Compare `8b74b6520ea42a542ba8294f275244b0165e4fd6..e0899b185fc1d3c0aa31dfd7f9de74993faa9bb9` shows the Phase 5 Reader/offline owners and proof files were not modified afterward.
- **Phase 6 — multi-congregation:** IN PROGRESS. The account-safe active-congregation primitive and Assignments consumption are integrated, and Presence active-context consumption/switch cleanup is integrated in #340. Existing Calendar code consumes the active congregation owner. Remaining release gate is controlled second-congregation topology plus real cross-congregation Gate C BACKEND-E2E/DEVICE-FIELD execution; any visible-switcher acceptance gap must also be closed before Phase 6 is marked complete.
- **Phase 7 — verification debt:** IN PROGRESS. CEBOCB/current Reader verification has substantial integrated evidence; Couples bidirectional verification and deferred whole-app Section E/G evidence still need current-head reconciliation.
- **Cross-phase localization/content/UX:** IN PROGRESS. The localization foundation is integrated. Shared shell, Transformation, Home, Calendar, Assignments, Notification Center, Account/settings, and Videos/Recordings have current EN/TL coverage and browser/static evidence. Remaining agreed Tagalog surfaces, Cebuano/Bisaya completion, latest-service/weekly composition, and content-depth work remain.
- **Phase 8 — certification/promotion:** NOT STARTED. No production promotion is authorized until all remaining required gates pass on one exact candidate SHA.

Recent A5 serialized integration sequence from the repaired line:

1. `71c980efcfafc635e162c9eaf64c35c9113ff303` — runtime/module-graph startup repair (#336).
2. `d4b1ea78520457746e64bd9a3137661f6a113c0d` — Videos/Recordings Tagalog tranche (#337).
3. `d8988ca3b535f8b31513a706502e436603967b3b` — truthful Admin delete audit ordering (#338).
4. `7518aab617b8e358c8031efc9848639ba2adeb41` — Phase 4 browser push lifecycle (#339).
5. `e0899b185fc1d3c0aa31dfd7f9de74993faa9bb9` — Phase 6 Presence active-congregation consumer (#340).

A5 must continue to serialize one PR at a time after exact-head review/evidence. A stale/red PR must be rebased/replayed or superseded rather than merged by assumption.

## 4. Mandatory V5 outcomes

1. Leader Center complete and role-safe.
2. Admin Console completion, including emergency-action UI and owner-only email-change/recovery with real controlled verification.
3. Remaining honest artwork/icon completion and dead duplicate Media Library owner retirement.
4. Minimum real Web Push using the existing Notification Center as source of truth.
5. Baseline reopening of previously-opened Scripture offline with clear availability state. **Satisfied.**
6. Real second-congregation Gate C evidence plus minimum active-congregation selection/switching respected by Calendar, presence, and Assignments.
7. CEBOCB, Couples bidirectional-sharing, and deferred whole-app verification debt closed with evidence.
8. Accepted content/UX completion track completed on the current architecture.
9. Full exact-SHA certification before promotion.

## 5. Accepted content/UX completion target

### P0 — release-critical product completion

#### 5.1 Localization foundation, then Tagalog

Localization is not a find/replace exercise. Before broad translation work, add the smallest current-architecture localization mechanism required to avoid repeated hard-coded rewrites:

- plain key -> string dictionaries for `en`, `tl`, and later `ceb`;
- a tiny lookup helper such as `t(key)` with deterministic English fallback;
- locale preference wired through an existing safe settings/state pattern rather than a new global state system;
- no framework dependency, build-tool change, routing rewrite, or generalized content platform;
- one canonical key inventory reused by Tagalog and Cebuano;
- missing-key and fallback tests.

Then complete natural Tagalog for BibleQuest-authored UI/content, starting with Transformation and shared shell/navigation, then Home, Calendar, Assignments, Notifications, settings, Community/Media, remaining member surfaces, and leader/admin user-visible instructions. Proper nouns and Bible translation names may remain unchanged. Scripture text itself must always come from approved/licensed Bible translations and must never be machine-translated by BibleQuest.

#### 5.2 Real Calendar

Calendar's primary presentation becomes a true month grid over the existing current-architecture event data. Preserve useful agenda/detail views. Event category colors must have visible text/icon cues so color is never the only accessibility signal. Mobile day selection must remain usable. Personal/congregation/assignment behavior and active-congregation filtering must be preserved.

#### 5.3 Media / latest completed service

V5 may automatically surface a completed service **only when the current BibleQuest/recordings flow already exposes a stable completed recording identity**. Use stable video identity for deduplication and provide authorized hide/edit correction.

V5 does **not** add YouTube Data API polling, webhooks, scheduled external discovery, a new ingestion daemon/service, or a replacement media platform. If the current app cannot know that a livestream ended without such an integration, V5 uses the smallest leader confirmation/import action and defers external discovery automation to V6.

#### 5.4 Today / This Week Home

Compose existing owners into an immediately useful member view: next event, current assignment, continue reading, latest service, current Transformation prompt, and unread notifications. Do not create a new state engine.

#### 5.5 Connected weekly spiritual journey

Connect existing service/sermon, Scripture, Transformation/reflection, discussion/prayer, assignment/action, and Calendar context through current owners and links/composition. Do not create a new workflow engine.

### P1 — connected content depth

- Transformation authored flow: Scripture/context -> understand -> reflect -> apply -> pray, with optional spouse/family discussion and weekly action.
- Pastor/leader weekly message anchoring the week's Scripture/service/Transformation/assignment/Calendar context using existing patterns.
- My Journey/reflection history presenting existing private reading/reflection/assignment/progress signals without a new analytics engine or competitive spiritual leaderboard.
- Family & Couples tracks for communication, forgiveness, stewardship/finances, intimacy/love, parenting, serving together, family Bible time, gratitude, kindness, and prayer.
- Non-competitive personal milestones using existing progress sources where possible.
- Optional Ask at Dinner prompt attached to a service, Transformation item, or weekly journey.

### P2 — completeness and discovery

- Full Cebuano/Bisaya localization of the same scoped BibleQuest-authored UI/content inventory using the localization foundation above. CEBOCB or another approved Cebuano Bible source remains Scripture.
- Lightweight filtering/search over data already loaded/exposed by current owners. No generalized index/search platform.
- Better organization of existing Media/Recordings by available metadata/categories. New schema is not assumed; reuse existing metadata first. Any genuinely required small schema change must be a separate reviewed/RLS-tested tranche.

## 6. Data-model rule for content additions

Composition/reuse comes first. Before adding a content table or new durable schema, prove that current Transformation, Assignment, Journey, Calendar, Media/Recordings, or existing settings owners cannot represent the requirement cleanly. Any new table/column must be minimal, separately claimed, use existing RLS conventions, and must not become a new V6-style content/repository engine.

## 7. Evidence rules

Use explicit evidence classes:

- **STATIC** — source/contract/unit checks only.
- **BROWSER-AUTO** — automated browser behavior on an exact SHA.
- **BACKEND-E2E** — controlled real backend execution with non-sensitive evidence.
- **DEVICE/FIELD** — actual device/network/account/congregation behavior.

A static test never substitutes for a required real backend/device gate. Push requires DEVICE/FIELD app-closed delivery. Offline requires actual no-network reopening; Phase 5 satisfies this through the checklist-approved real Chromium no-network equivalent. Gate C requires real cross-congregation execution. Email-change requires controlled real Supabase Auth execution.

## 8. V6/V7 sequencing

`V5 certification -> V6 architecture upgrade -> V7 full overhaul` is strict. V6 and V7 may be documented but no runtime implementation from those programs is allowed while V5 is active.
