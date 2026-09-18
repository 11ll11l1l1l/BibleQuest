# BibleQuest V5 Official Active Status

Updated: 2026-09-18 JST
Execution model: coordinated five-agent feature-completion program with serialized integration
Official V5 integration branch: `v5/feature-completion`
Final certified runtime/source candidate: `c0772d458e9d17ab1728c47c568e99857c7d67a1` (later commits are evidence/documentation-only)
Formal acceptance coverage after physical Web Push DEVICE/FIELD closeout: **122/122 = 100%**
Production: **V5 RELEASED** on `main` at `f6a0cff0e63ddf676b77b8470d84678958fe9d70`; V4 rollback preserved at `rollback/v4-pre-v5-production-20260918`

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

Integration stability: **GREEN on final runtime/source candidate `c0772d45`**. Exact-head accumulated regression run `35302198022` passed, including the authenticated notification deep-link hydration browser regression. Section G, collision guard, deployed Cloudflare preview smoke, Push Delivery Security, Ministry Calendar, Home Today, glyph inventory, Media retirement and field-harness readiness companions are green on the same candidate line.

The earlier concurrent-work collision damage remains repaired. Recent Home, weekly-journey, Recordings correction, and Leader Center tranches all passed focused merge-candidate gates together with the relevant collision/state/browser guards before serialized merge.

Formal checklist coverage is **122/122 = 100%**. Prior backend/Gate C, localization, Admin, and genuine-provider evidence remains valid. The two physical Web Push gates are now closed by `docs/v5/V5_PUSH_DEVICE_FIELD_EVIDENCE_2026-09-18.md`. Physical delivery was exercised on immutable candidate `35da53900fef8842a8d75187e4a4efaa1c5adc0e`; all push-critical owners are byte-identical on final runtime candidate `c0772d458e9d17ab1728c47c568e99857c7d67a1`, whose only later runtime correction is the separately-proven authenticated deep-link hydration fix.

### Phase 1 — Leader Center

Status: **COMPLETE / 6 OF 6 ACCEPTED**.

Accepted:

- congregation snapshot, role, ministry-safe member count, and active-in-30-min Overview composition;
- real response-review handoff through the existing Assignments owner and review destination;
- privacy-safe People directory limited to existing ministry-relevant directory fields;
- Groups & Teams composition through existing Journey Groups/Team Center ownership;
- ordinary member denied and authorized leader allowed, including exact-head Chromium/390px evidence.

Merged #399 completed these existing-owner composition gaps without adding a backend/schema/RLS/repository/router/state engine. The final merge candidate combined PR head `f82d8d2f103feebf6c3a17ecf1d88b884b3b45dc` with then-current integration and passed Leader, collision, Section G, Presence, and glyph-inventory companions before merge `f41fb0fa53c925287cc1da0078b1175c7a7c9eea`.

The exact candidate adds the authoritative server-owned published/scheduled/completed projection. The accepted denominator is current active targeted recipients; aggregate completion requires a non-zero audience with every current recipient completed. Invalid or unavailable aggregates fail closed and never borrow the signed-in member's progress.

### Phase 2 — Admin Console

Status: **COMPLETE / 7 OF 7 ACCEPTED — EMAIL-CHANGE BACKEND-E2E PASS**.

Accepted evidence covers identity/congregation/security cards, action severity, typed destructive confirmations, owner-only/privacy-safe/session-safe sensitive operations, negative cases, and the fail-closed non-production evidence path.

2026-09-18 live observation: the deployed path passed non-owner denial, owner self-protection, target email mutation, fail-closed session revocation, privacy-safe audit flags, restoration, and cleanup using disposable QA identities in the existing BibleQuest Supabase project.

Formal BACKEND-E2E is now closed through the checked-in zero-cost isolated-local path: Supabase CLI loopback run `35283763923` / job `105411397336` executed the real candidate function/Auth/session-revocation path with disposable identities and verified restoration/cleanup. The hosted project was not contacted. See `docs/v5/V5_ADMIN_LOCAL_BACKEND_E2E_2026-09-18.md`.

### Phase 3 — artwork / dead-owner completion

Status: **COMPLETE / 7 OF 7 ACCEPTED / HARD-ZERO REGRESSION ACTIVE**.

Accepted:

- abandoned duplicate Media Library service/page retired while the canonical `media -> Recordings` route remains authoritative;
- genuine Games, Recognition, Couples, Notification, Encouragement, Bible World, Avatar Vault, Story Journey, and semantic UI artwork mappings plus reviewed exceptions;
- independent visible/accessibility meaning for decorative artwork;
- Mission recommendations render genuine SVG assets from semantic `review`/`study` action IDs with no dead emoji presentation fields;
- the whole-app inventory is now a hard-zero gate.

On #427 exact head `bf93a9796b039203757e95dedf5315ea10e99824`, workflow run `35115458073` reported **128 glyph occurrences: 128 documented and 0 undocumented**. Collision guard `35115458236` and Section G `35115458103` also passed. Any future undocumented source glyph now fails CI.

### Phase 4 — minimum real Web Push

Status: **COMPLETE / 11 OF 11 ACCEPTED — PROVIDER + DEVICE/FIELD PASS**.

Accepted/integrated:

- browser PushManager lifecycle;
- explicit category opt-in default off;
- account-switch/sign-out safety;
- account-safe subscription persistence over the RLS-backed owner;
- Notification Center remains source of truth;
- server-side delivery sender accepted on runtime/source candidate `7b2710fe`, including encrypted Supabase Vault VAPID fallback, service-only idempotency, bounded recipient/category selection, Deno type checks, and secret scanning;
- controlled live sender execution proved the zero-subscription no-op and exact cleanup path for a signed HTTPS 410 simulation;
- genuine Mozilla Autopush invalid-endpoint cleanup is BACKEND-E2E PASS on exact source head `618ce3cde7730925a3c3373a484e88987470d380`, run `35288009361` / job `105424531705`; exactly one matching assignment subscription was removed and an unrelated calendar control subscription remained;
- same-origin notification click routing;
- no private VAPID/service secret shipped to the client.

Physical closeout:

- app closed + push enabled: real Android OS notification received; provider sender counters attempted=1/delivered=1/failed=0; notification tap opened the same V5 preview at Assignments;
- push disabled: browser/persisted subscription count 0; sender attempted=0/delivered=0; no Android notification arrived during the required 90-second closed-app observation;
- the field tap exposed a pre-session guest rendering race, corrected on final runtime candidate `c0772d45` and locked by exact browser regression;
- accepted `bq-assignment` automatic dispatch is now live as Edge Function v7 after device/provider proof, with JWT verification enabled and zero persisted subscriptions at activation.

See `docs/v5/V5_PUSH_PROVIDER_INVALIDATION_E2E_2026-09-18.md` and `docs/v5/V5_PUSH_DEVICE_FIELD_EVIDENCE_2026-09-18.md`.

### Phase 5 — baseline offline Scripture

Status: **COMPLETE / ACCEPTED**.

Equivalent real-browser no-network evidence satisfies the permitted acceptance path. Previously-opened/current cached Scripture behavior and unavailable-content failure handling are proven without introducing a generalized offline engine.

### Phase 6 — multi-congregation

Status: **COMPLETE / ACCEPTED — GATE C BACKEND-E2E PASS**.

Accepted:

- account-safe active-congregation selection;
- visible multi-membership switcher with exact-current-head 390px browser proof;
- Calendar consumes active congregation rather than `memberships[0]`;
- Presence consumes active congregation;
- Assignments consume active congregation.

2026-09-18 Gate C evidence:

- a clearly labelled QA-only second congregation exists with two QA identities; real congregation memberships were not repurposed;
- 14/14 live bidirectional RLS assertions passed for congregation visibility, member directory, assignments, and calendar;
- transient rows and temporary membership alterations were cleaned/restored.

See `docs/v5/V5_EXISTING_SUPABASE_CONTROLLED_EVIDENCE_2026-09-18.md`.

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

Status: **LOCALIZATION COMPLETE / ACCEPTED FOR THE V5 CHECKLIST**.

Accepted/integrated highlights:

- current-architecture EN/TL/CEB localization foundation with canonical 444-key parity;
- shared shell, Transformation, Home, Calendar, Assignments, Notification Center, Account/settings, Community and Videos/Recordings localized for the agreed V5 surfaces;
- final Tagalog completeness gate with reviewed shared-term exceptions only;
- Cebuano explicit ownership for every canonical key except the intentional `BibleQuest` product name, plus complete Videos and shell-recovery copy;
- connected weekly journey / Ask at Dinner authored in EN/TL/CEB;
- 390px Cebuano browser proof across shell, Community, Account, Calendar, Videos, and weekly journey, with overflow/page-error/touch-target assertions;
- Community and Videos/Recordings Tagalog browser proofs included in the final accumulated localization gate;
- latest-service, Home/Today, Recordings filtering, My Journey, Family/Couples, and other content/UX checklist items remain governed by their already-accepted dedicated sections rather than a stale localization blocker.

Evidence: `docs/v5/V5_LOCALIZATION_CLOSEOUT_2026-09-18.md`; localization run `35281386346` SUCCESS.

### My Journey

Status: **IMPLEMENTED AND FORMALLY ACCEPTED FOR THE CURRENT P1 CHECKLIST ITEM**.

Current evidence proves composition over existing Progress/Assignments owners, no direct owner bypass, private/noncompetitive history, EN/TL, empty state and 390px mobile behavior.

### Phase 8 — final certification / promotion

Status: **CERTIFIED / 122 OF 122 ACCEPTED — EXACT RUNTIME CANDIDATE FROZEN**.

Runtime/source freeze: `c0772d458e9d17ab1728c47c568e99857c7d67a1`. Physical device evidence is explicitly bound to this candidate as documented. Later commits on the closeout branch are evidence/documentation-only unless explicitly identified otherwise.

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
- Pass 4 / PR #397: **68/122 -> 76/122 (62.3%)**.
- Leader Center fast-track / PR #399: four existing-owner Phase 1 behaviors implemented/proven; aggregate lifecycle deliberately remains open.
- Pass 5 reconciliation: **76/122 -> 80/122 (65.6%)**.
- Mission hard-zero closeout / PR #427: 128/128 documented source glyphs; 0 undocumented; exact-head focused and accumulated checks green.
- Pass 6 reconciliation: **80/122 -> 86/122 (70.5%)**.
- Ask at Dinner / PR #431: exactly one optional EN/TL weekly prompt proven on exact PR head `a7663599c2b5b9d71ee3c86d63e27f3315fd7812`; merged as `f79301a6880af2a60e5431f3725768f8bf84d98b`.
- Recordings filter / PR #432: local search and featured-only filtering over already-loaded current-owner data, with no schema/index/metadata extension; exact PR head `d53022bc7b9ef9aff7e5f54580449fdf463f76f6`; merged as `3e4306aad8f8d29a9fb265df1b901a9f15ab1f36`.
- Pass 7 reconciliation: **86/122 -> 91/122 (74.6%)** once this documentation-only reconciliation is merged.
- Reconciled candidate / PR #438: both divergent V5 lines combined, stale EN/TL-only and pre-category test contracts corrected, Transform status-region collision fixed, and exact-SHA Cloudflare preview verification enabled.
- Pass 8 reconciliation: **91/122 -> 108/122 (88.5%)** on exact candidate `b301a617c17c21dc212b74a0210b9aa6fce57ed1`; all 29 workflows green.
- 2026-09-18 controlled existing-Supabase evidence: **108/122 -> 111/122 (91.0%)** on runtime/source candidate `7b2710fe097b6321fef68916938017bb88bc1c7c`; server delivery sender accepted and Phase 6 Gate C topology/isolation closed. Admin's stricter separate-nonprod gate and Push DEVICE/FIELD/genuine-provider cleanup remain open.
- 2026-09-18 localization closeout: **111/122 -> 117/122 (95.9%)** on runtime/source candidate `04034d8749695d272f532ecc3e848b7ebf600a46`; final Tagalog completeness and all four Cebuano/Bisaya acceptance items closed. Verification PR #445 passed localization, collision, Section G, preview, Cloudflare, and accumulated regression companions and was closed without merge.
- 2026-09-18 isolated-local Admin evidence: **117/122 -> 118/122 (96.7%)**; run `35283763923` / job `105411397336` passed the real email-change BACKEND-E2E against a disposable loopback Supabase CLI stack with restoration and cleanup.
- 2026-09-18 genuine push-provider evidence: **118/122 -> 119/122 (97.5%)**; run `35288009361` / job `105424531705` passed terminal invalid-endpoint cleanup against Mozilla Autopush while preserving an unrelated control subscription.
- 2026-09-18 physical Web Push closeout: **119/122 -> 122/122 (100%)**. Android/Brave closed-app delivery/open and disabled/no-push behavior passed. The notification deep-link hydration race discovered during the field run was corrected and exact-head regression-proven on final runtime candidate `c0772d458e9d17ab1728c47c568e99857c7d67a1`; accumulated regression run `35302198022` passed.

## 5. Post-release handoff

1. Preserve `c0772d458e9d17ab1728c47c568e99857c7d67a1` as the certified V5 runtime/source freeze.
2. Production promotion is complete at `f6a0cff0e63ddf676b77b8470d84678958fe9d70`; both Cloudflare projects deployed that exact commit successfully and the post-merge deployed preview smoke passed.
3. Preserve `rollback/v4-pre-v5-production-20260918` as the V4 rollback reference.
4. Begin V6 only from the released V5 production baseline and the final 122/122 acceptance/evidence contract; do not revive the superseded main-only V5 Feature Flag checklist.

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

**V5 RELEASED — 2026-09-18 JST.** The certified V5 tree was promoted through PR #449 to production commit `f6a0cff0e63ddf676b77b8470d84678958fe9d70`. Cloudflare deployments for both `mybiblequest` and `biblequest` completed successfully on that commit, and the post-merge deployed preview smoke passed. The certified runtime/source freeze remains `c0772d458e9d17ab1728c47c568e99857c7d67a1`; later release reconciliation/bookkeeping changes are documentation/test-contract only. V4 remains available at `rollback/v4-pre-v5-production-20260918`.
