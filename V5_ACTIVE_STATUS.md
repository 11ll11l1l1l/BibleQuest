# BibleQuest V5 Official Active Status

Updated: 2026-09-13 JST
Execution model: coordinated five-agent feature-completion program with serialized integration
Official V5 integration branch: `v5/feature-completion`
Observed integration HEAD at this reconciliation: `dfcb851b38326edef0e4969958eb15866c673c8d`
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

## 3. Current reconciliation state

The integration branch has not yet serialized the current queue of open worker PRs. Therefore phase state is tracked as **implemented/open-evidence/in-progress**, not inferred from stale prompts.

- **Phase 1 — Leader Center:** implementation is present on the integration line, but the exit gate remains open until current-head member-vs-leader browser denial/allow evidence is recorded. Do not redesign or re-open the phase except for demonstrated regression or missing exit evidence.
- **Phase 2 — Admin Console completion:** IN PROGRESS. UI/security/email-change work exists across open PRs and still requires controlled real Supabase Auth evidence for the email-change gate.
- **Phase 3 — artwork/dead-owner cleanup:** IN PROGRESS. Several bounded artwork/Media-retirement PRs are pending serialization/evidence.
- **Phase 4 — minimum Web Push:** IN PROGRESS. Service-worker delivery/click handling and subscription-storage work exist in separate PRs; client subscription lifecycle, server delivery/cleanup, integration, and real closed-app device proof remain.
- **Phase 5 — baseline offline Scripture:** IN PROGRESS. Offline availability characterization exists in an open PR; Reader UI wiring and actual no-network reopen evidence remain.
- **Phase 6 — multi-congregation:** IN PROGRESS. An account-safe active-congregation primitive exists in an open PR; visible switcher, Calendar/presence/Assignments wiring, controlled second congregation, and real Gate C execution remain.
- **Phase 7 — verification debt:** IN PROGRESS. CEBOCB current-head automated browser evidence exists in an open PR; Couples bidirectional verification and deferred whole-app Section E/G evidence remain.
- **Cross-phase content/UX completion track:** ACCEPTED / IMPLEMENTATION NOT CERTIFIED. The precise V5 target is defined below and in the plan/checklist.
- **Phase 8 — certification/promotion:** NOT STARTED. No production promotion is authorized until all required gates pass on one exact SHA.

Open PRs are work products, not integrated truth. A5 must serialize them one at a time after exact-head review/evidence.

## 4. Mandatory V5 outcomes

1. Leader Center complete and role-safe.
2. Admin Console completion, including emergency-action UI and owner-only email-change/recovery with real controlled verification.
3. Remaining honest artwork/icon completion and dead duplicate Media Library owner retirement.
4. Minimum real Web Push using the existing Notification Center as source of truth.
5. Baseline reopening of previously-opened Scripture offline with clear availability state.
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

A static test never substitutes for a required real backend/device gate. Push requires DEVICE/FIELD app-closed delivery. Offline requires actual no-network reopening. Gate C requires real cross-congregation execution. Email-change requires controlled real Supabase Auth execution.

## 8. V6/V7 sequencing

`V5 certification -> V6 architecture upgrade -> V7 full overhaul` is strict. V6 and V7 may be documented but no runtime implementation from those programs is allowed while V5 is active.
