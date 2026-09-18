# BibleQuest V5 Web Push DEVICE/FIELD evidence — 2026-09-18

## Scope and privacy

This record closes the two V5 physical-device Web Push acceptance gates.

It intentionally omits the tester's email address, Auth identifiers, push endpoint, subscription keys, VAPID private material, service credentials, and raw tokens.

Physical device: Android phone, Brave browser.
Physical-test candidate SHA: `35da53900fef8842a8d75187e4a4efaa1c5adc0e`.
Immutable physical-test preview: `https://8c086953.mybiblequest.pages.dev`.

Final runtime/source candidate after the bounded auth-hydration correction:
`c0772d458e9d17ab1728c47c568e99857c7d67a1`.

Final candidate immutable preview:
`https://c2ea631a.mybiblequest.pages.dev`.

## Gate P1 — app closed + push enabled receives and opens a real notification

### Pre-send physical state

The QA field harness reported all required enabled conditions on the physical Android browser:

- harness ready;
- signed in = yes;
- Push API supported = yes;
- Notification permission = granted;
- browser subscription = present;
- persisted current-browser subscription = present;
- account subscription count = 1;
- assignment category opt-in = enabled;
- subscription owner marker matched the signed-in account.

A controlled backend read confirmed exactly one current assignment-enabled HTTPS subscription for the field-test account.

### Closed-app send

The tester fully removed Brave from Android Recent Apps before delivery.

Controlled one-shot field run:

- GitHub Actions run: `35299944442`
- job: `105460265316`
- notification category: `assignment`
- attempted: **1**
- delivered: **1**
- removed: **0**
- failed: **0**
- skipped: **0**

The Android OS displayed the real notification while Brave was closed. Tapping the OS notification reopened the same immutable V5 preview on the accepted `/#/assignments` destination.

**Gate P1: DEVICE/FIELD PASS.**

### Session-hydration observation and correction

The physical tap exposed a bounded startup race unrelated to provider delivery: the route opened correctly, but the first Assignments rendering still showed its pre-session guest card because `router.start()` runs before persisted Auth restoration completes.

The final V5 runtime candidate corrects only that race: after `session.boot()` restores an authenticated session, BibleQuest re-resolves the exact current route once. Signed-out/local-first routes are not remounted.

Evidence on final runtime candidate `c0772d458e9d17ab1728c47c568e99857c7d67a1`:

- focused auth-hydration contract PASS;
- exact browser regression records `PASS V5 authenticated notification deep-link rehydrates current route.`;
- accumulated browser/mobile regression PASS;
- Section G PASS;
- Cloudflare deployed preview smoke PASS;
- collision guard PASS.

The actual push-delivery bytes tested physically were unchanged between the physical-test SHA and the final runtime candidate. Verified identical Git blobs include:

- `offline-shell-sw.js` — `77aac26d27f1314f2b81d88557ba03a1476af70d`
- `src/app/push-subscription.js` — `e67ddd1fb685f42ccabe2f560d3c3e3c5a4a6747`
- `src/app/push-subscription-persistence.js` — `7ed6c81ba8424274715131f65f1a99c7da167400`
- `src/app/push-subscription-repository.js` — `331c877b71049e93b96d6d1f57b343ef6253e171`
- `supabase/functions/bq-push-delivery/index.ts` — `d5ea0ad8f15c5d46584b9c1f848d6cb89ffffedd`
- `v5-push-device-field.js` — `190b22a78e6c2035e151bf2df8e1ca6c99a096c8`
- `v5-push-device-field.html` — `9682b738b10b4a25131090a0f26a0531b8c27078`

This explicitly binds the physical push result to the final runtime candidate while the separately-regressed bootstrap correction closes the only behavior changed afterward.

## Gate P2 — push disabled preserves pre-push behavior

### Disabled physical state

On the same physical Android browser, the tester disabled push through the accepted V5 lifecycle. The sanitized field harness then reported:

- signed in = yes;
- Push API supported = yes;
- Notification permission remained granted;
- browser subscription = absent;
- persisted current-browser subscription = absent;
- account subscription count = 0;
- assignment opt-in = not enabled;
- owner marker no longer matched.

The backend independently confirmed zero assignment-enabled subscriptions before the send.

### Closed-app no-push send

The tester fully removed Brave from Android Recent Apps again.

Controlled one-shot field run:

- GitHub Actions run: `35301272798`
- job: `105464228351`
- notification category: `assignment`
- attempted: **0**
- delivered: **0**
- removed: **0**
- failed: **0**
- skipped: **0**

A second in-app assignment notification row was created successfully as the Notification Center source-of-truth item.

The tester observed the physical phone for the required 90-second window with Brave closed and reported **no Android OS notification**.

The tester did not separately capture a manual post-window Notification Center screenshot. The ordinary in-app half of the pre-push behavior is therefore not misrepresented as a second manual observation; it is bound by:

- successful creation of the real in-app notification row;
- owner-scoped Notification Center RLS/read path;
- the exact-candidate Notification Center browser regression in the accumulated suite; and
- the unchanged Notification Center source-of-truth architecture.

**Gate P2: DEVICE/FIELD + BACKEND/BROWSER bound PASS.**

## Provider cleanup and live backend binding

The separate genuine-provider invalidation gate remains BACKEND-E2E PASS from Mozilla Autopush evidence in `docs/v5/V5_PUSH_PROVIDER_INVALIDATION_E2E_2026-09-18.md`.

After the physical gates passed and the final candidate was green, the accepted V5 `bq-assignment` implementation was deployed to the existing BibleQuest Supabase project:

- live Edge Function version: **7**;
- JWT verification: **enabled**;
- bounded `dispatchAssignmentPush` path: present;
- current total persisted push subscriptions immediately after deployment: **0**.

No new Supabase project or paid infrastructure was created.

## Temporary probe cleanup

The temporary `bq-v5-push-e2e-probe-20260918` function was restored to its inert HTTP 410 implementation immediately after each field send. No reusable public field-send path remains active.

## Acceptance conclusion

The two remaining Phase 4 DEVICE/FIELD gates are satisfied.

The final V5 runtime/source candidate is `c0772d458e9d17ab1728c47c568e99857c7d67a1`. Physical provider/device evidence is explicitly bound to it by byte identity for every push-critical owner plus exact-candidate automated coverage for the bounded session-hydration change.
