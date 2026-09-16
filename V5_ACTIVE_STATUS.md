# BibleQuest V5 Official Active Status

Updated: 2026-09-16 JST
Execution model: coordinated five-agent feature-completion program with serialized integration
Official V5 integration branch: `v5/feature-completion`
Observed integration HEAD before this documentation reconciliation: `c97c065d5cdc84e4c9d8e79cbb2729f461127f89`
Formal acceptance coverage after Pass 4 reconciliation: **76/122 = 62.3%**
Production fallback: V4 on `main` until an exact V5 candidate is explicitly accepted and promoted

## 1. Authority and conflict resolution

Use this order whenever instructions disagree:

1. Current repository/branch/commit state, exact-head CI/check evidence, and controlled backend/device evidence.
2. `V5_ACTIVE_STATUS.md` — current phase/blocker/candidate truth.
3. `DEVELOPMENT_PLAN_V5.md` — complete V5 target and sequencing.
4. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — testable completion contract.
5. `V5_COORDINATED_AGENT_PROTOCOL.md` — five-agent operating rules and ownership lanes.
6. The newest non-expired `V5-CLAIM` / `V5-DISPATCH` entries on Issue #185.
7. Scheduled-agent prompt text.
8. Older Issue #185 comments, chat handoffs, lab branches, README prose, and historical V5/V6 naming.

Historical claims do not override current repository evidence. A claim expires unless it still has an active branch/PR or is renewed after re-checking current ownership.

## 2. V5 line in the sand

V5 is **feature completion on the current proven architecture**. V6 owns engine/architecture replacement. V7 owns the later full product/visual overhaul.

V5 must not introduce a Vite/build migration, global router/state rewrite, broad TypeScript conversion, Reader/Games engine rewrite, generalized offline/background-sync platform, replacement notification engine, generalized repository/data-access layer, tenant engine, replacement media platform, generalized search/index engine, or broad V7 visual/navigation overhaul.

A small helper needed to complete an accepted V5 feature is allowed only when it remains local, dependency-light, current-architecture compatible, separately testable, and does not redefine ownership across the app.

## 3. Current reconciliation state

Integration stability: **GREEN at this reconciliation**.

The earlier concurrent-work collision damage remains repaired. Recent Home, weekly-journey and Recordings correction tranches all passed their focused exact-head gates together with the relevant collision/state/localization regression guards before serialized merge.

Formal checklist coverage is **76/122 = 62.3%**. This is an evidence-acceptance ratio, not a weighted implementation-progress estimate. Implementation remains materially further ahead than the formal release percentage in areas whose final backend/device evidence is still pending.

### Phase 1 — Leader Center

Status: **PARTIAL / ROLE-ACCESS EVIDENCE COMPLETE / FIVE PRODUCT GAPS OPEN**.

Accepted:

- ordinary member denied;
- authorized leader allowed;
- exact-current-head Chromium role proof and 390px mobile-safe behavior.

Still open:

- Overview member count requirement;
- full published/scheduled/completed assignment split acceptance;
- real completed-response review destination;
- privacy-safe People directory acceptance;
- Groups & Teams composition acceptance.

Do not mark Phase 1 complete merely because access/browser smoke is green.

### Phase 2 — Admin Console

Status: **6/7 ACCEPTED / REAL EMAIL-CHANGE BACKEND-E2E OPEN**.

Accepted evidence covers identity/congregation/security cards, action severity, typed destructive confirmations, owner-only/privacy-safe/session-safe sensitive operations, negative cases, and the fail-closed non-production evidence path.

Still open:

- real controlled Supabase Auth email-change execution with target email restored/cleaned up. **BACKEND-E2E required.**

Readiness/static evidence must not be relabeled as real backend execution.

### Phase 3 — artwork / dead-owner completion

Status: **IN PROGRESS**.

Accepted:

- abandoned duplicate Media Library service/page retired while the canonical `media -> Recordings` route remains authoritative.

The current whole-app inventory still contains substantial unresolved glyph/artwork debt. Older unmerged artwork experiments do not count as current runtime completion. Phase 3 remains open until genuine mappings/reviewed exceptions, validator/docs state, and accessibility requirements are fully reconciled on current source.

### Phase 4 — minimum real Web Push

Status: **IN PROGRESS**.

Accepted/integrated:

- browser PushManager lifecycle;
- explicit category opt-in default off;
- account-switch/sign-out safety;
- account-safe subscription persistence over the RLS-backed owner;
- Notification Center remains source of truth;
- same-origin notification click routing;
- no private VAPID/service secret shipped to the client.

Still open:

- final-candidate server-side delivery acceptance for required notification types;
- real push-service invalid/unsubscribed endpoint cleanup evidence;
- app-closed receive/open proof;
- push-disabled final device proof.

Required closed-app and disabled behavior remains **DEVICE/FIELD** work.

### Phase 5 — baseline offline Scripture

Status: **COMPLETE / ACCEPTED**.

Equivalent real-browser no-network evidence satisfies the permitted acceptance path. Previously-opened/current cached Scripture behavior and unavailable-content failure handling are proven without introducing a generalized offline engine.

### Phase 6 — multi-congregation

Status: **CLIENT/CONSUMER ACCEPTANCE SUBSTANTIALLY COMPLETE / GATE C OPEN**.

Accepted:

- account-safe active-congregation selection;
- visible multi-membership switcher with exact-current-head 390px browser proof;
- Calendar consumes active congregation rather than `memberships[0]`;
- Presence consumes active congregation;
- Assignments consume active congregation.

Still open:

- controlled second test congregation or equivalent isolated safe topology;
- real cross-congregation isolation Gate C execution with no leakage. **BACKEND-E2E/DEVICE-FIELD required.**

### Phase 7 — verification debt

Status: **COMPLETE / ACCEPTED**.

Accepted evidence covers CEBOCB 66-book/current Reader, CEBOCB mobile Reader behavior, Couples bidirectional/private sharing, deferred Section E integration, and the Section G loading/empty/error/offline matrix.

### P0 — latest completed service / Media-Recordings

Status: **COMPLETE / ACCEPTED FOR SECTION K**.

Merged #396 adds the previously missing correction surface over the existing Recordings owner:

- confirm/unconfirm an existing recording for latest-service surfacing through `setFeatured()`;
- hide/archive an incorrect active row through `archive()`;
- server-side RLS remains authoritative;
- EN/TL correction copy and 390px browser interaction are proven;
- no YouTube API polling, webhook ingestion, scheduled external discovery, new daemon or replacement media platform was introduced.

Focused run `35040064030`, collision run `35040063941`, Section G run `35040063924`, Recordings Tagalog run `35040064074`, and localization QA run `35040064013` all passed on the accepted #396 head before merge `c97c065d5cdc84e4c9d8e79cbb2729f461127f89`.

### P0 — Today / This Week Home

Status: **COMPLETE / ACCEPTED FOR SECTION L**.

Merged #394 closes both previously open Home acceptance behaviors:

- missing Calendar/Reader/latest-service data has intentional EN/TL empty-state copy rather than blank/broken details;
- exact-head 390px browser evidence covers empty and populated composition, all five owner tiles, navigation handoffs, and overflow/page-error safety.

Focused run `35039155709`, Home Tagalog `35039155616`, localization QA `35039155617`, collision `35039155644`, and Section G `35039155587` all passed before merge `2ba17a8794b9ae1fa79166ab7de1b02e73ab0051`.

### P0 — connected weekly spiritual journey

Status: **COMPLETE / ACCEPTED FOR SECTION M**.

Merged #395 provides a composition-only weekly path through existing owners:

`Recordings/service -> Reader/Scripture -> Transformation/reflection -> Journey Groups/discussion/prayer -> Assignments/action -> Calendar/plan`

The implementation uses existing first-class routes only. It creates no workflow engine, duplicate authoritative record, storage key, new backend/API, or automatic sermon-to-passage inference.

Focused run `35039686763`, collision run `35039686747`, Section G run `35039686745`, and Home browser run `35039686719` passed before merge `e89277383837cd590e023363690b4fc069462efa`.

### Cross-phase localization / content / UX

Status: **IN PROGRESS**.

Accepted/integrated highlights:

- current-architecture EN/TL localization foundation;
- shared shell, Transformation, Home, Calendar, Assignments, Notification Center, Account/settings, Community and Videos/Recordings scoped EN/TL work;
- Community and Videos/Recordings 390px Tagalog browser proof;
- latest-service stable identity, confirmation and correction;
- Home/Today existing-owner composition with intentional empty states and mobile proof;
- connected weekly spiritual journey;
- My Journey private/noncompetitive history with EN/TL, empty-state and 390px browser proof.

Still open includes:

- remaining Tagalog surfaces and final no-unexplained-English scan;
- Cebuano/Bisaya dictionary and full agreed UI/content coverage;
- remaining P1 content-depth items;
- Family/Couples content targets;
- Ask at Dinner;
- Media discovery/organization.

### My Journey

Status: **IMPLEMENTED AND FORMALLY ACCEPTED FOR THE CURRENT P1 CHECKLIST ITEM**.

Current evidence proves composition over existing Progress/Assignments owners, no direct owner bypass, private/noncompetitive history, EN/TL, empty state and 390px mobile behavior.

### Phase 8 — final certification / promotion

Status: **NOT STARTED AS A FINAL CANDIDATE FREEZE**.

Do not begin final promotion until required implementation sections and real backend/device gates are complete enough to freeze one exact candidate.

Required final actions include:

- all required checklist sections pass or have correctly bound evidence;
- accumulated regression green on one exact candidate SHA;
- required browser/backend/device evidence recorded honestly;
- V4 retained as rollback until explicit V5 acceptance;
- A5 reports/freezes but scheduled agents do not autonomously promote;
- final `V5_ACTIVE_STATUS.md` reconciliation before V6 runtime work begins.

## 4. Certification reconciliation history

- Pass 1 / PR #387: **46/122 -> 54/122 (44.3%)**.
- Admin exact-head certification / PR #389: six Admin acceptance items proven while real email-change E2E stayed open.
- Section E current-head refresh / PR #390: stale historical byte locks repaired; full Section E matrix green.
- Pass 2 / PR #391: **54/122 -> 63/122 (51.6%)**.
- Current-head evidence pack / PR #392: Leader role access, Phase 6 switcher/Calendar active context, and My Journey exact-current-head proof.
- Pass 3 / PR #393: **63/122 -> 68/122 (55.7%)** and stale active-status reconciliation replaced.
- Home closeout / PR #394: two Section L behaviors implemented/proven.
- Connected weekly journey / PR #395: all five Section M behaviors implemented/proven.
- Recordings correction / PR #396: remaining Section K correction behavior implemented/proven.
- Pass 4 reconciliation: **68/122 -> 76/122 (62.3%)** once this documentation-only reconciliation is merged.

## 5. Highest-priority remaining certification/development path

1. Complete the five genuine Leader Center product gaps, then rerun exact-head acceptance.
2. Execute Admin real email-change BACKEND-E2E in an explicitly approved isolated non-production Supabase topology.
3. Close Phase 3 artwork/glyph reconciliation.
4. Complete/accept remaining Web Push server and real-device gates.
5. Establish the controlled second-congregation topology and execute real Gate C.
6. Finish remaining Tagalog completeness and full Cebuano/Bisaya scope.
7. Complete remaining P1 content-depth and Media discovery/organization requirements.
8. Reconcile data-model discipline evidence, freeze one exact V5 release candidate, run the full accumulated evidence matrix, then make the explicit promotion decision.

## 6. Evidence rules

Evidence labels remain:

- **STATIC** — source/contract/unit evidence.
- **BROWSER-AUTO** — automated browser behavior on an exact SHA.
- **BACKEND-E2E** — controlled real backend execution.
- **DEVICE/FIELD** — actual device/network/account/congregation behavior.

Rules:

- STATIC never substitutes for a required real backend/device gate.
- Readiness harnesses do not equal execution.
- A green workflow only proves the assertions it actually executed.
- Exact-head evidence must remain bound to the tested SHA/PR/environment.
- Stale PRs are replayed/recreated or explicitly superseded; they are never merged by assumption.
- One reviewed integration tranche at a time remains the default serialization rule for collision-sensitive owners.

## 7. Release boundary

The current public production site remains the V4 fallback until V5 is explicitly accepted. No documentation reconciliation, scheduled agent, or verification-only PR authorizes promotion to `main` or production by itself.