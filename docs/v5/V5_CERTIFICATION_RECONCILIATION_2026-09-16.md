# BibleQuest V5 Certification Reconciliation — 2026-09-16

Reconciliation base: `5224d098700e86bedda6b13ec14ff1e9b15de149` (`v5/feature-completion`)

Purpose: fast-track formal documentation by reconciling already-merged implementation/evidence with `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`. This document does **not** weaken evidence classes and does not convert STATIC evidence into BACKEND-E2E or DEVICE/FIELD PASS.

## Executive result

The checklist currently records 46/122 accepted items (37.7%). Current merged evidence supports **at least eight additional acceptance promotions** without new runtime work:

- Phase 4 Push persistence: +1
- Phase 7 Couples exact-head verification: +1
- Phase 7 Section G loading/empty/error/offline sweep: +1
- P0 latest completed service: +3
- P0 Home/Today owner composition: +2

Conservative reconciled count: **54/122 = 44.3% formally evidenced**.

This remains intentionally below estimated implementation progress because several implemented areas still lack the exact evidence class required by their acceptance item.

## Evidence-backed promotions

### D. Phase 4 — minimum real Web Push

Promote:

- `[x] Subscription persistence is account/device-safe with owner-only access/RLS.`

Evidence:

- PR #348 merged account-safe persistence adapter. It requires an authenticated remote account, keys writes to current user + exact endpoint, verifies returned ownership, and performs exact endpoint/account cleanup.
- PR #348 merged at `4496f049e74a877f5b66fd6c5def1ddb6fcd046d`.
- Existing `bible_push_subscriptions` storage/RLS contract is the persistence owner consumed by the adapter.
- PR #349 subsequently connected the PushManager lifecycle to that persistence owner while preserving account rotation/sign-out cleanup/rollback semantics.

Evidence class: **STATIC**. This does not satisfy server delivery, invalid-endpoint real-response cleanup, or closed-app DEVICE/FIELD acceptance.

### G. Phase 7 — verification debt

Promote:

- `[x] Couples Journey intended spouse-to-spouse sharing is genuinely bidirectional and private to the correct relationship/account scope.`

Evidence:

- PR #383 merged exact-head revalidation.
- Exact PR head: `63d1995b209d70a50210df355d600fbfc2fb1124`.
- Workflow run `35021093121` concluded SUCCESS.
- The job explicitly executed `Couples bidirectional sharing and privacy at 390px` plus the accumulated Luna current-head regression companion.

Evidence class: **STATIC + BROWSER-AUTO**.

Promote:

- `[x] Deferred Section G loading/empty/error/offline sweep completed with evidence.`

Evidence:

- Latest relevant PR-head validation after the Home composition and Media-owner cleanup remained green.
- PR #386 head `50e7c8bd2810bd3da44e10330658a635cbd7e3cb` ran workflow `BibleQuest V5 Section G state sweep`, run `35029103272`, conclusion SUCCESS.
- The immediately preceding Home integration head `fa8d443917b135d4029f7a96c5f281e3dc4d8ee8` also ran Section G run `35028738463`, conclusion SUCCESS, including the explicit Playwright `loading empty error offline matrix` step.

Evidence class: **STATIC + BROWSER-AUTO**.

### K. P0 — latest completed service in Media/Recordings

Promote:

- `[x] Stable recording/video identity is the deduplication key for latest-service surfacing.`
- `[x] When the current BibleQuest/recordings flow already exposes a completed stable recording, it is surfaced as the latest service without duplicate insertion.`
- `[x] If completion cannot be known from current data, V5 uses a minimal leader confirmation/import step rather than pretending external automation exists.`

Evidence:

- PR #353 merged `V5 P0: bound latest service to confirmed Recordings identity`.
- Exact PR head: `229a5ebeef67bc74f1dd923027ab58fc5ca699db`.
- Workflow run `34927753652` (`V5 Recordings latest service verify`) concluded SUCCESS.
- Recordings deduplicates by stable YouTube ID, derives `latestService` only from leader-confirmed `featured` rows, rejects duplicate insertion, and returns no latest service when rows are unconfirmed rather than inferring completion from dates.
- The existing leader-controlled `featured`/import path is therefore the bounded V5 confirmation mechanism; no YouTube polling/webhook/daemon was added.

Evidence class: **STATIC**.

Still open:

- Authorized hide/edit/correct acceptance remains unchecked until its authorization/correction path has dedicated accepted evidence.

### L. P0 — Today / This Week Home

Promote:

- `[x] Home composes existing owners for next event, current assignment, continue reading, latest service, Transformation prompt, and unread notifications.`
- `[x] No new state engine or duplicate data owner is created.`

Evidence:

- PR #385 merged `V5 P0: complete Home/Today owner composition`.
- Exact PR head: `fa8d443917b135d4029f7a96c5f281e3dc4d8ee8`.
- Workflow `V5 Home Today Composition Gap` run `35028738458`: SUCCESS.
- Workflow `V5 Home Today This Week` run `35028738560`: SUCCESS.
- Focused acceptance contract proves Calendar, Reader, Recordings, Transform, Notification Center, Assignments and Daily Journey remain existing owners; it rejects localStorage/sessionStorage/direct Supabase bypasses.
- Bootstrap wires existing owners into Home rather than introducing replacement storage/state ownership.

Evidence class: **STATIC**.

Still open:

- `Missing source data produces intentional empty state rather than broken placeholders` remains unchecked pending a focused acceptance assertion for all composed sources.
- `Representative mobile/browser composition works` remains unchecked because the Home composition workflow is STATIC; no BROWSER-AUTO promotion is claimed here.

## Merged progress that should be documented but not yet promoted to PASS

### Community Tagalog

- PR #372 merged Community EN/TL localization.
- PR #380 merged focused 390px Community Tagalog browser proof; workflow run `35011561200` concluded SUCCESS.
- This materially advances the broad Tagalog item, but the checklist item combines Community/Media **and remaining member-facing surfaces**, so it must remain unchecked until the full agreed inventory is complete.

### My Journey

- My Journey runtime/content is integrated with EN/TL and dedicated contracts.
- Do not promote its P1 checklist item solely from implementation presence. It should receive a clean accepted exact-current-candidate proof after all relevant architecture validators are green.

### Admin Console

- #338 truthful deletion audit ordering, #358 fail-closed session revocation, #365 controlled email-change E2E harness/readiness and #371 integrated security-chain verification are merged.
- Real owner email-change remains **BACKEND-E2E OPEN**. Do not promote the real Supabase Auth acceptance item until controlled execution and cleanup actually pass.

### Multi-congregation Gate C

- Readiness/harness work exists, but real two-congregation Gate C remains **BACKEND-E2E/DEVICE-FIELD OPEN**.
- Do not mark controlled topology or isolation execution PASS from STATIC readiness.

### Web Push final acceptance

- Browser lifecycle and account-safe persistence are integrated.
- Server/final-candidate acceptance, invalid-endpoint cleanup against real push-service responses, app-closed delivery/open, and push-disabled field proof remain open under their required evidence classes.

## Documentation actions for A5

1. Apply the eight promotions above to `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.
2. Update the checklist date to 2026-09-16 JST and record the reconciled count: **54/122 (44.3%)**.
3. Refresh `V5_ACTIVE_STATUS.md` from stale observed head `e0899b...` to the current integration lineage and summarize #348/#353/#372/#380/#383/#385/#386.
4. Keep all BACKEND-E2E and DEVICE/FIELD blockers explicitly open.
5. Do not equate 44.3% formal certification with implementation completion; it is only the evidence-backed checklist ratio.
6. Continue serialized integration; documentation reconciliation must not authorize production promotion.

## Remaining certification-critical blockers after reconciliation

- Leader Center current-candidate role-safe exit evidence.
- Admin owner email-change real Supabase Auth BACKEND-E2E and Gate A field path.
- Remaining Phase 3 artwork/glyph reconciliation.
- Push server/final-candidate integration plus real closed-app DEVICE/FIELD proof.
- Phase 6 visible switcher/current Calendar evidence and real Gate C cross-congregation execution.
- CEBOCB current-candidate/mobile proof and deferred Section E sweep.
- Remaining final Tagalog inventory; Cebuano/Bisaya scope.
- Home missing-data and browser/mobile composition proof.
- Weekly spiritual journey, remaining content-depth, discovery/Media organization.
- One exact candidate SHA with the complete accumulated regression and all required browser/backend/device evidence before V5 promotion.
